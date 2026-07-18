const TEACHERS_API = 'https://api.nabilsnigdho.dev/teachers';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const upstream = await fetch(TEACHERS_API, {
      headers: { Accept: 'application/json' },
    });

    if (!upstream.ok) {
      return response.status(502).json({ error: 'Teacher directory unavailable' });
    }

    const data = await upstream.json();
    response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return response.status(200).json(data);
  } catch (error) {
    console.error('Teacher directory proxy failed', error);
    return response.status(502).json({ error: 'Teacher directory unavailable' });
  }
}
