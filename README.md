# Cultura Pop Store

Loja demonstrativa de cultura pop com catálogo de mangás, livros, HQs, Kindle e acessórios. O projeto usa React, TypeScript, Vite, Express, Prisma e SQLite.

## Funcionalidades

- Catálogo com busca e filtro por categoria
- Cadastro e login com e-mail e senha
- Carrinho persistente por usuário
- Registro e consulta de pedidos
- Painel administrativo para produtos e usuários
- Layout responsivo

## Requisitos

- Node.js 20 ou superior
- npm incluído com o Node.js

## Configuração local

Execute os comandos a partir da pasta raiz do repositório.

1. Instale as dependências:

```bash
npm install
```

2. Crie o arquivo de ambiente do backend a partir do exemplo.

PowerShell:

```powershell
Copy-Item .env.example backend/.env
```

macOS/Linux:

```bash
cp .env.example backend/.env
```

O exemplo configura o SQLite local em `backend/prisma/dev.db` e a API na porta `3001`. O arquivo `.env` é ignorado pelo Git.

3. Gere o Prisma Client, crie/atualize o banco e carregue os dados de demonstração:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

4. Inicie frontend e backend juntos:

```bash
npm run dev
```

Frontend: `http://localhost:5173`
API: `http://localhost:3001`
Verificação da API: `http://localhost:3001/api/health`

O Vite pode usar a porta `5174` se a `5173` já estiver ocupada; essa origem também está liberada pelo backend.

## Comandos úteis

```bash
npm test       # testes HTTP do backend
npm run build  # compila backend e frontend para produção
```

Os testes usam um Prisma simulado, não iniciam um banco nem alteram os dados locais.

## Publicação no GitHub Pages

O workflow publica somente o frontend, pois o GitHub Pages não executa o backend Express nem o banco SQLite.

1. No repositório `ronald1134/Pop-Store`, abra **Settings > Pages** e selecione **GitHub Actions** como fonte de publicação.
2. Envie as alterações para a branch `main`. O workflow em `.github/workflows/deploy.yml` executa os testes, compila o frontend e publica `frontend/dist`.
3. Acompanhe a execução na aba **Actions**. Quando ela concluir, o site estará em `https://ronald1134.github.io/Pop-Store/`.

O prefixo `/Pop-Store/` é aplicado apenas no GitHub Actions; o desenvolvimento local continua usando a raiz do Vite. O arquivo `404.html` permite que rotas do React Router continuem funcionando ao atualizar a página.

Sem backend, o frontend mostra um catálogo estático com seis produtos de demonstração. Para habilitar login, catálogo dinâmico vindo do banco, carrinho e pedidos, hospede o backend separadamente e crie a variável de repositório `VITE_API_URL` em **Settings > Secrets and variables > Actions > Variables**. Informe a URL base da API, sem `/api` no final. Configure também o `CORS_ORIGIN` do backend com `https://ronald1134.github.io`.

Para publicar as alterações locais, revise `git status`, faça commit dos arquivos de deploy e envie para `main`:

```bash
git add .github/workflows/deploy.yml frontend/vite.config.ts frontend/src/main.tsx frontend/src/services/api.ts frontend/index.html frontend/public/favicon.ico README.md
git commit -m "Configura deploy do frontend no GitHub Pages"
git push origin main
```

## Limitações atuais

- O endpoint de pagamento é simulado e aprova a transação sem integrar um provedor. Não use para cobrar compras reais.
- Antes de publicar, configure segredos fortes para o JWT, restrinja as origens CORS ao domínio publicado e implemente um provedor de pagamento com cálculo de valores no servidor.
- O SQLite local é apropriado para desenvolvimento e demonstração, não para uma loja com tráfego e requisitos de disponibilidade de produção.