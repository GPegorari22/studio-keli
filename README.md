# Studio Keli

Landing page do Studio Keli Dalpian, desenvolvida com React + Vite.

## Visão geral

Este projeto apresenta a identidade visual do studio com foco em:

- hero banner inicial
- navegação principal
- seção de modalidades
- apresentação do studio e vídeos
- professoras
- espetáculos
- chamada para inscrição
- rodapé com links e redes sociais

## Estrutura principal

- [src/App.jsx](src/App.jsx): composição da página e dados dos blocos
- [src/App.css](src/App.css): estilos visuais e responsividade da landing page
- [src/index.css](src/index.css): base global e fontes
- [src/assets](src/assets): imagens e vídeos usados no projeto
- [src/lib/supabase.js](src/lib/supabase.js): cliente compartilhado do Supabase

## Como rodar

1. Instale as dependências:
   npm install

2. Copie `.env.example` para `.env.local` e preencha a URL e a chave pública do Supabase.

3. Inicie o ambiente de desenvolvimento:
   npm run dev

4. Para gerar a build de produção:
   npm run build

## Supabase

A conexão usa `@supabase/supabase-js`, seguindo o [guia oficial para React](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs). O cliente é inicializado em `src/main.jsx` e pode ser reutilizado nos componentes:

```js
import { supabase } from './lib/supabase.js'
```

Configure estas variáveis em `.env.local`:

```dotenv
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_sua_chave_publica
```

O arquivo `.env.local` fica fora do Git. A chave publishable é própria para o navegador; o acesso aos dados segue as políticas de RLS configuradas no Supabase. Veja a [documentação de chaves de API](https://supabase.com/docs/guides/getting-started/api-keys).

Para verificar a URL e a chave com uma consulta de leitura ao serviço de autenticação:

```sh
npm run supabase:check
```

### Solicitações de aula experimental

O modal de aula experimental grava uma solicitação na tabela
`public.solicitacao_aula_experimental`. Antes de testar o envio, execute a migration
[`20260917000000_create_solicitacao_aula_experimental.sql`](supabase/migrations/20260917000000_create_solicitacao_aula_experimental.sql)
no SQL Editor do Supabase ou pelo fluxo de migrations do projeto.

A policy criada permite somente `INSERT` para visitantes e usuários autenticados.
Não há acesso público de leitura, atualização ou exclusão dos dados de contato. A
equipe pode consultar as solicitações pelo painel do Supabase até que seja criada a
policy administrativa vinculada ao perfil de Administrador.

Esse comando valida a conexão com o serviço de autenticação. As consultas às tabelas dependem do esquema e das permissões do banco.

Ao publicar o site, configure as mesmas variáveis no serviço de hospedagem antes de executar `npm run build`. Reinicie o Vite quando alterar as variáveis locais, conforme a [documentação de variáveis de ambiente](https://vite.dev/guide/env-and-mode).

## Status atual

O projeto está funcional e compilando corretamente em produção.

Verificação executada:
- npm run build
- resultado: build concluída com sucesso pelo Vite

## Observações

A página já está em um estado visual completo para apresentação, com foco em estética e identidade da marca. O próximo passo natural pode ser integrar:

- formulário de contato
- WhatsApp direto
- área de loja
- CMS ou dados dinâmicos
