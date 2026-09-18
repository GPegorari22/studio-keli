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

### Login e primeiro acesso

O botão **Entrar** abre `/#entrar`. A tela usa o cliente compartilhado do Supabase
Auth para login com e-mail e senha, cadastro de novas contas, confirmação por
link, criação de senha, recuperação de senha e logout. A sessão é restaurada ao
recarregar a página; o cabeçalho passa a mostrar **Minha conta**.

O primeiro acesso (`/#primeiro-acesso`) usa `signInWithOtp` com
`shouldCreateUser: true`, envia um link de confirmação e salva a senha com
`updateUser` somente após a autenticação pelo link. A recuperação usa
`resetPasswordForEmail`, que também envia um link para criar uma nova senha.

O cadastro de primeiro acesso é restrito a e-mails já existentes em
`public.aluno`. A migration
[`20260918000003_restrict_first_access_to_registered_students.sql`](supabase/migrations/20260918000003_restrict_first_access_to_registered_students.sql)
cria um hook no banco que bloqueia a criação de identidades para qualquer outro
e-mail, sem abrir leitura pública da tabela de alunos.

#### Configurar o projeto hospedado no Supabase

As variáveis de conexão já usadas pelo site também atendem ao login. As opções de
`supabase/config.toml` e os templates deste repositório configuram o Supabase
**local**; elas não alteram automaticamente o projeto hospedado.

No painel do projeto hospedado:

1. Em **Authentication → Sign In / Providers**, habilite e-mail, cadastro de novos
   usuários e confirmação de e-mail. Use senha mínima de 8 caracteres.
   Em **Authentication → Hooks (Beta)**, selecione a função Postgres
   `restringir_cadastro_ao_email_do_aluno` para o evento **Before User Created**
   depois de aplicar a migration acima.
2. Em **Authentication → Email Templates**, mantenha o template padrão ou use um
   template que contenha `{{ .ConfirmationURL }}` em **Confirm signup**, **Magic
   Link** e **Reset Password**. Esse link abre a tela para a pessoa criar ou
   redefinir sua senha.
3. Em **Authentication → URL Configuration**, defina a **Site URL** do site e
   autorize estas URLs de retorno (troque a origem na publicação):
   - `http://localhost:5173/?auth=primeiro-acesso`
   - `http://localhost:5173/?auth=recuperar-senha`
   - as mesmas URLs com `http://127.0.0.1:5173`, se usar esse endereço.
4. Para enviar a novos usuários fora dos endereços autorizados pelo serviço de
   e-mail padrão, configure um SMTP de produção em **Authentication → Email**.

Referências: [OTP por e-mail](https://supabase.com/docs/guides/auth/auth-email-passwordless),
[templates](https://supabase.com/docs/guides/auth/auth-email-templates) e
[SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

O cadastro cria a identidade em **Authentication → Users**. Ele não atribui um
perfil administrativo nem cria registros de aluno ou matrícula. O vínculo com
`public.usuario` e os perfis da escola continua sendo responsabilidade do fluxo
administrativo, protegido por RLS. Após entrar, o usuário vê a tela de sucesso e
pode retornar ao Studio ou sair; um painel escolar não faz parte desta tela.

#### Verificação

```sh
npm run supabase:check
npm run build
npm run lint
npm run test:auth
```

Os testes de navegador usam respostas simuladas da API de autenticação e não
criam contas nem enviam e-mails reais. Cobrem login, sessão persistida, logout,
cadastro, confirmação por link, confirmação de senha, recuperação por link,
limites de envio, bloqueio de e-mail não cadastrado e layout mobile. No Windows usam o Edge instalado; em outros
sistemas, instale o Chromium com `npx playwright install chromium`.

Para verificar a entrega real de e-mails, após configurar o painel, faça o primeiro
acesso com um e-mail seu, abra o link recebido, defina a senha, saia e entre novamente.

### Solicitações de aula experimental

O modal de aula experimental grava os contatos em `public.possivel_aluno`. Ele usa
somente os campos existentes nessa tabela: `nome`, `data_nascimento`, `telefone`,
`email`, `horario_aula_experimental`, `origem`, `observacoes` e `status`.

Antes de testar o envio público, execute a migration
[`20260917000001_enable_public_trial_request_on_possivel_aluno.sql`](supabase/migrations/20260917000001_enable_public_trial_request_on_possivel_aluno.sql)
no SQL Editor do Supabase ou pelo fluxo de migrations do projeto.

Além da policy de RLS, essa migration concede somente `INSERT` e o uso da sequência
de identidade ao formulário público; ela não libera leitura, atualização ou exclusão
dos contatos.

As turmas do passo de disponibilidade são carregadas de
`public.turmas_disponiveis_inscricao`. A view calcula `vagas_disponiveis` a cada
consulta a partir de `turma.capacidade - COUNT(matricula ativa)` e não retorna
turmas lotadas. Ao selecionar uma turma, o formulário grava o `id_turma` existente
em `possivel_aluno`; a data da aula continua nula até a confirmação da equipe.

Para habilitar a lista, execute também a migration
[`20260917000002_create_turmas_disponiveis_inscricao_view.sql`](supabase/migrations/20260917000002_create_turmas_disponiveis_inscricao_view.sql).

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
