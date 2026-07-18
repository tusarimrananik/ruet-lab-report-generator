const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-20b';
const MAX_REQUESTS = 5;
const WINDOW_MS = 60 * 60 * 1000;
const requestLog = new Map();

const getClientIp = request => String(request.headers['x-forwarded-for'] || request.socket?.remoteAddress || 'unknown').split(',')[0].trim();

const isRateLimited = ip => {
  const now = Date.now();
  const recent = (requestLog.get(ip) || []).filter(time => now - time < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) return true;
  recent.push(now);
  requestLog.set(ip, recent);
  return false;
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.GROQ_API_KEY) {
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

  const { courseCode = '', courseTitle = '', labNo = '', labTitle = '', preset = '', university = '', universityStatus = '', presetDepartment = '', semester = '', notes = '', sections = [] } = request.body || {};
  if (!String(labTitle).trim()) return response.status(400).json({ error: 'Add the lab title on the cover page first.' });

  const safeSections = Array.isArray(sections) ? sections.slice(0, 12).filter(section => /^[a-z][a-z0-9_-]{0,39}$/.test(String(section.id || ''))) : [];
  if (!safeSections.length) return response.status(400).json({ error: 'Add at least one valid report section.' });
  const sectionIds = [...new Set(safeSections.map(section => String(section.id)))];
  const schema = {
    type: 'object',
    properties: Object.fromEntries(sectionIds.map(id => [id, { type: 'string' }])),
    required: sectionIds,
    additionalProperties: false,
  };

  const context = {
    courseCode: String(courseCode).slice(0, 40),
    courseTitle: String(courseTitle).slice(0, 200),
    labNo: String(labNo).slice(0, 20),
    labTitle: String(labTitle).slice(0, 300),
    preset: String(preset).slice(0, 40),
    university: String(university).slice(0, 160),
    universityStatus: String(universityStatus).slice(0, 40),
    department: String(presetDepartment).slice(0, 160),
    semester: String(semester).slice(0, 20),
    notes: String(notes).slice(0, 6000),
    existingSections: safeSections.map(section => ({
      id: String(section.id || '').slice(0, 40),
      title: String(section.title || '').slice(0, 100),
      body: String(section.body || '').slice(0, 6000),
    })),
  };

  const instructions = `Write a concise, technically accurate lab report using the supplied academic context and the exact section keys provided. Treat university, department, semester, and report format only as writing context; never claim an official university policy, template, course code, or curriculum rule that is not supplied. A universityStatus of "demo structure" means the selection is explicitly non-authoritative. For CSE 2206 assembly work, target emu8086-compatible 8086 assembly. Use formal academic prose in complete paragraphs. Preserve useful facts and code from existing sections. Never invent execution, measured values, screenshots, inputs, or observed register results. If no observed output is supplied, return an empty output string and phrase any result or verdict as an expected result that the student must verify. Return code without Markdown fences. Do not include headings inside field values.`;

  try {
    const upstream = await fetch(GROQ_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: instructions },
          { role: 'user', content: JSON.stringify(context) },
        ],
        temperature: 0.2,
        max_completion_tokens: 4000,
        response_format: {
          type: 'json_schema',
          json_schema: {
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
      console.error('Groq report generation failed', upstream.status, errorCode);
      if (upstream.status === 401) {
        return response.status(503).json({ error: 'The configured Groq API key is invalid.' });
      }
      if (upstream.status === 429) {
        return response.status(429).json({ error: 'Groq is rate-limiting requests. Try again shortly.' });
      }
      return response.status(502).json({ error: 'AI generation is temporarily unavailable.' });
    }

    const outputText = data.choices?.[0]?.message?.content || '';
    if (!outputText) return response.status(502).json({ error: 'AI returned no report content.' });
    return response.status(200).json({ sections: JSON.parse(outputText) });
  } catch (error) {
    console.error('Groq report generation failed', error instanceof Error ? error.message : 'unknown');
    return response.status(502).json({ error: 'AI generation is temporarily unavailable.' });
  }
}
