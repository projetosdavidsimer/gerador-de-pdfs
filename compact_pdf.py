#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para compressão automática de PDFs
LIMITE MÁXIMO: Personalizável pelo usuário
Preserva imagens (reduz qualidade se necessário)
Mantém qualidade legível de texto/imagens
Processa arquivos em lote
Permite escolher o tamanho máximo desejado
"""

import os
import sys
import fitz  # PyMuPDF
import pikepdf
from pathlib import Path
import time
import shutil

def get_file_size_mb(file_path):
    """Retorna o tamanho do arquivo em MB"""
    return os.path.getsize(file_path) / (1024 * 1024)

def safe_rename(src, dst):
    """Renomeia arquivo removendo o destino se existir"""
    if os.path.exists(dst):
        os.remove(dst)
    os.rename(src, dst)

def is_already_optimized(file_path, threshold_mb=0.5):
    """
    Verifica se o arquivo já está otimizado baseado no tamanho
    Se for menor que threshold_mb, considera já otimizado
    """
    size_mb = get_file_size_mb(file_path)
    return size_mb < threshold_mb

def compress_pdf_simple(input_path, output_path):
    """
    Comprime PDF de forma mais conservadora preservando imagens
    """
    try:
        doc = fitz.open(input_path)
        
        # Salva com compressão básica que preserva imagens
        doc.save(
            output_path,
            garbage=4,           # Remove objetos não utilizados
            deflate=True,        # Comprime streams
            clean=True,          # Limpa estrutura
            pretty=False         # Remove formatação desnecessária
        )
        doc.close()
        return True
        
    except Exception as e:
        print(f"   ⚠️  Erro na compressão: {e}")
        return False

def compress_pdf_aggressive(input_path, output_path, image_quality=60):
    """
    Comprime PDF de forma mais agressiva para atingir limite de tamanho
    """
    try:
        doc = fitz.open(input_path)
        
        # Comprime imagens mais agressivamente
        for page_num in range(len(doc)):
            page = doc[page_num]
            image_list = page.get_images()
            
            for img_index, img in enumerate(image_list):
                xref = img[0]
                try:
                    # Extrai a imagem
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]
                    image_ext = base_image["ext"]
                    
                    # Converte para PIL Image
                    from PIL import Image
                    import io
                    
                    pil_image = Image.open(io.BytesIO(image_bytes))
                    
                    # Reduz qualidade se for JPEG ou converte para JPEG
                    if pil_image.mode in ("RGBA", "LA", "P"):
                        pil_image = pil_image.convert("RGB")
                    
                    # Salva com qualidade reduzida
                    img_buffer = io.BytesIO()
                    pil_image.save(img_buffer, format="JPEG", quality=image_quality, optimize=True)
                    img_buffer.seek(0)
                    
                    # Substitui a imagem no PDF
                    doc.update_stream(xref, img_buffer.getvalue())
                    
                except Exception as e:
                    print(f"     ⚠️  Erro ao comprimir imagem {img_index}: {e}")
                    continue
        
        # Salva o documento comprimido
        doc.save(
            output_path,
            garbage=4,
            deflate=True,
            clean=True,
            pretty=False
        )
        doc.close()
        return True
        
    except Exception as e:
        print(f"   ⚠️  Erro na compressão agressiva: {e}")
        return False

def optimize_with_pikepdf(input_path, output_path):
    """
    Otimiza o PDF usando pikepdf (versão corrigida)
    """
    try:
        with pikepdf.open(input_path) as pdf:
            # Otimizações compatíveis com a versão atual
            pdf.save(
                output_path,
                compress_streams=True,
                recompress_flate=True
            )
        return True
    except Exception as e:
        print(f"   ⚠️  Erro na otimização com pikepdf: {e}")
        return False

def compress_pdf(input_path, output_path, max_size_mb=5.0):
    """
    Função principal para comprimir um PDF garantindo tamanho máximo
    """
    try:
        # Verifica se já está otimizado e dentro do limite
        original_size = get_file_size_mb(input_path)
        if original_size <= max_size_mb and is_already_optimized(input_path):
            print(f"   ℹ️  Arquivo já está otimizado e dentro do limite ({original_size:.2f}MB ≤ {max_size_mb}MB)")
            # Copia o arquivo original
            shutil.copy2(input_path, output_path)
            return True
        
        # Cria arquivo temporário
        temp_path = str(output_path).replace('.pdf', '_temp.pdf')
        temp_path2 = str(output_path).replace('.pdf', '_temp2.pdf')
        
        # Passo 1: Compressão conservadora
        print(f"   🗜️  Comprimindo PDF (modo conservador)...")
        success = False
        
        if compress_pdf_simple(input_path, temp_path):
            # Passo 2: Otimiza com pikepdf
            print(f"   ⚙️  Otimizando estrutura...")
            if optimize_with_pikepdf(temp_path, temp_path2):
                # Verifica se está dentro do limite
                compressed_size = get_file_size_mb(temp_path2)
                if compressed_size <= max_size_mb:
                    print(f"   ✅ Tamanho OK: {compressed_size:.2f}MB ≤ {max_size_mb}MB")
                    safe_rename(temp_path2, output_path)
                    success = True
                else:
                    print(f"   ⚠️  Ainda muito grande: {compressed_size:.2f}MB > {max_size_mb}MB")
                    print(f"   🔧 Aplicando compressão agressiva...")
                    
                    # Tenta compressão agressiva com diferentes qualidades
                    for quality in [60, 50, 40, 30]:
                        print(f"     🎯 Tentando qualidade {quality}%...")
                        if compress_pdf_aggressive(input_path, temp_path2, quality):
                            final_size = get_file_size_mb(temp_path2)
                            if final_size <= max_size_mb:
                                print(f"     ✅ Sucesso! Tamanho: {final_size:.2f}MB")
                                safe_rename(temp_path2, output_path)
                                success = True
                                break
                            else:
                                print(f"     ❌ Ainda grande: {final_size:.2f}MB")
                    
                    if not success:
                        print(f"   ⚠️  Não foi possível reduzir para {max_size_mb}MB")
                        print(f"   📋 Salvando melhor resultado obtido...")
                        safe_rename(temp_path2, output_path)
                        success = True
            else:
                # Se pikepdf falhar, usa resultado do PyMuPDF
                compressed_size = get_file_size_mb(temp_path)
                if compressed_size <= max_size_mb:
                    safe_rename(temp_path, output_path)
                    success = True
                else:
                    print(f"   🔧 Aplicando compressão agressiva...")
                    for quality in [60, 50, 40, 30]:
                        print(f"     🎯 Tentando qualidade {quality}%...")
                        if compress_pdf_aggressive(input_path, output_path, quality):
                            final_size = get_file_size_mb(output_path)
                            if final_size <= max_size_mb:
                                print(f"     ✅ Sucesso! Tamanho: {final_size:.2f}MB")
                                success = True
                                break
                            else:
                                print(f"     ❌ Ainda grande: {final_size:.2f}MB")
                    
                    if not success:
                        print(f"   📋 Salvando melhor resultado obtido...")
                        success = True
        else:
            # Se PyMuPDF falhar, tenta otimização direta
            print(f"   ⚙️  Tentando otimização direta...")
            if optimize_with_pikepdf(input_path, temp_path):
                compressed_size = get_file_size_mb(temp_path)
                if compressed_size <= max_size_mb:
                    safe_rename(temp_path, output_path)
                    success = True
                else:
                    print(f"   🔧 Aplicando compressão agressiva...")
                    for quality in [60, 50, 40, 30]:
                        if compress_pdf_aggressive(input_path, output_path, quality):
                            final_size = get_file_size_mb(output_path)
                            if final_size <= max_size_mb:
                                success = True
                                break
        
        # Limpa arquivos temporários
        for temp_file in [temp_path, temp_path2]:
            if os.path.exists(temp_file):
                os.remove(temp_file)
        
        return success
            
    except Exception as e:
        print(f"   ❌ Erro geral: {e}")
        return False

def get_user_size_limit():
    """
    Solicita ao usuário o tamanho máximo desejado para os PDFs
    """
    print("🎯 CONFIGURAÇÃO DO TAMANHO MÁXIMO")
    print("=" * 40)
    print("Escolha o tamanho máximo desejado para os PDFs:")
    print()
    print("📋 Opções sugeridas:")
    print("   1️⃣  1 MB  - Muito compacto (ideal para email)")
    print("   2️⃣  2 MB  - Compacto (boa qualidade)")
    print("   3️⃣  5 MB  - Padrão (qualidade alta)")
    print("   4️⃣  10 MB - Grande (qualidade máxima)")
    print("   5️⃣  20 MB - Muito grande (quase sem compressão)")
    print("   6️⃣  Personalizado - Digite o valor desejado")
    print()
    
    while True:
        try:
            choice = input("Digite sua escolha (1-6): ").strip()
            
            if choice == "1":
                return 1.0
            elif choice == "2":
                return 2.0
            elif choice == "3":
                return 5.0
            elif choice == "4":
                return 10.0
            elif choice == "5":
                return 20.0
            elif choice == "6":
                while True:
                    try:
                        custom_size = input("Digite o tamanho em MB (ex: 3.5): ").strip()
                        size = float(custom_size)
                        if size <= 0:
                            print("❌ O tamanho deve ser maior que 0!")
                            continue
                        if size > 100:
                            confirm = input(f"⚠️  {size}MB é muito grande. Confirma? (s/n): ").strip().lower()
                            if confirm not in ['s', 'sim', 'y', 'yes']:
                                continue
                        return size
                    except ValueError:
                        print("❌ Digite um número válido (ex: 3.5)")
            else:
                print("❌ Escolha inválida! Digite um número de 1 a 6.")
                
        except KeyboardInterrupt:
            print("\n\n❌ Operação cancelada pelo usuário.")
            sys.exit(0)
        except EOFError:
            print("\n\n❌ Entrada inválida.")
            sys.exit(0)

def process_pdfs_in_folder(input_folder="entrada", output_folder="saida", max_size_mb=None):
    """
    Processa todos os PDFs de uma pasta com tamanho máximo personalizável
    """
    # Se não foi especificado o tamanho, pergunta ao usuário
    if max_size_mb is None:
        max_size_mb = get_user_size_limit()
    
    print(f"\n🎯 TAMANHO MÁXIMO CONFIGURADO: {max_size_mb} MB")
    print("=" * 50)
    # Cria pastas se não existirem
    input_path = Path(input_folder)
    output_path = Path(output_folder)
    
    if not input_path.exists():
        print(f"❌ Pasta '{input_folder}' não encontrada!")
        print(f"   Criando pasta '{input_folder}'...")
        input_path.mkdir(exist_ok=True)
        print(f"   ✅ Pasta criada! Coloque seus PDFs em '{input_folder}' e execute novamente.")
        return
    
    output_path.mkdir(exist_ok=True)
    
    # Busca por arquivos PDF
    pdf_files = list(input_path.glob("*.pdf"))
    
    if not pdf_files:
        print(f"❌ Nenhum arquivo PDF encontrado em '{input_folder}'!")
        return
    
    print(f"📁 Encontrados {len(pdf_files)} arquivo(s) PDF")
    print(f"📤 Saída: '{output_folder}'\n")
    print(f"🎯 OBJETIVO: Todos os arquivos ≤ {max_size_mb}MB\n")
    
    total_original_size = 0
    total_compressed_size = 0
    successful_compressions = 0
    files_over_limit = 0
    
    for i, pdf_file in enumerate(pdf_files, 1):
        print(f"[{i}/{len(pdf_files)}] 📄 {pdf_file.name}")
        
        # Tamanho original
        original_size = get_file_size_mb(pdf_file)
        total_original_size += original_size
        print(f"   📏 Tamanho original: {original_size:.2f} MB")
        
        if original_size > max_size_mb:
            files_over_limit += 1
        
        # Arquivo de saída
        output_file = output_path / pdf_file.name
        
        # Comprime o PDF
        start_time = time.time()
        success = compress_pdf(pdf_file, output_file, max_size_mb)
        end_time = time.time()
        
        if success and output_file.exists():
            # Tamanho comprimido
            compressed_size = get_file_size_mb(output_file)
            total_compressed_size += compressed_size
            
            # Calcula economia
            savings_mb = original_size - compressed_size
            savings_percent = (savings_mb / original_size) * 100 if original_size > 0 else 0
            
            # Verifica se está dentro do limite
            status_icon = "✅" if compressed_size <= max_size_mb else "⚠️"
            limit_status = "DENTRO DO LIMITE" if compressed_size <= max_size_mb else "ACIMA DO LIMITE"
            
            print(f"   {status_icon} Comprimido: {compressed_size:.2f} MB ({limit_status})")
            print(f"   💾 Economia: {savings_mb:.2f} MB ({savings_percent:.1f}%)")
            print(f"   ⏱️  Tempo: {end_time - start_time:.1f}s")
            successful_compressions += 1
        else:
            print(f"   ❌ Falha na compressão")
            total_compressed_size += original_size  # Conta como não comprimido
        
        print()
    
    # Resumo final
    print("=" * 50)
    print("📊 RESUMO FINAL")
    print("=" * 50)
    print(f"✅ Arquivos processados com sucesso: {successful_compressions}/{len(pdf_files)}")
    print(f"📏 Tamanho total original: {total_original_size:.2f} MB")
    print(f"📦 Tamanho total comprimido: {total_compressed_size:.2f} MB")
    
    if total_original_size > 0:
        total_savings = total_original_size - total_compressed_size
        total_savings_percent = (total_savings / total_original_size) * 100
        print(f"💾 Economia total: {total_savings:.2f} MB ({total_savings_percent:.1f}%)")
    
    print(f"🎯 Arquivos originalmente > {max_size_mb}MB: {files_over_limit}")
    
    # Verifica quantos arquivos finais estão dentro do limite
    files_within_limit = 0
    for pdf_file in pdf_files:
        output_file = output_path / pdf_file.name
        if output_file.exists():
            final_size = get_file_size_mb(output_file)
            if final_size <= max_size_mb:
                files_within_limit += 1
    
    print(f"✅ Arquivos finais ≤ {max_size_mb}MB: {files_within_limit}/{len(pdf_files)}")
    
    print(f"\n🎉 Processo concluído! Arquivos salvos em '{output_folder}'")

def main():
    """Função principal"""
    print("🗜️  COMPRESSOR DE PDFs")
    print("=" * 30)
    print("📋 LIMITE MÁXIMO: Personalizável pelo usuário")
    print("📋 Preserva imagens (reduz qualidade se necessário)")
    print("📋 Mantém qualidade legível")
    print("📋 Processa arquivos em lote")
    print("📋 Compressão inteligente e adaptativa")
    print("📋 Escolha o tamanho máximo desejado")
    print()
    
    # Verifica se as bibliotecas estão instaladas
    try:
        import pikepdf
        import fitz
        from PIL import Image
    except ImportError as e:
        print("❌ Biblioteca não encontrada!")
        print("   Execute: pip install pikepdf pymupdf pillow")
        print(f"   Erro: {e}")
        return
    
    # Processa os PDFs
    process_pdfs_in_folder()

if __name__ == "__main__":
    main()