import axios, { AxiosError, Method } from 'axios';
import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate';
import { validateExternalUrl } from '../utils/ssrf';
import { AppError } from '../utils/errors';

const proxySchema = z.object({
  method: z.string().trim().toUpperCase(),
  url: z.string().url(),
  headers: z.record(z.string()).optional().default({}),
  body: z.unknown().optional(),
  auth: z
    .object({
      type: z.enum(['bearer', 'basic']),
      token: z.string().optional(),
      username: z.string().optional(),
      password: z.string().optional(),
    })
    .optional(),
});

const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

const BLOCKED_HEADER_NAMES = new Set([
  'host',
  'content-length',
  'connection',
  'transfer-encoding',
  'upgrade',
  'proxy-authorization',
  'proxy-authenticate',
]);

function sanitizeHeaders(inputHeaders: Record<string, string>): Record<string, string> {
  // Strip hop-by-hop headers so clients cannot override connection behavior.
  return Object.entries(inputHeaders).reduce<Record<string, string>>((acc, [key, value]) => {
    const normalizedKey = key.toLowerCase().trim();

    if (!normalizedKey || BLOCKED_HEADER_NAMES.has(normalizedKey)) {
      return acc;
    }

    acc[normalizedKey] = value;
    return acc;
  }, {});
}

function mapProxyError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    if (axiosError.code === 'ECONNABORTED') {
      return new AppError('Upstream request timed out', 504, 'UPSTREAM_TIMEOUT');
    }

    if (axiosError.code === 'ERR_FR_MAX_BODY_LENGTH_EXCEEDED' || axiosError.code === 'ERR_BAD_RESPONSE') {
      return new AppError('Upstream response exceeded size limit', 502, 'UPSTREAM_TOO_LARGE');
    }

    if (axiosError.code === 'ENOTFOUND' || axiosError.code === 'EAI_AGAIN') {
      return new AppError('Unable to reach upstream host', 502, 'UPSTREAM_DNS_ERROR');
    }

    if (axiosError.code) {
      return new AppError('Network error while contacting upstream API', 502, 'UPSTREAM_NETWORK_ERROR');
    }
  }

  return new AppError('Unexpected proxy error', 500, 'PROXY_ERROR');
}

export const proxyRouter = Router();

proxyRouter.post('/proxy', validateBody(proxySchema), async (req, res, next) => {
  try {
    const { method, url, headers, body, auth } = req.body as z.infer<typeof proxySchema>;

    if (!ALLOWED_METHODS.has(method)) {
      throw new AppError('HTTP method is not allowed', 400, 'INVALID_METHOD');
    }

    await validateExternalUrl(url);

    const sanitizedHeaders = sanitizeHeaders(headers);

    if (auth?.type === 'bearer' && auth.token) {
      sanitizedHeaders.authorization = `Bearer ${auth.token}`;
    }

    if (auth?.type === 'basic' && auth.username) {
      sanitizedHeaders.authorization = `Basic ${Buffer.from(
        `${auth.username}:${auth.password ?? ''}`
      ).toString('base64')}`;
    }
    const startedAt = Date.now();

    const response = await axios.request({
      method: method as Method,
      url,
      headers: sanitizedHeaders,
      data: method === 'GET' || method === 'HEAD' ? undefined : body,
      timeout: 10_000,
      maxContentLength: 5 * 1024 * 1024,
      maxBodyLength: 5 * 1024 * 1024,
      validateStatus: () => true,
    });

    const responseTime = Date.now() - startedAt;

    const responseHeaders = Object.entries(response.headers).reduce<Record<string, string>>((acc, [key, value]) => {
      if (typeof value === 'string') {
        acc[key] = value;
      }
      return acc;
    }, {});

    res.json({
      status: response.status,
      responseTime,
      data: response.data,
      headers: responseHeaders,
    });
  } catch (error) {
    next(mapProxyError(error));
  }
});
