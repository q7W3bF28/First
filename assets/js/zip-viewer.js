// 显示ZIP文件中的图像
async function displayZIP(zipUrl) {
    try {
        // 获取ZIP文件
        const response = await fetch(zipUrl);
        const blob = await response.blob();
        
        // 解压ZIP文件
        const zip = await JSZip.loadAsync(blob);
        
        // 获取所有图像文件
        const imageFiles = [];
        zip.forEach((relativePath, file) => {
            if (!file.dir && (file.name.toLowerCase().endsWith('.jpg') || 
                file.name.toLowerCase().endsWith('.jpeg') || 
                file.name.toLowerCase().endsWith('.png'))) {
                imageFiles.push(file);
            }
        });
        
        // 按文件名排序
        imageFiles.sort((a, b) => a.name.localeCompare(b.name));
        
        // 设置总页数
        totalPages = imageFiles.length;
        
        // 显示第一张图像
        if (totalPages > 0) {
            await displayImage(imageFiles[currentPage - 1]);
        } else {
            alert('ZIP文件中没有找到图像');
        }
    } catch (error) {
        console.error('处理ZIP文件错误:', error);
        alert('无法处理ZIP文件');
    }
}

// 显示图像
async function displayImage(imageFile) {
    try {
        // 获取图像数据
        const imageData = await imageFile.async('blob');
        const imageUrl = URL.createObjectURL(imageData);
        
        // 设置图像源
        const image = document.getElementById('comic-image');
        image.src = imageUrl;
        
        // 应用缩放
        image.style.transform = `scale(${currentZoom})`;
    } catch (error) {
        console.error('显示图像错误:', error);
    }
}

// 旋转图像
function rotateImage() {
    const image = document.getElementById('comic-image');
    const currentRotation = image.dataset.rotation || 0;
    const newRotation = (parseInt(currentRotation) + 90) % 360;
    image.dataset.rotation = newRotation;
    image.style.transform = `scale(${currentZoom}) rotate(${newRotation}deg)`;
}

// 适应屏幕
function fitImageToScreen() {
    const image = document.getElementById('comic-image');
    const container = document.querySelector('.viewer-container');
    const containerWidth = container.clientWidth - 40; // 减去padding
    const containerHeight = container.clientHeight - 40;
    
    // 计算适合的缩放比例
    const scaleX = containerWidth / image.naturalWidth;
    const scaleY = containerHeight / image.naturalHeight;
    const scale = Math.min(scaleX, scaleY);
    
    currentZoom = scale;
    updateComicDisplay();
}
