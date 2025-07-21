// Estado da aplicação
let selectedImages = [];
let generatedPdf = null;

// Verificar se PDF-lib carregou
window.addEventListener('load', function() {
    console.log('=== VERIFICAÇÃO INICIAL ===');
    console.log('PDFLib disponível:', typeof PDFLib !== 'undefined');
    console.log('PDFLib.PDFDocument:', typeof PDFLib?.PDFDocument);
    
    if (typeof PDFLib === 'undefined') {
        console.error('ERRO CRÍTICO: PDF-lib não foi carregada!');
        showNotification('Erro: Biblioteca PDF não carregada. Recarregue a página.', 'error');
    } else {
        console.log('✅ PDF-lib carregada com sucesso');
    }
});

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    setupDragAndDrop();
}

function setupEventListeners() {
    // File input para imagens
    const imageInput = document.getElementById('imageInput');
    imageInput.addEventListener('change', handleImageSelect);

    // Download PDF button
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', downloadGeneratedPdf);
    }

    // Image order select
    const imageOrderSelect = document.getElementById('imageOrder');
    if (imageOrderSelect) {
        imageOrderSelect.addEventListener('change', function() {
            if (selectedImages.length > 0) {
                sortImages();
                displaySelectedImages();
            }
        });
    }
}

function setupDragAndDrop() {
    // Drag and drop para imagens
    const imageUploadZone = document.getElementById('imageUploadZone');
    setupDragDropZone(imageUploadZone, handleImages, 'image/*');
}

function setupDragDropZone(zone, handler, acceptType) {
    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('dragover');
    });
    
    zone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
    });
    
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        // Aceitar qualquer arquivo que pareça ser imagem
        const validFiles = files.filter(file => 
            file.type.startsWith('image/') || 
            /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file.name)
        );
        
        if (validFiles.length > 0) {
            handler(validFiles);
        } else {
            showNotification('Por favor, selecione apenas arquivos de imagem.', 'error');
        }
    });
}

// Funções para geração de PDF a partir de imagens
function handleImageSelect(e) {
    const files = Array.from(e.target.files);
    handleImages(files);
}

function handleImages(files) {
    console.log('=== ARQUIVOS SELECIONADOS ===');
    console.log('Quantidade:', files.length);
    
    files.forEach((file, index) => {
        console.log(`Arquivo ${index + 1}:`, {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: new Date(file.lastModified)
        });
    });
    
    selectedImages = [...selectedImages, ...files];
    sortImages();
    displaySelectedImages();
    showSection('imageConfigSection');
    showSection('imagesSection');
    updateImageCounter();
}

function sortImages() {
    const order = document.getElementById('imageOrder')?.value || 'original';
    
    switch(order) {
        case 'name':
            selectedImages.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'size':
            selectedImages.sort((a, b) => b.size - a.size);
            break;
        case 'date':
            selectedImages.sort((a, b) => b.lastModified - a.lastModified);
            break;
        default:
            // Manter ordem original
            break;
    }
}

function displaySelectedImages() {
    const imagesList = document.getElementById('imagesList');
    imagesList.innerHTML = '';
    
    selectedImages.forEach((file, index) => {
        const imageItem = createImageItem(file, index);
        imagesList.appendChild(imageItem);
    });
}

function createImageItem(file, index) {
    const div = document.createElement('div');
    div.className = 'image-item fade-in';
    
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    const url = URL.createObjectURL(file);
    
    div.innerHTML = `
        <img src="${url}" alt="${file.name}" class="image-preview">
        <div class="image-info">
            <h5>${file.name}</h5>
            <p>${sizeInMB} MB • ${file.type || 'Imagem'}</p>
        </div>
        <div class="image-actions">
            <span class="image-order">Página ${index + 1}</span>
            <button class="btn btn-remove" onclick="removeImage(${index})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return div;
}

function removeImage(index) {
    selectedImages.splice(index, 1);
    displaySelectedImages();
    updateImageCounter();
    
    if (selectedImages.length === 0) {
        hideSection('imageConfigSection');
        hideSection('imagesSection');
    }
}

function clearImages() {
    selectedImages = [];
    document.getElementById('imageInput').value = '';
    hideSection('imageConfigSection');
    hideSection('imagesSection');
    updateImageCounter();
}

function updateImageCounter() {
    const counter = document.getElementById('imageCounter');
    if (counter) {
        const count = selectedImages.length;
        counter.textContent = `${count} ${count === 1 ? 'imagem selecionada' : 'imagens selecionadas'}`;
    }
}

// Função corrigida para obter dimensões da página
function getPageDimensions(pageSize, orientation) {
    console.log('🔧 getPageDimensions chamada com:', { pageSize, orientation });
    
    // Definir dimensões fixas e válidas
    const sizes = {
        'A4': { width: 595, height: 842 },
        'Letter': { width: 612, height: 792 },
        'Legal': { width: 612, height: 1008 },
        'A3': { width: 842, height: 1191 }
    };
    
    // Garantir que temos um pageSize válido
    const validPageSize = pageSize && sizes[pageSize] ? pageSize : 'A4';
    console.log('📏 Usando tamanho de página:', validPageSize);
    
    const size = sizes[validPageSize];
    console.log('📐 Dimensões base:', size);
    
    // Aplicar orientação
    let result;
    if (orientation === 'landscape') {
        result = { width: size.height, height: size.width };
        console.log('🔄 Aplicando orientação paisagem');
    } else {
        result = { width: size.width, height: size.height };
        console.log('📄 Usando orientação retrato');
    }
    
    console.log('✅ Dimensões finais:', result);
    
    // Verificação de segurança
    if (!result.width || !result.height || isNaN(result.width) || isNaN(result.height)) {
        console.error('❌ ERRO: Dimensões inválidas detectadas, usando A4 padrão');
        return { width: 595, height: 842 };
    }
    
    return result;
}

async function generatePDF() {
    console.log('\n=== INICIANDO GERAÇÃO DE PDF ===');
    
    // Verificar PDF-lib novamente
    if (typeof PDFLib === 'undefined') {
        console.error('ERRO: PDF-lib não está disponível');
        showNotification('Erro: Biblioteca PDF não carregada. Recarregue a página.', 'error');
        return;
    }
    
    if (selectedImages.length === 0) {
        showNotification('Selecione pelo menos uma imagem.', 'error');
        return;
    }
    
    console.log(`Total de imagens selecionadas: ${selectedImages.length}`);
    
    showSection('pdfProcessingSection');
    hideSection('imageConfigSection');
    hideSection('imagesSection');
    
    try {
        const pageSize = document.getElementById('pageSize').value;
        const orientation = document.getElementById('orientation').value;
        const imageQuality = document.getElementById('imageQuality').value;
        const margin = parseFloat(document.getElementById('margin').value) || 10;
        const pdfName = document.getElementById('pdfName').value.trim() || 'documento_gerado';
        
        console.log('Configurações:', { pageSize, orientation, imageQuality, margin, pdfName });
        
        updatePdfProcessingStatus('Criando documento PDF...');
        updatePdfProgress(5);
        
        // Criar novo documento PDF
        console.log('Criando documento PDF...');
        const pdfDoc = await PDFLib.PDFDocument.create();
        console.log('✅ Documento PDF criado com sucesso');
        
        // Definir dimensões da página com verificação
        const pageDimensions = getPageDimensions(pageSize, orientation);
        console.log('📏 Dimensões da página validadas:', pageDimensions);
        
        // Verificação adicional de segurança
        if (!pageDimensions || !pageDimensions.width || !pageDimensions.height) {
            throw new Error('Erro ao obter dimensões da página');
        }
        
        const totalImages = selectedImages.length;
        let processedCount = 0;
        let failedImages = [];
        
        for (let i = 0; i < selectedImages.length; i++) {
            const imageFile = selectedImages[i];
            console.log(`\n--- Processando imagem ${i + 1}/${totalImages}: ${imageFile.name} ---`);
            
            updatePdfProcessingStatus(`Processando imagem ${i + 1} de ${totalImages}: ${imageFile.name}`);
            updatePdfProgress(5 + (i / totalImages) * 85);
            
            try {
                // Verificar se o arquivo é válido
                if (!imageFile || imageFile.size === 0) {
                    console.error(`❌ Arquivo inválido: ${imageFile.name}`);
                    failedImages.push(`${imageFile.name} (arquivo vazio)`);
                    continue;
                }
                
                console.log(`📁 Arquivo válido: ${imageFile.name}, tamanho: ${imageFile.size} bytes, tipo: ${imageFile.type}`);
                
                // Adicionar nova página com dimensões validadas
                console.log('📄 Adicionando nova página com dimensões:', pageDimensions);
                const page = pdfDoc.addPage([pageDimensions.width, pageDimensions.height]);
                console.log('✅ Página adicionada com sucesso');
                
                // Processar imagem
                console.log('🖼️ Iniciando processamento da imagem...');
                const image = await processImageForPDF(pdfDoc, imageFile);
                console.log(`✅ Imagem processada com sucesso, dimensões: ${image.width}x${image.height}`);
                
                // Calcular dimensões da imagem na página
                const { width: pageWidth, height: pageHeight } = pageDimensions;
                const marginPoints = margin * 2.83; // Converter mm para pontos
                const availableWidth = pageWidth - (marginPoints * 2);
                const availableHeight = pageHeight - (marginPoints * 2);
                
                const imageAspectRatio = image.width / image.height;
                const availableAspectRatio = availableWidth / availableHeight;
                
                let imageWidth, imageHeight;
                
                if (imageAspectRatio > availableAspectRatio) {
                    // Imagem é mais larga
                    imageWidth = availableWidth;
                    imageHeight = availableWidth / imageAspectRatio;
                } else {
                    // Imagem é mais alta
                    imageHeight = availableHeight;
                    imageWidth = availableHeight * imageAspectRatio;
                }
                
                // Centralizar imagem na página
                const x = (pageWidth - imageWidth) / 2;
                const y = (pageHeight - imageHeight) / 2;
                
                console.log(`🎯 Desenhando imagem na posição: x=${x.toFixed(2)}, y=${y.toFixed(2)}, width=${imageWidth.toFixed(2)}, height=${imageHeight.toFixed(2)}`);
                
                // Desenhar imagem na página
                page.drawImage(image, {
                    x: x,
                    y: y,
                    width: imageWidth,
                    height: imageHeight,
                });
                
                console.log(`✅ Imagem ${imageFile.name} adicionada com sucesso ao PDF`);
                processedCount++;
                
            } catch (imageError) {
                console.error(`❌ ERRO ao processar imagem ${imageFile.name}:`, imageError);
                failedImages.push(`${imageFile.name} (${imageError.message})`);
                continue;
            }
        }
        
        console.log(`\n=== RESUMO: ${processedCount} de ${totalImages} imagens processadas ===`);
        if (failedImages.length > 0) {
            console.log('❌ Imagens que falharam:', failedImages);
        }
        
        if (processedCount === 0) {
            const errorMsg = failedImages.length > 0 
                ? `Nenhuma imagem pôde ser processada:\n${failedImages.join('\n')}`
                : 'Nenhuma imagem pôde ser processada. Verifique se os arquivos são imagens válidas.';
            throw new Error(errorMsg);
        }
        
        updatePdfProcessingStatus('Finalizando PDF...');
        updatePdfProgress(95);
        
        console.log('💾 Salvando PDF...');
        
        // Salvar PDF com configurações simples
        const pdfBytes = await pdfDoc.save();
        console.log(`✅ PDF salvo com sucesso, tamanho: ${pdfBytes.length} bytes`);
        
        // Garantir que o nome do arquivo termine com .pdf
        const fileName = pdfName.endsWith('.pdf') ? pdfName : `${pdfName}.pdf`;
        generatedPdf = new File([pdfBytes], fileName, { type: 'application/pdf' });
        
        console.log(`📄 Arquivo PDF criado: ${fileName}`);
        
        updatePdfProgress(100);
        
        // Mostrar aviso se algumas imagens falharam
        if (failedImages.length > 0) {
            showNotification(`PDF gerado com ${processedCount} imagens. ${failedImages.length} imagens falharam.`, 'warning');
        }
        
        setTimeout(() => {
            showPdfResults();
        }, 500);
        
    } catch (error) {
        console.error('❌ ERRO GERAL ao gerar PDF:', error);
        showNotification(`Erro ao gerar PDF: ${error.message}`, 'error');
        hideSection('pdfProcessingSection');
        showSection('imageConfigSection');
        showSection('imagesSection');
    }
}

// Função para processar imagens com múltiplas tentativas
async function processImageForPDF(pdfDoc, imageFile) {
    console.log(`🔄 Processando imagem: ${imageFile.name}`);
    
    // Estratégia 1: Tentar como JPG se o tipo ou extensão indicar
    if (imageFile.type === 'image/jpeg' || 
        imageFile.type === 'image/jpg' || 
        imageFile.name.toLowerCase().match(/\.(jpg|jpeg)$/)) {
        
        try {
            console.log('📸 Tentando processar como JPG...');
            const arrayBuffer = await imageFile.arrayBuffer();
            console.log(`📦 ArrayBuffer criado, tamanho: ${arrayBuffer.byteLength} bytes`);
            
            if (arrayBuffer.byteLength === 0) {
                throw new Error('ArrayBuffer vazio');
            }
            
            const image = await pdfDoc.embedJpg(arrayBuffer);
            console.log('✅ JPG processado com sucesso');
            return image;
        } catch (error) {
            console.warn(`⚠️ Erro ao processar como JPG: ${error.message}`);
        }
    }
    
    // Estratégia 2: Tentar como PNG
    if (imageFile.type === 'image/png' || 
        imageFile.name.toLowerCase().endsWith('.png')) {
        
        try {
            console.log('🖼️ Tentando processar como PNG...');
            const arrayBuffer = await imageFile.arrayBuffer();
            console.log(`📦 ArrayBuffer criado, tamanho: ${arrayBuffer.byteLength} bytes`);
            
            if (arrayBuffer.byteLength === 0) {
                throw new Error('ArrayBuffer vazio');
            }
            
            const image = await pdfDoc.embedPng(arrayBuffer);
            console.log('✅ PNG processado com sucesso');
            return image;
        } catch (error) {
            console.warn(`⚠️ Erro ao processar como PNG: ${error.message}`);
        }
    }
    
    // Estratégia 3: Converter usando Canvas
    console.log('🎨 Convertendo usando Canvas...');
    try {
        const pngArrayBuffer = await convertImageToCanvas(imageFile);
        console.log(`🔄 Conversão concluída, tamanho: ${pngArrayBuffer.byteLength} bytes`);
        
        if (pngArrayBuffer.byteLength === 0) {
            throw new Error('Conversão resultou em dados vazios');
        }
        
        const image = await pdfDoc.embedPng(pngArrayBuffer);
        console.log('✅ Imagem convertida processada com sucesso');
        return image;
    } catch (error) {
        console.error(`❌ Erro na conversão: ${error.message}`);
        throw new Error(`Não foi possível processar a imagem ${imageFile.name}: ${error.message}`);
    }
}

// Função de conversão usando Canvas
function convertImageToCanvas(imageFile) {
    return new Promise((resolve, reject) => {
        console.log(`🎨 Iniciando conversão de ${imageFile.name} usando Canvas`);
        
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Timeout de segurança
        const timeout = setTimeout(() => {
            reject(new Error(`Timeout ao carregar ${imageFile.name}`));
        }, 15000);
        
        img.onload = function() {
            clearTimeout(timeout);
            console.log(`🖼️ Imagem carregada: ${img.width}x${img.height}`);
            
            try {
                // Verificar se a imagem tem dimensões válidas
                if (!img.width || !img.height || img.width <= 0 || img.height <= 0) {
                    reject(new Error(`Dimensões inválidas: ${img.width}x${img.height}`));
                    return;
                }
                
                // Configurar canvas
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Fundo branco
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Desenhar imagem
                ctx.drawImage(img, 0, 0);
                console.log('✅ Imagem desenhada no canvas');
                
                // Converter para blob
                canvas.toBlob(function(blob) {
                    if (!blob || blob.size === 0) {
                        reject(new Error('Falha ao criar blob ou blob vazio'));
                        return;
                    }
                    
                    console.log(`📦 Blob criado, tamanho: ${blob.size} bytes`);
                    
                    // Converter blob para ArrayBuffer
                    const reader = new FileReader();
                    reader.onload = function() {
                        if (!reader.result || reader.result.byteLength === 0) {
                            reject(new Error('ArrayBuffer vazio após conversão'));
                            return;
                        }
                        
                        console.log(`✅ ArrayBuffer criado, tamanho: ${reader.result.byteLength} bytes`);
                        resolve(reader.result);
                    };
                    reader.onerror = function() {
                        reject(new Error('Erro ao ler blob'));
                    };
                    reader.readAsArrayBuffer(blob);
                }, 'image/png', 0.9);
                
            } catch (error) {
                clearTimeout(timeout);
                console.error('❌ Erro no canvas:', error);
                reject(error);
            }
        };
        
        img.onerror = function(event) {
            clearTimeout(timeout);
            console.error(`❌ Erro ao carregar imagem: ${imageFile.name}`, event);
            reject(new Error(`Erro ao carregar imagem: ${imageFile.name}`));
        };
        
        // Carregar imagem
        try {
            const url = URL.createObjectURL(imageFile);
            console.log(`🔗 URL criada para ${imageFile.name}`);
            img.src = url;
            
            // Cleanup da URL
            const cleanup = () => {
                try {
                    URL.revokeObjectURL(url);
                    console.log(`🧹 URL limpa para ${imageFile.name}`);
                } catch (e) {
                    // Ignorar erro de cleanup
                }
            };
            
            img.addEventListener('load', cleanup, { once: true });
            img.addEventListener('error', cleanup, { once: true });
            
        } catch (error) {
            clearTimeout(timeout);
            reject(new Error(`Erro ao criar URL da imagem: ${error.message}`));
        }
    });
}

function updatePdfProcessingStatus(status) {
    const element = document.getElementById('pdfProcessingStatus');
    if (element) {
        element.textContent = status;
    }
}

function updatePdfProgress(percentage) {
    const fillElement = document.getElementById('pdfProgressFill');
    const textElement = document.getElementById('pdfProgressText');
    
    if (fillElement) {
        fillElement.style.width = percentage + '%';
    }
    if (textElement) {
        textElement.textContent = Math.round(percentage) + '%';
    }
}

function showPdfResults() {
    hideSection('pdfProcessingSection');
    showSection('pdfResultsSection');
    
    displayPdfResultInfo();
}

function displayPdfResultInfo() {
    const resultInfo = document.getElementById('pdfResultInfo');
    if (!resultInfo || !generatedPdf) return;
    
    const sizeInMB = (generatedPdf.size / (1024 * 1024)).toFixed(2);
    const pageSize = document.getElementById('pageSize').value;
    const orientation = document.getElementById('orientation').value;
    const quality = document.getElementById('imageQuality').value;
    
    const qualityText = {
        'high': 'Alta',
        'medium': 'Média',
        'low': 'Baixa'
    };
    
    resultInfo.innerHTML = `
        <h4><i class="fas fa-file-pdf"></i> PDF Gerado com Sucesso!</h4>
        <p>Seu documento foi criado com ${selectedImages.length} ${selectedImages.length === 1 ? 'página' : 'páginas'}</p>
        <div class="pdf-info-grid">
            <div class="stat-item">
                <span class="stat-value">${selectedImages.length}</span>
                <span class="stat-label">${selectedImages.length === 1 ? 'Página' : 'Páginas'}</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${sizeInMB} MB</span>
                <span class="stat-label">Tamanho</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${pageSize}</span>
                <span class="stat-label">Formato</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${orientation === 'portrait' ? 'Retrato' : 'Paisagem'}</span>
                <span class="stat-label">Orientação</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${qualityText[quality]}</span>
                <span class="stat-label">Qualidade</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${document.getElementById('margin').value}mm</span>
                <span class="stat-label">Margem</span>
            </div>
        </div>
    `;
}

function downloadGeneratedPdf() {
    if (!generatedPdf) {
        showNotification('Nenhum PDF foi gerado ainda.', 'error');
        return;
    }
    
    try {
        const url = URL.createObjectURL(generatedPdf);
        const a = document.createElement('a');
        a.href = url;
        a.download = generatedPdf.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Download iniciado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro no download:', error);
        showNotification('Erro ao fazer download do PDF.', 'error');
    }
}

function resetPdfGenerator() {
    selectedImages = [];
    generatedPdf = null;
    
    // Reset image input
    const imageInput = document.getElementById('imageInput');
    if (imageInput) imageInput.value = '';
    
    // Reset form values
    const elements = {
        'pageSize': 'A4',
        'orientation': 'portrait',
        'imageQuality': 'medium',
        'margin': '10',
        'pdfName': 'documento_gerado',
        'imageOrder': 'original'
    };
    
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = elements[id];
    });
    
    // Show/hide sections
    hideSection('imageConfigSection');
    hideSection('imagesSection');
    hideSection('pdfProcessingSection');
    hideSection('pdfResultsSection');
    
    // Reset progress
    updatePdfProgress(0);
    updateImageCounter();
}

// Funções utilitárias
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
    // Remover notificações existentes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const iconClass = type === 'error' ? 'exclamation-circle' : 
                     type === 'success' ? 'check-circle' : 
                     type === 'warning' ? 'exclamation-triangle' : 'info-circle';
    
    notification.innerHTML = `
        <i class="fas fa-${iconClass}"></i>
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
                top: 80px;
                right: 24px;
                background: white;
                padding: 16px 20px;
                border-radius: 8px;
                box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
                display: flex;
                align-items: center;
                gap: 12px;
                z-index: 1000;
                max-width: 400px;
                animation: slideIn 0.3s ease-out;
                border-left: 4px solid #2563eb;
            }
            
            .notification-error {
                border-left-color: #dc2626;
            }
            
            .notification-success {
                border-left-color: #059669;
            }
            
            .notification-warning {
                border-left-color: #d97706;
            }
            
            .notification-info {
                border-left-color: #2563eb;
            }
            
            .notification i:first-child {
                color: #2563eb;
                font-size: 18px;
            }
            
            .notification-error i:first-child {
                color: #dc2626;
            }
            
            .notification-success i:first-child {
                color: #059669;
            }
            
            .notification-warning i:first-child {
                color: #d97706;
            }
            
            .notification button {
                background: none;
                border: none;
                cursor: pointer;
                color: #94a3b8;
                margin-left: auto;
                padding: 4px;
                border-radius: 4px;
                transition: background-color 0.2s ease;
            }
            
            .notification button:hover {
                background-color: #f1f5f9;
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