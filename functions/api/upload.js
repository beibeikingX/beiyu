export async function onRequest(context) {
    const { request, env } = context;
    const method = request.method;
    
    if (method === 'OPTIONS') {
        return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
    }
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

    try {
        if (method !== 'POST') return new Response(JSON.stringify({ error: '不支持的方法' }), { status: 405, headers });

        // 鉴权
        const authHeader = request.headers.get('Authorization');
        const isAdmin = authHeader === 'Bearer ' + (env.ADMIN_TOKEN || 'my-secret-token-123');
        if (!isAdmin) return new Response(JSON.stringify({ error: '无权操作' }), { status: 403, headers });

        const formData = await request.formData();
        const file = formData.get('file');
        if (!file) return new Response(JSON.stringify({ error: '没有选择文件' }), { status: 400, headers });

        // 生成唯一文件名
        const ext = file.name ? file.name.split('.').pop() : 'jpg';
        const key = `images/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

        // 上传到 R2
        await env.MY_BUCKET.put(key, file.stream(), {
            httpMetadata: { contentType: file.type }
        });

        // 拼接公开访问链接
        const publicUrl = env.R2_PUBLIC_URL;
        if (!publicUrl) throw new Error('未配置 R2_PUBLIC_URL 环境变量');

        const fileUrl = `${publicUrl}/${key}`;
        return new Response(JSON.stringify({ success: true, url: fileUrl }), { headers });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
}
