import axios from 'axios';
import { z } from 'zod';
import { env } from '../config/env';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const analyzeResultSchema = z.object({
  summary: z.string(),
  design_issues: z.array(z.string()),
  security_issues: z.array(z.string()),
  improvement_suggestions: z.array(z.string()),
  improved_response_example: z.record(z.unknown()),
  openapi_snippet: z.string(),
});

export type AnalyzeResult = z.infer<typeof analyzeResultSchema>;

interface AnalyzeInput {
  method: string;
  url: string;
  status: number;
  response: unknown;
}

function buildFallback(input: AnalyzeInput, reason: string): AnalyzeResult {
  return {
    summary: `Automated AI analysis is unavailable (${reason}).`,
    design_issues: ['Validate response schema consistency across endpoints.'],
    security_issues: input.status >= 500
      ? ['Server returned an error; ensure internal details are not leaked in production responses.']
      : [],
    improvement_suggestions: [
      'Add explicit OpenAPI response schema and examples for this endpoint.',
      'Return stable machine-readable error codes for client handling.',
    ],
    improved_response_example: {
      data: input.response,
      meta: {
        method: input.method,
        url: input.url,
        status: input.status,
      },
    },
    openapi_snippet: `responses:\n  '${input.status}':\n    description: API response\n    content:\n      application/json:\n        schema:\n          type: object`,
  };
}

function extractJson(content: string): string | null {
  const trimmed = content.trim();

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  return trimmed.slice(firstBrace, lastBrace + 1);
}

export async function analyzeApiResponse(input: AnalyzeInput): Promise<AnalyzeResult> {
  if (!env.OPENROUTER_API_KEY) {
    return buildFallback(input, 'missing OPENROUTER_API_KEY');
  }

  const systemPrompt = [
    'You are a senior backend architect and API design expert.',
    'Return STRICT JSON with this exact shape and keys:',
    '{',
    '"summary": string,',
    '"design_issues": string[],',
    '"security_issues": string[],',
    '"improvement_suggestions": string[],',
    '"improved_response_example": object,',
    '"openapi_snippet": string',
    '}',
    'Do not include markdown fences or extra commentary.',
  ].join('\n');

  const userPrompt = JSON.stringify(
    {
      method: input.method,
      url: input.url,
      status: input.status,
      response: input.response,
    },
    null,
    2
  );

  try {
    const { data } = await axios.post(
      OPENROUTER_URL,
      {
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt.slice(0, 16_000) },
        ],
        temperature: 0.2,
        max_tokens: 1200,
      },
      {
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30_000,
      }
    );

    const content = data?.choices?.[0]?.message?.content;

    if (typeof content !== 'string' || !content.trim()) {
      return buildFallback(input, 'empty model response');
    }

    const jsonCandidate = extractJson(content);

    if (!jsonCandidate) {
      return buildFallback(input, 'invalid model JSON');
    }

    const parsed = JSON.parse(jsonCandidate);
    const validated = analyzeResultSchema.safeParse(parsed);

    if (!validated.success) {
      return buildFallback(input, 'schema validation failed');
    }

    return validated.data;
  } catch (error) {
    console.error('[openrouter_error]', error);
    return buildFallback(input, 'upstream error');
  }
}
