import { useCallback, useEffect, useMemo, useState } from 'react'
import mulherSeuMovimento from '../assets/mulher-seuMovimento.png'
import cardImagemAluno from '../assets/card-imagemAluno.png'
import logoBranca from '../assets/logo-branca.png'
import { supabase } from '../lib/supabase.js'
import './StudentDashboard.css'

const ptDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
const shortDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })

const defaultDashboard = {
  aluno: { nome: '' },
  proxima_aula: {
    modalidade: 'TERÇA - FEIRA: Ballet clássico',
    data: '2026-09-29',
    horario_inicio: '08:00',
    horario_fim: '09:00',
    turma: 'Sala 02',
  },
  frequencia: { presencas: 72, faltas: 28, percentual: 72 },
  criterios: [
    { nome: 'Técnica', nota: 85 },
    { nome: 'Flexibilidade', nota: 72 },
    { nome: 'Expressão', nota: 90 },
    { nome: 'Disciplina', nota: 68 },
  ],
  aulas: [
    { data: '2026-09-29', horario_inicio: '08:00', horario_fim: '09:00', turma: 'Sala 02' },
    { data: '2026-09-30', horario_inicio: '18:30', horario_fim: '19:30', turma: 'Sala 01' },
  ],
}

const toDate = (value) => value ? new Date(`${value}T12:00:00`) : null
const firstName = (name) => name?.trim().split(/\s+/)[0] || ''
const time = (value) => value?.slice(0, 5) || '--:--'
const normaliseScore = (value) => {
  const score = Number(value)
  if (!Number.isFinite(score)) return null
  return Math.max(0, Math.min(100, score <= 10 ? score * 10 : score))
}

function Icon({ name }) {
  const paths = {
    home: <path d="M3.5 10.6 12 3l8.5 7.6v9.1a1.3 1.3 0 0 1-1.3 1.3H4.8a1.3 1.3 0 0 1-1.3-1.3v-9.1Zm5 10.4v-6h7v6" />,
    calendar: <><rect x="4" y="5.5" width="16" height="15" rx="2" /><path d="M8 3v5m8-5v5M4 10h16m-12 4h.01m4 0h.01m4 0h.01m-8 3.5h.01m4 0h.01" /></>,
    dance: <><circle cx="12" cy="4.2" r="2" /><path d="m10 8 3 3.3 3.8-1.1M13 11.3l-1.7 4.5-3.8 3.7m5.5-8.2 2.3 5 3.2 2.1" /></>,
    chart: <><path d="m4 19 5.1-6 3.6 3.3L20 7" /><path d="M15 7h5v5" /></>,
    bag: <><path d="M5 8h14l-1 12H6L5 8Zm4 0V6a3 3 0 0 1 6 0v2" /></>,
    logout: <><path d="M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10" /><path d="m14 8 4 4-4 4m4-4H8" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-2.5 7-2.5 9h17c0-2-2.5-2-2.5-9ZM10 21h4" /></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

function AttendanceChart({ attendance }) {
  const percent = attendance?.percentual ?? 72
  const radius = 46
  const circumference = 2 * Math.PI * radius
  return (
    <div className="student-attendance-chart" aria-label={`${percent}% de frequência`}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="student-ring__track" cx="60" cy="60" r={radius} />
        <circle className="student-ring__value" cx="60" cy="60" r={radius} style={{ strokeDasharray: circumference, strokeDashoffset: circumference * (1 - percent / 100) }} />
      </svg>
      <strong>{percent}%</strong>
      <span>frequência</span>
    </div>
  )
}

function ProgressChart({ criteria }) {
  const values = (criteria || []).slice(0, 4).map((criterion, index) => ({
    ...criterion,
    value: normaliseScore(criterion.nota),
    colorClass: index % 2 ? 'student-ring__value--navy' : '',
  }))

  if (!values.length) {
    return <p className="student-empty-chart">Sua evolução aparecerá aqui após a primeira avaliação.</p>
  }

  return (
    <div className="student-progress-chart">
      <div className="student-progress-chart__rings" aria-hidden="true">
        {values.map((criterion, index) => {
          const radius = 50 - index * 11
          const circumference = 2 * Math.PI * radius
          return (
            <svg viewBox="0 0 120 120" key={criterion.nome || index}>
              <circle className="student-ring__track" cx="60" cy="60" r={radius} />
              <circle className={`student-ring__value ${criterion.colorClass}`.trim()} cx="60" cy="60" r={radius} style={{ strokeDasharray: circumference, strokeDashoffset: circumference * (1 - ((criterion.value ?? 0) / 100)) }} />
            </svg>
          )
        })}
      </div>
      <div className="student-progress-chart__legend">
        {values.map((criterion, index) => (
          <div key={criterion.nome || index}>
            <i className={index % 2 ? 'is-navy' : ''} />
            <span>
              {criterion.value == null ? '—' : `${Math.round(criterion.value)}%`}
              <small>{criterion.nome}</small>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Calendar({ scheduledClasses }) {
  const today = new Date(2026, 8, 23)
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const firstWeekday = (start.getDay() + 6) % 7
  const activeDays = new Set((scheduledClasses || []).filter((lesson) => {
    const date = toDate(lesson.data)
    return date && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()
  }).map((lesson) => toDate(lesson.data).getDate()))
  const days = Array.from({ length: firstWeekday + end.getDate() }, (_, index) => index < firstWeekday ? null : index - firstWeekday + 1)
  const month = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(today)

  return (
    <section className="student-calendar" aria-label={`Calendário de ${month}`}>
      <header>
        <span>{month}</span>
        <button type="button" aria-label="Abrir calendário completo">›</button>
      </header>
      <div className="student-calendar__week">
        {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="student-calendar__days">
        {days.map((day, index) => <span key={`${day}-${index}`} className={`${day === today.getDate() ? 'is-today' : ''} ${activeDays.has(day) ? 'has-class' : ''}`}>{day}</span>)}
      </div>
    </section>
  )
}

export default function StudentDashboard({ session, navigate }) {
  const [dashboard, setDashboard] = useState(() => ({
    ...defaultDashboard,
    aluno: { ...defaultDashboard.aluno, nome: '' },
  }))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [notice, setNotice] = useState('')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error: requestError } = await supabase.rpc('meu_painel_aluno')
      const fallbackDashboard = {
        ...defaultDashboard,
        aluno: { ...defaultDashboard.aluno, nome: '' },
      }

      if (requestError) {
        setDashboard(fallbackDashboard)
        setError(requestError.message || 'Não foi possível carregar o perfil do aluno.')
      } else if (data?.erro) {
        setDashboard(fallbackDashboard)
        setError(data.erro)
      } else {
        setDashboard({
          ...defaultDashboard,
          ...data,
          aluno: {
            ...defaultDashboard.aluno,
            ...(data?.aluno || {}),
            nome: data?.aluno?.nome || '',
          },
        })
      }
    } catch {
      setDashboard({
        ...defaultDashboard,
        aluno: { ...defaultDashboard.aluno, nome: '' },
      })
      setError('Não foi possível carregar o perfil do aluno.')
    }
    setLoading(false)
  }, [session])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  const nextLesson = dashboard?.proxima_aula || defaultDashboard.proxima_aula
  const lessons = dashboard?.aulas || defaultDashboard.aulas
  const attendance = dashboard?.frequencia || defaultDashboard.frequencia
  const criteria = dashboard?.criterios || defaultDashboard.criterios
  const dateLabel = useMemo(() => ptDate.format(new Date(2026, 8, 23)), [])
  const studentName = dashboard?.aluno?.nome || 'Aluno'
  const nextLessonIsToday = nextLesson && toDate(nextLesson.data)?.toDateString() === new Date(2026, 8, 23).toDateString()

  const confirmAttendance = async () => {
    if (!nextLesson?.id_aula || !nextLessonIsToday) return
    setConfirming(true)
    setNotice('')
    const { error: confirmError } = await supabase.rpc('confirmar_presenca_da_proxima_aula', { id_da_aula: nextLesson.id_aula })
    if (confirmError) {
      setNotice('Não foi possível confirmar sua presença agora. Tente novamente mais perto do horário da aula.')
    } else {
      setNotice('Presença confirmada. Bons movimentos!')
      await loadDashboard()
    }
    setConfirming(false)
  }

  const signOut = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    navigate('inicio')
  }

  return (
    <main className="student-page">
      <aside className="student-sidebar" aria-label="Navegação do perfil">
        <button className="student-sidebar__profile" type="button" aria-label="Perfil do aluno">
          <span>{firstName(dashboard?.aluno?.nome).charAt(0)}</span>
        </button>

        <nav>
          <a className="is-active" href="#visao-geral" aria-current="page"><Icon name="home" /><span>Início</span></a>
          <a href="#calendario"><Icon name="calendar" /><span>Calendário</span></a>
          <a href="#proxima-aula"><Icon name="dance" /><span>Aulas</span></a>
          <a href="#evolucao"><Icon name="chart" /><span>Evolução</span></a>
          <a href="#loja"><Icon name="bag" /><span>Loja</span></a>
        </nav>

        <button className="student-sidebar__logout" type="button" onClick={signOut}><Icon name="logout" /><span>Sair</span></button>
      </aside>

      <section className="student-content" id="visao-geral">
        <header className="student-topbar">
          <div>
            <p>perfil do aluno</p>
            <h1>Olá, {studentName}!</h1>
          </div>
          <div className="student-topbar__right">
            <span className="student-topbar__date">{dateLabel}</span>
            <button type="button" aria-label="Notificações"><Icon name="bell" /></button>
          </div>
        </header>

        {loading && <div className="student-state" role="status">Carregando seu perfil…</div>}
        {!loading && error && (
          <div className="student-state student-state--error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={loadDashboard}>Tentar novamente</button>
          </div>
        )}

        <section className="student-hero">
          <div>
            <em>Seu movimento, sua jornada.</em>
            <p>Acompanhe suas aulas, evolução e tudo o que acontece no Studio Keli Dalpian.</p>
          </div>
          <img src={mulherSeuMovimento} alt="Bailarina em movimento" />
        </section>

        <div className="student-grid">
          <section className="student-card student-next-card" id="proxima-aula">
            <div className="student-card__eyebrow">Próxima aula</div>
            <strong>{nextLesson.modalidade}</strong>
            <p>{toDate(nextLesson.data) ? shortDate.format(toDate(nextLesson.data)) : 'Data a confirmar'} · {time(nextLesson.horario_inicio)} – {time(nextLesson.horario_fim)}</p>
            <span>{nextLesson.turma}</span>
            <button type="button" onClick={confirmAttendance} disabled={!nextLessonIsToday || confirming}>
              {confirming ? 'Confirmando…' : nextLessonIsToday ? 'Marcar presença' : 'Presença disponível no dia da aula'}
            </button>
            {notice && <p className="student-notice" role="status">{notice}</p>}
          </section>

          <section className="student-card student-attendance-card" aria-label="Frequência">
            <AttendanceChart attendance={attendance} />
            <div className="student-attendance-card__legend">
              <span><i></i>{attendance?.presencas || 0} presenças</span>
              <span><i className="is-navy"></i>{attendance?.faltas || 0} faltas</span>
            </div>
          </section>

          <Calendar scheduledClasses={lessons} />

          <section className="student-card student-evolution" id="evolucao">
            <div className="student-card__eyebrow">Sua evolução</div>
            <ProgressChart criteria={criteria} />
          </section>

          <section className="student-image-card" id="loja">
            <img src={cardImagemAluno} alt="Bailarina do Studio Keli Dalpian" />
            <div><img src={logoBranca} alt="Studio Keli Dalpian" /></div>
          </section>
        </div>
      </section>

      <footer className="student-footer">Studio Keli Dalpian <span>|</span> © 2026</footer>
    </main>
  )
}
