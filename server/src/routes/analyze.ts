import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate';
import { analyzeApiResponse } from '../utils/openrouter';
import { AppError } from '../utils/errors';

const analyzeSchema = z.object({
  method: z.string().trim().min(1),
  url: z.string().url(),
  status: z.number().int().min(100).max(599),
  response: z.unknown(),
});

function toItems(items: string[]) {
  return items.map((item) => ({
    title: item.slice(0, 80),
    description: item,
  }));
}

export const analyzeRouter = Router();

analyzeRouter.post('/analyze', validateBody(analyzeSchema), async (req, res, next) => {
  try {
    const payload = req.body as z.infer<typeof analyzeSchema>;
    const analysis = await analyzeApiResponse({
      method: payload.method,
      url: payload.url,
      status: payload.status,
      response: payload.response,
    });

    res.json({
      summary: analysis.summary,
      designIssues: toItems(analysis.design_issues),
      securityIssues: toItems(analysis.security_issues),
      suggestions: toItems(analysis.improvement_suggestions),
      improvedResponse: analysis.improved_response_example,
      openApiSnippet: analysis.openapi_snippet,
      raw: analysis,
    });
  } catch (error) {
    next(new AppError('Analysis failed', 500, 'ANALYSIS_ERROR'));
  }
});
