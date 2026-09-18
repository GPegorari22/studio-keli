const pendingKey = 'studio-keli:pending-access'

export function readPendingAccess() {
  try {
    return JSON.parse(sessionStorage.getItem(pendingKey) || 'null')
  } catch {
    return null
  }
}

export function savePendingAccess(value) {
  try {
    if (value) sessionStorage.setItem(pendingKey, JSON.stringify(value))
    else sessionStorage.removeItem(pendingKey)
  } catch {
    // O fluxo continua mesmo quando o navegador bloqueia o armazenamento.
  }
}

export function getAuthRedirectUrl(mode) {
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  url.searchParams.set('auth', mode)
  return url.toString()
}

export function getAuthErrorMessage(error) {
  const messages = {
    invalid_credentials: 'E-mail ou senha incorretos. Confira seus dados e tente novamente.',
    email_not_confirmed: 'Confirme seu e-mail antes de entrar. Use Primeiro acesso para receber um novo código.',
    otp_expired: 'O código expirou ou é inválido. Confira os números ou solicite um novo código.',
    access_denied: 'Este link expirou ou já foi utilizado. Solicite um novo código.',
    over_email_send_rate_limit: 'Aguarde alguns instantes antes de solicitar outro e-mail.',
    over_request_rate_limit: 'Muitas tentativas em pouco tempo. Aguarde um momento e tente novamente.',
    email_address_invalid: 'Informe um endereço de e-mail válido.',
    email_address_not_authorized: 'Não foi possível enviar o e-mail para este endereço. Entre em contato com o Studio.',
    signup_disabled: 'O cadastro está temporariamente indisponível. Entre em contato com o Studio.',
    weak_password: 'Escolha uma senha mais forte, com letras maiúsculas, minúsculas, números e símbolos.',
    same_password: 'Escolha uma senha diferente da sua senha atual.',
    user_banned: 'Não foi possível acessar esta conta. Entre em contato com o Studio.',
    session_not_found: 'Sua sessão expirou. Solicite um novo código para continuar.',
    reauthentication_needed: 'Confirme novamente seu e-mail para alterar a senha.',
  }
  if (messages[error?.code]) return messages[error.code]
  const providerMessage = String(error?.message || error?.msg || '').toLowerCase()
  if (providerMessage.includes('não está habilitado para o primeiro acesso')) {
    return 'Este e-mail não está habilitado para o primeiro acesso. Peça à administração do Studio para cadastrar ou atualizar seu e-mail.'
  }
  if (providerMessage.includes('invalid login credentials')) return messages.invalid_credentials
  if (providerMessage.includes('token has expired') || providerMessage.includes('token is invalid')) return messages.otp_expired
  if (error?.status === 429) return messages.over_email_send_rate_limit
  if (error?.name === 'AuthSessionMissingError') return messages.session_not_found
  if (error instanceof TypeError || error?.name === 'AuthRetryableFetchError') {
    return 'Não foi possível conectar. Verifique sua conexão e tente novamente.'
  }
  return 'Não foi possível concluir agora. Tente novamente em instantes.'
}
