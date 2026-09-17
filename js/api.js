// 全局配置
const API_TOKEN = 'my-secret-token-123'; 
const authHeaders = { 'Authorization': `Bearer ${API_TOKEN}` };

// 通用请求封装
async function request(url, options = {}) {
    try {
        const res = await fetch(url, options);
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data ? (data.error || '请求失败') : '网络错误');
        return { success: true, data };
    } catch (e) {
        console.error('API Error:', url, e);
        return { success: false, error: e.message };
    }
}

// 接口集合
const api = {
    // 说说
    shuoshuo: {
        getAll: () => request('/api/shuoshuo'),
        add: (data) => request('/api/shuoshuo', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders }, body: JSON.stringify(data) }),
        update: (data) => request('/api/shuoshuo', { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders }, body: JSON.stringify(data) }),
        delete: (id) => request(`/api/shuoshuo?id=${id}`, { method: 'DELETE', headers: authHeaders }),
        like: (id, action) => request(`/api/shuoshuo?id=${id}&action=${action}`, { method: 'PATCH' })
    },
    // 相册
    album: {
        getAll: () => request('/api/album'),
        add: (data) => request('/api/album', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders }, body: JSON.stringify(data) }),
        update: (data) => request('/api/album', { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders }, body: JSON.stringify(data) }),
        delete: (id) => request(`/api/album?id=${id}`, { method: 'DELETE', headers: authHeaders })
    },
    // 文章
    articles: {
        getAll: () => request('/api/articles'),
        getOne: (id) => request(`/api/articles?id=${id}`),
        add: (data) => request('/api/articles', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders }, body: JSON.stringify(data) }),
        update: (data) => request('/api/articles', { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders }, body: JSON.stringify(data) }),
        delete: (id) => request(`/api/articles?id=${id}`, { method: 'DELETE', headers: authHeaders })
    },
    // 友链
links: {
    getAll: () => request('/api/links'),
    add: (data) => request('/api/links', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders }, body: JSON.stringify(data) }),
    update: (data) => request('/api/links', { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders }, body: JSON.stringify(data) }),
    delete: (id) => request(`/api/links?id=${id}`, { method: 'DELETE', headers: authHeaders })
},
    // 评论
    comments: {
        getByShuoshuo: (shuoshuo_id) => request(`/api/comments?shuoshuo_id=${shuoshuo_id}`),
        add: (data) => request('/api/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    },
    // 设置
    settings: {
        get: (key) => request(`/api/settings?key=${key}`),
        save: (key, value) => request(`/api/settings?key=${key}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders }, body: JSON.stringify({ value }) }),
        delete: (key) => request(`/api/settings?key=${key}`, { method: 'DELETE', headers: authHeaders })
    },
    // 统计
    stats: {
        recordVisit: () => request('/api/stats', { method: 'POST' }),
        getVisit: () => request('/api/stats')
    }
};
