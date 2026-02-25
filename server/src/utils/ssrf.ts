import dns from 'node:dns/promises';
import net from 'node:net';
import { AppError } from './errors';

const BLOCKED_HOSTNAMES = new Set(['localhost', '0.0.0.0']);

function ipv4ToNumber(ip: string): number {
  return ip
    .split('.')
    .map((part) => Number(part))
    .reduce((acc, octet) => (acc << 8) + octet, 0) >>> 0;
}

function isIpv4InCidr(ip: string, baseIp: string, prefix: number): boolean {
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ipv4ToNumber(ip) & mask) === (ipv4ToNumber(baseIp) & mask);
}

function normalizeIpv6(ip: string): string {
  return ip.toLowerCase();
}

function isPrivateOrInternalIp(ip: string): boolean {
  if (net.isIP(ip) === 4) {
    return (
      isIpv4InCidr(ip, '0.0.0.0', 8) ||
      isIpv4InCidr(ip, '10.0.0.0', 8) ||
      isIpv4InCidr(ip, '100.64.0.0', 10) ||
      isIpv4InCidr(ip, '127.0.0.0', 8) ||
      isIpv4InCidr(ip, '169.254.0.0', 16) ||
      isIpv4InCidr(ip, '172.16.0.0', 12) ||
      isIpv4InCidr(ip, '192.168.0.0', 16) ||
      isIpv4InCidr(ip, '198.18.0.0', 15) ||
      isIpv4InCidr(ip, '224.0.0.0', 4)
    );
  }

  if (net.isIP(ip) === 6) {
    const normalized = normalizeIpv6(ip);

    return (
      normalized === '::1' ||
      normalized === '::' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe8') ||
      normalized.startsWith('fe9') ||
      normalized.startsWith('fea') ||
      normalized.startsWith('feb') ||
      normalized.startsWith('::ffff:127.') ||
      normalized.startsWith('::ffff:10.') ||
      normalized.startsWith('::ffff:192.168.')
    );
  }

  return true;
}

function validateHost(hostname: string): void {
  const normalizedHost = hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(normalizedHost) || normalizedHost === '::1') {
    throw new AppError('Target host is not allowed', 400, 'SSRF_BLOCKED_HOST');
  }

  if (net.isIP(normalizedHost) && isPrivateOrInternalIp(normalizedHost)) {
    throw new AppError('Target IP is private/internal and not allowed', 400, 'SSRF_PRIVATE_IP');
  }
}

export async function validateExternalUrl(inputUrl: string): Promise<void> {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(inputUrl);
  } catch {
    throw new AppError('Invalid URL format', 400, 'INVALID_URL');
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new AppError('Only HTTP/HTTPS URLs are allowed', 400, 'INVALID_URL_PROTOCOL');
  }

  validateHost(parsedUrl.hostname.replace(/^\[|\]$/g, ''));

  if (net.isIP(parsedUrl.hostname.replace(/^\[|\]$/g, ''))) {
    return;
  }

  // Resolve DNS before proxying so hostnames that point to internal IPs are blocked.
  let resolvedAddresses: Array<{ address: string; family: number }>;

  try {
    resolvedAddresses = await dns.lookup(parsedUrl.hostname, { all: true, verbatim: true });
  } catch {
    throw new AppError('Unable to resolve target host', 400, 'DNS_RESOLUTION_FAILED');
  }

  if (resolvedAddresses.length === 0) {
    throw new AppError('Target host has no resolvable addresses', 400, 'DNS_EMPTY_RESULT');
  }

  const hasBlockedAddress = resolvedAddresses.some((entry) => isPrivateOrInternalIp(entry.address));

  if (hasBlockedAddress) {
    throw new AppError('Target resolves to private/internal network', 400, 'SSRF_PRIVATE_DNS');
  }
}
