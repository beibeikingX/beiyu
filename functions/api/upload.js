export async function onRequest(context) {
    const { request, env } = context;
    const method = request.method;
    
    if (method === 'OPTIONS') {
        return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
    }
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

    try {
        if (method !== 'POST') return new Response(JSON.stringify({ error: '不支持的方法' }), { status: 405, headers });

        const authHeader = request.headers.get('Authorization');
        const isAdmin = authHeader === 'Bearer ' + (env.ADMIN_TOKEN || 'my-secret-token-123');
        if (!isAdmin) return new Response(JSON.stringify({ error: '无权操作' }), { status: 403, headers });

        const formData = await request.formData();
        const file = formData.get('file');
        if (!file) return new Response(JSON.stringify({ error: '没有选择文件' }), { status: 400, headers });

        const uploadForm = new FormData();
        uploadForm.append('file', file);
        
        const telegraPhRes = await fetch('https://telegra.ph/upload', {
            method: 'POST',
            body: uploadForm
        });
        
        if (!telegraPhRes.ok) {
            const errorText = await telegraPhRes.text();
            throw new Error(`图床拒绝请求 (${telegraPhRes.status}): ${errorText.substring(0, 100)}`);
        }
        
        const result = await telegraPhRes.json();
        
        if (result && result[0] && result[0].src) {
            const imgUrl = 'https://telegra.ph' + result[0].src;
            return new Response(JSON.stringify({ success: true, url: imgUrl }), { headers });
        } else {
            throw new Error('图床返回数据格式异常');
        }

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
}
