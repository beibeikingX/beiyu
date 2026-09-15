export async function onRequest(context) {
    const { request, env } = context;
    const method = request.method;

    if (method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    }

    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
    };

    try {
        // GET: 获取某条说说下的评论
        if (method === 'GET') {
            const url = new URL(request.url);
            const shuoshuo_id = url.searchParams.get('shuoshuo_id');
            if (!shuoshuo_id) {
                return new Response(JSON.stringify({ error: '缺少说说ID' }), { status: 400, headers });
            }
            const { results } = await env.DB.prepare('SELECT * FROM comments WHERE shuoshuo_id = ? ORDER BY id ASC')
                                     .bind(shuoshuo_id)
                                     .all();
            return new Response(JSON.stringify(results), { headers });
        }

        // POST: 提交新评论
        if (method === 'POST') {
            const body = await request.json();
            const { shuoshuo_id, author, content, time } = body;
            if (!shuoshuo_id || !author || !content) {
                return new Response(JSON.stringify({ error: '昵称和内容不能为空' }), { status: 400, headers });
            }
            await env.DB.prepare('INSERT INTO comments (shuoshuo_id, author, content, time) VALUES (?, ?, ?, ?)')
                     .bind(shuoshuo_id, author, content, time)
                     .run();
            return new Response(JSON.stringify({ success: true }), { headers });
        }

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }

    return new Response(JSON.stringify({ error: '不支持的请求方法' }), { status: 405, headers });
}
