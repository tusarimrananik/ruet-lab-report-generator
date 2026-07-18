import { createHash } from 'node:crypto';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const MODEL = 'gpt-5.6-terra';
const MAX_REQUESTS = 5;
const WINDOW_MS = 60 * 60 * 1000;
const requestLog = new Map();

const schema = {
  type: 'object',
  properties: {
    objective: { type: 'string' },
    theory: { type: 'string' },
    code: { type: 'string' },
    output: { type: 'string' },
    verdict: { type: 'string' },
    discussion: { type: 'string' },
    conclusion: { type: 'string' },
  },
  required: ['objective', 'theory', 'code', 'output', 'verdict', 'discussion', 'conclusion'],
  additionalProperties: false,
};

const getClientIp = request => String(request.headers['x-forwarded-for'] || request.socket?.remoteAddress || 'unknown').split(',')[0].trim();

const isRateLimited = ip => {
  const now = Date.now();
  const recent = (requestLog.get(ip) || []).filter(time => now - time < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) return true;
  recent.push(now);
  requestLog.set(ip, recent);
  return false;
};

const getOutputText = response => {
  for (const item of response.output || []) {
    for (const part of item.content || []) {
      if (part.type === 'output_text' && part.text) return part.text;
    }
  }
  return '';
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return response.status(503).json({ error: 'AI generation is not configured yet.' });
  }

  const contentLength = Number(request.headers['content-length'] || 0);
  if (contentLength > 50000) return response.status(413).json({ error: 'The report context is too large.' });

  const host = request.headers.host;
  const origin = request.headers.origin;
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return response.status(403).json({ error: 'Request origin not allowed.' });
    } catch {
      return response.status(403).json({ error: 'Request origin not allowed.' });
    }
  }

  const ip = getClientIp(request);
  if (isRateLimited(ip)) return response.status(429).json({ error: 'AI generation limit reached. Try again later.' });

  const { courseCode = '', courseTitle = '', labNo = '', labTitle = '', preset = '', notes = '', sections = [] } = request.body || {};
  if (!String(labTitle).trim()) return response.status(400).json({ error: 'Add the lab title on the cover page first.' });

  const context = {
    courseCode: String(courseCode).slice(0, 40),
    courseTitle: String(courseTitle).slice(0, 200),
    labNo: String(labNo).slice(0, 20),
    labTitle: String(labTitle).slice(0, 300),
    preset: String(preset).slice(0, 40),
    notes: String(notes).slice(0, 6000),
    existingSections: Array.isArray(sections) ? sections.slice(0, 12).map(section => ({
      id: String(section.id || '').slice(0, 40),
      title: String(section.title || '').slice(0, 100),
      body: String(section.body || '').slice(0, 6000),
    })) : [],
  };

  const instructions = `Write a concise, technically accurate RUET lab report using the supplied context. For CSE 2206 assembly work, target emu8086-compatible 8086 assembly and follow this exact order: Objective, Theory, Assembly Language Code, Output, Verdict, Discussion, Conclusion. Use formal academic prose in complete paragraphs. Preserve useful facts and code from existing sections. Never invent execution, measured values, screenshots, inputs, or observed register results. If no observed output is supplied, return an empty output string and phrase the verdict as an expected result that the student must verify. Return code without Markdown fences. Do not include headings inside field values.`;

  try {
    const upstream = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        reasoning: { effort: 'low' },
        store: false,
        max_output_tokens: 4000,
        safety_identifier: `ruet-${createHash('sha256').update(ip).digest('hex').slice(0, 32)}`,
        instructions,
        input: JSON.stringify(context),
        text: {
          format: {
            type: 'json_schema',
            name: 'ruet_lab_report',
            strict: true,
            schema,
          },
        },
      }),
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      const errorCode = data.error?.code || 'unknown';
      console.error('OpenAI report generation failed', upstream.status, errorCode);
      if (errorCode === 'insufficient_quota') {
        return response.status(402).json({ error: 'The OpenAI API account has no available credits. Add billing or credits, then try again.' });
      }
      if (errorCode === 'invalid_api_key') {
        return response.status(503).json({ error: 'The configured OpenAI API key is invalid.' });
      }
      if (upstream.status === 429) {
        return response.status(429).json({ error: 'OpenAI is rate-limiting requests. Try again shortly.' });
      }
      return response.status(502).json({ error: 'AI generation is temporarily unavailable.' });
    }

    const outputText = getOutputText(data);
    if (!outputText) return response.status(502).json({ error: 'AI returned no report content.' });
    return response.status(200).json({ sections: JSON.parse(outputText) });
  } catch (error) {
    console.error('AI report generation failed', error instanceof Error ? error.message : 'unknown');
    return response.status(502).json({ error: 'AI generation is temporarily unavailable.' });
  }
}
