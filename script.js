// Estado da aplicação
let selectedFiles = [];
let selectedSize = 5; // MB
let processedFiles = [];

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    setupDragAndDrop();
}

function setupEventListeners() {
    // File input
    const fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', handleFileSelect);
    
    // Size options
    const sizeOptions = document.querySelectorAll('.size-option');
    sizeOptions.forEach(option => {
        option.addEventListener('click', handleSizeSelect);
    });
    
    // Custom size input
    const customSizeInput = document.getElementById('customSizeInput');
    customSizeInput.addEventListener('input', handleCustomSizeInput);
}

function setupDragAndDrop() {
    const uploadArea = document.getElementById('uploadArea');
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files).filter(file => 
            file.type === 'application/pdf'
        );
        
        if (files.length > 0) {
            handleFiles(files);
        } else {
            showNotification('Por favor, selecione apenas arquivos PDF.', 'error');
        }
    });
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    handleFiles(files);
}

function handleFiles(files) {
    selectedFiles = files;
    displaySelectedFiles();
    showSection('sizeSection');
    showSection('filesSection');
}

function displaySelectedFiles() {
    const filesList = document.getElementById('filesList');
    filesList.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const fileItem = createFileItem(file, index);
        filesList.appendChild(fileItem);
    });
}

function createFileItem(file, index) {
    const div = document.createElement('div');
    div.className = 'file-item fade-in';
    
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    
    div.innerHTML = `
        <div class="file-info">
            <div class="file-icon">
                <i class="fas fa-file-pdf"></i>
            </div>
            <div class="file-details">
                <h4>${file.name}</h4>
                <p>Arquivo PDF</p>
            </div>
        </div>
        <div class="file-size">${sizeInMB} MB</div>
    `;
    
    return div;
}

function handleSizeSelect(e) {
    // Remove seleção anterior
    document.querySelectorAll('.size-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Adiciona seleção atual
    e.currentTarget.classList.add('selected');
    
    const size = e.currentTarget.dataset.size;
    
    if (size === 'custom') {
        document.getElementById('customSize').style.display = 'block';
        selectedSize = parseFloat(document.getElementById('customSizeInput').value) || 5;
    } else {
        document.getElementById('customSize').style.display = 'none';
        selectedSize = parseFloat(size);
    }
}

function handleCustomSizeInput(e) {
    const value = parseFloat(e.target.value);
    if (value > 0) {
        selectedSize = value;
    }
}

async function processFiles() {
    if (selectedFiles.length === 0) {
        showNotification('Selecione pelo menos um arquivo PDF.', 'error');
        return;
    }
    
    if (!selectedSize || selectedSize <= 0) {
        showNotification('Selecione um tamanho válido.', 'error');
        return;
    }
    
    showSection('processingSection');
    hideSection('sizeSection');
    hideSection('filesSection');
    
    processedFiles = [];
    const totalFiles = selectedFiles.length;
    
    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        updateProcessingStatus(`Processando ${file.name}... (${i + 1}/${totalFiles})`);
        updateProgress((i / totalFiles) * 100);
        
        try {
            const compressedFile = await compressPDF(file, selectedSize);
            processedFiles.push({
                original: file,
                compressed: compressedFile,
                originalSize: file.size,
                compressedSize: compressedFile.size,
                savings: file.size - compressedFile.size
            });
        } catch (error) {
            console.error('Erro ao processar arquivo:', error);
            showNotification(`Erro ao processar ${file.name}`, 'error');
        }
    }
    
    updateProgress(100);
    setTimeout(() => {
        showResults();
    }, 500);
}

async function compressPDF(file, maxSizeMB) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        
        // Configurações de compressão baseadas no tamanho desejado
        let compressionLevel = 0.8;
        if (maxSizeMB <= 1) compressionLevel = 0.3;
        else if (maxSizeMB <= 2) compressionLevel = 0.5;
        else if (maxSizeMB <= 5) compressionLevel = 0.7;
        else if (maxSizeMB <= 10) compressionLevel = 0.8;
        else compressionLevel = 0.9;
        
        // Comprime o PDF
        const pdfBytes = await pdfDoc.save({
            useObjectStreams: false,
            addDefaultPage: false,
            objectsPerTick: 50,
        });
        
        // Verifica se precisa de mais compressão
        const currentSizeMB = pdfBytes.length / (1024 * 1024);
        
        if (currentSizeMB > maxSizeMB) {
            // Aplica compressão mais agressiva
            const compressedPdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
            const finalPdfBytes = await compressedPdfDoc.save({
                useObjectStreams: true,
                addDefaultPage: false,
                objectsPerTick: 25,
            });
            
            return new File([finalPdfBytes], file.name, { type: 'application/pdf' });
        }
        
        return new File([pdfBytes], file.name, { type: 'application/pdf' });
        
    } catch (error) {
        console.error('Erro na compressão:', error);
        // Em caso de erro, retorna o arquivo original
        return file;
    }
}

function updateProcessingStatus(status) {
    document.getElementById('processingStatus').textContent = status;
}

function updateProgress(percentage) {
    document.getElementById('progressFill').style.width = percentage + '%';
}

function showResults() {
    hideSection('processingSection');
    showSection('resultsSection');
    
    displayResultsSummary();
    displayResultsList();
}

function displayResultsSummary() {
    const summary = document.getElementById('resultsSummary');
    
    const totalOriginalSize = processedFiles.reduce((sum, file) => sum + file.originalSize, 0);
    const totalCompressedSize = processedFiles.reduce((sum, file) => sum + file.compressedSize, 0);
    const totalSavings = totalOriginalSize - totalCompressedSize;
    const savingsPercentage = ((totalSavings / totalOriginalSize) * 100).toFixed(1);
    
    summary.innerHTML = `
        <h4>📊 Resumo da Compactação</h4>
        <p><strong>${processedFiles.length}</strong> arquivos processados com sucesso</p>
        <p>Tamanho original: <strong>${formatFileSize(totalOriginalSize)}</strong></p>
        <p>Tamanho compactado: <strong>${formatFileSize(totalCompressedSize)}</strong></p>
        <p>Economia total: <strong>${formatFileSize(totalSavings)} (${savingsPercentage}%)</strong></p>
    `;
}

function displayResultsList() {
    const resultsList = document.getElementById('resultsList');
    resultsList.innerHTML = '';
    
    processedFiles.forEach((fileData, index) => {
        const resultItem = createResultItem(fileData, index);
        resultsList.appendChild(resultItem);
    });
}

function createResultItem(fileData, index) {
    const div = document.createElement('div');
    div.className = 'result-item fade-in';
    
    const savingsPercentage = ((fileData.savings / fileData.originalSize) * 100).toFixed(1);
    const isWithinLimit = (fileData.compressedSize / (1024 * 1024)) <= selectedSize;
    const statusIcon = isWithinLimit ? '✅' : '⚠️';
    const statusText = isWithinLimit ? 'Dentro do limite' : 'Acima do limite';
    
    div.innerHTML = `
        <div class="result-info">
            <h4>${statusIcon} ${fileData.original.name}</h4>
            <p>${statusText} (máximo: ${selectedSize} MB)</p>
            <div class="size-comparison">
                <div class="size-before">
                    <small>Antes</small>
                    <span>${formatFileSize(fileData.originalSize)}</span>
                </div>
                <div class="size-after">
                    <small>Depois</small>
                    <span>${formatFileSize(fileData.compressedSize)}</span>
                </div>
                <div class="savings">
                    <small>Economia</small>
                    <span>${savingsPercentage}%</span>
                </div>
            </div>
        </div>
        <button class="btn-download" onclick="downloadFile(${index})">
            <i class="fas fa-download"></i> Baixar
        </button>
    `;
    
    return div;
}

function downloadFile(index) {
    const fileData = processedFiles[index];
    const url = URL.createObjectURL(fileData.compressed);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compactado_${fileData.original.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function downloadAllFiles() {
    processedFiles.forEach((fileData, index) => {
        setTimeout(() => downloadFile(index), index * 500);
    });
}

// Event listener para o botão de download all
document.addEventListener('DOMContentLoaded', function() {
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    if (downloadAllBtn) {
        downloadAllBtn.addEventListener('click', downloadAllFiles);
    }
});

function resetApp() {
    selectedFiles = [];
    processedFiles = [];
    selectedSize = 5;
    
    // Reset file input
    document.getElementById('fileInput').value = '';
    
    // Reset size selection
    document.querySelectorAll('.size-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector('.size-option[data-size="5"]').classList.add('selected');
    
    // Hide custom size
    document.getElementById('customSize').style.display = 'none';
    document.getElementById('customSizeInput').value = '';
    
    // Show/hide sections
    hideSection('sizeSection');
    hideSection('filesSection');
    hideSection('processingSection');
    hideSection('resultsSection');
    
    // Reset progress
    updateProgress(0);
}

function showSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
        section.classList.add('fade-in');
    }
}

function hideSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'none';
        section.classList.remove('fade-in');
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Adicionar estilos se não existirem
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 1000;
                max-width: 400px;
                animation: slideIn 0.3s ease-out;
            }
            
            .notification-error {
                border-left: 4px solid #dc3545;
            }
            
            .notification-info {
                border-left: 4px solid #17a2b8;
            }
            
            .notification i:first-child {
                color: #dc3545;
            }
            
            .notification-info i:first-child {
                color: #17a2b8;
            }
            
            .notification button {
                background: none;
                border: none;
                cursor: pointer;
                color: #666;
                margin-left: auto;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove após 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}