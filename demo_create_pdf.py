# -*- coding: utf-8 -*-
"""
Demo do criador de PDFs a partir de imagens
Executa automaticamente no modo múltiplos PDFs
"""

import os
import sys
from pathlib import Path
import time
from PIL import Image
import io
import fitz  # PyMuPDF

def get_file_size_mb(file_path):
    """Retorna o tamanho do arquivo em MB"""
    return os.path.getsize(file_path) / (1024 * 1024)

def get_supported_image_extensions():
    """Retorna extensões de imagem suportadas"""
    return {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.webp'}

def optimize_image_for_pdf(image_path, target_quality=85, max_width=1200):
    """
    Otimiza uma imagem para inclusão em PDF
    Retorna os bytes da imagem otimizada
    """
    try:
        with Image.open(image_path) as img:
            # Converte para RGB se necessário
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
            
            # Redimensiona se muito grande
            if img.width > max_width:
                ratio = max_width / img.width
                new_height = int(img.height * ratio)
                img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
            
            # Salva com qualidade especificada
            img_buffer = io.BytesIO()
            img.save(img_buffer, format='JPEG', quality=target_quality, optimize=True)
            img_buffer.seek(0)
            
            return img_buffer.getvalue()
    
    except Exception as e:
        print(f"     ⚠️  Erro ao otimizar {image_path.name}: {e}")
        return None

def estimate_pdf_size(image_paths, quality=85, max_width=1200):
    """
    Estima o tamanho do PDF baseado nas imagens
    """
    total_size = 0
    
    for img_path in image_paths:
        img_bytes = optimize_image_for_pdf(img_path, quality, max_width)
        if img_bytes:
            total_size += len(img_bytes)
    
    # Adiciona overhead do PDF (aproximadamente 10-20%)
    pdf_overhead = total_size * 0.15
    estimated_size_mb = (total_size + pdf_overhead) / (1024 * 1024)
    
    return estimated_size_mb

def create_pdf_from_images(image_paths, output_path, max_size_mb=5.0):
    """
    Cria um PDF a partir de uma lista de imagens
    Ajusta automaticamente a qualidade para não ultrapassar max_size_mb
    """
    if not image_paths:
        return False
    
    print(f"   📸 Processando {len(image_paths)} imagem(ns)...")
    
    # Testa diferentes configurações para encontrar a melhor
    configs = [
        {'quality': 95, 'max_width': 1600},
        {'quality': 85, 'max_width': 1400},
        {'quality': 75, 'max_width': 1200},
        {'quality': 65, 'max_width': 1000},
        {'quality': 55, 'max_width': 900},
        {'quality': 45, 'max_width': 800},
        {'quality': 35, 'max_width': 700},
        {'quality': 25, 'max_width': 600},
    ]
    
    best_config = None
    
    # Encontra a melhor configuração
    for config in configs:
        estimated_size = estimate_pdf_size(image_paths, config['quality'], config['max_width'])
        print(f"     🎯 Testando qualidade {config['quality']}%, largura max {config['max_width']}px: ~{estimated_size:.2f}MB")
        
        if estimated_size <= max_size_mb:
            best_config = config
            break
    
    if not best_config:
        print(f"     ⚠️  Usando configuração mínima (pode exceder {max_size_mb}MB)")
        best_config = configs[-1]
    else:
        print(f"     ✅ Configuração escolhida: qualidade {best_config['quality']}%, largura max {best_config['max_width']}px")
    
    # Cria o PDF
    try:
        doc = fitz.open()  # Novo documento PDF
        
        for i, img_path in enumerate(image_paths):
            print(f"     📄 Adicionando página {i+1}/{len(image_paths)}: {img_path.name}")
            
            # Otimiza a imagem
            img_bytes = optimize_image_for_pdf(img_path, best_config['quality'], best_config['max_width'])
            if not img_bytes:
                continue
            
            # Cria uma página com a imagem
            img_rect = fitz.Rect(0, 0, 595, 842)  # A4 size
            page = doc.new_page(width=img_rect.width, height=img_rect.height)
            
            # Insere a imagem na página
            page.insert_image(img_rect, stream=img_bytes)
        
        # Salva o PDF
        doc.save(output_path, garbage=4, deflate=True, clean=True)
        doc.close()
        
        # Verifica o tamanho final
        final_size = get_file_size_mb(output_path)
        print(f"     📦 PDF criado: {final_size:.2f}MB")
        
        return True
        
    except Exception as e:
        print(f"     ❌ Erro ao criar PDF: {e}")
        return False

def process_image_folders(input_folder="imagens", output_folder="pdfs_gerados"):
    """
    Processa pastas de imagens e cria PDFs
    Cada subpasta vira um PDF separado
    """
    input_path = Path(input_folder)
    output_path = Path(output_folder)
    
    if not input_path.exists():
        print(f"❌ Pasta '{input_folder}' não encontrada!")
        print(f"   Criando estrutura de pastas...")
        input_path.mkdir(exist_ok=True)
        
        # Cria pasta de exemplo
        example_folder = input_path / "documento_exemplo"
        example_folder.mkdir(exist_ok=True)
        
        print(f"   ✅ Estrutura criada!")
        print(f"   📋 Como usar:")
        print(f"   1. Coloque suas imagens em subpastas dentro de '{input_folder}'")
        print(f"   2. Cada subpasta será convertida em um PDF separado")
        print(f"   3. Exemplo: '{input_folder}/documento1/' → 'documento1.pdf'")
        print(f"   4. Execute o script novamente")
        return
    
    output_path.mkdir(exist_ok=True)
    
    # Busca por subpastas com imagens
    image_extensions = get_supported_image_extensions()
    folders_with_images = []
    
    for subfolder in input_path.iterdir():
        if subfolder.is_dir():
            images = []
            for file in subfolder.iterdir():
                if file.suffix.lower() in image_extensions:
                    images.append(file)
            
            if images:
                # Ordena as imagens por nome
                images.sort(key=lambda x: x.name.lower())
                folders_with_images.append((subfolder, images))
    
    if not folders_with_images:
        print(f"❌ Nenhuma pasta com imagens encontrada em '{input_folder}'!")
        print(f"   📋 Formatos suportados: {', '.join(image_extensions)}")
        return
    
    print(f"📁 Encontradas {len(folders_with_images)} pasta(s) com imagens")
    print(f"📤 Saída: '{output_folder}'\n")
    print(f"🎯 OBJETIVO: Todos os PDFs ≤ 5.0MB\n")
    
    total_folders = len(folders_with_images)
    successful_pdfs = 0
    total_images = 0
    
    for i, (folder, images) in enumerate(folders_with_images, 1):
        print(f"[{i}/{total_folders}] 📂 {folder.name}")
        print(f"   📸 {len(images)} imagem(ns) encontrada(s)")
        total_images += len(images)
        
        # Nome do PDF de saída
        pdf_name = f"{folder.name}.pdf"
        output_file = output_path / pdf_name
        
        # Cria o PDF
        start_time = time.time()
        success = create_pdf_from_images(images, output_file)
        end_time = time.time()
        
        if success and output_file.exists():
            final_size = get_file_size_mb(output_file)
            status_icon = "✅" if final_size <= 5.0 else "⚠️"
            limit_status = "DENTRO DO LIMITE" if final_size <= 5.0 else "ACIMA DO LIMITE"
            
            print(f"   {status_icon} PDF criado: {final_size:.2f} MB ({limit_status})")
            print(f"   ⏱️  Tempo: {end_time - start_time:.1f}s")
            successful_pdfs += 1
        else:
            print(f"   ❌ Falha na criação do PDF")
        
        print()
    
    # Resumo final
    print("=" * 50)
    print("📊 RESUMO FINAL")
    print("=" * 50)
    print(f"✅ PDFs criados com sucesso: {successful_pdfs}/{total_folders}")
    print(f"📸 Total de imagens processadas: {total_images}")
    
    # Verifica quantos PDFs estão dentro do limite
    pdfs_within_limit = 0
    total_size = 0
    
    for pdf_file in output_path.glob("*.pdf"):
        size = get_file_size_mb(pdf_file)
        total_size += size
        if size <= 5.0:
            pdfs_within_limit += 1
    
    print(f"🎯 PDFs dentro do limite (≤ 5MB): {pdfs_within_limit}/{successful_pdfs}")
    print(f"📦 Tamanho total dos PDFs: {total_size:.2f} MB")
    
    print(f"\n🎉 Processo concluído! PDFs salvos em '{output_folder}'")

def main():
    """Função principal"""
    print("📸➡️📄 CRIADOR DE PDFs A PARTIR DE IMAGENS")
    print("=" * 45)
    print("📋 LIMITE MÁXIMO: 5MB por PDF")
    print("📋 Calcula qualidade automaticamente")
    print("📋 Suporte a múltiplos formatos de imagem")
    print("📋 Processa pastas em lote")
    print("📋 Otimização inteligente")
    print()
    
    # Verifica se as bibliotecas estão instaladas
    try:
        import fitz
        from PIL import Image
    except ImportError as e:
        print("❌ Biblioteca não encontrada!")
        print("   Execute: pip install pymupdf pillow")
        print(f"   Erro: {e}")
        return
    
    print("🔄 Executando no modo: Múltiplos PDFs")
    print("   (Cada subpasta vira um PDF separado)\n")
    
    process_image_folders()

if __name__ == "__main__":
    main()