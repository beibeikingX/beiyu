// ============================================================
// 1. 页面初始化与主题切换
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    applyTheme(localStorage.getItem('blog-theme') === 'dark' || (!localStorage.getItem('blog-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches));
    loadSiteSettings();
    loadBackground();
    fetchHitokoto();
    renderArticles();
    renderShuoshuo();
    renderAlbum();
    recordVisit();
});

function switchTab(viewName) {
    ['home', 'articles', 'articleDetail', 'shuoshuo', 'album', 'admin'].forEach(v => {
        const el = document.getElementById(v + '-view');
        if (el) { el.classList.add('hidden'); el.classList.remove('block'); }
    });
    const target = document.getElementById(viewName + '-view');
    if (target) { target.classList.remove('hidden'); target.classList.add('block'); }
    window.scrollTo({top: 0, behavior: 'smooth'});

    if (viewName === 'articles') renderArticles();
    if (viewName === 'shuoshuo') renderShuoshuo();
    if (viewName === 'album') renderAlbum();
    if (viewName === 'admin' && typeof renderAdminLists === 'function') renderAdminLists(); 
}

// 主题控制
const htmlEl = document.documentElement; 
const themeToggleIcon = document.getElementById('theme-toggle');
function applyTheme(isDark) { 
    if (isDark) { htmlEl.classList.add('dark'); if(themeToggleIcon) themeToggleIcon.classList.replace('fa-moon', 'fa-sun'); localStorage.setItem('blog-theme', 'dark'); } 
    else { htmlEl.classList.remove('dark'); if(themeToggleIcon) themeToggleIcon.classList.replace('fa-sun', 'fa-moon'); localStorage.setItem('blog-theme', 'light'); } 
}
themeToggleIcon.addEventListener('click', () => applyTheme(!htmlEl.classList.contains('dark')));
document.getElementById('settings-theme-toggle').addEventListener('click', () => applyTheme(!htmlEl.classList.contains('dark')));
const settingsBtn = document.getElementById('settings-btn'); 
const settingsPanel = document.getElementById('settings-panel');
settingsBtn.addEventListener('click', () => settingsPanel.classList.toggle('hidden-panel'));
document.getElementById('close-settings').addEventListener('click', () => settingsPanel.classList.add('hidden-panel'));
document.addEventListener('click', (e) => { if (!settingsPanel.contains(e.target) && !settingsBtn.contains(e.target)) settingsPanel.classList.add('hidden-panel'); });

// ============================================================
// 2. 一言与设置加载
// ============================================================
function fetchHitokoto() { 
    const textElement = document.getElementById('hitokoto-text'); 
    if (!textElement) return; 
    textElement.textContent = '正在获取文案...'; 
    fetch('https://v1.hitokoto.cn/')
        .then(response => response.json())
        .then(data => { 
            const source = data.from ? ` —— ${data.from}` : ''; 
            textElement.textContent = `${data.hitokoto}${source}`; 
        })
        .catch(() => { textElement.textContent = '网络开小差了，点击重试~'; }); 
}

async function loadSiteSettings() {
    const resName = await api.settings.get('site_name');
    if (resName.success && resName.data.value) document.getElementById('site-name-display').textContent = resName.data.value;
    
    const resOp = await api.settings.get('card_opacity');
    if (resOp.success && resOp.data.value) {
        document.documentElement.style.setProperty('--card-opacity', resOp.data.value);
        document.getElementById('setting-opacity').value = Math.round(resOp.data.value * 100);
        document.getElementById('opacity-value').textContent = Math.round(resOp.data.value * 100) + '%';
    }
}

document.getElementById('setting-opacity').addEventListener('input', (e) => { 
    document.getElementById('opacity-value').textContent = e.target.value + '%'; 
    document.documentElement.style.setProperty('--card-opacity', e.target.value / 100); 
});

async function loadBackground() { 
    const res = await api.settings.get('background_image'); 
    if (res.success && res.data.value) document.documentElement.style.setProperty('--custom-bg', `url('${res.data.value}')`); 
}

async function recordVisit() { 
    const res = await api.stats.recordVisit(); 
    if (res.success) { 
        const dataRes = await api.stats.getVisit(); 
        if (dataRes.success) {
            const el = document.getElementById('visit-count'); 
            el.textContent = `访问量: ${dataRes.data.count}`; 
            el.classList.remove('hidden'); 
        }
    } 
}

// ============================================================
// 3. 前台渲染逻辑
// ============================================================
async function renderArticles() {
    const container = document.getElementById('articles-list');
    container.innerHTML = Array(3).fill(`<div class="glass rounded-2xl p-6 skeleton h-24 w-full"></div>`).join('');
    
    const res = await api.articles.getAll();
    if (!res.success) { container.innerHTML = '<div class="glass rounded-2xl p-6 text-center text-red-400">加载失败</div>'; return; }
    
    const data = res.data;
    if (data.length === 0) { container.innerHTML = '<div class="glass rounded-2xl p-6 text-center text-gray-500">暂无文章~</div>'; return; }
    
    container.innerHTML = '';
    data.forEach(item => {
        let tagsHtml = '';
        if (item.tags) { item.tags.split(',').forEach(tag => { if(tag.trim()) tagsHtml += `<span class="text-[10px] bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 px-1.5 py-0.5 rounded-md mr-1">#${tag.trim()}</span>`; }); }
        container.innerHTML += `
            <div class="glass rounded-2xl p-6 hover-lift cursor-pointer" onclick="openArticle(${item.id})">
                <h4 class="font-bold text-lg mb-2">${item.title}</h4>
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">${item.excerpt}...</p>
                <div class="flex items-center justify-between text-xs text-gray-400">
                    <div>${tagsHtml}</div>
                    <div class="flex items-center gap-3">
                        <span><i class="fas fa-calendar-alt mr-1"></i>${item.time.split(' ')[0]}</span>
                        <span><i class="fas fa-eye mr-1"></i>${item.views}</span>
                    </div>
                </div>
            </div>
        `;
    });
}

async function openArticle(id) {
    switchTab('articleDetail');
    document.getElementById('detail-title').innerText = '加载中...';
    document.getElementById('detail-content').innerHTML = '<div class="skeleton h-64 w-full"></div>';
    document.getElementById('detail-time').innerText = '';
    document.getElementById('detail-views').innerText = '';
    document.getElementById('detail-tags').innerHTML = '';

    const res = await api.articles.getOne(id);
    if (!res.success) {
        document.getElementById('detail-content').innerHTML = `<div class="text-red-400 text-center py-10">加载失败：${res.error}</div>`;
        return;
    }
    
    const data = res.data;
    document.getElementById('detail-title').innerText = data.title || '无标题';
    document.getElementById('detail-time').innerText = data.time || '未知时间';
    document.getElementById('detail-views').innerText = data.views || 0;
    
    let tagsHtml = '';
    if (data.tags) { 
        data.tags.split(',').forEach(tag => { 
            if(tag.trim()) tagsHtml += `<span class="text-[10px] bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 px-1.5 py-0.5 rounded-md mr-1">#${tag.trim()}</span>`; 
        }); 
    }
    document.getElementById('detail-tags').innerHTML = tagsHtml;

    try {
        if (typeof marked !== 'undefined' && marked.parse) {
            document.getElementById('detail-content').innerHTML = marked.parse(data.content || '');
            if (typeof hljs !== 'undefined') {
                document.querySelectorAll('#detail-content pre code').forEach((block) => { hljs.highlightElement(block); });
            }
        } else {
            document.getElementById('detail-content').innerText = data.content || '（无内容）';
        }
    } catch (e) {
        document.getElementById('detail-content').innerHTML = `<div class="text-red-500 mb-4">⚠️ 渲染出错：${e.message}</div><pre class="whitespace-pre-wrap">${data.content}</div>`;
    }
}

async function renderShuoshuo() {
    const container = document.getElementById('shuoshuo-list');
    container.innerHTML = Array(3).fill(`<div class="glass rounded-2xl p-6"><div class="flex items-center space-x-3 mb-3"><div class="skeleton w-10 h-10 rounded-full"></div><div class="space-y-2"><div class="skeleton h-3 w-16"></div><div class="skeleton h-2 w-12"></div></div></div><div class="skeleton h-4 w-full mb-2"></div><div class="skeleton h-4 w-2/3"></div></div>`).join('');
    
    const res = await api.shuoshuo.getAll();
    if (!res.success) { container.innerHTML = '<div class="glass rounded-2xl p-6 text-center text-red-400">加载失败</div>'; return; }
    
    const data = res.data;
    if (data.length === 0) { container.innerHTML = '<div class="glass rounded-2xl p-6 text-center text-gray-500">暂无说说~</div>'; return; }
    
    container.innerHTML = '';
    data.forEach((item) => {
        let tagsHtml = '';
        if (item.tags) { item.tags.split(',').forEach(tag => { if(tag.trim()) tagsHtml += `<span class="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded-md mr-1">#${tag.trim()}</span>`; }); }
        const isLiked = localStorage.getItem(`liked-${item.id}`) === 'true';
        const heartClass = isLiked ? 'fas fa-heart text-red-500' : 'far fa-heart text-gray-400';
        
        let html = `
            <div class="glass rounded-2xl p-6 hover-lift">
                <div class="flex items-center space-x-3 mb-3">
                    <img src="https://q1.qlogo.cn/g?b=qq&nk=1779180196&s=100" referrerpolicy="no-referrer" class="w-10 h-10 rounded-full bg-white dark:bg-gray-800" loading="lazy">
                    <div><div class="font-bold">北宇</div><div class="text-xs text-gray-500 dark:text-gray-400">${item.time}</div></div>
                </div>
                <p class="text-gray-700 dark:text-gray-300 text-sm mb-3 whitespace-pre-wrap">${item.text}</p>
                ${item.img ? `<img src="${item.img}" class="rounded-xl max-w-xs w-full object-cover mb-3" loading="lazy">` : ''}
                <div class="mb-2">${tagsHtml}</div>
                <div class="flex items-center gap-4 border-t border-gray-200 dark:border-gray-700 pt-3 mt-3 text-xs">
                    <button onclick="toggleLike(${item.id})" class="flex items-center gap-1 hover:text-red-500 transition ${isLiked ? 'text-red-500' : 'text-gray-500'}"><i id="heart-${item.id}" class="${heartClass}"></i> <span id="likes-${item.id}">${item.likes || 0}</span></button>
                    <button onclick="toggleComments(${item.id})" class="text-blue-500 hover:text-blue-700 flex items-center gap-1 transition"><i class="fas fa-comment"></i> 评论</button>
                </div>
                <div id="comments-${item.id}" class="hidden mt-3 space-y-3"></div>
            </div>`;
        container.innerHTML += html;
    });
}

async function toggleLike(id) {
    const isLiked = localStorage.getItem(`liked-${id}`) === 'true';
    const action = isLiked ? 'unlike' : 'like';
    const heart = document.getElementById(`heart-${id}`); 
    const countSpan = document.getElementById(`likes-${id}`); 
    let count = parseInt(countSpan.innerText);
    
    if (isLiked) { 
        heart.className = 'far fa-heart text-gray-400'; 
        countSpan.innerText = count - 1; 
        localStorage.removeItem(`liked-${id}`); 
    } else { 
        heart.className = 'fas fa-heart text-red-500'; 
        countSpan.innerText = count + 1; 
        localStorage.setItem(`liked-${id}`, 'true'); 
    }
    await api.shuoshuo.like(id, action);
}

async function toggleComments(id) {
    const container = document.getElementById(`comments-${id}`);
    if (container.classList.contains('hidden')) { container.classList.remove('hidden'); await loadComments(id); }
    else { container.classList.add('hidden'); }
}

async function loadComments(shuoshuoId) {
    const container = document.getElementById(`comments-${shuoshuoId}`);
    container.innerHTML = '<div class="skeleton h-10 w-full mb-2"></div><div class="skeleton h-10 w-full"></div>';
    
    const res = await api.comments.getByShuoshuo(shuoshuoId);
    if (!res.success) { container.innerHTML = '<div class="text-xs text-red-400 text-center py-2">评论加载失败</div>'; return; }
    
    const data = res.data;
    let html = '';
    if (data.length === 0) { html += `<div class="text-xs text-gray-500 text-center py-2">暂无评论，快来抢沙发吧！</div>`; }
    else {
        html += `<div class="space-y-2 mb-3">`;
        data.forEach(c => {
            const isReply = c.parent_id > 0;
            const marginClass = isReply ? 'ml-6 bg-white/20 dark:bg-black/10' : 'bg-white/40 dark:bg-black/20';
            html += `<div class="${marginClass} p-3 rounded-xl border border-white/50 dark:border-white/10"><div class="flex justify-between items-center mb-1"><span class="font-bold text-xs text-gray-700 dark:text-gray-300">${c.author} ${isReply ? '<i class="fas fa-reply text-[10px] text-gray-400 ml-1"></i>' : ''}</span><span class="text-[10px] text-gray-400">${c.time}</span></div><p class="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">${c.content}</p><button onclick="replyTo(${shuoshuoId}, ${c.id}, '${c.author.replace(/'/g, "\\'")}')" class="text-[10px] text-blue-500 hover:text-blue-700 mt-1 transition">回复</button></div>`;
        });
        html += `</div>`;
    }
    const savedAuthor = localStorage.getItem('comment-author') || '';
    html += `<div class="flex flex-col gap-2"><input type="text" id="comment-author-${shuoshuoId}" placeholder="你的昵称" value="${savedAuthor}" class="w-full glass border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 transition bg-transparent"><textarea id="comment-content-${shuoshuoId}" rows="2" placeholder="写下你的评论..." class="w-full glass border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 transition bg-transparent resize-none"></textarea><button id="comment-submit-btn-${shuoshuoId}" onclick="submitComment(${shuoshuoId})" class="self-end bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-1.5 px-4 rounded-lg transition shadow-md">发表评论</button></div>`;
    container.innerHTML = html;
}

function replyTo(shuoshuoId, parentId, author) {
    const contentInput = document.getElementById(`comment-content-${shuoshuoId}`);
    contentInput.placeholder = `回复 @${author}：`; contentInput.focus();
    const btn = document.getElementById(`comment-submit-btn-${shuoshuoId}`); 
    btn.setAttribute('data-parent-id', parentId);
}

async function submitComment(shuoshuoId) {
    const authorInput = document.getElementById(`comment-author-${shuoshuoId}`); 
    const contentInput = document.getElementById(`comment-content-${shuoshuoId}`);
    const btn = document.getElementById(`comment-submit-btn-${shuoshuoId}`); 
    const parentId = btn.getAttribute('data-parent-id') || 0;
    const author = authorInput.value.trim(); 
    const content = contentInput.value.trim();
    
    if (!author) return alert('请输入你的昵称！'); 
    if (!content) return alert('请输入评论内容！');
    
    localStorage.setItem('comment-author', author);
    const now = new Date(); 
    const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
    const res = await api.comments.add({ shuoshuo_id: shuoshuoId, author, content, time: timeStr, parent_id: parentId });
    if (res.success) { 
        contentInput.value = ''; 
        contentInput.placeholder = '写下你的评论...'; 
        btn.removeAttribute('data-parent-id'); 
        await loadComments(shuoshuoId); 
    } else { 
        alert('评论失败，请重试'); 
    }
}

async function renderAlbum() {
    const container = document.getElementById('album-list');
    container.innerHTML = Array(6).fill('<div class="glass rounded-2xl overflow-hidden skeleton h-48 w-full break-inside-avoid"></div>').join('');
    
    const res = await api.album.getAll();
    if (!res.success) { container.innerHTML = '<div class="glass rounded-2xl p-6 text-center text-red-400 w-full col-span-3">加载失败</div>'; return; }
    
    const data = res.data;
    if (data.length === 0) { container.innerHTML = '<div class="glass rounded-2xl p-6 text-center text-gray-500 w-full col-span-3">暂无照片~</div>'; return; }
    
    container.innerHTML = '';
    data.forEach((item) => { 
        container.innerHTML += `<div class="glass rounded-2xl overflow-hidden hover-lift break-inside-avoid relative group"><img src="${item.src}" class="w-full" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300?text=Image+Error'"><div class="p-3 text-sm text-center text-gray-600 dark:text-gray-400">${item.desc}</div></div>`; 
    });
}

// ============================================================
// 4. 悬浮球拖拽
// ============================================================
const widget = document.getElementById('music-widget'); 
let isDragging = false; 
let isMoved = false; 
let startX, startY, startLeft, startTop;
function getClientX(e) { return e.type.includes('mouse') ? e.clientX : e.touches[0].clientX; }
function getClientY(e) { return e.type.includes('mouse') ? e.clientY : e.touches[0].clientY; }

function dragStart(e) {
    if (e.target.closest('.widget-content') && !e.target.closest('.widget-header')) return;
    isDragging = true; isMoved = false; 
    const clientX = getClientX(e); const clientY = getClientY(e);
    const rect = widget.getBoundingClientRect(); 
    startX = clientX; startY = clientY; startLeft = rect.left; startTop = rect.top;
    widget.style.transition = 'none'; 
    widget.style.right = 'auto'; widget.style.bottom = 'auto'; 
    widget.style.left = startLeft + 'px'; widget.style.top = startTop + 'px';
}

function dragMove(e) {
    if (!isDragging) return; 
    const clientX = getClientX(e); const clientY = getClientY(e);
    const dx = clientX - startX; const dy = clientY - startY; 
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) isMoved = true;
    let newLeft = startLeft + dx; let newTop = startTop + dy;
    const maxX = window.innerWidth - widget.offsetWidth; 
    const maxY = window.innerHeight - widget.offsetHeight;
    newLeft = Math.max(0, Math.min(newLeft, maxX)); 
    newTop = Math.max(0, Math.min(newTop, maxY));
    widget.style.left = newLeft + 'px'; widget.style.top = newTop + 'px'; 
    if (e.cancelable) e.preventDefault();
}

function dragEnd() {
    if (!isDragging) return; 
    isDragging = false; 
    widget.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    const rect = widget.getBoundingClientRect(); 
    const centerX = rect.left + rect.width / 2;
    if (centerX < window.innerWidth / 2) { widget.style.left = '20px'; } 
    else { widget.style.left = (window.innerWidth - rect.width - 20) + 'px'; }
}

widget.addEventListener('mousedown', dragStart); 
document.addEventListener('mousemove', dragMove); 
document.addEventListener('mouseup', dragEnd);
widget.addEventListener('touchstart', dragStart, { passive: false }); 
document.addEventListener('touchmove', dragMove, { passive: false }); 
document.addEventListener('touchend', dragEnd);

function toggleWidget(e) { 
    if (e) e.stopPropagation(); 
    if (isMoved) return; 
    const widget = document.getElementById('music-widget'); 
    if (widget.classList.contains('collapsed')) { 
        widget.classList.remove('collapsed'); widget.classList.add('expanded'); 
    } else { 
        widget.classList.remove('expanded'); widget.classList.add('collapsed'); 
    } 
}
