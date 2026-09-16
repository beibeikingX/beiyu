export async function onRequest(context) {
    const { request, env } = context;
    const method = request.method;
    if (method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

    try {
        if (method === 'GET') {
            const url = new URL(request.url);
            const shuoshuo_id = url.searchParams.get('shuoshuo_id');
            const { results } = await env.DB.prepare('SELECT * FROM comments WHERE shuoshuo_id = ? ORDER BY id ASC').bind(shuoshuo_id).all();
            return new Response(JSON.stringify(results), { headers });
        }
        if (method === 'POST') {
            const { shuoshuo_id, author, content, time, parent_id } = await request.json();
            if (!shuoshuo_id || !author || !content) return new Response(JSON.stringify({ error: '昵称和内容不能为空' }), { status: 400, headers });
            await env.DB.prepare('INSERT INTO comments (shuoshuo_id, author, content, time, parent_id) VALUES (?, ?, ?, ?, ?)').bind(shuoshuo_id, author, content, time, parent_id || 0).run();
            return new Response(JSON.stringify({ success: true }), { headers });
        }
    } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
    return new Response(JSON.stringify({ error: '不支持的请求方法' }), { status: 405, headers });
}
