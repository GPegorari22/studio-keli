import { createClient } from '@supabase/supabase-js'
import { loadEnv } from 'vite'
import { readFile } from 'node:fs/promises'

const env = loadEnv('development', process.cwd(), 'VITE_')
const client = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(15000) }) },
})
const migration = await readFile('supabase/migrations/20261002000025_admin_dashboard_and_test_user.sql', 'utf8')
const [, email, password] = migration.match(/-- Conta de teste: (\S+) \/ (\S+)/)
const { error: authError } = await client.auth.signInWithPassword({ email, password })
if (authError) throw new Error(`Login administrativo: ${authError.message}`)
const access = await client.rpc('is_admin')
console.log('is_admin:', access.data, access.error?.message || '')
const api = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/`, {
  headers: { apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${(await client.auth.getSession()).data.session.access_token}` },
  signal: AbortSignal.timeout(15000),
})
const schema = await api.json()
for (const table of ['usuario', 'aluno', 'professor', 'turma', 'aula', 'matricula', 'frequencia', 'mensalidade', 'pagamento', 'pedido', 'pedidos', 'comunicado_usuario']) {
  const definition = schema.definitions?.[table]
  console.log('schema', table, definition ? Object.keys(definition.properties).join(', ') : 'indisponível')
  const fields = table === 'frequencia' ? 'presente' : table === 'pagamento' ? 'id_pagamento' : table === 'comunicado_usuario' ? 'lido' : 'status'
  const { data, error, count } = await client.from(table).select(fields, { count: 'exact' }).limit(1000)
  const statuses = data?.reduce((groups, row) => { const value = String(row.status ?? row.presente ?? row.lido ?? 'registro'); groups[value] = (groups[value] || 0) + 1; return groups }, {})
  console.log('data', table, error ? `${error.code}: ${error.message}` : JSON.stringify({ count, statuses }))
}
for (const rpc of ['painel_administrativo', 'painel_admin_dados']) {
  const { data, error } = await client.rpc(rpc)
  console.log('rpc', rpc, error ? `${error.code}: ${error.message}` : JSON.stringify({ keys: Object.keys(data || {}), indicadores: data?.indicadores }))
}
await client.auth.signOut({ scope: 'local' })
