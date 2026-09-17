export async function onRequest(context) {
    const { request, env } = context;
    const method = request.method;

    if (method === 'OPTIONS') {
        return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
    }
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

    try {
        const authHeader = request.headers.get('Authorization');
        const isAdmin = authHeader === 'Bearer ' + (env.ADMIN_TOKEN || 'my-secret-token-123');

        if (method === 'GET') {
            const { results } = await env.DB.prepare('SELECT * FROM links ORDER BY id DESC').all();
            return new Response(JSON.stringify(results), { headers });
        }

        if (method === 'POST') {
            if (!isAdmin) return new Response(JSON.stringify({ error: '无权操作' }), { status: 403, headers });
            const { name, url, avatar, description } = await request.json();
            if (!name || !url) return new Response(JSON.stringify({ error: '名称和链接不能为空' }), { status: 400, headers });
            await env.DB.prepare('INSERT INTO links (name, url, avatar, description) VALUES (?, ?, ?, ?)').bind(name, url, avatar || '', description || '').run();
            return new Response(JSON.stringify({ success: true }), { headers });
        }

        if (method === 'PUT') {
            if (!isAdmin) return new Response(JSON.stringify({ error: '无权操作' }), { status: 403, headers });
            const { id, name, url, avatar, description } = await request.json();
            await env.DB.prepare('UPDATE links SET name = ?, url = ?, avatar = ?, description = ? WHERE id = ?').bind(name, url, avatar || '', description || '', id).run();
            return new Response(JSON.stringify({ success: true }), { headers });
        }

        if (method === 'DELETE') {
            if (!isAdmin) return new Response(JSON.stringify({ error: '无权操作' }), { status: 403, headers });
            const url = new URL(request.url);
            const id = url.searchParams.get('id');
            await env.DB.prepare('DELETE FROM links WHERE id = ?').bind(id).run();
            return new Response(JSON.stringify({ success: true }), { headers });
        }
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
    return new Response(JSON.stringify({ error: '不支持的请求方法' }), { status: 405, headers });
