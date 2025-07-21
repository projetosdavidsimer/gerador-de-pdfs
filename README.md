# 🗜️ Compactador de PDFs

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/projetosdavidsimer/compactador-de-pdfs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/projetosdavidsimer/compactador-de-pdfs.svg)](https://github.com/projetosdavidsimer/compactador-de-pdfs/stargazers)

> **Compacte seus arquivos PDF online de forma gratuita, rápida e segura!**

Uma aplicação web moderna que permite comprimir arquivos PDF mantendo a qualidade, com tamanho máximo personalizável pelo usuário.

## 🌟 Características

- **🔒 100% Seguro**: Processamento local no navegador - seus arquivos nunca saem do seu computador
- **⚡ Super Rápido**: Compressão otimizada e inteligente
- **🎯 Personalizável**: Escolha exatamente o tamanho que você precisa
- **📱 Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- **🎨 Interface Moderna**: Design limpo e intuitivo
- **📊 Relatórios Detalhados**: Veja exatamente quanto espaço você economizou

## 🚀 Demo

**[🔗 Acesse a aplicação online](https://compactador-de-pdfs.vercel.app)**

![Screenshot da aplicação](https://via.placeholder.com/800x400/667eea/ffffff?text=Compactador+de+PDFs)

## 📋 Funcionalidades

### 📤 Upload Inteligente
- Drag & drop de múltiplos arquivos
- Seleção manual de arquivos
- Validação automática de tipo de arquivo
- Preview dos arquivos selecionados

### 🎛️ Opções de Compressão
- **1 MB** - Muito compacto (ideal para email)
- **2 MB** - Compacto (boa qualidade)
- **5 MB** - Padrão (qualidade alta)
- **10 MB** - Grande (qualidade máxima)
- **20 MB** - Muito grande (quase sem compressão)
- **Personalizado** - Digite qualquer valor

### 📊 Relatórios Completos
- Tamanho antes e depois da compressão
- Porcentagem de economia
- Status de conformidade com o limite
- Resumo geral de todos os arquivos

### 💾 Download Flexível
- Download individual de cada arquivo
- Download em lote de todos os arquivos
- Nomes de arquivo organizados

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Biblioteca PDF**: PDF-lib para manipulação de PDFs
- **Styling**: CSS Grid, Flexbox, Animações CSS
- **Icons**: Font Awesome
- **Deploy**: Vercel

## 🏃‍♂️ Como Executar Localmente

### Pré-requisitos
- Navegador web moderno
- Servidor HTTP local (opcional)

### Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/projetosdavidsimer/compactador-de-pdfs.git
   cd compactador-de-pdfs
   ```

2. **Execute localmente**
   
   **Opção 1: Servidor Python**
   ```bash
   python -m http.server 3000
   ```
   
   **Opção 2: Servidor Node.js**
   ```bash
   npx http-server -p 3000
   ```
   
   **Opção 3: Live Server (VS Code)**
   - Instale a extensão "Live Server"
   - Clique com o botão direito em `index.html`
   - Selecione "Open with Live Server"

3. **Acesse no navegador**
   ```
   http://localhost:3000
   ```

## 🚀 Deploy no Vercel

### Deploy Automático
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/projetosdavidsimer/compactador-de-pdfs)

### Deploy Manual

1. **Instale o Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Faça login no Vercel**
   ```bash
   vercel login
   ```

3. **Deploy o projeto**
   ```bash
   vercel
   ```

4. **Deploy para produção**
   ```bash
   vercel --prod
   ```

## 📁 Estrutura do Projeto

```
compactador-de-pdfs/
├── 📄 index.html          # Página principal
├── 🎨 styles.css          # Estilos CSS
├── ⚡ script.js           # Lógica JavaScript
├── 🐍 compact_pdf.py      # Script Python (versão CLI)
├── ⚙️ vercel.json         # Configuração do Vercel
├── 📦 package.json        # Metadados do projeto
└── 📖 README.md           # Documentação
```

## 🔧 Configuração

### Vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

## 🎯 Como Usar

1. **📤 Upload**: Arraste seus PDFs ou clique para selecionar
2. **🎛️ Configure**: Escolha o tamanho máximo desejado
3. **🗜️ Compacte**: Clique em "Compactar PDFs"
4. **📊 Analise**: Veja os resultados da compressão
5. **💾 Download**: Baixe os arquivos compactados

## 🔒 Privacidade e Segurança

- ✅ **Processamento Local**: Todos os arquivos são processados no seu navegador
- ✅ **Sem Upload**: Nenhum arquivo é enviado para servidores externos
- ✅ **Sem Armazenamento**: Nada é salvo ou armazenado
- ✅ **Open Source**: Código totalmente aberto e auditável

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Veja como você pode ajudar:

1. **Fork** o projeto
2. **Crie** uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. **Abra** um Pull Request

### 🐛 Reportando Bugs

Encontrou um bug? [Abra uma issue](https://github.com/projetosdavidsimer/compactador-de-pdfs/issues) com:

- Descrição detalhada do problema
- Passos para reproduzir
- Screenshots (se aplicável)
- Informações do navegador/sistema

### 💡 Sugestões de Features

Tem uma ideia? [Abra uma issue](https://github.com/projetosdavidsimer/compactador-de-pdfs/issues) com a tag `enhancement`!

## 📈 Roadmap

- [ ] 🌍 Suporte a múltiplos idiomas
- [ ] 📊 Mais opções de compressão avançadas
- [ ] 🔄 Processamento em lote otimizado
- [ ] 📱 App mobile nativo
- [ ] 🎨 Temas personalizáveis
- [ ] 📋 Histórico de compressões
- [ ] 🔗 API para desenvolvedores

## 📊 Estatísticas

- ⚡ **Velocidade**: Compressão em menos de 5 segundos
- 💾 **Economia**: Até 90% de redução no tamanho
- 🎯 **Precisão**: Controle exato do tamanho final
- 🔒 **Segurança**: 100% processamento local

## 🏆 Casos de Uso

- **📧 Email**: Anexos que cabem em qualquer provedor
- **☁️ Cloud Storage**: Economize espaço na nuvem
- **📱 Mobile**: Arquivos otimizados para dispositivos móveis
- **🌐 Web**: Upload mais rápido em formulários
- **💼 Trabalho**: Documentos profissionais otimizados

## 📞 Suporte

- 📧 **Email**: [seu-email@exemplo.com]
- 🐛 **Issues**: [GitHub Issues](https://github.com/projetosdavidsimer/compactador-de-pdfs/issues)
- 💬 **Discussões**: [GitHub Discussions](https://github.com/projetosdavidsimer/compactador-de-pdfs/discussions)

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Autor

**David Simer**
- GitHub: [@projetosdavidsimer](https://github.com/projetosdavidsimer)
- LinkedIn: [David Simer](https://linkedin.com/in/david-simer)

## 🙏 Agradecimentos

- [PDF-lib](https://pdf-lib.js.org/) - Biblioteca para manipulação de PDFs
- [Font Awesome](https://fontawesome.com/) - Ícones incríveis
- [Vercel](https://vercel.com/) - Plataforma de deploy
- Comunidade open source por todo o suporte

---

<div align="center">

**⭐ Se este projeto te ajudou, considere dar uma estrela!**

[![GitHub stars](https://img.shields.io/github/stars/projetosdavidsimer/compactador-de-pdfs.svg?style=social&label=Star)](https://github.com/projetosdavidsimer/compactador-de-pdfs/stargazers)

</div>