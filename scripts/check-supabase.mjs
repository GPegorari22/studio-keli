import { loadEnv } from 'vite'

const env = loadEnv(process.argv[2] ?? 'development', process.cwd(), 'VITE_')
const supabaseUrl = env.VITE_SUPABASE_URL?.trim()
const supabasePublishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

try {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no .env.local.')
  }

  const settingsUrl = new URL(`${supabaseUrl.replace(/\/+$/, '')}/auth/v1/settings`)
  const response = await fetch(settingsUrl, {
    headers: { apikey: supabasePublishableKey },
    signal: AbortSignal.timeout(10000),
  })

  if (!response.ok) {
    throw new Error(`O Supabase respondeu com HTTP ${response.status}. Verifique a URL e a chave pública.`)
  }

  await response.json()
  console.log('Conexão com o Supabase validada: serviço de autenticação acessível e chave pública aceita.')
} catch (error) {
  console.error(`Falha ao verificar o Supabase: ${error.message}`)
  process.exitCode = 1
}
