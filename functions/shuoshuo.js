export async function onRequest(context) {
    const { request, env } = context;
    const method = request.method;

    if (method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
