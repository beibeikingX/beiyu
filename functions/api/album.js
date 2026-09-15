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
            const { results } = await env.DB.prepare('SELECT * FROM album ORDER BY id DESC').all();
            return new Response(JSON.stringify(results), { headers });
        }

        if (method === 'POST') {
            const body = await request.json();
            const { src, desc } = body;
            if (!src) {
                return new Response(JSON.stringify({ error: '图片链接不能为空' }), { status: 400, headers });
            }
            await env.DB.prepare('INSERT INTO album (src, desc) VALUES (?, ?)')
                     .bind(src, desc || '未命名图片')
                     .run();
            return new Response(JSON.stringify({ success: true }), { headers });
        }

        if (method === 'PUT') {
            const body = await request.json();
            const { id, src, desc } = body;
            if (!id || !src) {
                return new Response(JSON.stringify({ error: '缺少 ID 或图片链接为空' }), { status: 400, headers });
            }
            await env.DB.prepare('UPDATE album SET src = ?, desc = ? WHERE id = ?')
                     .bind(src, desc || '未命名图片', id)
                     .run();
            return new Response(JSON.stringify({ success: true }), { headers });
        }

        if (method === 'DELETE') {
            const url = new URL(request.url);
            const id = url.searchParams.get('id');
            if (!id) {
                return new Response(JSON.stringify({ error: '缺少 ID 参数' }), { status: 400, headers });
            }
            await env.DB.prepare('DELETE FROM album WHERE id = ?').bind(id).run();
            return new Response(JSON.stringify({ success: true }), { headers });
        }

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }

    return new Response(JSON.stringify({ error: '不支持的请求方法' }), { status: 405, headers });
}
