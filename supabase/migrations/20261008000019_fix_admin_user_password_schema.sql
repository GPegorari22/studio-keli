-- Corrige o acesso às funções crypt/gen_salt da extensão pgcrypto.
alter function public.admin_criar_usuario_admin(text, text, text, jsonb)
  set search_path = public, extensions;
