export async function onRequest(context) {
    const { request, env } = context;
    const method = request.method;

    if (method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
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
            const url = new URL(request.url);
            const key = url.searchParams.get('key');
            if (!key) return new Response(JSON.stringify({ error: '缺少 key' }), { status: 400, headers });
            
            const result = await env.DB.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first();
            return new Response(JSON.stringify(result || {}), { headers });
        }

        if (method === 'PUT') {
            const url = new URL(request.url);
            const key = url.searchParams.get('key');
            const body = await request.json();
            const value = body.value;
            
            if (!key || value === undefined) return new Response(JSON.stringify({ error: '参数错误' }), { status: 400, headers });

            // 使用 UPSERT 语法（如果存在则更新，不存在则插入）
            await env.DB.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?')
                     .bind(key, value, value)
                     .run();
            return new Response(JSON.stringify({ success: true }), { headers });
        }

        if (method === 'DELETE') {
            const url = new URL(request.url);
            const key = url.searchParams.get('key');
            if (!key) return new Response(JSON.stringify({ error: '缺少 key' }), { status: 400, headers });
            
            await env.DB.prepare('DELETE FROM settings WHERE key = ?').bind(key).run();
            return new Response(JSON.stringify({ success: true }), { headers });
        }

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }

    return new Response(JSON.stringify({ error: '不支持的请求方法' }), { status: 405, headers });
}
