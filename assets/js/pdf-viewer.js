// 显示PDF文件
async function displayPDF(pdfUrl) {
    try {
        // 配置PDF.js
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        
        // 加载PDF文档
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        
        // 获取总页数
        totalPages = pdf.numPages;
        
        // 显示第一页
        await displayPage(pdf, currentPage);
    } catch (error) {
        console.error('加载PDF错误:', error);
        alert('无法加载PDF文件');
    }
}

// 显示PDF页面
async function displayPage(pdf, pageNumber) {
    try {
        // 获取页面
        const page = await pdf.getPage(pageNumber);
        
        // 设置缩放
        const viewport = page.getViewport({ scale: currentZoom * 2 });
        
        // 获取canvas
        const canvas = document.getElementById('pdf-canvas');
        const context = canvas.getContext('2d');
        
        // 设置canvas尺寸
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // 渲染页面
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        
        await page.render(renderContext).promise;
    } catch (error) {
        console.error('渲染PDF页面错误:', error);
    }
}

// 旋转PDF页面
function rotatePDF() {
    const canvas = document.getElementById('pdf-canvas');
    const currentRotation = canvas.dataset.rotation || 0;
    const newRotation = (parseInt(currentRotation) + 90) % 360;
    canvas.dataset.rotation = newRotation;
    canvas.style.transform = `scale(${currentZoom}) rotate(${newRotation}deg)`;
}

// 适应屏幕
function fitPDFToScreen() {
    const canvas = document.getElementById('pdf-canvas');
    const container = document.querySelector('.viewer-container');
    const containerWidth = container.clientWidth - 40; // 减去padding
    const containerHeight = container.clientHeight - 40;
    
    // 计算适合的缩放比例
    const scaleX = containerWidth / canvas.width;
    const scaleY = containerHeight / canvas.height;
    const scale = Math.min(scaleX, scaleY);
    
    currentZoom = scale;
    updateComicDisplay();
}
