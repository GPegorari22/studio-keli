import { test, expect } from '@playwright/test'

const email = 'bailarina@example.com'
const password = 'Danca!2026'
const user = {
  id: 'd1712222-0000-4000-a000-000000000001',
  aud: 'authenticated',
  role: 'authenticated',
  email,
  email_confirmed_at: '2026-09-18T12:00:00Z',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: {},
  identities: [],
  created_at: '2026-09-18T12:00:00Z',
}

function sessionData() {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600
  const encode = (data) => Buffer.from(JSON.stringify(data)).toString('base64url')
  return {
    access_token: `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, aud: 'authenticated', role: 'authenticated', email, exp: expiresAt })}.test-signature`,
    refresh_token: 'test-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expiresAt,
    user,
  }
}

async function mockAuth(page, overrides = {}) {
  const requests = []
  await page.route('**/auth/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const endpoint = url.pathname.split('/').at(-1)
    const body = request.postDataJSON()
    requests.push({ endpoint, method: request.method(), body, url })
    if (overrides[endpoint]) {
      await overrides[endpoint](route, body)
      return
    }
    const payload = endpoint === 'token' || endpoint === 'verify' ? sessionData() : endpoint === 'user' ? user : {}
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
  })
  return requests
}

async function requestSignup(page) {
  await page.goto('/#primeiro-acesso')
  await page.getByLabel('E-mail', { exact: true }).fill(email)
  await page.getByRole('button', { name: 'Enviar link', exact: true }).click()
  await expect(page.getByRole('heading', { name: '2. Verifique seu e-mail' })).toBeVisible()
}

async function openConfirmedLink(page, route = 'primeiro-acesso') {
  const session = sessionData()
  await page.goto(`/?auth=${route}#access_token=${session.access_token}&refresh_token=${session.refresh_token}&expires_in=3600&token_type=bearer&type=${route === 'recuperar-senha' ? 'recovery' : 'magiclink'}`)
  await expect(page.getByRole('heading', { name: /3\. Crie/ })).toBeVisible()
}

test('botão Entrar abre a tela; credenciais inválidas não criam sessão', async ({ page }, testInfo) => {
  await mockAuth(page, { token: (route) => route.fulfill({ status: 400, contentType: 'application/json', headers: { 'x-supabase-api-version': '2024-01-01' }, body: JSON.stringify({ code: 'invalid_credentials', msg: 'Invalid login credentials' }) }) })
  await page.goto('/')
  await page.getByRole('link', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Bem-vindo (a) de volta!' })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('login-desktop.png'), fullPage: true, animations: 'disabled' })
  await page.getByLabel('E-mail', { exact: true }).fill(email)
  await page.getByLabel('Senha', { exact: true }).fill('senha-incorreta')
  await page.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  await expect(page.getByRole('alert')).toContainText('E-mail ou senha incorretos')
  await expect(page.getByRole('heading', { name: 'Sistema Studio Keli Dalpian' })).toHaveCount(0)
})

test('login persiste ao recarregar, atualiza o cabeçalho e permite sair', async ({ page }) => {
  const requests = await mockAuth(page)
  await page.goto('/#entrar')
  await page.getByLabel('E-mail', { exact: true }).fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  await expect(page.getByRole('heading', { name: 'Sistema Studio Keli Dalpian' })).toBeVisible()
  expect(requests.find((request) => request.endpoint === 'token').body).toMatchObject({ email, password })
  await page.reload()
  await expect(page.getByText(email, { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Voltar ao Studio', exact: true }).click()
  await page.getByRole('link', { name: 'Minha conta' }).click()
  await page.getByRole('button', { name: 'Sair da conta' }).click()
  await expect(page.getByRole('heading', { name: 'Bem-vindo (a) de volta!' })).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Senha', { exact: true })).toBeVisible()
})

test('primeiro acesso envia link e só salva senha depois da confirmação', async ({ page }) => {
  const requests = await mockAuth(page)
  await requestSignup(page)
  const otpRequest = requests.find((request) => request.endpoint === 'otp')
  expect(otpRequest.body).toMatchObject({ email, create_user: true })
  expect(otpRequest.url.searchParams.get('redirect_to')).toContain('?auth=primeiro-acesso')
  await expect(page.getByRole('button', { name: /Reenviar link em/ })).toBeDisabled()
  await page.reload()
  await expect(page.getByText('Abra o e-mail e clique no link para continuar.')).toBeVisible()
  await openConfirmedLink(page)
  expect(requests.filter((request) => request.endpoint === 'verify')).toHaveLength(0)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByLabel('Confirmar senha', { exact: true }).fill('Diferente!123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  await expect(page.getByRole('alert')).toContainText('As senhas não coincidem')
  expect(requests.filter((request) => request.endpoint === 'user' && request.method === 'PUT')).toHaveLength(0)
  await page.getByLabel('Confirmar senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  await expect(page.getByRole('heading', { name: 'Sistema Studio Keli Dalpian' })).toBeVisible()
  expect(requests.find((request) => request.endpoint === 'user' && request.method === 'PUT').body).toMatchObject({ password })
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Sistema Studio Keli Dalpian' })).toBeVisible()
})

test('não libera criação de senha antes da confirmação pelo link', async ({ page }) => {
  const requests = await mockAuth(page)
  await requestSignup(page)
  await page.getByRole('button', { name: 'Já confirmei o e-mail' }).click()
  await expect(page.getByRole('alert')).toContainText('Abra o link recebido por e-mail')
  await expect(page.getByLabel('Confirmar senha', { exact: true })).toHaveCount(0)
  expect(requests.filter((request) => request.endpoint === 'user')).toHaveLength(0)
})

test('e-mail fora da tabela de alunos não recebe link nem cria conta', async ({ page }) => {
  const requests = await mockAuth(page, {
    otp: (route) => route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Este e-mail não está habilitado para o primeiro acesso. Peça à administração do Studio para cadastrar ou atualizar seu e-mail.' }),
    }),
  })
  await page.goto('/#primeiro-acesso')
  await page.getByLabel('E-mail', { exact: true }).fill('nao-cadastrado@example.com')
  await page.getByRole('button', { name: 'Enviar link', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Este e-mail não está habilitado para o primeiro acesso')
  await expect(page.getByRole('heading', { name: '2. Verifique seu e-mail' })).toHaveCount(0)
  expect(requests.filter((request) => request.endpoint === 'user')).toHaveLength(0)
})

test('recuperação envia link e atualiza senha após o retorno', async ({ page }) => {
  const requests = await mockAuth(page)
  await page.goto('/#entrar')
  await page.getByRole('button', { name: 'Esqueci minha senha' }).click()
  await page.getByLabel('E-mail', { exact: true }).fill(email)
  await page.getByRole('button', { name: 'Enviar link', exact: true }).click()
  expect(requests.find((request) => request.endpoint === 'recover').body).toMatchObject({ email })
  await openConfirmedLink(page, 'recuperar-senha')
  expect(requests.filter((request) => request.endpoint === 'verify')).toHaveLength(0)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByLabel('Confirmar senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Salvar senha' }).click()
  await expect(page.getByRole('heading', { name: 'Sistema Studio Keli Dalpian' })).toBeVisible()
})

test('link de recuperação abre criação de senha e link expirado mostra erro', async ({ page }) => {
  await mockAuth(page)
  await openConfirmedLink(page, 'recuperar-senha')
  await page.goto('/?auth=recuperar-senha#error=access_denied&error_code=otp_expired')
  await expect(page.getByRole('alert')).toContainText('O código expirou ou é inválido')
  await expect(page.getByLabel('Confirmar senha', { exact: true })).toHaveCount(0)
})

test('falha de envio e limite de requisições não avançam o cadastro', async ({ page }) => {
  await mockAuth(page, { otp: (route) => route.fulfill({ status: 429, contentType: 'application/json', headers: { 'x-supabase-api-version': '2024-01-01' }, body: JSON.stringify({ code: 'over_email_send_rate_limit' }) }) })
  await page.goto('/#primeiro-acesso')
  await page.getByLabel('E-mail', { exact: true }).fill(email)
  await page.getByRole('button', { name: 'Enviar link', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Aguarde alguns instantes')
  await expect(page.getByRole('button', { name: /Aguarde \d+s/ })).toBeDisabled()
  await expect(page.getByText('Abra o e-mail e clique no link para continuar.')).toHaveCount(0)
  await page.getByRole('button', { name: 'Já recebi o link' }).click()
  await expect(page.getByText('Abra o e-mail e clique no link para continuar.')).toBeVisible()
})

test('layout cabe no celular e mantém campos acessíveis', async ({ page }, testInfo) => {
  await mockAuth(page)
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/#entrar')
  await expect(page.getByLabel('E-mail', { exact: true })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('login-mobile.png'), fullPage: true, animations: 'disabled' })
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Mostrar senha', exact: true }).click()
  await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'text')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
