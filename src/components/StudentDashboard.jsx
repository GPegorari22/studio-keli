import { useCallback, useEffect, useId, useState } from 'react'
import seuMovimento from '../assets/seu-movimento.png'
import studentRibbon from '../assets/student-ribbon.png'
import profileIcon from '../assets/student-icon-profile.png'
import homeIcon from '../assets/student-icon-home.png'
import calendarIcon from '../assets/student-icon-calendar.png'
import danceIcon from '../assets/student-icon-dance.png'
import chartIcon from '../assets/student-icon-chart.png'
import bagIcon from '../assets/student-icon-bag.png'
import logoutIcon from '../assets/student-icon-logout.png'
import bellIcon from '../assets/student-icon-bell.png'
import agendaCalendarIcon from '../assets/icone-calendario-rosa.png'
import agendaHomeIcon from '../assets/icone-home-branco.png'
import { supabase } from '../lib/supabase.js'
import './StudentDashboard.css'

const ptDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
const shortDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })

const defaultDashboard = {
  aluno: { nome: '' },
  proxima_aula: null,
  frequencia: { presencas: 0, faltas: 0, percentual: null },
  criterios: [],
  aulas: [],
}
const icons = { profile: profileIcon, home: homeIcon, calendar: calendarIcon, dance: danceIcon, chart: chartIcon, bag: bagIcon, logout: logoutIcon, bell: bellIcon }
const criterionDescriptions = {
  'Técnica': 'Precisão e controle em cada movimento.',
  'Flexibilidade': 'Amplitude e leveza para ir mais longe.',
  'Expressão': 'Sua personalidade ganha movimento.',
  'Disciplina': 'Constância e dedicação a cada aula.',
}

const toDate = (value) => value ? new Date(`${value}T12:00:00`) : null
const firstName = (name) => name?.trim().split(/\s+/)[0] || ''
const time = (value) => value?.slice(0, 5) || '--:--'
const normaliseScore = (value) => {
  if (value == null || value === '') return null
  const score = Number(value)
  if (!Number.isFinite(score)) return null
  return Math.max(0, Math.min(100, score <= 10 ? score * 10 : score))
}

function Icon({ name, source }) {
  return <img className={`student-icon student-icon--${name}`} src={source || icons[name]} alt="" aria-hidden="true" />
}

function AttendanceChart({ attendance }) {
  const patternId = useId()
  const hasAttendance = attendance?.percentual != null
  const percent = Math.max(0, Math.min(100, Number(attendance?.percentual) || 0))
  const arc = 'M 24 108 A 76 76 0 0 1 176 108'

  return (
    <div className="student-attendance-chart" role="img" aria-label={hasAttendance ? `${percent}% de frequência` : 'Sem registros de frequência'}>
      <svg viewBox="0 0 200 138" aria-hidden="true">
        <defs>
          <pattern id={patternId} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <line x1="0" y1="0" x2="0" y2="5" stroke="#a9acae" strokeWidth="2.5" />
          </pattern>
        </defs>
        <path className="student-gauge__arc" d={arc} stroke={`url(#${patternId})`} />
        {hasAttendance && <>
          <path className="student-gauge__arc student-gauge__absence" d={arc} pathLength="100" strokeDasharray={`${Math.min(100, percent + 18)} 100`} />
          {percent > 0 && <>
            <path className="student-gauge__arc student-gauge__presence-border" d={arc} pathLength="100" strokeDasharray={`${percent} 100`} />
            <path className="student-gauge__arc student-gauge__presence" d={arc} pathLength="100" strokeDasharray={`${percent} 100`} />
          </>}
        </>}
        <text className="student-gauge__number" x="100" y="107" textAnchor="middle">{hasAttendance ? `${percent}%` : '—'}</text>
        <text className="student-gauge__label" x="100" y="125" textAnchor="middle">FREQUÊNCIA</text>
      </svg>
    </div>
  )
}

function ProgressChart({ criteria }) {
  const values = (criteria || []).slice(0, 4).map((criterion, index) => ({
    ...criterion,
    value: normaliseScore(criterion.nota),
    color: index % 2 ? '#203b61' : '#dd6985',
  }))

  if (!values.length) return <p className="student-empty-chart">Sua evolução aparecerá aqui após a primeira avaliação.</p>

  return (
    <div className="student-progress-chart">
      <svg className="student-progress-chart__rings" viewBox="0 0 200 200" aria-hidden="true">
        {values.map((criterion, index) => {
          const radius = 88 - index * 20
          const rotation = [28, 70, 88, -10][index]
          const sweep = (criterion.value ?? 0) / 100 * 300
          const angle = (rotation + sweep) * Math.PI / 180
          return (
            <g key={criterion.nome || index}>
              <circle className="student-progress-chart__track" cx="100" cy="100" r={radius} />
              {criterion.value > 0 && <>
                <circle className="student-progress-chart__value" cx="100" cy="100" r={radius} pathLength="360" stroke={criterion.color} strokeDasharray={`${sweep} 360`} transform={`rotate(${rotation} 100 100)`} />
                <text className="student-progress-chart__marker" x={100 + radius * Math.cos(angle)} y={100 + radius * Math.sin(angle)} textAnchor="middle" dominantBaseline="central">{index + 1}</text>
              </>}
            </g>
          )
        })}
      </svg>
      <div className="student-progress-chart__details">
        <ul className="student-progress-chart__legend">
          {values.map((criterion, index) => (
            <li key={criterion.nome || index} style={{ '--criterion-color': criterion.color }}>
              <i aria-hidden="true" />
              <div>
                <span>{criterion.value == null ? '—' : `${Math.round(criterion.value)}%`} <strong>{criterion.nome}</strong></span>
                <p>{criterionDescriptions[criterion.nome] || 'Seu desenvolvimento nas aulas de dança.'}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="student-progress-chart__scale" aria-hidden="true">
          {values.map((criterion, index) => <span key={criterion.nome || index} style={{ '--criterion-color': criterion.color }}><i />{criterion.value == null ? '—' : `${Math.round(criterion.value)}%`}</span>)}
        </div>
      </div>
    </div>
  )
}

function Evolution({ criteria, studentName }) {
  return (
    <section className="student-evolution-page" id="evolucao" aria-label="Sua evolução" tabIndex={-1}>
      <header className="student-evolution-page__header">
        <div>
          <h2>Minha Evolução</h2>
          <p>Acompanhe seu desenvolvimento e descubra até onde seus movimentos podem chegar.</p>
        </div>
        <div className="student-evolution-page__status">
          <span>Última avaliação: 05/09/2026</span>
          <span>Próxima avaliação: 05/10/2026</span>
        </div>
      </header>
      <div className="student-evolution-page__overview">
        <section aria-labelledby="evolution-chart-title">
          <h3 id="evolution-chart-title">Keli Dance Evolution</h3>
          <ProgressChart criteria={criteria} />
        </section>
        <section className="student-evolution-page__trajectory" aria-labelledby="trajectory-title">
          <h3 id="trajectory-title">Minha trajetória</h3>
          <svg viewBox="0 0 520 170" role="img" aria-label="Evolução crescente ao longo dos meses">
            <path d="M34 135H492M34 100H492M34 65H492M34 30H492" />
            <polyline points="34,126 120,105 205,84 295,66 382,48 475,30" />
            {[[34, 126], [120, 105], [205, 84], [295, 66], [382, 48], [475, 30]].map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5" />)}
            <text x="34" y="158">ABR</text><text x="120" y="158">MAI</text><text x="205" y="158">JUN</text><text x="295" y="158">JUL</text><text x="382" y="158">AGO</text><text x="475" y="158">SET</text>
          </svg>
        </section>
      </div>
      <section className="student-evolution-page__feedback" aria-labelledby="feedback-title">
        <div className="student-evolution-page__feedback-avatar" aria-hidden="true">{studentName.slice(0, 1)}</div>
        <div><h3 id="feedback-title">Feedback</h3><p>Você apresentou uma evolução muito bonita neste período. Sua técnica está mais segura e sua presença em sala demonstra cada vez mais confiança. Continue trabalhando sua flexibilidade e atenção aos detalhes dos movimentos.</p></div>
      </section>
    </section>
  )
}

function Calendar({ scheduledClasses, today }) {
  const [displayedMonth, setDisplayedMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const year = displayedMonth.getFullYear()
  const monthIndex = displayedMonth.getMonth()
  const firstWeekday = displayedMonth.getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const activeDays = new Set((scheduledClasses || []).map((lesson) => lesson.data))
  const days = Array.from({ length: Math.ceil((firstWeekday + daysInMonth) / 7) * 7 }, (_, index) => new Date(year, monthIndex, index - firstWeekday + 1))
  const month = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(displayedMonth).replace(' de ', ' ')
  const changeMonth = (offset) => setDisplayedMonth(new Date(year, monthIndex + offset, 1))

  return (
    <section className="student-calendar" id="calendario-resumo" aria-label={`Calendário de ${month}`} tabIndex={-1}>
      <header>
        <button type="button" aria-label="Mês anterior" onClick={() => changeMonth(-1)}>‹</button>
        <span aria-live="polite">{month}</span>
        <button type="button" aria-label="Próximo mês" onClick={() => changeMonth(1)}>›</button>
      </header>
      <div className="student-calendar__week" aria-hidden="true">
        {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="student-calendar__days">
        {days.map((date) => {
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
          const isToday = date.toDateString() === today.toDateString()
          const hasClass = activeDays.has(key)
          return <span key={key} className={[date.getMonth() !== monthIndex && 'is-outside', isToday && 'is-today', hasClass && 'has-class'].filter(Boolean).join(' ')} aria-current={isToday ? 'date' : undefined} aria-label={`${ptDate.format(date)}${hasClass ? ', aula agendada' : ''}`}>{date.getDate()}</span>
        })}
      </div>
    </section>
  )
}

function Agenda({ scheduledClasses, today }) {
  const [displayedMonth, setDisplayedMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const year = displayedMonth.getFullYear()
  const monthIndex = displayedMonth.getMonth()
  const firstWeekday = displayedMonth.getDay()
  const month = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(displayedMonth).replace(' de ', ' ')
  const activeDays = new Set((scheduledClasses || []).map((lesson) => lesson.data))
  const days = Array.from({ length: 42 }, (_, index) => new Date(year, monthIndex, index - firstWeekday + 1))
  const changeMonth = (offset) => setDisplayedMonth(new Date(year, monthIndex + offset, 1))

  return (
    <section className="student-agenda" id="calendario" aria-label={`Calendário de ${month}`} tabIndex={-1}>
      <header className="student-agenda__header">
        <div>
          <h2>Minha Agenda</h2>
          <div className="student-agenda__month-nav">
            <button type="button" aria-label="Mês anterior" onClick={() => changeMonth(-1)}>‹</button>
            <strong>{month}</strong>
            <button type="button" aria-label="Próximo mês" onClick={() => changeMonth(1)}>›</button>
          </div>
        </div>
        <Icon name="bell" />
      </header>
      <div className="student-agenda__toolbar" aria-label="Filtros da agenda">
        {['Hoje', 'Ver mês', 'Junho', 'Todos', 'Aulas', 'Ensaios', 'Espetáculos', 'etc'].map((filter) => <button className={filter === 'Todos' ? 'is-selected' : undefined} key={filter} type="button">{filter}</button>)}
        <button type="button" className="student-agenda__clear">Limpar anotações</button>
      </div>
      <div className="student-agenda__body">
        <div className="student-agenda__calendar">
          <div className="student-agenda__week" aria-hidden="true">{['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="student-agenda__days">
            {days.map((date) => {
              const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
              const isToday = date.toDateString() === today.toDateString()
              const hasClass = activeDays.has(key)
              return <button type="button" key={key} className={[date.getMonth() !== monthIndex && 'is-outside', isToday && 'is-today', hasClass && 'has-class'].filter(Boolean).join(' ')} aria-label={`${ptDate.format(date)}${hasClass ? ', aula agendada' : ''}`}><span>{date.getDate()}</span></button>
            })}
          </div>
        </div>
        <aside className="student-agenda__notes">
          <div><strong>Selecione uma data</strong><p>Os eventos desse dia aparecem aqui.</p></div>
          <div><strong>Anotação do dia</strong><label><input type="text" placeholder="Ex: revisar Modalidade" /><button type="button">Salvar</button></label></div>
        </aside>
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
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [activeView, setActiveView] = useState('home')
  const today = new Date()

  const loadDashboard = useCallback(async () => {
    try {
      const { data, error: requestError } = await supabase.rpc('meu_painel_aluno')
      setError('')
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
  }, [])

  // Updates state only after the Supabase request resolves for the current session.
  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => { loadDashboard() }, [loadDashboard, session?.user?.id])

  const nextLesson = dashboard?.proxima_aula || defaultDashboard.proxima_aula
  const lessons = dashboard?.aulas || defaultDashboard.aulas
  const attendance = dashboard?.frequencia || defaultDashboard.frequencia
  const criteria = dashboard?.criterios || defaultDashboard.criterios
  const dateLabel = ptDate.format(today)
  const studentName = firstName(dashboard?.aluno?.nome) || 'Aluno'
  const nextLessonIsToday = nextLesson && toDate(nextLesson.data)?.toDateString() === today.toDateString()

  const confirmAttendance = async () => {
    if (!nextLesson?.id_aula || !nextLessonIsToday) return
    setConfirming(true)
    setNotice('')
    try {
      const { error: confirmError } = await supabase.rpc('confirmar_presenca_da_proxima_aula', { id_da_aula: nextLesson.id_aula })
      if (confirmError) throw confirmError
      setNotice('Presença confirmada. Bons movimentos!')
      await loadDashboard()
    } catch {
      setNotice('Não foi possível confirmar sua presença agora. Tente novamente mais perto do horário da aula.')
    } finally {
      setConfirming(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    navigate('inicio')
  }

  // Dashboard links switch views inside the fixed student shell.
  const scrollToSection = (event, id) => {
    event.preventDefault()
    setActiveView(id === 'calendario' ? 'agenda' : id === 'evolucao' ? 'evolution' : 'home')
  }
  const lessonDate = toDate(nextLesson?.data)
  const lessonTitle = nextLesson?.modalidade?.includes(':') ? nextLesson.modalidade : `${lessonDate ? new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(lessonDate).toLocaleUpperCase('pt-BR') + ': ' : ''}${nextLesson?.modalidade || 'Aula de dança'}`

  return (
    <main className="student-page">
      <aside className="student-sidebar" aria-label="Navegação do perfil">
        <a className="student-sidebar__profile" href="#visao-geral" onClick={(event) => scrollToSection(event, 'visao-geral')} aria-label="Perfil do aluno" title="Perfil do aluno"><Icon name="profile" /></a>
        <nav aria-label="Área do aluno">
          {[
            ['home', 'visao-geral', 'Início'],
            ['calendar', 'calendario', 'Calendário'],
            ['dance', 'proxima-aula', 'Aulas'],
            ['chart', 'evolucao', 'Evolução'],
            ['bag', 'loja', 'Loja'],
          ].map(([icon, id, label]) => {
            const targetView = icon === 'calendar' ? 'agenda' : icon === 'chart' ? 'evolution' : 'home'
            const isActive = (icon === 'home' && activeView === 'home') || (icon === 'calendar' && activeView === 'agenda') || (icon === 'chart' && activeView === 'evolution')
            return <a key={id} className={isActive ? 'is-active' : undefined} href={`#${id}`} onClick={(event) => { event.preventDefault(); setActiveView(targetView) }} aria-current={isActive ? 'page' : undefined} title={label}><Icon name={icon} source={activeView === 'agenda' && icon === 'home' ? agendaHomeIcon : activeView === 'agenda' && icon === 'calendar' ? agendaCalendarIcon : undefined} /><span>{label}</span></a>
          })}
        </nav>
        <button className="student-sidebar__logout" type="button" onClick={signOut} title="Sair"><Icon name="logout" /><span>Sair</span></button>
      </aside>

      <section className="student-content" id="visao-geral" aria-label="Perfil do aluno" tabIndex={-1}>
        <img className="student-content__ribbon" src={studentRibbon} alt="" aria-hidden="true" />
        <div className="student-workspace">
          <header className="student-topbar">
            <h1>Olá, {studentName}!</h1>
            <div className="student-topbar__right">
              <span className="student-topbar__date"><Icon name="calendar" />{dateLabel}</span>
              <div className="student-notifications">
                <button type="button" aria-label="Notificações" aria-expanded={notificationsOpen} aria-controls="student-notifications" onClick={() => setNotificationsOpen((open) => !open)}><Icon name="bell" /></button>
                {notificationsOpen && <div className="student-notifications__panel" id="student-notifications" role="status">{nextLesson ? `Sua próxima aula será em ${shortDate.format(lessonDate)}, às ${time(nextLesson.horario_inicio)}.` : 'Nenhuma aula agendada no momento.'}</div>}
              </div>
            </div>
          </header>

          {loading && <div className="student-state" role="status">Carregando seu perfil…</div>}
          {!loading && error && <div className="student-state student-state--error" role="alert"><p>{error}</p><button type="button" onClick={() => { setLoading(true); loadDashboard() }}>Tentar novamente</button></div>}

          {activeView === 'home' ? <>
            <div className="student-hero-layout">
              <section className="student-hero" aria-label="Sua jornada no Studio">
                <img src={seuMovimento} alt="Seu movimento, sua jornada. Acompanhe suas aulas, evolução e tudo o que acontece no Studio Keli Dalpian." />
              </section>
              <Calendar scheduledClasses={lessons} today={today} />
            </div>

            <div className="student-summary">
              <section className="student-next-card" id="proxima-aula" aria-labelledby="next-lesson-title" tabIndex={-1}>
                <h2 id="next-lesson-title">Próxima aula</h2>
                {nextLesson ? <>
                  <div className="student-next-card__details">
                    <strong>{lessonTitle}</strong>
                    <p><time dateTime={nextLesson.data} title={shortDate.format(lessonDate)}>{time(nextLesson.horario_inicio)} – {time(nextLesson.horario_fim)}</time></p>
                    <span>{nextLesson.turma}</span>
                  </div>
                  <button type="button" onClick={confirmAttendance} disabled={!nextLesson.id_aula || !nextLessonIsToday || confirming} title={!nextLessonIsToday ? 'Presença disponível no dia da aula' : undefined}>{confirming ? 'Confirmando…' : 'Marcar presença'}</button>
                </> : <p className="student-empty-chart">Você ainda não tem uma próxima aula agendada.</p>}
                {notice && <p className="student-notice" role="status">{notice}</p>}
              </section>

              <section className="student-attendance-card" aria-label="Frequência">
                <AttendanceChart attendance={attendance} />
                <div className="student-attendance-card__legend">
                  <span aria-label={`${attendance?.presencas || 0} presenças`}><i aria-hidden="true" />Presença</span>
                  <span aria-label={`${attendance?.faltas || 0} faltas`}><i className="is-navy" aria-hidden="true" />Faltas</span>
                </div>
              </section>
            </div>
            {!criteria.length && <p className="student-empty-chart">Sua evolução aparecerá aqui após a primeira avaliação.</p>}

          </> : activeView === 'agenda' ? <Agenda scheduledClasses={lessons} today={today} /> : <Evolution criteria={criteria} studentName={studentName} />}
        </div>
        <footer className="student-footer">Studio Keli Dalpian <span>|</span> © {today.getFullYear()}</footer>
      </section>
    </main>
  )
}
