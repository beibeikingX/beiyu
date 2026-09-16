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
            const url = new URL(request.url);
            const id = url.searchParams.get('id');
            
            if (id) {
                // 获取单篇文章，并增加阅读量
                await env.DB.prepare('UPDATE articles SET views = views + 1 WHERE id = ?').bind(id).run();
                const article = await env.DB.prepare('SELECT * FROM articles WHERE id = ?').bind(id).first();
                return new Response(JSON.stringify(article), { headers });
            } else {
                // 获取文章列表（不返回正文内容，只返回摘要，减轻加载负担）
                const { results } = await env.DB.prepare('SELECT id, title, tags, time, views, substr(content, 1, 100) as excerpt FROM articles ORDER BY id DESC').all();
                return new Response(JSON.stringify(results), { headers });
            }
        }

        if (method === 'POST') {
            if (!isAdmin) return new Response(JSON.stringify({ error: '无权操作' }), { status: 403, headers });
            const { title, content, tags, time } = await request.json();
            if (!title || !content) return new Response(JSON.stringify({ error: '标题和内容不能为空' }), { status: 400, headers });
            await env.DB.prepare('INSERT INTO articles (title, content, tags, time) VALUES (?, ?, ?, ?)').bind(title, content, tags || '', time).run();
            return new Response(JSON.stringify({ success: true }), { headers });
        }

        if (method === 'PUT') {
            if (!isAdmin) return new Response(JSON.stringify({ error: '无权操作' }), { status: 403, headers });
            const { id, title, content, tags } = await request.json();
            await env.DB.prepare('UPDATE articles SET title = ?, content = ?, tags = ? WHERE id = ?').bind(title, content, tags || '', id).run();
            return new Response(JSON.stringify({ success: true }), { headers });
        }

        if (method === 'DELETE') {
            if (!isAdmin) return new Response(JSON.stringify({ error: '无权操作' }), { status: 403, headers });
            const url = new URL(request.url);
            const id = url.searchParams.get('id');
            await env.DB.prepare('DELETE FROM articles WHERE id = ?').bind(id).run();
            return new Response(JSON.stringify({ success: true }), { headers });
        }
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
    return new Response(JSON.stringify({ error: '不支持的请求方法' }), { status: 405, headers });
}
