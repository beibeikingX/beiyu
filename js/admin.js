// ============================================================
// 1. 后台登录与退出
// ============================================================
function handleLogin() { 
    const user = document.getElementById('admin-username').value; 
    const pass = document.getElementById('admin-password').value; 
    if (user === 'admin' && pass === '1677554758a') { 
        document.getElementById('admin-login').classList.add('hidden'); 
        document.getElementById('admin-main').classList.remove('hidden'); 
        renderAdminLists(); 
        alert('登录成功！'); 
    } else { 
        alert('账号或密码错误！'); 
    } 
}

function logout() { 
    document.getElementById('admin-login').classList.remove('hidden'); 
    document.getElementById('admin-main').classList.add('hidden'); 
    document.getElementById('admin-username').value = ''; 
    document.getElementById('admin-password').value = ''; 
    cancelEditShuoshuo(); 
    cancelEditAlbum(); 
    cancelEditArticle(); 
    switchTab('home'); 
}

// ============================================================
// 2. 图片上传 (R2)
// ============================================================
function compressImage(file, maxWidth = 1200, quality = 0.8) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => { resolve(blob); }, 'image/jpeg', quality);
            };
        };
    });
}

async function uploadImage(inputElement, targetInputId) {
    const file = inputElement.files[0];
    if (!file) return;
    const targetInput = document.getElementById(targetInputId);
    const originalPlaceholder = targetInput.placeholder;
    targetInput.placeholder = '图片压缩中...';
    targetInput.disabled = true;
    try {
        const compressedBlob = await compressImage(file);
        targetInput.placeholder = '图片上传中...';
        const formData = new FormData();
        formData.append('file', compressedBlob, 'image.jpg');
        
        const res = await fetch('/api/upload', { method: 'POST', headers: authHeaders, body: formData });
        const data = await res.json();
        
        if (data.success && data.url) {
            targetInput.value = data.url;
            alert('图片上传成功！');
        } else { throw new Error(data.error || '上传失败'); }
    } catch (e) { 
        alert('上传失败：' + e.message); 
    }
    finally { 
        targetInput.placeholder = originalPlaceholder; 
        targetInput.disabled = false; 
        inputElement.value = ''; 
    }
}

// ============================================================
// 3. 后台列表渲染
// ============================================================
async function renderAdminLists() {
    // 文章管理列表
    const adminArticleContainer = document.getElementById('admin-article-list');
    adminArticleContainer.innerHTML = '<div class="skeleton h-12 w-full mb-2"></div><div class="skeleton h-12 w-full mb-2"></div>';
    const resArticles = await api.articles.getAll();
    if (!resArticles.success) { adminArticleContainer.innerHTML = '<div class="text-center text-red-400 text-sm py-4">加载失败</div>'; }
    else if (resArticles.data.length === 0) { adminArticleContainer.innerHTML = '<div class="text-center text-gray-500 text-sm py-4">暂无文章</div>'; }
    else {
        adminArticleContainer.innerHTML = '';
        resArticles.data.forEach(item => {
            adminArticleContainer.innerHTML += `<div class="flex justify-between items-center bg-white/40 dark:bg-black/30 p-3 rounded-xl border border-white/50 dark:border-white/10"><div class="flex-1 min-w-0 pr-3"><div class="text-xs text-gray-500 dark:text-gray-400 mb-1">${item.time}</div><div class="text-sm truncate">${item.title}</div></div><div class="flex gap-2 shrink-0"><button onclick="editArticle(${item.id})" class="bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900 text-blue-500 w-8 h-8 rounded-full flex items-center justify-center transition"><i class="fas fa-pen text-xs"></i></button><button onclick="deleteArticle(${item.id})" class="bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900 text-red-500 w-8 h-8 rounded-full flex items-center justify-center transition"><i class="fas fa-trash-alt text-xs"></i></button></div></div>`;
        });
    }

    // 说说管理列表
    const adminShuoshuoContainer = document.getElementById('admin-shuoshuo-list');
    adminShuoshuoContainer.innerHTML = '<div class="skeleton h-12 w-full mb-2"></div><div class="skeleton h-12 w-full mb-2"></div>';
    const resShuoshuo = await api.shuoshuo.getAll();
    if (!resShuoshuo.success) { adminShuoshuoContainer.innerHTML = '<div class="text-center text-red-400 text-sm py-4">加载失败</div>'; }
    else if (resShuoshuo.data.length === 0) { adminShuoshuoContainer.innerHTML = '<div class="text-center text-gray-500 text-sm py-4">暂无说说</div>'; }
    else {
        adminShuoshuoContainer.innerHTML = '';
        resShuoshuo.data.forEach(item => {
            adminShuoshuoContainer.innerHTML += `<div class="flex justify-between items-center bg-white/40 dark:bg-black/30 p-3 rounded-xl border border-white/50 dark:border-white/10"><div class="flex-1 min-w-0 pr-3"><div class="text-xs text-gray-500 dark:text-gray-400 mb-1">${item.time}</div><div class="text-sm truncate">${item.text}</div></div><div class="flex gap-2 shrink-0"><button onclick="editShuoshuo(${item.id}, '${item.text.replace(/'/g, "\\'")}', '${item.img || ''}', '${item.tags || ''}')" class="bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900 text-blue-500 w-8 h-8 rounded-full flex items-center justify-center transition"><i class="fas fa-pen text-xs"></i></button><button onclick="deleteShuoshuo(${item.id})" class="bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900 text-red-500 w-8 h-8 rounded-full flex items-center justify-center transition"><i class="fas fa-trash-alt text-xs"></i></button></div></div>`;
        });
    }

    // 相册管理列表
    const adminAlbumContainer = document.getElementById('admin-album-list');
    adminAlbumContainer.innerHTML = '<div class="skeleton h-12 w-full mb-2"></div><div class="skeleton h-12 w-full mb-2"></div>';
    const resAlbum = await api.album.getAll();
    if (!resAlbum.success) { adminAlbumContainer.innerHTML = '<div class="text-center text-red-400 text-sm py-4">加载失败</div>'; }
    else if (resAlbum.data.length === 0) { adminAlbumContainer.innerHTML = '<div class="text-center text-gray-500 text-sm py-4">暂无图片</div>'; }
    else {
        adminAlbumContainer.innerHTML = '';
        resAlbum.data.forEach(item => {
            adminAlbumContainer.innerHTML += `<div class="flex items-center gap-3 bg-white/40 dark:bg-black/30 p-2 rounded-xl border border-white/50 dark:border-white/10"><img src="${item.src}" class="w-10 h-10 rounded-lg object-cover shrink-0" loading="lazy" onerror="this.src='https://via.placeholder.com/100?text=Img'"><div class="flex-1 min-w-0"><div class="text-sm truncate">${item.desc}</div></div><div class="flex gap-2 shrink-0"><button onclick="editAlbum(${item.id}, '${item.src}', '${item.desc.replace(/'/g, "\\'")}')" class="bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900 text-blue-500 w-8 h-8 rounded-full flex items-center justify-center transition"><i class="fas fa-pen text-xs"></i></button><button onclick="deleteAlbum(${item.id})" class="bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900 text-red-500 w-8 h-8 rounded-full flex items-center justify-center transition"><i class="fas fa-trash-alt text-xs"></i></button></div></div>`;
        });
    }
}

// ============================================================
// 4. 文章增删改查
// ============================================================
async function editArticle(id) {
    const res = await api.articles.getOne(id);
    if (!res.success) return alert('获取文章失败');
    const data = res.data;
    document.getElementById('edit-article-id').value = data.id;
    document.getElementById('new-article-title').value = data.title;
    document.getElementById('new-article-tags').value = data.tags || '';
    document.getElementById('new-article-content').value = data.content;
    document.getElementById('article-form-title').innerText = '修改文章';
    document.getElementById('article-submit-btn').innerText = '保存修改';
    document.getElementById('cancel-article-btn').classList.remove('hidden');
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function cancelEditArticle() {
    document.getElementById('edit-article-id').value = '';
    document.getElementById('new-article-title').value = '';
    document.getElementById('new-article-tags').value = '';
    document.getElementById('new-article-content').value = '';
    document.getElementById('article-form-title').innerText = '发布文章';
    document.getElementById('article-submit-btn').innerText = '立即发布';
    document.getElementById('cancel-article-btn').classList.add('hidden');
}

async function submitArticle() {
    const id = document.getElementById('edit-article-id').value;
    const title = document.getElementById('new-article-title').value.trim();
    const tags = document.getElementById('new-article-tags').value.trim();
    const content = document.getElementById('new-article-content').value.trim();
    if (!title || !content) return alert('标题和内容不能为空');
    
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
    let res;
    if (id) {
        res = await api.articles.update({ id, title, content, tags });
    } else {
        res = await api.articles.add({ title, content, tags, time: timeStr });
    }
    
    if (res.success) {
        alert(id ? '修改成功！' : '发布成功！');
        cancelEditArticle(); 
        renderAdminLists();
    } else {
        alert('操作失败：' + res.error);
    }
}

async function deleteArticle(id) {
    if(!confirm('确定删除这篇文章吗？')) return;
    const res = await api.articles.delete(id);
    if (res.success) { alert('删除成功！'); renderAdminLists(); }
    else { alert('删除失败：' + res.error); }
}

// ============================================================
// 5. 说说增删改查
// ============================================================
function editShuoshuo(id, text, img, tags) { 
    document.getElementById('edit-shuoshuo-id').value = id; 
    document.getElementById('new-shuoshuo-text').value = text; 
    document.getElementById('new-shuoshuo-img').value = img; 
    document.getElementById('new-shuoshuo-tags').value = tags; 
    document.getElementById('shuoshuo-form-title').innerText = '修改说说'; 
    document.getElementById('shuoshuo-submit-btn').innerText = '保存修改'; 
    document.getElementById('cancel-shuoshuo-btn').classList.remove('hidden'); 
    window.scrollTo({top: 0, behavior: 'smooth'}); 
}

function cancelEditShuoshuo() { 
    document.getElementById('edit-shuoshuo-id').value = ''; 
    document.getElementById('new-shuoshuo-text').value = ''; 
    document.getElementById('new-shuoshuo-img').value = ''; 
    document.getElementById('new-shuoshuo-tags').value = ''; 
    document.getElementById('shuoshuo-form-title').innerText = '发布说说'; 
    document.getElementById('shuoshuo-submit-btn').innerText = '立即发布'; 
    document.getElementById('cancel-shuoshuo-btn').classList.add('hidden'); 
}

async function submitShuoshuo() {
    const id = document.getElementById('edit-shuoshuo-id').value; 
    const text = document.getElementById('new-shuoshuo-text').value.trim(); 
    const img = document.getElementById('new-shuoshuo-img').value.trim(); 
    const tags = document.getElementById('new-shuoshuo-tags').value.trim();
    if (!text) return alert('请输入说说内容');
    
    const now = new Date(); 
    const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
    let res;
    if (id) {
        res = await api.shuoshuo.update({ id, text, img: img || null, tags });
    } else {
        res = await api.shuoshuo.add({ text, img: img || null, time: timeStr, tags });
    }
    
    if (res.success) {
        alert(id ? '修改成功！' : '发布成功！'); 
        cancelEditShuoshuo(); 
        renderAdminLists(); 
        renderShuoshuo();
    } else {
        alert('操作失败：' + res.error);
    }
}

async function deleteShuoshuo(id) { 
    if(!confirm('确定删除这条说说吗？')) return; 
    const res = await api.shuoshuo.delete(id); 
    if (res.success) { alert('删除成功！'); renderAdminLists(); renderShuoshuo(); }
    else { alert('删除失败：' + res.error); }
}

// ============================================================
// 6. 相册增删改查
// ============================================================
function editAlbum(id, src, desc) { 
    document.getElementById('edit-album-id').value = id; 
    document.getElementById('new-album-img').value = src; 
    document.getElementById('new-album-desc').value = desc; 
    document.getElementById('album-form-title').innerText = '修改相册'; 
    document.getElementById('album-submit-btn').innerText = '保存修改'; 
    document.getElementById('cancel-album-btn').classList.remove('hidden'); 
    window.scrollTo({top: 0, behavior: 'smooth'}); 
}

function cancelEditAlbum() { 
    document.getElementById('edit-album-id').value = ''; 
    document.getElementById('new-album-img').value = ''; 
    document.getElementById('new-album-desc').value = ''; 
    document.getElementById('album-form-title').innerText = '添加相册图片'; 
    document.getElementById('album-submit-btn').innerText = '添加图片'; 
    document.getElementById('cancel-album-btn').classList.add('hidden'); 
}

async function submitAlbum() {
    const id = document.getElementById('edit-album-id').value; 
    const img = document.getElementById('new-album-img').value.trim(); 
    const desc = document.getElementById('new-album-desc').value.trim();
    if (!img) return alert('请输入图片链接');
    
    let res;
    if (id) {
        res = await api.album.update({ id, src: img, desc: desc || '未命名图片' });
    } else {
        res = await api.album.add({ src: img, desc: desc || '未命名图片' });
    }
    
    if (res.success) {
        alert(id ? '修改成功！' : '添加成功！'); 
        cancelEditAlbum(); 
        renderAdminLists(); 
        renderAlbum();
    } else {
        alert('操作失败：' + res.error);
    }
}

async function deleteAlbum(id) { 
    if(!confirm('确定删除这张照片吗？')) return; 
    const res = await api.album.delete(id); 
    if (res.success) { alert('删除成功！'); renderAdminLists(); renderAlbum(); }
    else { alert('删除失败：' + res.error); }
}

// ============================================================
// 7. 全局设置逻辑
// ============================================================
async function saveSiteName() { 
    const url = document.getElementById('setting-site-name').value.trim(); 
    if (!url) return alert('请输入站点名称！'); 
    const res = await api.settings.save('site_name', url);
    if (res.success) { alert('站点名称保存成功！'); document.getElementById('site-name-display').textContent = url; }
    else { alert('保存失败：' + res.error); }
}

async function saveOpacity() { 
    const val = document.getElementById('setting-opacity').value / 100; 
    const res = await api.settings.save('card_opacity', val);
    if (res.success) alert('透明度保存成功！');
    else alert('保存失败：' + res.error);
}

async function saveBgSetting() { 
    const url = document.getElementById('setting-bg-url').value.trim(); 
    if (!url) return alert('请输入图片链接！'); 
    const res = await api.settings.save('background_image', url);
    if (res.success) { alert('背景图保存成功！'); document.getElementById('setting-bg-url').value = ''; loadBackground(); }
    else { alert('保存失败：' + res.error); }
}

async function deleteBgSetting() { 
    if (!confirm('确定要恢复默认背景图吗？')) return; 
    const res = await api.settings.delete('background_image');
    if (res.success) { alert('已恢复默认背景！'); document.documentElement.style.removeProperty('--custom-bg'); }
    else { alert('操作失败：' + res.error); }
}
