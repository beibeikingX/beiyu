export async function onRequest(context) {
    const { request, env } = context;
    const method = request.method;

    if (method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    }

    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
    };

    try {
        if (method === 'GET') {
            const { results } = await env.DB.prepare('SELECT * FROM shuoshuo ORDER BY id DESC').all();
            return new Response(JSON.stringify(results), { headers });
        }

        if (method === 'POST') {
            const body = await request.json();
            const { text, img, time } = body;
            if (!text) {
                return new Response(JSON.stringify({ error: '说说内容不能为空' }), { status: 400, headers });
            }
            await env.DB.prepare('INSERT INTO shuoshuo (text, img, time) VALUES (?, ?, ?)')
                     .bind(text, img || null, time)
                     .run();
            return new Response(JSON.stringify({ success: true }), { headers });
        }

        if (method === 'PUT') {
            const body = await request.json();
            const { id, text, img } = body;
            if (!id || !text) {
                return new Response(JSON.stringify({ error: '缺少 ID 或内容为空' }), { status: 400, headers });
            }
            await env.DB.prepare('UPDATE shuoshuo SET text = ?, img = ? WHERE id = ?')
                     .bind(text, img || null, id)
                     .run();
            return new Response(JSON.stringify({ success: true }), { headers });
        }

        if (method === 'DELETE') {
            const url = new URL(request.url);
            const id = url.searchParams.get('id');
            if (!id) {
                return new Response(JSON.stringify({ error: '缺少 ID 参数' }), { status: 400, headers });
            }
            await env.DB.prepare('DELETE FROM shuoshuo WHERE id = ?').bind(id).run();
            return new Response(JSON.stringify({ success: true }), { headers });
        }

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }

    return new Response(JSON.stringify({ error: '不支持的请求方法' }), { status: 405, headers });
}
export async function onRequest(context) {
    const { request, env } = context;
    const method = request.method;

    if (method === 'OPTIONS') {
        return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
    }
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

    try {
        // 简单的鉴权：写操作必须带上前端设置的管理员 Token（防止小白恶意调接口）
        const authHeader = request.headers.get('Authorization');
        const isAdmin = authHeader === 'Bearer ' + (env.ADMIN_TOKEN || 'my-secret-token-123');

        if (method === 'GET') {
            const { results } = await env.DB.prepare('SELECT * FROM shuoshuo ORDER BY id DESC').all();
            return new Response(JSON.stringify(results), { headers });
        }

        if (method === 'POST') {
            if (!isAdmin) return new Response(JSON.stringify({ error: '无权操作' }), { status: 403, headers });
            const { text, img, time, tags } = await request.json();
            if (!text) return new Response(JSON.stringify({ error: '内容不能为空' }), { status: 400, headers });
            await env.DB.prepare('INSERT INTO shuoshuo (text, img, time, tags) VALUES (?, ?, ?, ?)').bind(text, img || null, time, tags || '').run();
            return new Response(JSON.stringify({ success: true }), { headers });
        }

        // 点赞接口
        if (method === 'PATCH') {
            const url = new URL(request.url);
            const id = url.searchParams.get('id');
            const action = url.searchParams.get('action'); // like or unlike
            if (!id) return new Response(JSON.stringify({ error: '缺少 ID' }), { status: 400, headers });
            
            if (action === 'like') {
                await env.DB.prepare('UPDATE shuoshuo SET likes = likes + 1 WHERE id = ?').bind(id).run();
            } else {
                await env.DB.prepare('UPDATE shuoshuo SET likes = likes - 1 WHERE id = ?').bind(id).run();
            }
            return new Response(JSON.stringify({ success: true }), { headers });
        }

        if (method === 'PUT') {
            if (!isAdmin) return new Response(JSON.stringify({ error: '无权操作' }), { status: 403, headers });
            const { id, text, img, tags } = await request.json();
            await env.DB.prepare('UPDATE shuoshuo SET text = ?, img = ?, tags = ? WHERE id = ?').bind(text, img || null, tags || '', id).run();
            return new Response(JSON.stringify({ success: true }), { headers });
        }

        if (method === 'DELETE') {
            if (!isAdmin) return new Response(JSON.stringify({ error: '无权操作' }), { status: 403, headers });
            const url = new URL(request.url);
            const id = url.searchParams.get('id');
            await env.DB.prepare('DELETE FROM shuoshuo WHERE id = ?').bind(id).run();
            return new Response(JSON.stringify({ success: true }), { headers });
        }
    } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
    return new Response(JSON.stringify({ error: '不支持的请求方法' }), { status: 405, headers });

