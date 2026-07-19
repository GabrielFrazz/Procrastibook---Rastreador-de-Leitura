# Procrastibook

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript_6-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)

Aplicação web pessoal para organizar obras, acompanhar o progresso de leitura e visualizar hábitos ao longo do tempo.

Trabalho final da disciplina **CSI606 — Desenvolvimento Web**, desenvolvido por **Carlos Gabriel de Oliveira Frazão (22.1.8100)**.

## Sobre o projeto

O Procrastibook centraliza livros, mangás, artigos e e-books em uma biblioteca pessoal. O usuário pode registrar seu progresso e suas sessões de leitura, organizar obras em listas, definir metas e consultar estatísticas.

O sistema também permite importar informações do Google Books e da Open Library, mantendo disponível o cadastro manual quando uma obra não é encontrada.

## Funcionalidades

- Autenticação por e-mail e senha, recuperação de acesso e Google OAuth opcional.
- Biblioteca com busca, filtros e status de leitura.
- Cadastro manual ou importação de obras por catálogos externos.
- Progresso por páginas, capítulos ou porcentagem.
- Sessões de leitura com duração, posição final e anotações.
- Avaliações, reviews, notas, citações e listas personalizadas.
- Metas, dashboard e estatísticas pessoais.
- Perfil com avatar, nome e fuso horário.
- Interface responsiva para desktop, tablet e mobile.

## Protótipos

Os protótipos de baixa fidelidade abaixo registram a concepção inicial do sistema. A interface atual evoluiu durante o desenvolvimento, portanto essas imagens funcionam como referência histórica.

### Login

![Protótipo da tela de login](prototipos/login.png)

### Dashboard

![Protótipo do dashboard](prototipos/dashboard.png)

### Biblioteca

![Protótipo da biblioteca](prototipos/biblioteca.png)

### Adicionar obra

![Protótipo da tela de adicionar obra](prototipos/adicionar.png)

## Tecnologias e arquitetura

O projeto é uma aplicação full stack em um único workspace. O Next.js atende a interface, as páginas do servidor, Server Actions e endpoints internos. O Supabase fornece PostgreSQL, autenticação e armazenamento de arquivos.

| Área                 | Tecnologias                              |
| -------------------- | ---------------------------------------- |
| Aplicação            | Next.js 16, React 19 e TypeScript 6      |
| Validação            | Zod 4                                    |
| Banco e autenticação | PostgreSQL, Supabase Auth, Storage e RLS |
| Integrações          | Google Books e Open Library              |
| Testes               | Vitest e pgTAP                           |
| Deploy               | Vercel e Supabase                        |

As funcionalidades são organizadas por domínio em `src/features`. Componentes visuais não consultam o banco diretamente: os comandos passam por actions e serviços, enquanto consultas e persistência ficam isoladas nas camadas de dados. O banco utiliza RLS para separar os dados de cada usuário e funções PostgreSQL para operações atômicas, como progresso e sessões de leitura.

## Estrutura principal

```text
.
├── src/
│   ├── app/                 # Rotas, layouts, Server Actions e endpoints
│   ├── components/          # Shell e componentes visuais compartilhados
│   ├── features/            # Regras e interfaces organizadas por domínio
│   ├── lib/                 # Configuração e clientes do Supabase
│   ├── styles/              # Tokens e estilos globais ou por tela
│   └── proxy.ts             # Sessão e proteção das rotas autenticadas
├── supabase/
│   ├── migrations/          # Schema, RLS, Storage e funções PostgreSQL
│   ├── tests/               # Testes de banco com pgTAP
│   └── seed.sql             # Dados do ambiente local
├── prototipos/              # Protótipos históricos do projeto
├── .env.example             # Modelo das variáveis de ambiente
├── package.json             # Dependências e scripts
└── README.md
```

## Como executar localmente

### Pré-requisitos

- Node.js 24 LTS;
- pnpm 11;
- Docker Desktop em execução.

Instale o pnpm adotado pelo projeto:

```powershell
npm install --global pnpm@11.7.0
```

Na raiz do repositório, execute:

```powershell
pnpm install
Copy-Item .env.example .env.local
pnpm db:start
pnpm db:status
```

Copie para `.env.local` a URL e a chave pública exibidas por `pnpm db:status`. Depois, prepare o banco e inicie a aplicação:

```powershell
pnpm db:reset
pnpm dev
```

A aplicação ficará disponível em <http://localhost:3000>. O Supabase Studio local estará em <http://127.0.0.1:54323>.

> Se o PowerShell bloquear `pnpm.ps1`, execute `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` e abra um novo terminal.

> `pnpm db:reset` apaga e recria somente o banco local. Nunca execute esse comando em produção.

## Variáveis de ambiente

| Variável                               | Finalidade                                       |
| -------------------------------------- | ------------------------------------------------ |
| `NEXT_PUBLIC_APP_URL`                  | URL base da aplicação                            |
| `NEXT_PUBLIC_SUPABASE_URL`             | URL do projeto Supabase                          |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave pública do Supabase                        |
| `GOOGLE_AUTH_ENABLED`                  | Habilita o login com Google                      |
| `GOOGLE_BOOKS_API_KEY`                 | Credencial usada no servidor para o Google Books |
| `OPEN_LIBRARY_USER_AGENT`              | Identificação enviada à Open Library             |

Segredos administrativos, como `service_role`, senha do banco e segredos OAuth, não devem ser adicionados ao repositório nem expostos ao navegador.

## Comandos principais

| Comando                          | Ação                                            |
| -------------------------------- | ----------------------------------------------- |
| `pnpm dev`                       | Inicia o ambiente de desenvolvimento            |
| `pnpm build`                     | Gera o build de produção                        |
| `pnpm db:start` / `pnpm db:stop` | Inicia ou encerra o Supabase local              |
| `pnpm db:reset`                  | Recria o banco local a partir das migrações     |
| `pnpm db:test`                   | Executa os testes de banco                      |
| `pnpm test`                      | Executa os testes Vitest                        |
| `pnpm validate`                  | Executa lint, formatação, tipos, testes e build |

## Deploy

A aplicação é hospedada na Vercel e utiliza um projeto Supabase para banco, autenticação e arquivos. A ordem segura de publicação é:

1. Executar `pnpm validate`.
2. Conferir e aplicar as migrações com `pnpm exec supabase migration list` e `pnpm exec supabase db push`.
3. Publicar o código na Vercel e testar os fluxos principais.

Migrações já aplicadas não devem ser editadas. Correções de banco devem ser feitas por uma nova migração.

## Referências

- [Next.js](https://nextjs.org/docs)
- [React](https://react.dev/)
- [Supabase](https://supabase.com/docs)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Google Books APIs](https://developers.google.com/books)
- [Open Library Developer Center](https://openlibrary.org/developers/api)
