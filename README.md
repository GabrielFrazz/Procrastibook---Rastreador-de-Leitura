# **CSI606 - Trabalho Final - Resultados**

## _Discente: Carlos Gabriel de Oliveira Frazão (22.1.8100)_

### Resumo

O Procrastibook é uma aplicação web pessoal para organização e acompanhamento de leituras. O sistema centraliza livros, mangás, artigos e e-books, permitindo que cada usuário acompanhe seu progresso, registre sessões de leitura, organize obras em listas, defina metas e consulte estatísticas sobre seus hábitos.

Além do cadastro manual, a aplicação consulta o Google Books e a Open Library para importar metadados. O produto final possui autenticação, armazenamento privado de imagens, interface responsiva e isolamento dos dados de cada usuário.

### 1. Tecnologias utilizadas - Backend e Frontend

#### Frontend

- **Next.js 16** com App Router, Server Components e layouts por grupo de rotas;
- **React 19** para componentes e interações da interface;
- **TypeScript 6** em modo estrito;
- **CSS** com tokens semânticos, estilos compartilhados e estilos específicos por tela;
- **Next Font** para carregamento otimizado da tipografia;
- componentes responsivos e acessíveis para desktop, tablet e mobile.

#### Backend e banco de dados

- **Server Actions e Route Handlers do Next.js** para comandos autenticados e endpoints internos;
- **Zod 4** para validação dos dados recebidos pelo servidor;
- **Supabase Auth** para autenticação por e-mail, senha e Google OAuth;
- **PostgreSQL** como banco de dados principal;
- **funções PostgreSQL** para operações atômicas de progresso, sessões e gerenciamento de obras;
- **Supabase Storage** para capas e avatares privados;
- **Google Books API e Open Library API** para consulta de obras;
- **Vercel e Supabase** para hospedagem da aplicação e dos serviços de backend.

#### Testes e qualidade

- **pgTAP**, pelo Supabase CLI, para testar schema, funções e políticas de RLS;
- **ESLint**, **Prettier** e verificação de tipos do TypeScript.

A arquitetura principal do projeto está organizada da seguinte forma:

```text
.
├── src/
│   ├── app/                 # Rotas, layouts e endpoints
│   ├── components/          # Shell e componentes visuais compartilhados
│   ├── features/            # Funcionalidades organizadas por domínio
│   ├── lib/                 # Configuração e clientes do Supabase
│   ├── styles/              # Tokens e estilos da interface
│   └── proxy.ts             # Sessão e proteção das rotas autenticadas
├── supabase/
│   ├── migrations/          # Schema, RLS, Storage e funções PostgreSQL
│   ├── tests/               # Testes de banco com pgTAP
│   └── seed.sql             # Dados do ambiente local
├── prototipos/              # Protótipos históricos do projeto
├── .env.example             # Modelo das variáveis de ambiente
└── package.json             # Dependências e scripts
```

### 2. Funcionalidades implementadas

As funcionalidades centrais definidas na proposta foram implementadas:

- cadastro e autenticação de usuários;
- recuperação e atualização de senha;
- cadastro de livros, mangás, artigos e e-books;
- importação de metadados pelo Google Books e Open Library;
- biblioteca com busca, filtros e status **Quero ler**, **Lendo**, **Finalizado** e **Abandonado**;
- acompanhamento por páginas, capítulos ou porcentagem;
- histórico de progresso com suporte a correções;
- registro de sessões com data, duração, posição final e anotações;
- atualização do progresso da obra ao registrar uma sessão;
- avaliações, reviews, notas e citações;
- criação e gerenciamento de listas personalizadas;
- metas por obras, páginas, capítulos ou minutos;
- dashboard com resumo das leituras;
- estatísticas pessoais e evolução por período;
- perfil do usuário com nome, fuso horário e avatar;
- interface responsiva para desktop, tablet e celular.

#### Protótipos iniciais

Os protótipos abaixo foram utilizados como referência no início do projeto. A interface foi reformulada durante o desenvolvimento e, por isso, o produto final não os reproduz fielmente.

##### Login

![Protótipo da tela de login](prototipos/login.png)

##### Dashboard

![Protótipo do dashboard](prototipos/dashboard.png)

##### Biblioteca

![Protótipo da biblioteca](prototipos/biblioteca.png)

##### Adicionar obra

![Protótipo da tela de adicionar obra](prototipos/adicionar.png)

### 3. Funcionalidades previstas e não implementadas

Todas as funcionalidades centrais previstas na proposta foram implementadas.

Recursos como rede social, chat, marketplace, aplicativo mobile nativo, modo offline, recomendações por inteligência artificial e autenticação multifator não foram implementados mas já estavam definidas como fora do escopo.

### 4. Outras funcionalidades implementadas

Além do escopo inicial, foram adicionadas melhorias para tornar o site mais completo:

- login opcional com Google OAuth;
- mudança automática de **Quero ler** para **Lendo** quando o usuário registra avanço;
- atualização atômica do progresso ao salvar uma sessão de leitura;
- recorte visual da área do avatar antes do envio;

### 5. Principais desafios e dificuldades

#### Consistência entre sessões e progresso

O registro de uma sessão inicialmente não atualizava o progresso da obra. A solução foi mover a operação para uma função PostgreSQL transacional, que determina a posição inicial, cria a sessão e atualiza o progresso no mesmo comando. Isso evita registros divergentes mesmo quando ocorre uma falha durante o processo.

#### Integrações com catálogos diferentes

Google Books e Open Library retornam formatos e níveis de informação distintos. Foi necessário criar adaptadores para juntar as duas respostas.

#### Responsividade e identidade visual

Os protótipos iniciais tinha a aparência genérica, tentei melhorar isso na versão final, mas manter um design consistente é dificil.

### 6. Instruções para instalação e execução

#### Pré-requisitos

- Node.js 24 LTS;
- pnpm 11;
- Docker Desktop em execução.

Instale a versão de pnpm utilizada pelo projeto:

```powershell
npm install --global pnpm@11.7.0
```

Na raiz do repositório, instale as dependências e crie o arquivo de ambiente:

```powershell
pnpm install
Copy-Item .env.example .env.local
```

Inicie o Supabase local e consulte as credenciais geradas:

```powershell
pnpm db:start
pnpm db:status
```

Substitua em `.env.local` a URL e a chave pública do Supabase pelos valores exibidos pelo comando anterior. As variáveis esperadas estão documentadas em `.env.example`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=chave-publica-local
GOOGLE_AUTH_ENABLED=false
GOOGLE_BOOKS_API_KEY=chave-opcional-do-google-books
OPEN_LIBRARY_USER_AGENT=Procrastibook/0.1 (contact: seu-email)
```

Prepare o banco a partir das migrações e inicie a aplicação:

```powershell
pnpm db:reset
pnpm dev
```

A aplicação ficará disponível em <http://localhost:3000> e o Supabase Studio em <http://127.0.0.1:54323>.

> Se o PowerShell bloquear `pnpm.ps1`, execute `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` e abra um novo terminal.

> `pnpm db:reset` apaga e recria somente o banco local. Esse comando não deve ser executado em produção.

### 7. Referências

GOOGLE. **Google Books APIs: Getting Started**. Disponível em: <https://developers.google.com/books>. Acesso em: 15 maio 2026.

META. **React Documentation**. Disponível em: <https://react.dev/>. Acesso em: 14 jul. 2026.

MICROSOFT. **TypeScript Documentation**. Disponível em: <https://www.typescriptlang.org/docs/>. Acesso em: 14 jul. 2026.

NEXT.JS. **Next.js Documentation**. Disponível em: <https://nextjs.org/docs>. Acesso em: 14 jul. 2026.

OPEN LIBRARY. **Open Library Developer Center**. Disponível em: <https://openlibrary.org/developers/api>. Acesso em: 15 maio 2026.

POSTGRESQL GLOBAL DEVELOPMENT GROUP. **PostgreSQL Documentation**. Disponível em: <https://www.postgresql.org/docs/>. Acesso em: 14 jul. 2026.

SUPABASE. **Supabase Documentation**. Disponível em: <https://supabase.com/docs>. Acesso em: 14 jul. 2026.
