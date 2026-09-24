import { test, expect } from '@playwright/test'

const dashboard = {
  aluno: { nome: 'Letícia Silva' },
  proxima_aula: { id_aula: 12, modalidade: 'Ballet clássico', data: '2026-09-23', horario_inicio: '08:00', horario_fim: '19:00', turma: 'Sala 02' },
  frequencia: { presencas: 72, faltas: 28, percentual: 72 },
  criterios: [{ nome: 'Técnica', nota: 8.5 }, { nome: 'Flexibilidade', nota: 7.2 }, { nome: 'Expressão', nota: 9 }, { nome: 'Disciplina', nota: 6.8 }],
  aulas: [{ data: '2026-09-23' }, { data: '2026-10-02' }],
}

async function openDashboard(page, data = dashboard) {
  await page.clock.setFixedTime(new Date('2026-09-23T12:00:00-03:00'))
  await page.route('**/rest/v1/rpc/meu_painel_aluno', (route) => route.fulfill({ json: data }))
  await page.goto('/#aluno')
  await expect(page.getByRole('heading', { name: 'Olá, Letícia!' })).toBeVisible()
  await expect(page.getByText('Carregando seu perfil…')).toHaveCount(0)
}

test('menu mantém o aluno no painel e calendário permite navegar entre meses', async ({ page }) => {
  await openDashboard(page)
  await expect(page.getByRole('img', { name: '72% de frequência' })).toBeVisible()
  for (const name of ['Calendário', 'Aulas', 'Evolução', 'Loja', 'Início']) {
    await page.getByRole('link', { name, exact: true }).click()
    await expect(page).toHaveURL(/#aluno$/)
    await expect(page.getByRole('heading', { name: 'Olá, Letícia!' })).toBeAttached()
    if (name === 'Evolução') await expect(page.getByRole('heading', { name: 'Minha Evolução' })).toBeVisible()
  }
  await page.getByRole('button', { name: 'Próximo mês' }).click()
  await expect(page.getByRole('region', { name: 'Calendário de outubro 2026' })).toBeVisible()
  await expect(page.locator('.has-class')).toHaveAttribute('aria-label', '02 de outubro de 2026, aula agendada')
  await page.getByRole('button', { name: 'Mês anterior' }).click()
  await expect(page.locator('[aria-current="date"]')).toHaveText('23')
})

test('confirma presença somente na aula do dia usando o identificador real', async ({ page }) => {
  let submitted
  await page.route('**/rest/v1/rpc/confirmar_presenca_da_proxima_aula', async (route) => {
    submitted = route.request().postDataJSON()
    await route.fulfill({ json: { ok: true } })
  })
  await openDashboard(page)
  await page.getByRole('button', { name: 'Marcar presença' }).click()
  await expect(page.getByRole('status')).toContainText('Presença confirmada')
  expect(submitted).toEqual({ id_da_aula: 12 })
})

test('aula futura mantém a confirmação de presença desabilitada', async ({ page }) => {
  await openDashboard(page, { ...dashboard, proxima_aula: { ...dashboard.proxima_aula, data: '2026-09-29' } })
  await expect(page.getByRole('button', { name: 'Marcar presença' })).toBeDisabled()
})

test('perfil sem registros exibe estados vazios', async ({ page }) => {
  await openDashboard(page, { ...dashboard, proxima_aula: null, frequencia: { percentual: null }, criterios: [], aulas: [] })
  await expect(page.getByText('Você ainda não tem uma próxima aula agendada.')).toBeVisible()
  await expect(page.getByRole('img', { name: 'Sem registros de frequência' })).toBeVisible()
  await expect(page.getByText('Sua evolução aparecerá aqui após a primeira avaliação.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Marcar presença' })).toHaveCount(0)
})

for (const [name, width, height] of [['desktop', 1440, 1000], ['referencia', 604, 652], ['mobile', 390, 844], ['mobile-estreito', 320, 740]]) {
  test(`layout ${name} preserva o conteúdo sem rolagem horizontal`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height })
    await openDashboard(page)
    await page.evaluate(() => document.fonts.ready)
    await expect(page.locator('.student-footer')).toBeAttached()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    expect(await page.locator('.student-workspace').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true, animations: 'disabled' })
  })
}
