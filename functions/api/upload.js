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

        // 接收前端传来的 Base64 图片数据
        const body = await request.json();
        const base64Image = body.image;
        if (!base64Image) return new Response(JSON.stringify({ error: '没有接收到图片数据' }), { status: 400, headers });

        // 转发给 ImgBB
        const imgbbForm = new FormData();
        imgbbForm.append('image', base64Image);

        const imgbbKey = env.IMGBB_API_KEY;
        if (!imgbbKey) throw new Error('未配置 IMGBB_API_KEY 环境变量');

        const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
            method: 'POST',
            body: imgbbForm
        });
        
        const result = await imgbbRes.json();
        
        if (result && result.data && result.data.url) {
            return new Response(JSON.stringify({ success: true, url: result.data.url }), { headers });
        } else {
            throw new Error(result.error ? result.error.message : '图床返回数据异常');
        }

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
}
