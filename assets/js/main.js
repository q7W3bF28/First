// 全局变量
let selectedBookcase = null;
let currentBookcasePassword = null;
let ably = null;
let currentComic = null;
let currentPage = 1;
let totalPages = 1;
let currentZoom = 1.0;
let currentRotation = 0;

// Cloudinary 配置
const CLOUDINARY_CLOUD_NAME = 'dc5rhyjth';
const CLOUDINARY_API_KEY = '459597826878157';
const CLOUDINARY_UPLOAD_PRESET = 'comic_share'; // 使用用户指定的预设名

// Ably 配置
const ABLY_API_KEY = 'nc5NGw.wSmsXg:SMs5pD5aJ4hGMvNZnd7pJp2lYS2X1iCmWm_yeLx_pkk';

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化Ably
    ably = new Ably.Realtime(ABLY_API_KEY);
    
    // 根据当前页面执行不同初始化
    const currentPath = window.location.pathname;
    if (currentPath.includes('index.html') || currentPath === '/') {
        initHomePage();
    } else if (currentPath.includes('share.html')) {
        initSharePage();
    } else if (currentPath.includes('read.html')) {
        initReadPage();
    }
});

// 首页初始化
function initHomePage() {
    // 绑定分享按钮
    document.getElementById('start-share-btn').addEventListener('click', function() {
        window.location.href = 'share.html';
    });
    
    // 绑定阅读按钮
    document.getElementById('start-read-btn').addEventListener('click', function() {
        window.location.href = 'read.html';
    });
}

// 分享页面初始化
function initSharePage() {
    generateBookcases();
    
    // 文件上传区域点击事件
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('comic-file');
    
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });
    
    // 拖放功能
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', function() {
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelection();
        }
    });
    
    // 文件选择事件
    fileInput.addEventListener('change', handleFileSelection);
    
    // 上传按钮事件
    document.getElementById('upload-btn').addEventListener('click', uploadComic);
    
    // 返回按钮事件
    document.getElementById('back-btn').addEventListener('click', function() {
        window.location.href = 'index.html';
    });
    
    // 复制密码按钮事件
    document.getElementById('copy-password')?.addEventListener('click', function() {
        const password = document.getElementById('new-password').textContent;
        navigator.clipboard.writeText(password).then(() => {
            const btn = this;
            btn.textContent = '✓ 已复制';
            setTimeout(() => {
                btn.textContent = '复制密码';
            }, 2000);
        });
    });
}

// 阅读页面初始化
function initReadPage() {
    generateBookcases();
    
    // 验证密码按钮事件
    document.getElementById('verify-btn').addEventListener('click', verifyPassword);
    
    // 密码输入框回车事件
    document.getElementById('password-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            verifyPassword();
        }
    });
    
    // 密码显示切换
    document.getElementById('toggle-password').addEventListener('click', function() {
        const input = document.getElementById('password-input');
        if (input.type === 'password') {
            input.type = 'text';
            this.textContent = '👁️‍';
        } else {
            input.type = 'password';
            this.textContent = '👁️';
        }
    });
    
    // 查看器控制按钮事件
    document.getElementById('prev-page').addEventListener('click', prevPage);
    document.getElementById('next-page').addEventListener('click', nextPage);
    document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
    document.getElementById('zoom-in-btn').addEventListener('click', zoomIn);
    document.getElementById('zoom-out-btn').addEventListener('click', zoomOut);
    document.getElementById('rotate-btn').addEventListener('click', rotateComic);
    document.getElementById('fit-screen-btn').addEventListener('click', fitComicToScreen);
    
    // 返回按钮事件
    document.getElementById('back-btn').addEventListener('click', function() {
        window.location.href = 'index.html';
    });
}

// 上一页
function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        updateComicDisplay();
    }
}

// 下一页
function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        updateComicDisplay();
    }
}

// 放大
function zoomIn() {
    if (currentZoom < 3.0) {
        currentZoom += 0.25;
        updateComicDisplay();
    }
}

// 缩小
function zoomOut() {
    if (currentZoom > 0.5) {
        currentZoom -= 0.25;
        updateComicDisplay();
    }
}

// 旋转漫画
function rotateComic() {
    if (currentComic.format === 'pdf') {
        rotatePDF();
    } else if (currentComic.format === 'zip') {
        rotateImage();
    }
}

// 适应屏幕
function fitComicToScreen() {
    if (currentComic.format === 'pdf') {
        fitPDFToScreen();
    } else if (currentComic.format === 'zip') {
        fitImageToScreen();
    }
}

// 生成书柜
function generateBookcases() {
    const bookcaseGrid = document.querySelector('.bookcase-grid');
    if (!bookcaseGrid) return;
    
    bookcaseGrid.innerHTML = '';
    
    for (let i = 1; i <= 10; i++) {
        const bookcase = document.createElement('div');
        bookcase.className = 'bookcase';
        bookcase.dataset.id = i;
        
        bookcase.innerHTML = `
            <div class="bookcase-icon">📚</div>
            <h3>书柜 ${i}</h3>
        `;
        
        bookcase.addEventListener('click', function() {
            // 移除其他书柜的选中状态
            document.querySelectorAll('.bookcase').forEach(b => b.classList.remove('selected'));
            
            // 选中当前书柜
            this.classList.add('selected');
            selectedBookcase = this.dataset.id;
            
            // 根据当前页面执行不同操作
            const currentPath = window.location.pathname;
            if (currentPath.includes('share.html')) {
                document.querySelector('.upload-section').style.display = 'block';
                document.getElementById('file-info').style.display = 'none';
                document.getElementById('success-message').style.display = 'none';
                // 显示当前选中的书柜
                document.getElementById('selected-bookcase-display').textContent = selectedBookcase;
            } else if (currentPath.includes('read.html')) {
                document.getElementById('password-section').style.display = 'block';
                // 填充存储的密码
                const storedPassword = localStorage.getItem(`bookcase_${selectedBookcase}_password`);
                if (storedPassword) {
                    document.getElementById('password-input').value = storedPassword;
                } else {
                    document.getElementById('password-input').value = '123456';
                }
            }
        });
        
        bookcaseGrid.appendChild(bookcase);
    }
}

// 处理文件选择
function handleFileSelection() {
    const fileInput = document.getElementById('comic-file');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        fileName.textContent = `文件名: ${file.name}`;
        fileSize.textContent = `文件大小: ${(file.size / 1024 / 1024).toFixed(2)} MB`;
        fileInfo.style.display = 'block';
    }
}

// 上传漫画
async function uploadComic() {
    const fileInput = document.getElementById('comic-file');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('upload-progress');
    const progressText = document.getElementById('progress-text');
    
    if (!fileInput.files.length || !selectedBookcase) {
        alert('请选择书柜和文件');
        return;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', `bookcase_${selectedBookcase}`);
    
    // 显示进度条
    progressContainer.style.display = 'block';
    
    try {
        // 使用Cloudinary上传文件
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
            {
                method: 'POST',
                body: formData
            }
        );
        
        const result = await response.json();
        
        if (result.secure_url) {
            // 上传成功，生成新密码
            const newPassword = generateRandomPassword();
            
            // 更新书柜密码
            await updateBookcasePassword(selectedBookcase, newPassword);
            
            // 通过Ably发布新密码
            publishNewPassword(selectedBookcase, newPassword);
            
            // 显示成功消息
            document.getElementById('selected-bookcase').textContent = selectedBookcase;
            document.getElementById('new-password').textContent = newPassword;
            document.getElementById('success-message').style.display = 'block';
            
            // 隐藏上传表单
            document.querySelector('.upload-section').style.display = 'block';
            document.getElementById('file-info').style.display = 'none';
            progressContainer.style.display = 'none';
        } else {
            throw new Error('上传失败');
        }
    } catch (error) {
        console.error('上传错误:', error);
        alert('上传失败，请重试');
        progressContainer.style.display = 'none';
    }
}

// 验证密码
async function verifyPassword() {
    const passwordInput = document.getElementById('password-input');
    const password = passwordInput.value;
    const errorMessage = document.getElementById('error-message');
    
    if (!password || !selectedBookcase) {
        alert('请选择书柜并输入密码');
        return;
    }
    
    try {
        // 获取书柜密码
        const storedPassword = await getBookcasePassword(selectedBookcase);
        
        if (password === storedPassword) {
            // 密码正确，隐藏错误消息
            errorMessage.style.display = 'none';
            
            // 显示漫画查看器
            document.getElementById('password-section').style.display = 'none';
            document.getElementById('comic-viewer').style.display = 'block';
            
            // 获取书柜中的漫画
            const comics = await getComicsInBookcase(selectedBookcase);
            
            if (comics.length > 0) {
                // 显示第一个漫画
                currentComic = comics[0];
                displayComic(currentComic);
                
                // 显示当前密码
                document.getElementById('current-password').textContent = storedPassword;
                
                // 订阅密码更新
                subscribeToPasswordUpdates(selectedBookcase, (message) => {
                    const newPassword = message.data;
                    currentBookcasePassword = newPassword;
                    document.getElementById('current-password').textContent = newPassword;
                    document.getElementById('password-update-indicator').style.display = 'inline-block';
                    
                    // 更新本地存储
                    localStorage.setItem(`bookcase_${selectedBookcase}_password`, newPassword);
                    
                    // 5秒后隐藏更新指示器
                    setTimeout(() => {
                        document.getElementById('password-update-indicator').style.display = 'none';
                    }, 5000);
                });
            } else {
                alert('该书柜中没有漫画');
            }
        } else {
            // 密码错误
            errorMessage.style.display = 'block';
            passwordInput.value = '';
            passwordInput.focus();
        }
    } catch (error) {
        console.error('验证密码错误:', error);
        alert('验证失败，请重试');
    }
}

// 显示漫画
function displayComic(comic) {
    const comicTitle = document.getElementById('comic-title');
    const pdfViewer = document.getElementById('pdf-viewer');
    const zipViewer = document.getElementById('zip-viewer');
    
    comicTitle.textContent = comic.name;
    
    if (comic.format === 'pdf') {
        pdfViewer.style.display = 'block';
        zipViewer.style.display = 'none';
        displayPDF(comic.url);
    } else if (comic.format === 'zip') {
        pdfViewer.style.display = 'none';
        zipViewer.style.display = 'block';
        displayZIP(comic.url);
    }
    
    // 重置页面和缩放
    currentPage = 1;
    currentZoom = 1.0;
    currentRotation = 0;
    updateComicDisplay();
}

// 更新漫画显示
function updateComicDisplay() {
    const pageCounter = document.getElementById('page-counter');
    const zoomPercent = document.getElementById('zoom-percent');
    
    pageCounter.textContent = `${currentPage}/${totalPages}`;
    zoomPercent.textContent = `${Math.round(currentZoom * 100)}%`;
    
    // 更新按钮状态
    document.getElementById('prev-page').disabled = currentPage <= 1;
    document.getElementById('next-page').disabled = currentPage >= totalPages;
    
    // 应用缩放和旋转
    const canvas = document.getElementById('pdf-canvas');
    const image = document.getElementById('comic-image');
    
    if (canvas) {
        const rotation = canvas.dataset.rotation || 0;
        canvas.style.transform = `scale(${currentZoom}) rotate(${rotation}deg)`;
    }
    
    if (image) {
        const rotation = image.dataset.rotation || 0;
        image.style.transform = `scale(${currentZoom}) rotate(${rotation}deg)`;
    }
}

// 切换全屏
function toggleFullscreen() {
    const viewerContainer = document.querySelector('.viewer-container');
    
    if (!document.fullscreenElement) {
        viewerContainer.requestFullscreen().catch(err => {
            alert(`无法进入全屏模式: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

// 生成随机密码
function generateRandomPassword() {
    const charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let password = "";
    for (let i = 0; i < 6; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}
