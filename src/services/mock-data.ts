import type { ApiResponse, AiAnalysis } from '@/types/api';

export const mockApiResponse: ApiResponse = {
  status: 200,
  statusText: 'OK',
  responseTime: 247,
  data: {
    users: [
      { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'admin', active: true },
      { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'user', active: true },
      { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', role: 'user', active: false },
    ],
    pagination: { page: 1, perPage: 10, total: 3, totalPages: 1 },
    meta: { requestId: 'req_abc123', timestamp: '2025-02-25T12:00:00Z' },
  },
  headers: {
    'content-type': 'application/json',
    'x-request-id': 'req_abc123',
    'x-ratelimit-remaining': '99',
  },
};

export const mockAiAnalysis: AiAnalysis = {
  summary: 'Well-structured REST API response with proper pagination. A few improvements could enhance security and developer experience.',
  designIssues: [
    { title: 'Missing HATEOAS Links', description: 'Response lacks hypermedia links for pagination navigation. Consider adding next/prev/first/last links.', severity: 'medium' },
    { title: 'Inconsistent Naming', description: 'Uses camelCase for some fields and snake_case for others. Standardize to one convention.', severity: 'low' },
  ],
  securityIssues: [
    { title: 'Email Exposure', description: 'User emails are exposed in the list endpoint. Consider masking or omitting emails in collection responses.', severity: 'high' },
    { title: 'Missing Rate Limit Headers', description: 'Only x-ratelimit-remaining is present. Add x-ratelimit-limit and x-ratelimit-reset for complete rate limiting info.', severity: 'medium' },
  ],
  suggestions: [
    { title: 'Add ETag Support', description: 'Implement ETag headers for caching. This reduces bandwidth and improves client performance.' },
    { title: 'Envelope-Free Option', description: 'Consider supporting an envelope-free response mode via Accept header for clients that prefer flat arrays.' },
    { title: 'Field Selection', description: 'Add ?fields=id,name query parameter support to allow clients to request only needed fields.' },
  ],
  improvedResponse: {
    data: [
      { id: 1, name: 'Alice Johnson', email: 'a****@example.com', role: 'admin', active: true },
    ],
    pagination: { page: 1, perPage: 10, total: 3 },
    links: { next: '/api/users?page=2', self: '/api/users?page=1' },
  },
  openApiSnippet: `paths:
  /api/users:
    get:
      summary: List users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  users:
                    type: array
                    items:
                      \$ref: '#/components/schemas/User'`,
};
