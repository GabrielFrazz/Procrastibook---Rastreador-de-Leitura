# CSI606-2026-01 - Proposta trabalho final

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)

## Aluno: Carlos Gabriel de Oliveira Frazão - 22.1.8100

---

## Resumo

O presente trabalho propõe o desenvolvimento de uma aplicação web voltada para o gerenciamento e acompanhamento de hábitos de leitura de diferentes tipos de obras, como livros, mangás, artigos e e-books.

A plataforma permitirá que usuários organizem suas leituras de forma simples e centralizada, registrando progresso, sessões de leitura, avaliações, anotações e listas personalizadas. Além disso, o sistema contará com dashboards e estatísticas para auxiliar no acompanhamento do desempenho e dos hábitos de leitura ao longo do tempo.

O projeto tem como foco a aplicação de conceitos de desenvolvimento web full stack utilizando tecnologias modernas tanto no frontend quanto no backend, além da integração com APIs externas para enriquecimento automático das informações das obras cadastradas.

---

# 1. Tema

O trabalho final tem como tema o desenvolvimento de um sistema web para gerenciamento e acompanhamento de hábitos de leitura.

A aplicação será voltada para usuários que desejam centralizar informações relacionadas às suas leituras em um único ambiente, permitindo organizar obras, acompanhar progresso, registrar sessões de leitura e visualizar estatísticas pessoais.

---

# 2. Escopo

O sistema contará com as seguintes funcionalidades principais:

- Cadastro e gerenciamento de obras:
  - Livros;
  - Mangás;
  - Artigos;
  - E-books.

- Controle de progresso de leitura:
  - Páginas lidas;
  - Porcentagem concluída;
  - Controle de capítulos.

- Registro de sessões de leitura:
  - Tempo gasto;
  - Quantidade de páginas lidas;
  - Anotações pessoais.

- Sistema de avaliações e reviews:
  - Notas;
  - Comentários;
  - Citações favoritas.

- Organização por listas personalizadas:
  - Quero Ler;
  - Lendo;
  - Finalizado;
  - Abandonado.

- Dashboard com estatísticas pessoais:
  - Quantidade de obras lidas;
  - Total de páginas;
  - Velocidade média de leitura;
  - Metas de leitura.

- Sistema de busca e filtros:
  - Título;
  - Autor;
  - Gênero;
  - Status da leitura.

- Integração com APIs externas:
  - Google Books API;
  - Open Library API.

---

# 3. Restrições

Neste trabalho não serão considerados:

- Recursos de rede social entre usuários;
- Sistema de mensagens ou chat em tempo real;
- Marketplace ou compra de livros;
- Aplicativo mobile nativo;
- Recomendações baseadas em inteligência artificial;
- Funcionalidades offline;
- Sistema avançado de autenticação com múltiplos fatores.

---

# 4. Protótipo

Os esboços da interface do sistema foram elaborados na forma de protótipos de baixa fidelidade, servindo para ilustrar o fluxo de navegação principal e a disposição inicial dos componentes de tela. Os arquivos de imagem correspondentes encontram-se estruturados na pasta `prototipos`:

### Tela de Login

Interface simples contendo campos para autenticação do usuário na plataforma.
![Tela de Login](prototipos/login.png)

### Dashboard

Painel central contendo as métricas de leitura, metas anuais, etc.
![Dashboard](prototipos/dashboard.png)

### Biblioteca

Visualização de todas as obras cadastradas pelo usuário, separadas por categorias e progresso.
![Biblioteca](prototipos/biblioteca.png)

### Adicionar Obra

Formulário para inclusão manual de novos materiais ou para importação automatizada via APIs externas.
![Adicionar Obra](prototipos/adicionar.png)
---

# 5. Tecnologias Previstas

O projeto será implementado como uma aplicação full stack em um único workspace:

- Next.js com App Router;
- React e TypeScript estrito;
- pnpm e Node.js 24 LTS;
- PostgreSQL, Auth e Storage pelo Supabase;
- Zod e React Hook Form nas fases de domínio;
- Vitest, Testing Library, pgTAP e Playwright conforme os módulos forem adicionados.

## Ambiente local

Pré-requisitos:

- Node.js 24 LTS;
- pnpm 11;
- Docker Desktop com o mecanismo WSL 2 para o Supabase local.

Instale as dependências e execute o servidor:

```bash
pnpm install
pnpm dev
```

A aplicação ficará disponível em <http://localhost:3000>.

Copie `.env.example` para `.env.local` quando precisar alterar os valores locais. Os placeholders do Supabase devem ser substituídos pelos valores exibidos por `pnpm db:status`.

## Supabase local

Com o Docker Desktop em execução:

```bash
pnpm db:start
pnpm db:status
pnpm db:reset
pnpm db:test
pnpm db:stop
```

Serviços locais padrão:

- API: <http://127.0.0.1:54321>;
- Studio: <http://127.0.0.1:54323>;
- Mailpit: <http://127.0.0.1:54324>.

`pnpm db:reset` recria o banco a partir das migrações e executa `supabase/seed.sql`.
`pnpm db:test` executa os testes pgTAP de constraints e isolamento por RLS.

## Comandos de qualidade

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

`pnpm validate` executa a sequência completa acima.

---

# 6. Estrutura de Pastas Prevista

O workspace inicial segue esta organização:

```text
procrastibook/
├── src/
│   ├── app/              # Rotas e layouts do Next.js
│   ├── styles/           # Estilos globais; tokens entram na fundação visual
│   └── test/             # Testes e configuração compartilhada
├── prototipos/           # Protótipos de baixa fidelidade
├── .env.example          # Nomes e valores fictícios de ambiente
├── package.json          # Scripts e dependências fixadas
└── pnpm-lock.yaml        # Resolução reproduzível das dependências
```

Banco, autenticação, integrações externas e funcionalidades de leitura serão adicionados em entregas posteriores.

---

# 7. Referências

GOOGLE BOOKS API. Google Books APIs Getting Started. Disponível em: <https://developers.google.com/books>. Acesso em: 15 maio 2026.

NEXT.JS. Next.js Documentation. Disponível em: <https://nextjs.org/docs>. Acesso em: 14 jul. 2026.

OPEN LIBRARY API. Open Library Developer Center. Disponível em: <https://openlibrary.org/developers/api>. Acesso em: 15 maio 2026.

POSTGRESQL. PostgreSQL Database Management System Documentation. Disponível em: <https://www.postgresql.org/docs/>. Acesso em: 14 jul. 2026.

REACT. React Documentation and Guides. Disponível em: <https://react.dev>. Acesso em: 14 jul. 2026.

SUPABASE. Supabase Documentation. Disponível em: <https://supabase.com/docs>. Acesso em: 14 jul. 2026.
