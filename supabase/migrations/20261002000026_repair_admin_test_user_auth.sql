-- Corrige a conta de teste criada pela migration anterior.
-- O Supabase Auth não aceita NULL nos campos de token de auth.users ao consultar
-- um usuário durante o login.

update auth.users
set
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change = coalesce(email_change, '')
where email = 'admin.teste@studiokeli.local';