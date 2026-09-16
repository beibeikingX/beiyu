export async function onRequest(context) {
    const { request, env } = context;
    const method = request.method;
    
    // 处理跨域
    if (method === 'OPTIONS') {
        return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
    }
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

    try {
        if (method !== 'POST') return new Response(JSON.stringify({ error: '不支持的方法' }), { status: 405, headers });

        // 鉴权（防止别人用你的服务器刷图）
        const authHeader = request.headers.get('Authorization');
        const isAdmin = authHeader === 'Bearer ' + (env.ADMIN_TOKEN || 'my-secret-token-123');
        if (!isAdmin) return new Response(JSON.stringify({ error: '无权操作' }), { status: 403, headers });

        // 接收前端传来的 FormData
        const formData = await request.formData();
        const file = formData.get('file');
        if (!file) return new Response(JSON.stringify({ error: '没有选择文件' }), { status: 400, headers });

        // 转发给 Catbox.moe 图床
        const catboxForm = new FormData();
        catboxForm.append('reqtype', 'fileupload');
        // 必须显式提供文件名，否则 Catbox 会报错
        catboxForm.append('fileToUpload', file, 'upload.jpg'); 

        const catboxRes = await fetch('https://catbox.moe/user/api.php', {
            method: 'POST',
            body: catboxForm
        });
        
        // Catbox 成功时返回的是纯文本的图片链接，失败时返回错误信息
        const catboxText = await catboxRes.text();
        
        if (catboxText.startsWith('https://')) {
            return new Response(JSON.stringify({ success: true, url: catboxText.trim() }), { headers });
        } else {
            throw new Error('图床响应异常: ' + catboxText.substring(0, 100));
        }

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
}
