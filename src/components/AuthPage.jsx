import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { getAuthErrorMessage, getAuthRedirectUrl, readPendingAccess, savePendingAccess } from '../lib/auth.js'
import AuthBrand from './AuthBrand.jsx'
import ribbon from '../assets/secao-espetaculos.png'
import './AuthPage.css'

function PasswordField({ id, label, value, onChange, isNew = false }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-password">
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          autoComplete={isNew ? 'new-password' : 'current-password'}
          placeholder={isNew ? 'Crie sua senha' : 'Digite sua senha aqui'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          minLength={isNew ? 8 : undefined}
          maxLength={128}
          required
          aria-describedby={isNew ? 'auth-password-hint' : undefined}
        />
        <button className="auth-eye" type="button" onClick={() => setVisible(!visible)} aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`} aria-pressed={visible}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            {visible && <path d="m3 3 18 18" />}
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function AuthPage({ mode, session, loading, callback, initialError, navigate }) {
  const [pending] = useState(() => {
    const saved = readPendingAccess()
    return saved?.mode === mode ? saved : null
  })
  const [step, setStep] = useState(pending?.step || 1)
  const [email, setEmail] = useState(pending?.email || '')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [verifiedUserId, setVerifiedUserId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [initialErrorDismissed, setInitialErrorDismissed] = useState(false)
  const [notice, setNotice] = useState('')
  const [resendAt, setResendAt] = useState(pending?.resendAt || 0)
  const [now, setNow] = useState(Date.now)
  const [completed, setCompleted] = useState(false)
  const inFlight = useRef(false)
  const titleRef = useRef(null)
  const mounted = useRef(true)
  const isLogin = mode === 'entrar'
  const isRecovery = mode === 'recuperar-senha'
  const cleanEmail = email.trim().toLowerCase()
  const verified = Boolean(session && (
    session.user.id === verifiedUserId
    || (pending?.step === 3 && pending.email === session.user.email)
    || (callback && !initialError)
  ))
  const currentStep = !isLogin && verified ? 3 : step === 3 ? 1 : step
  const success = Boolean(session && (completed || isLogin))
  const cooldown = Math.max(0, Math.ceil((resendAt - now) / 1000))
  const visibleError = error || (!initialErrorDismissed && initialError ? getAuthErrorMessage(initialError) : '')
  const title = isLogin ? 'Bem-vindo (a) de volta!' : isRecovery ? 'Recupere seu acesso' : 'Primeiro acesso'

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    if (!resendAt) return undefined
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [resendAt])

  useEffect(() => {
    document.title = success ? 'Minha conta | Studio Keli Dalpian' : `${title} | Studio Keli Dalpian`
    titleRef.current?.focus({ preventScroll: true })
    return () => { document.title = 'Studio Keli Dalpian' }
  }, [title, currentStep, success])

  const run = async (action) => {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setError('')
    setInitialErrorDismissed(true)
    setNotice('')
    try {
      await action()
    } catch (failure) {
      if (mounted.current) setError(getAuthErrorMessage(failure))
    } finally {
      inFlight.current = false
      if (mounted.current) setBusy(false)
    }
  }

  const requestConfirmationLink = () => run(async () => {
    if (cooldown > 0) return
    const redirectTo = getAuthRedirectUrl(mode)
    const { error: requestError } = isRecovery
      ? await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo })
      : await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: { shouldCreateUser: true, emailRedirectTo: redirectTo },
      })
    if (requestError) {
      if (requestError.status === 429 || requestError.code === 'over_email_send_rate_limit') {
        const nextResendAt = Date.now() + 60000
        savePendingAccess({ mode, email: cleanEmail, step: 1, resendAt: nextResendAt })
        setResendAt(nextResendAt)
        setNow(Date.now())
        setError(getAuthErrorMessage(requestError))
        return
      }
      throw requestError
    }
    if (!mounted.current) return
    const nextResendAt = Date.now() + 60000
    savePendingAccess({ mode, email: cleanEmail, step: 2, resendAt: nextResendAt })
    setResendAt(nextResendAt)
    setNow(Date.now())
    setStep(2)
    setNotice('Confira sua caixa de entrada e a pasta de spam. Clique no link enviado para continuar.')
  })

  const checkLinkConfirmation = () => run(async () => {
    const { data, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    if (!data.session?.user) {
      setError('Abra o link recebido por e-mail para confirmar seu acesso antes de continuar.')
      return
    }
    savePendingAccess({ mode, email: cleanEmail, step: 3 })
    setVerifiedUserId(data.session.user.id)
    setStep(3)
  })

  const submit = (event) => {
    event.preventDefault()
    if (isLogin) {
      run(async () => {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password })
        if (loginError) throw loginError
        if (!data.session) throw new Error('Missing session')
        savePendingAccess(null)
        setPassword('')
        setCompleted(true)
      })
    } else if (currentStep === 1) {
      requestConfirmationLink()
    } else if (currentStep === 2) {
      checkLinkConfirmation()
    } else {
      if (password !== confirmation) {
        setError('As senhas não coincidem. Digite a mesma senha nos dois campos.')
        return
      }
      run(async () => {
        if (!verified) throw { code: 'session_not_found' }
        const { error: passwordError } = await supabase.auth.updateUser({ password })
        if (passwordError) throw passwordError
        savePendingAccess(null)
        if (!mounted.current) return
        setPassword('')
        setConfirmation('')
        navigate('minha-conta')
      })
    }
  }

  const signOut = () => run(async () => {
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
    if (signOutError) throw signOutError
    savePendingAccess(null)
    setCompleted(false)
    setPassword('')
    navigate('entrar')
  })

  if (success) {
    return (
      <main className="auth-success">
        <img className="auth-success__ribbon" src={ribbon} alt="" aria-hidden="true" />
        <div className="auth-success__content">
          <AuthBrand className="auth-success__brand" />
          <h1 ref={titleRef} tabIndex={-1}>Sistema Studio Keli Dalpian</h1>
          <p role="status">{completed ? (isRecovery ? 'Senha atualizada com sucesso!' : 'Tudo pronto. Que bom ter você aqui!') : 'Que bom ter você aqui!'}</p>
          <span className="auth-success__email">{session.user.email}</span>
          <button className="auth-submit" type="button" onClick={() => navigate('inicio')}>Voltar ao Studio</button>
          <button className="auth-text-button" type="button" disabled={busy} onClick={signOut}>{busy ? 'Saindo…' : 'Sair da conta'}</button>
          {visibleError && <p className="auth-message auth-message--error" role="alert">{visibleError}</p>}
        </div>
      </main>
    )
  }

  return (
    <main className="auth-page">
      <aside className="auth-art" aria-label="Studio Keli Dalpian">
        <button className="auth-back" type="button" onClick={() => navigate('inicio')}>
          <span aria-hidden="true">←</span> Voltar ao Studio
        </button>
        <AuthBrand className="auth-art__brand" />
        <nav className="auth-tabs" aria-label="Acesso à sua conta">
          <button type="button" className={isLogin || isRecovery ? 'is-active' : ''} aria-current={isLogin || isRecovery ? 'page' : undefined} disabled={busy} onClick={() => navigate('entrar')}>Entrar</button>
          <button type="button" className={!isLogin && !isRecovery ? 'is-active' : ''} aria-current={!isLogin && !isRecovery ? 'page' : undefined} disabled={busy} onClick={() => navigate('primeiro-acesso')}>Primeiro<br />acesso</button>
        </nav>
      </aside>

      <section className="auth-panel" aria-labelledby="auth-title" aria-busy={busy || loading}>
        <div className="auth-panel__inner">
          <header className="auth-heading">
            <h1 id="auth-title" ref={titleRef} tabIndex={-1}>{title}</h1>
            <p>{isLogin ? <>Entre para continuar sua jornada no<br />Studio Keli Dalpian.</> : isRecovery ? <>Vamos ajudar você a voltar.<br />Confirme seu e-mail e crie uma nova senha.</> : <>Ative seu acesso para acompanhar as<br />funcionalidades da plataforma!</>}</p>
          </header>

          {!isLogin && (
            <ol className="auth-progress" aria-label="Etapas do acesso">
              {['E-mail', 'Confirmação', 'Senha'].map((label, index) => (
                <li key={label} className={currentStep >= index + 1 ? 'is-complete' : ''} aria-current={currentStep === index + 1 ? 'step' : undefined}>
                  <span aria-hidden="true">{index + 1}</span><span className="auth-sr-only">{label}</span>
                </li>
              ))}
            </ol>
          )}

          <form className="auth-form" onSubmit={submit}>
            <fieldset disabled={busy || loading}>
              {isLogin ? (
                <>
                  <div className="auth-field">
                    <label htmlFor="auth-email">E-mail</label>
                    <input id="auth-email" name="email" type="email" autoComplete="email" placeholder="Digite seu e-mail aqui" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} required />
                  </div>
                  <PasswordField id="auth-password" label="Senha" value={password} onChange={setPassword} />
                  <button className="auth-text-button auth-forgot" type="button" onClick={() => navigate('recuperar-senha')}>Esqueci minha senha</button>
                </>
              ) : currentStep === 1 ? (
                <>
                  <div className="auth-step-heading">
                    <h2>1. {isRecovery ? 'Informe seu e-mail' : 'Valide seu e-mail'}</h2>
                    <p>{isRecovery ? 'Digite o e-mail da sua conta para receber as instruções de recuperação.' : 'Digite o e-mail cadastrado pela administração do Studio.'}</p>
                  </div>
                  <div className="auth-field">
                    <label className="auth-sr-only" htmlFor="auth-email">E-mail</label>
                    <input id="auth-email" name="email" type="email" autoComplete="email" placeholder="Digite seu e-mail aqui" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} required />
                  </div>
                </>
              ) : currentStep === 2 ? (
                <>
                  <div className="auth-step-heading">
                    <h2>2. Verifique seu e-mail</h2>
                    <p>Enviamos um link de confirmação para <strong>{cleanEmail}</strong>. Abra o e-mail e clique no link para continuar.</p>
                  </div>
                  <p className="auth-hint">Após abrir o link, você voltará para esta tela e poderá criar sua senha.</p>
                </>
              ) : (
                <>
                  <div className="auth-step-heading">
                    <h2>3. {isRecovery ? 'Crie uma nova senha' : 'Crie sua senha'}</h2>
                    <p>Agora você só precisa criar uma senha para acessar sua conta no Studio.</p>
                  </div>
                  <PasswordField id="auth-new-password" label="Senha" value={password} onChange={setPassword} isNew />
                  <p className="auth-hint" id="auth-password-hint">Use pelo menos 8 caracteres. Combine letras, números e símbolos.</p>
                  <PasswordField id="auth-confirm-password" label="Confirmar senha" value={confirmation} onChange={setConfirmation} isNew />
                </>
              )}

              {visibleError && <p className="auth-message auth-message--error" role="alert">{visibleError}</p>}
              {notice && <p className="auth-message" role="status">{notice}</p>}
              {loading && <p className="auth-message" role="status">Verificando seu acesso…</p>}

              <button className="auth-submit" type="submit" disabled={busy || loading || (currentStep === 1 && cooldown > 0)}>
                {busy ? 'Aguarde…' : currentStep === 1 && cooldown > 0 ? `Aguarde ${cooldown}s` : isLogin || currentStep === 3 ? (isRecovery ? 'Salvar senha' : 'Entrar') : currentStep === 2 ? 'Já confirmei o e-mail' : 'Enviar link'}
              </button>

              {!isLogin && currentStep === 1 && cooldown > 0 && (
                <button className="auth-text-button auth-link-received" type="button" onClick={() => setStep(2)}>
                  Já recebi o link
                </button>
              )}

              {!isLogin && currentStep === 2 && (
                <div className="auth-link-actions">
                  <button className="auth-text-button" type="button" disabled={busy || cooldown > 0} onClick={requestConfirmationLink}>
                    {cooldown > 0 ? `Reenviar link em ${cooldown}s` : 'Reenviar link'}
                  </button>
                  <button className="auth-text-button" type="button" onClick={() => { savePendingAccess(null); setStep(1); setCode(''); setError(''); setNotice('') }}>Alterar e-mail</button>
                </div>
              )}
              {isRecovery && <button className="auth-text-button auth-return" type="button" onClick={() => navigate('entrar')}>Voltar para entrar</button>}
            </fieldset>
          </form>
        </div>
      </section>
    </main>
  )
}
