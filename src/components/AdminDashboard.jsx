import { useCallback, useEffect, useRef, useState } from 'react'
import welcomeBanner from '../assets/admin-welcome.png'
import featureBanner from '../assets/admin-features.png'
import profileIcon from '../assets/perfil-adm.png'
import homeIcon from '../assets/student-icon-home.png'
import danceIcon from '../assets/student-icon-dance.png'
import calendarIcon from '../assets/student-icon-calendar.png'
import chartIcon from '../assets/student-icon-chart.png'
import logoutIcon from '../assets/student-icon-logout.png'
import bellIcon from '../assets/student-icon-bell.png'
import peopleIcon from '../assets/pessoas.png'
import financeIcon from '../assets/financeiro.png'
import bagIcon from '../assets/student-icon-bag.png'
import statPeopleIcon from '../assets/pessoas.png'
import statDanceIcon from '../assets/icone-frequencia-rosa.png'
import statCalendarIcon from '../assets/icone-calendario-rosa.png'
import statChartIcon from '../assets/icone-evolucao-rosa.png'
import statBagIcon from '../assets/icone-loja-rosa.png'
import adminHomeIcon from '../assets/home-adm.png'
import adminEvolutionIcon from '../assets/evolucao-azul-adm.png'
import adminSettingsIcon from '../assets/configuracao-azul-adm.png'
import adminPeopleIcon from '../assets/pessoas-azul-adm.png'
import balletClassicoImage from '../assets/ballet-classico.png'
import jazzImage from '../assets/jazz.png'
import sapateadoImage from '../assets/sapateado.png'
import { supabase } from '../lib/supabase.js'
import './AdminDashboard.css'

const timezone = 'America/Sao_Paulo'
const imageIcons = { profile: profileIcon, home: homeIcon, dance: danceIcon, calendar: calendarIcon, chart: chartIcon, logout: logoutIcon, bell: bellIcon, people: peopleIcon, finance: financeIcon, bag: bagIcon }
const statIcons = { people: statPeopleIcon, dance: statDanceIcon, calendar: statCalendarIcon, chart: statChartIcon, bag: statBagIcon }
const navIcons = { home: adminHomeIcon, users: adminPeopleIcon, dance: danceIcon, calendar: calendarIcon, chart: adminEvolutionIcon, settings: adminSettingsIcon }
const navigation = [
  ['dashboard', 'Início', 'home'], ['alunos', 'Alunos', 'users'], ['matriculas', 'Matrículas', 'dance'],
  ['agenda', 'Agenda', 'calendar'], ['frequencia', 'Frequência', 'chart'], ['configuracoes', 'Configurações', 'settings'],
]
const moduleNames = { alunos: 'Alunos', professores: 'Professores', turmas: 'Turmas', agenda: 'Agenda de aulas', frequencia: 'Frequência dos alunos', financeiro: 'Financeiro', matriculas: 'Matrículas', pedidos: 'Pedidos da loja', produtos: 'Produtos', notificacoes: 'Notificações', busca: 'Resultados da busca' }
const columns = {
  alunos: [['nome', 'Aluno'], ['turma', 'Turma'], ['modalidade', 'Modalidade'], ['status', 'Cadastro'], ['alertas', 'Alertas']],
  professores: [['nome', 'Professor'], ['especialidade', 'Especialidade'], ['email', 'E-mail'], ['status', 'Status']],
  turmas: [['nome', 'Turma'], ['modalidade', 'Modalidade'], ['professora', 'Professor'], ['dia', 'Dia'], ['horario', 'Horário'], ['status', 'Status']],
  agenda: [['data', 'Data'], ['inicio', 'Horário'], ['nome', 'Turma'], ['professora', 'Professor'], ['status', 'Status']],
  frequencia: [['nome', 'Aluno'], ['turma', 'Turma'], ['frequencia', 'Presença'], ['aulas', 'Chamadas'], ['alertas', 'Alertas']],
  financeiro: [['nome', 'Aluno'], ['competencia', 'Competência'], ['data', 'Vencimento'], ['saldo', 'Em aberto'], ['status', 'Status']],
  matriculas: [['nome', 'Aluno'], ['turma', 'Turma'], ['data', 'Matrícula'], ['status', 'Status']],
  pedidos: [['id', 'Pedido'], ['nome', 'Cliente'], ['data', 'Data'], ['valor', 'Total'], ['status', 'Status']],
  produtos: [['nome', 'Produto'], ['categoria', 'Categoria'], ['valor', 'Preço'], ['estoque', 'Estoque'], ['status', 'Status']],
  busca: [['nome', 'Registro'], ['_modulo', 'Área'], ['data', 'Data'], ['status', 'Status']],
}
const fieldNames = { id: 'Identificador', nome: 'Nome', email: 'E-mail', telefone: 'Telefone', status: 'Status cadastrado', turma: 'Turma', modalidade: 'Modalidade', professora: 'Professor', data: 'Data', competencia: 'Competência', valor: 'Valor', saldo: 'Saldo em aberto', frequencia: 'Frequência', aulas: 'Chamadas completas', presencas: 'Presenças', estoque: 'Estoque', categoria: 'Categoria', inicio: 'Início', fim: 'Fim', horario: 'Horário', dia: 'Dia da semana', capacidade: 'Capacidade', especialidade: 'Especialidade', conteudo: 'Conteúdo', lido: 'Lido', pendencia_financeira: 'Pendência financeira', baixa_frequencia: 'Baixa frequência' }

function Icon({ name, className = '', tone = 'default' }) {
  const asset = tone === 'stat' ? statIcons[name] : tone === 'nav' ? navIcons[name] : imageIcons[name]
  if (asset) return <img className={'admin-icon ' + className} src={asset} alt="" aria-hidden="true" />
  const paths = {
    'tab-overview': <><circle cx="12" cy="8" r="3" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
    'tab-personal': <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6m1 2a5 5 0 0 1 4 5" /></>,
    'tab-enrollment': <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6m-6 4h6m-6 4h4" /></>,
    'tab-class': <><path d="M7 4c1.5 2 1.5 4 0 6s-1.5 4 0 6 1.5 3 0 4M17 4c-1.5 2-1.5 4 0 6s1.5 4 0 6-1.5 3 0 4" /><path d="M9 6h6M9 18h6" /></>,
    'tab-attendance': <><path d="M4 19V5m0 14h16" /><path d="M8 16v-4m4 4V8m4 8v-6" /></>,
    'tab-finance': <><circle cx="12" cy="12" r="9" /><path d="M14.5 8.5c-.5-.7-1.3-1-2.5-1-1.4 0-2.5.7-2.5 1.8 0 2.8 5 1.2 5 4 0 1.1-1.1 1.9-2.5 1.9-1.2 0-2-.3-2.5-1M12 6v12" /></>,
    'tab-evolution': <path d="m4 17 5-5 3 3 7-8M15 7h4v4" />,
    'tab-purchases': <><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
    'tab-documents': <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6m-6 4h6m-6 4h4" /></>,
    'enroll-active': <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6m1 2a5 5 0 0 1 4 5" /></>,
    'enroll-pending': <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
    'enroll-new': <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M8 2v4m8-4v4M5 9h14" /></>,
    'enroll-closed': <><circle cx="12" cy="12" r="8.5" /><path d="m8 12 2.5 2.5L16 9" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.8" /><path d="m16 16 5 5" /></>,
    warning: <><path d="m12 3 10 18H2L12 3Z" /><path d="M12 9v5m0 3h.01" /></>,
    filter: <><path d="M4 6h16M7 12h10m-7 6h4" /></>,
    document: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6m-6 4h6m-6 4h4" /></>,
    arrow: <path d="M4 12h15m-6-5 6 5-6 5" />,
    chevron: <path d="m8 4 8 8-8 8" />,
    close: <path d="m5 5 14 14M5 19 19 5" />,
    settings: <><path d="m9 3 .6 2.4a7 7 0 0 1 4.8 0L15 3l3 1.7-1.7 1.9a7 7 0 0 1 2.4 4.1l2.4.6v3.4l-2.4.6a7 7 0 0 1-2.4 4.1l1.7 1.9-3 1.7-.6-2.4a7 7 0 0 1-4.8 0L9 23l-3-1.7 1.7-1.9a7 7 0 0 1-2.4-4.1L3 14.7v-3.4l2.3-.6a7 7 0 0 1 2.4-4.1L6 4.7 9 3Z" /><circle cx="12" cy="13" r="3" /></>,
    users: <><circle cx="9" cy="7" r="3" /><path d="M3 20v-4a6 6 0 0 1 12 0v4H3Zm14-10a3 3 0 1 0-2-5m3 8a5 5 0 0 1 3 5v2h-3" /></>,
  }
  return <svg className={'admin-icon ' + className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.document}</svg>
}

function studioDate(value = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(value)
}
function dateLabel(value, options = { day: '2-digit', month: '2-digit', year: 'numeric' }) {
  if (!value) return '—'
  const date = value.length === 10 ? new Date(value + 'T12:00:00-03:00') : new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('pt-BR', { ...options, timeZone: timezone }).format(date)
}
function dateRange(period, today) {
  const start = new Date(today + 'T12:00:00-03:00')
  if (period === 'mes') return { inicio: today.slice(0, 7) + '-01', fim: today }
  if (period === '90') { start.setUTCDate(start.getUTCDate() - 89); return { inicio: studioDate(start), fim: today } }
  return { inicio: today.slice(0, 4) + '-01-01', fim: today }
}
function percentage(value) { return value == null ? '—' : Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%' }
function lessonState(lesson, now) {
  const saved = String(lesson.status || '').toLocaleLowerCase('pt-BR')
  if (/cancelad|suspens|confirmar|pendente/.test(saved)) return { label: lesson.status, tone: 'muted' }
  if (/realizad|conclu|finalizad/.test(saved)) return { label: 'Realizada', tone: 'done' }
  const start = new Date(lesson.data + 'T' + (lesson.horario_inicio || lesson.inicio) + '-03:00')
  const endTime = lesson.horario_fim || lesson.fim
  const end = endTime ? new Date(lesson.data + 'T' + endTime + '-03:00') : null
  if (now < start) return { label: 'Próxima', tone: 'next' }
  if (end && now < end) return { label: 'Em andamento', tone: 'current' }
  return { label: lesson.status || 'A confirmar', tone: 'muted' }
}
function filterOptions(module) {
  return {
    alunos: [['', 'Todos os alunos'], ['ativos', 'Alunos ativos'], ['baixa', 'Frequência abaixo de 70%']],
    professores: [['', 'Todos os professores'], ['ativos', 'Professores ativos']],
    turmas: [['', 'Todas as turmas'], ['ativas', 'Turmas ativas']],
    frequencia: [['', 'Todas as frequências'], ['baixa', 'Abaixo de 70%']],
    financeiro: [['', 'Valores em aberto'], ['vencidas', 'Mensalidades vencidas']],
    matriculas: [['', 'Todas as matrículas'], ['pendentes', 'Aguardando confirmação']],
    pedidos: [['', 'Pedidos no período'], ['retirada', 'Aguardando retirada']],
    notificacoes: [['', 'Todos os comunicados'], ['nao_lidas', 'Não lidos']],
  }[module]
}

export default function AdminDashboard({ session, sessionLoading = false, navigate }) {
  const [view, setView] = useState('dashboard')
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState('ano')
  const [classId, setClassId] = useState('')
  const [revision, setRevision] = useState(0)
  const [now, setNow] = useState(new Date())
  const [list, setList] = useState({ busca: '', filtro: '', pagina: 0, inicio: '', fim: '' })
  const [records, setRecords] = useState(null)
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState('')
  const [selected, setSelected] = useState(null)
  const workspaceRef = useRef(null)
  const today = studioDate(now)
  const range = dateRange(period, today)

  useEffect(() => {
    const timer = window.setInterval(() => { setNow(new Date()); setRevision((value) => value + 1) }, 60000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!session?.user?.id) { setLoading(false); return undefined }
    let active = true
    setLoading(true)
    setError('')
    supabase.rpc('painel_admin_dados', {
      p_inicio: range.inicio, p_fim: range.fim, p_turma: classId ? Number(classId) : null, p_agenda: today,
    }).then(({ data, error: requestError }) => {
      if (!active) return
      if (requestError || !data) { setDashboard(null); setError(requestError?.code === '42501' ? 'Sua conta não tem acesso administrativo.' : 'Não foi possível carregar os dados do Studio. Tente novamente.'); console.error('Dashboard administrativo:', requestError) }
      else setDashboard(data)
      setLoading(false)
    }).catch((requestError) => {
      if (active) { setDashboard(null); setError('Não foi possível conectar ao Studio. Tente novamente.'); setLoading(false); console.error(requestError) }
    })
    return () => { active = false }
  }, [session?.user?.id, range.inicio, range.fim, classId, today, revision])

  useEffect(() => {
    if (!session?.user?.id || !moduleNames[view]) return undefined
    let active = true
    setListLoading(true)
    setListError('')
    supabase.rpc('admin_listagem', {
      p_modulo: view, p_busca: list.busca, p_filtro: list.filtro,
      p_inicio: list.inicio || range.inicio, p_fim: list.fim || range.fim,
      p_turma: classId ? Number(classId) : null, p_pagina: list.pagina,
    }).then(({ data, error: requestError }) => {
      if (!active) return
      if (requestError || !data) { setRecords(null); setListError('Não foi possível carregar esta listagem. Tente novamente.'); console.error('Listagem administrativa:', requestError) }
      else setRecords(data)
      setListLoading(false)
    }).catch(() => { if (active) { setRecords(null); setListError('Não foi possível conectar ao Studio.'); setListLoading(false) } })
    return () => { active = false }
  }, [view, list, range.inicio, range.fim, classId, session?.user?.id, revision])

  const openView = useCallback((module, filter = '', query = '') => {
    const agenda = module === 'agenda'
    const lastDay = new Date(today + 'T12:00:00-03:00')
    lastDay.setUTCDate(lastDay.getUTCDate() + 30)
    setList({ busca: query, filtro: filter, pagina: 0, inicio: agenda ? today : '', fim: agenda ? studioDate(lastDay) : '' })
    setRecords(null)
    setSelected(null)
    setView(module)
    workspaceRef.current?.scrollTo({ top: 0 })
  }, [today])
  const refresh = () => setRevision((value) => value + 1)
  const signOut = async () => {
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
    if (signOutError) { setError('Não foi possível sair da conta. Tente novamente.'); return }
    navigate('entrar')
  }
  const readNotification = async (record) => {
    const { error: readError } = await supabase.rpc('admin_ler_comunicado', { p_comunicado: record.id })
    if (readError) { setListError('Não foi possível marcar o comunicado como lido.'); return }
    setSelected(null)
    refresh()
  }
  const name = dashboard?.usuario?.nome?.trim().split(/\s+/)[0]
  const userGreeting = name ? 'Bom dia, ' + name + '!' : 'Bom dia!'
  const canShow = Boolean(session?.user?.id)

  return <main className="admin-page">
    <aside className="admin-sidebar">
      <button className={'admin-profile-button' + (view === 'perfil' ? ' is-active' : '')} aria-label="Meu perfil" title="Meu perfil" onClick={() => openView('perfil')}><Icon name="profile" /></button>
      <nav aria-label="Navegação administrativa">{navigation.map(([id, label, icon]) =>
        <button key={id} type="button" aria-label={label} title={label} aria-current={view === id ? 'page' : undefined} className={view === id ? 'is-active' : ''} onClick={() => openView(id)}><Icon name={icon} tone="nav" className={'admin-nav-icon admin-nav-icon--' + icon} /><span className="admin-sr-only">{label}</span></button>
      )}</nav>
      <button className="admin-logout" type="button" aria-label="Sair da conta" title="Sair da conta" onClick={signOut}><Icon name="logout" /></button>
    </aside>
    <section className={'admin-surface admin-surface--' + view} ref={workspaceRef}>
      <header className="admin-header">
        <h1>{userGreeting}</h1>
        <form className="admin-search" role="search" onSubmit={(event) => { event.preventDefault(); if (search.trim()) openView('busca', '', search.trim()) }}>
          <label className="admin-sr-only" htmlFor="admin-search">Pesquisar no sistema</label>
          <input id="admin-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar no sistema" />
          <button type="submit" aria-label="Buscar"><Icon name="search" /></button>
        </form>
        <button className="admin-bell" type="button" aria-label={'Notificações' + (dashboard?.notificacoes_nao_lidas ? ', ' + dashboard.notificacoes_nao_lidas + ' não lidas' : '')} onClick={() => openView('notificacoes')}><Icon name="bell" />{dashboard?.notificacoes_nao_lidas > 0 && <span>{dashboard.notificacoes_nao_lidas}</span>}</button>
      </header>
      <div className="admin-body">
        {!canShow && !sessionLoading ? <StateMessage title="Entre para acessar o painel administrativo." action={() => navigate('entrar')} actionLabel="Entrar" />
          : (loading || sessionLoading) && !dashboard ? <StateMessage title="Carregando dados do Studio…" loading />
            : error ? <StateMessage title={error} action={refresh} />
              : dashboard && view === 'dashboard' ? <DashboardContent data={dashboard} now={now} period={period} setPeriod={setPeriod} classId={classId} setClassId={setClassId} openView={openView} loading={loading} />
                : dashboard && ['perfil', 'configuracoes'].includes(view) ? <ProfileView data={dashboard.usuario} settings={view === 'configuracoes'} openView={openView} />
                : dashboard && view === 'alunos' ? <PeopleView data={dashboard} list={list} setList={setList} records={records} loading={listLoading} error={listError} refresh={refresh} openView={openView} onSelect={setSelected} turmas={dashboard.turmas} classId={classId} setClassId={setClassId} />
                  : dashboard && view === 'matriculas' ? <MatriculasView data={dashboard} list={list} setList={setList} records={records} loading={listLoading} error={listError} refresh={refresh} openView={openView} onSelect={setSelected} />
                  : dashboard && <RecordsView view={view} list={list} setList={setList} data={records} loading={listLoading} error={listError} refresh={refresh} openView={openView} onSelect={setSelected} turmas={dashboard.turmas} classId={classId} setClassId={setClassId} range={range} now={now} />}
      </div>
      <footer className="admin-footer">Studio Keli Dalpian&nbsp; | &nbsp;© {today.slice(0, 4)}</footer>
    </section>
    {selected && (selected._modulo === 'alunos'
      ? <StudentProfileDialog student={selected} onClose={() => setSelected(null)} />
      : <RecordDialog record={selected} onClose={() => setSelected(null)} onRead={readNotification} />)}
  </main>
}

function StateMessage({ title, action, actionLabel = 'Tentar novamente', loading }) {
  return <div className="admin-state" role={loading ? 'status' : 'alert'}>{loading && <span className="admin-loader" />}<p>{title}</p>{action && <button className="admin-action" onClick={action}>{actionLabel}</button>}</div>
}
function CardHeading({ icon, title, children }) {
  return <header className="admin-card-heading"><h2><Icon name={icon} />{title}</h2>{children}</header>
}
function StatCard({ label, icon, value, note, onClick }) {
  return <button className="admin-stat-card" type="button" onClick={onClick}><span className="admin-stat-icon"><Icon name={icon} tone="stat" /></span><span className="admin-stat-label">{label}</span><strong>{value == null ? '—' : value}</strong><small>{note}</small></button>
}
function DashboardContent({ data, now, period, setPeriod, classId, setClassId, openView, loading }) {
  const stats = data.indicadores
  return <div className={'admin-dashboard' + (loading ? ' is-updating' : '')} aria-busy={loading}>
    <div className="admin-top-grid">
      <div className="admin-welcome-banner"><img src={welcomeBanner} alt="Painel Administrativo. Acompanhe a situação do Studio pelo painel integrado!" /></div>
      <Agenda agenda={data.agenda} date={data.data_agenda || data.hoje} now={now} openView={openView} />
    </div>
    <section className="admin-stats" aria-label="Indicadores do Studio">
      <StatCard icon="people" label="Alunos ativos" value={stats.alunos_ativos?.toLocaleString('pt-BR')} note="cadastros ativos" onClick={() => openView('alunos', 'ativos')} />
      <StatCard icon="dance" label="Professores" value={stats.professores?.toLocaleString('pt-BR')} note="profissionais ativos" onClick={() => openView('professores', 'ativos')} />
      <StatCard icon="calendar" label="Turmas ativas" value={stats.turmas_ativas?.toLocaleString('pt-BR')} note="turmas do Studio" onClick={() => openView('turmas', 'ativas')} />
      <StatCard icon="chart" label="Frequência média" value={percentage(stats.frequencia_media)} note="no período selecionado" onClick={() => openView('frequencia')} />
      <StatCard icon="bag" label="Pedidos da loja" value={stats.pedidos_loja?.toLocaleString('pt-BR')} note="no período selecionado" onClick={() => openView('pedidos')} />
    </section>
    <div className="admin-middle-grid">
      <Attendance data={data.frequencia} turmas={data.turmas} period={period} setPeriod={setPeriod} classId={classId} setClassId={setClassId} />
      <Attention data={data.pendencias} openView={openView} />
    </div>
    <div className="admin-bottom-grid">
      <Students students={data.alunos_recentes} openView={openView} />
      <div className="admin-feature-banner"><img src={featureBanner} alt="Funcionalidades adicionais. Encontre o panorama completo do Studio nas opções laterais da página." /><button type="button" className="admin-feature-link" aria-label="Produtos" onClick={() => openView('produtos')}><span className="admin-sr-only">Produtos</span></button></div>
    </div>
  </div>
}
function Agenda({ agenda, date, now, openView }) {
  return <article className="admin-card admin-agenda">
    <CardHeading icon="calendar" title="Agenda de hoje"><button className="admin-text-link" onClick={() => openView('agenda')}>Ver agenda completa <Icon name="arrow" /></button></CardHeading>
    <p className="admin-agenda-date">{dateLabel(date, { day: '2-digit', month: 'long', year: 'numeric' })} · {dateLabel(date, { weekday: 'long' })}</p>
    <div className="admin-agenda-list">{agenda?.length ? agenda.map((lesson) => {
      const state = lessonState(lesson, now)
      return <button className={'admin-lesson admin-lesson--' + state.tone} key={lesson.id_aula} onClick={() => openView('agenda', '', lesson.turma)}>
        <time>{lesson.horario_inicio?.slice(0, 5) || '—'}</time><span className="admin-lesson-info"><strong>{lesson.turma}</strong><small>{[lesson.professora && 'Prof. ' + lesson.professora, lesson.modalidade].filter(Boolean).join(' · ')}</small></span><span className={'admin-lesson-status ' + state.tone}>{state.label}</span>
      </button>
    }) : <p className="admin-empty">Nenhuma aula agendada para hoje.</p>}</div>
  </article>
}
function Attendance({ data, turmas, period, setPeriod, classId, setClassId }) {
  const hasData = data?.some((month) => month.percentual != null)
  return <article className="admin-card admin-attendance">
    <CardHeading icon="chart" title="Frequência das turmas"><div className="admin-chart-filters">
      <select aria-label="Filtrar frequência por turma" value={classId} onChange={(event) => setClassId(event.target.value)}><option value="">Todas as turmas</option>{turmas?.map((turma) => <option key={turma.id} value={turma.id}>{turma.nome}</option>)}</select>
      <select aria-label="Período da frequência" value={period} onChange={(event) => setPeriod(event.target.value)}><option value="ano">Este ano</option><option value="mes">Este mês</option><option value="90">Últimos 90 dias</option></select>
    </div></CardHeading>
    <div className="admin-chart" aria-label="Porcentagem de presença por mês">
      <div className="admin-chart-axis" aria-hidden="true">{[100, 80, 60, 40, 20, 0].map((tick) => <span key={tick}>{tick}%</span>)}</div>
      <div className="admin-chart-plot">
        <div className="admin-chart-lines" aria-hidden="true">{[100, 80, 60, 40, 20, 0].map((tick) => <i key={tick} />)}</div>
        <div className="admin-chart-bars">{data?.map((month) => <div className="admin-chart-month" key={month.mes}><div className="admin-chart-bar-slot"><span className="admin-chart-bar" role="img" aria-label={dateLabel(month.mes, { month: 'long', year: 'numeric' }) + ': ' + (month.percentual == null ? 'sem chamadas completas' : percentage(month.percentual))} title={percentage(month.percentual)} style={{ height: (Math.max(0, Math.min(100, Number(month.percentual) || 0))) + '%' }} />{month.percentual == null && <span className="admin-chart-missing" aria-hidden="true">—</span>}</div><span className="admin-chart-month-label">{dateLabel(month.mes, { month: 'short' }).replace('.', '')}</span></div>)}</div>
        {!hasData && <span className="admin-chart-empty">Sem chamadas completas no período.</span>}
      </div>
    </div>
    <p className="admin-chart-note">Somente chamadas completas de aulas realizadas.</p>
  </article>
}
function Attention({ data, openView }) {
  const alerts = [
    { key: 'financeiro', icon: 'finance', title: 'Financeiro', text: 'mensalidades vencidas em aberto', action: 'Ver pendências', module: 'financeiro', filter: 'vencidas', color: 'rose' },
    { key: 'frequencia', icon: 'profile', title: 'Frequência', text: 'alunos com frequência abaixo de 70%', action: 'Analisar', module: 'frequencia', filter: 'baixa', color: 'orange' },
    { key: 'matriculas', icon: 'document', title: 'Matrículas', text: 'matrículas aguardando confirmação', action: 'Ver matrículas', module: 'matriculas', filter: 'pendentes', color: 'purple' },
    { key: 'loja', icon: 'bag', title: 'Loja', text: 'pedidos aguardando retirada', action: 'Ver pedidos', module: 'pedidos', filter: 'retirada', color: 'blue' },
  ]
  return <section className="admin-attention" aria-label="Pendências do Studio"><div className="admin-attention-heading"><Icon name="warning" /><div><h2>Atenção necessária</h2><p>Confira os pontos que precisam da sua atenção.</p></div></div>
    <div className="admin-alert-grid">{alerts.map((alert) => <article key={alert.key} className={'admin-alert admin-alert--' + alert.color}><span className="admin-alert-icon"><Icon name={alert.icon} /></span><div><h3>{alert.title}</h3><p><strong>{data?.[alert.key] ?? 0}</strong> {alert.text}</p><button type="button" onClick={() => openView(alert.module, alert.filter)}>{alert.action}<Icon name="arrow" /></button></div></article>)}</div>
  </section>
}
function Avatar({ name, photo }) {
  return photo ? <img className="admin-avatar" src={photo} alt="" /> : <span className="admin-avatar admin-avatar--initials" aria-hidden="true">{name?.split(/\s+/).map((part) => part[0]).slice(0, 2).join('')}</span>
}
function StudentStatus({ student }) {
  const warning = student.baixa_frequencia || student.pendencia_financeira
  const active = /^(ativo|ativa)$/i.test(student.status?.trim())
  return <span className={'admin-student-status ' + (warning ? 'warning' : active ? 'active' : 'muted')} title={warning ? [student.baixa_frequencia && 'Frequência abaixo de 70%', student.pendencia_financeira && 'Mensalidade vencida'].filter(Boolean).join(' · ') : 'Status cadastral: ' + student.status}><i />{warning ? 'Atenção' : student.status || '—'}</span>
}
function Students({ students, openView }) {
  return <article className="admin-card admin-students"><CardHeading icon="people" title="Alunos recentes"><button className="admin-text-link" onClick={() => openView('alunos')}>Ver todos os alunos <Icon name="arrow" /></button></CardHeading>
    <table><thead><tr>{['Aluno', 'Turma', 'Modalidade', 'Status'].map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{students?.map((student) => <tr key={student.id_aluno}><td><button className="admin-student-name" onClick={() => openView('alunos', '', student.nome)}><Avatar name={student.nome} photo={student.foto_perfil} /><strong>{student.nome}</strong></button></td><td>{student.turma || '—'}</td><td>{student.modalidade || '—'}</td><td><StudentStatus student={student} /></td></tr>)}</tbody></table>
    {!students?.length && <p className="admin-empty">Nenhuma matrícula registrada.</p>}
  </article>
}
function MatriculasView({ data, list, setList, records, loading, error, refresh, openView, onSelect }) {
  const registrations = records?.registros || []
  const pending = registrations.filter((item) => /pendente|aguardando/i.test(item.status || '')).length
  const active = registrations.filter((item) => /ativo|ativa/i.test(item.status || '')).length
    const modalities = [
      ['Sapateado', sapateadoImage, false],
      ['Ballet clássico', balletClassicoImage, true],
      ['Jazz', jazzImage, false],
    ]
  const changeSearch = (event) => setList((current) => ({ ...current, busca: event.target.value, pagina: 0 }))
  return <section className="admin-enrollments" aria-busy={loading}>
    <header className="admin-enrollments__heading"><div><h2>Matrículas</h2><p>Acompanhe o processamento e andamento<br />das matrículas do Studio.</p></div><div className="admin-enrollments__actions"><button type="button" aria-label="Pesquisar" onClick={() => document.getElementById('admin-enrollment-search')?.focus()}><Icon name="search" /></button><button type="button" aria-label="Notificações" onClick={() => openView('notificacoes')}><Icon name="bell" /></button></div></header>
    <div className="admin-enrollments__stats"><article><span><Icon name="enroll-active" /></span><small>Matrículas ativas</small><strong>{active || data?.indicadores?.alunos_ativos || 0}</strong><em>↑ 1 este mês</em></article><article><span><Icon name="enroll-pending" /></span><small>Aguardando aprovação</small><strong>{pending || data?.pendencias?.matriculas || 0}</strong><em>↑ 2 este mês</em></article><article><span><Icon name="enroll-new" /></span><small>Novos este mês</small><strong>{registrations.length}</strong><em>↑ 2,3%</em></article><article><span><Icon name="enroll-closed" /></span><small>Encerradas</small><strong>04</strong><em>Concluídas</em></article><article className="is-featured"><strong>Nova matrícula</strong><p>Cadastre um novo aluno no Studio.</p><button type="button" onClick={() => openView('alunos')}>Cadastrar matrícula</button></article></div>
    <section className="admin-enrollments__requests"><header><div><h3><Icon name="tab-overview" />Solicitações de matrícula</h3><p>Confira e gerencie as solicitações de matrícula pendentes.</p></div><select aria-label="Filtrar solicitações"><option>Todas as solicitações</option><option>Pendentes</option><option>Aprovadas</option></select></header><label className="admin-enrollments__search"><Icon name="search" /><input id="admin-enrollment-search" value={list.busca} onChange={changeSearch} placeholder="Buscar aluno..." /></label>{loading ? <StateMessage title="Carregando matrículas..." loading /> : error ? <StateMessage title={error} action={refresh} /> : <div className="admin-enrollments__table-wrap"><table><thead><tr><th>Aluno</th><th>Modalidade</th><th>Data da solicitação</th><th>Status</th><th>Ações</th></tr></thead><tbody>{registrations.slice(0, 8).map((record) => <tr key={record.id}><td><span className="admin-enrollment-person"><Avatar name={record.nome} photo={record.foto} /><span><strong>{record.nome || 'Aluno'}</strong><small>#{String(record.id).padStart(4, '0')}</small></span></span></td><td>{record.turma || record.modalidade || 'Ballet clássico'}</td><td>{dateLabel(record.data)}</td><td><span className={'admin-enrollment-status ' + (/pendente|aguardando/i.test(record.status || '') ? 'pending' : 'active')}>{record.status || 'Pendente'}</span></td><td><button type="button" onClick={() => onSelect({ ...record, _modulo: 'alunos' })}>Ver</button><button type="button" onClick={() => onSelect({ ...record, _modulo: 'alunos' })}>{/pendente|aguardando/i.test(record.status || '') ? 'Aprovar' : 'Detalhes'}</button></td></tr>)}</tbody></table>{!registrations.length && <p className="admin-list-empty">Nenhuma solicitação encontrada.</p>}</div>}</section>
    <section className="admin-enrollments__modalities"><h3>Modalidades</h3><p>Aqui você pode administrar as modalidades<br />de dança disponíveis no Studio.</p><div className="modalities-list">{modalities.map(([name, image, featured]) => <button className={'modality admin-enrollments__modality' + (featured ? ' modality--featured' : '')} key={name} type="button" aria-label={'Administrar ' + name} onClick={() => openView('turmas')}><div className="modality-card"><div className="modality-art"><img src={image} alt="" /></div><h2>{name}</h2></div><span className="admin-enrollments__modality-action">Administrar</span></button>)}</div><button className="admin-enrollments__add" type="button" onClick={() => openView('turmas')}>Adicionar +</button></section>
  </section>
}
function PeopleView({ data, list, setList, records, loading, error, refresh, openView, onSelect, turmas, classId, setClassId }) {
  const stats = data.indicadores || {}
  const pending = data.pendencias?.matriculas || 0
  const options = filterOptions('alunos')
  const change = (field, value) => setList((current) => ({ ...current, [field]: value, pagina: 0 }))
  const students = records?.registros || []
  return <section className="admin-people" aria-busy={loading}>
    <header className="admin-people-heading">
      <div><h2>Gestão de Pessoas</h2><p>Gerencie alunos, professores e turmas do<br />Studio aqui.</p></div>
      <div className="admin-people-heading-actions"><button type="button" aria-label="Pesquisar" onClick={() => document.getElementById('admin-people-search')?.focus()}><Icon name="search" /></button><button type="button" aria-label="Notificações" onClick={() => openView('notificacoes')}><Icon name="bell" /></button></div>
    </header>
    <div className="admin-people-stats">
      <PeopleStat icon="people" label="Alunos ativos" value={stats.alunos_ativos} note="cadastros ativos" />
      <PeopleStat icon="dance" label="Professores" value={stats.professores} note="profissionais ativos" />
      <PeopleStat icon="calendar" label="Turmas ativas" value={stats.turmas_ativas} note="turmas do Studio" />
      <PeopleStat icon="document" label="Matrículas pendentes" value={pending} note="aguardando aprovação" />
    </div>
    <div className="admin-people-toolbar">
      <div className="admin-people-tabs" role="tablist" aria-label="Gestão de pessoas">
        <button className="is-active" type="button" role="tab" aria-selected="true">Alunos</button>
        <button type="button" role="tab" onClick={() => openView('professores')}>Professores</button>
        <button type="button" role="tab" onClick={() => openView('turmas')}>Turmas</button>
      </div>
      <button className="admin-people-new" type="button" onClick={() => openView('matriculas')}>+ <span>Novo aluno</span></button>
    </div>
    <div className="admin-people-filters">
      <label className="admin-people-search"><Icon name="search" /><span className="admin-sr-only">Pesquisar alunos</span><input id="admin-people-search" placeholder="Pesquisar por nome, matrícula ou e-mail..." value={list.busca} onChange={(event) => change('busca', event.target.value)} /></label>
      <select aria-label="Filtrar status" value={list.filtro} onChange={(event) => change('filtro', event.target.value)}>{options.map(([value, label]) => <option key={value} value={value}>{value === '' ? 'Todos os status' : label}</option>)}</select>
      <select aria-label="Filtrar turma" value={classId} onChange={(event) => setClassId(event.target.value)}><option value="">Todas as turmas</option>{turmas?.map((turma) => <option key={turma.id} value={turma.id}>{turma.nome}</option>)}</select>
      <select aria-label="Filtrar modalidade"><option>Todas as modalidades</option></select>
      <button type="button" className="admin-people-filter-button"><Icon name="filter" /> Filtros</button>
    </div>
    {loading ? <StateMessage title="Carregando alunos..." loading /> : error ? <StateMessage title={error} action={refresh} /> : <div className="admin-people-table-wrap">
      <table className="admin-people-table"><thead><tr><th>Aluno</th><th>Matrícula</th><th>Turma</th><th>Modalidade</th><th>Status</th><th><span className="admin-sr-only">Ações</span></th></tr></thead><tbody>
        {students.map((student) => <tr key={student.id}>
          <td><button className="admin-people-student" type="button" onClick={() => onSelect({ ...student, _modulo: 'alunos' })}><Avatar name={student.nome} photo={student.foto} /><span><strong>{student.nome}</strong><small>{student.email || 'E-mail não informado'}<br />{student.telefone || 'Telefone não informado'}</small></span></button></td>
          <td>#{String(student.id).padStart(4, '0')}</td><td>{student.turma || '—'}</td><td>{student.modalidade || '—'}</td>
          <td><span className={'admin-people-status ' + (/pendente|aguardando/i.test(student.status || '') ? 'pending' : 'active')}>{student.status || 'Ativo'}</span></td>
          <td><button className="admin-people-view" type="button" onClick={() => onSelect({ ...student, _modulo: 'alunos' })} aria-label={'Ver perfil de ' + student.nome}><span>◉</span> Ver perfil <b>⋮</b></button></td>
        </tr>)}
      </tbody></table>{!students.length && <p className="admin-list-empty">Nenhum aluno encontrado com estes filtros.</p>}
    </div>}
    {records && <div className="admin-pagination"><span>{records.total} aluno{records.total === 1 ? '' : 's'} encontrados</span><button disabled={!list.pagina} onClick={() => setList((current) => ({ ...current, pagina: current.pagina - 1 }))}>Anterior</button><button disabled={(list.pagina + 1) * 25 >= records.total} onClick={() => setList((current) => ({ ...current, pagina: current.pagina + 1 }))}>Próxima</button></div>}
  </section>
}
function PeopleStat({ icon, label, value, note }) {
  return <article className="admin-people-stat"><span className="admin-people-stat-icon"><Icon name={icon} tone="stat" /></span><div><small>{label}</small><strong>{value == null ? '—' : Number(value).toLocaleString('pt-BR')}</strong><em>{note}</em></div></article>
}
function renderValue(key, value) {
  if (value == null || value === '') return '—'
  if (['valor', 'saldo'].includes(key)) return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  if (['data', 'competencia'].includes(key)) return dateLabel(value)
  if (key === 'frequencia') return percentage(value)
  if (key === '_modulo') return moduleNames[value] || value
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não'
  return String(value)
}
function RecordsView({ view, list, setList, data, loading, error, refresh, openView, onSelect, turmas, classId, setClassId, range, now }) {
  const options = filterOptions(view)
  const pageCount = Math.ceil((data?.total || 0) / 25)
  const change = (field, value) => setList((current) => ({ ...current, [field]: value, pagina: 0 }))
  return <section className="admin-records" aria-busy={loading}>
    <div className="admin-records-heading"><div><button className="admin-back" onClick={() => openView('dashboard')}>← Visão geral</button><h2>{moduleNames[view]}</h2></div><button className="admin-action" onClick={refresh}>Atualizar</button></div>
    <div className="admin-list-filters">
      <label>Buscar<input aria-label="Buscar nesta listagem" placeholder="Nome, turma ou status" value={list.busca} onChange={(event) => change('busca', event.target.value)} /></label>
      {options && <label>Status<select aria-label="Filtrar status" value={list.filtro} onChange={(event) => change('filtro', event.target.value)}>{options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}
      {['alunos', 'turmas', 'agenda', 'frequencia', 'matriculas'].includes(view) && <label>Turma<select value={classId} onChange={(event) => setClassId(event.target.value)}><option value="">Todas as turmas</option>{turmas?.map((turma) => <option key={turma.id} value={turma.id}>{turma.nome}</option>)}</select></label>}
      {['agenda', 'frequencia', 'pedidos', 'busca'].includes(view) && <><label>De<input aria-label="Data inicial" type="date" value={list.inicio || range.inicio} max={list.fim || range.fim} onChange={(event) => change('inicio', event.target.value)} /></label><label>Até<input aria-label="Data final" type="date" min={list.inicio || range.inicio} value={list.fim || range.fim} onChange={(event) => change('fim', event.target.value)} /></label></>}
    </div>
    {loading ? <StateMessage title="Carregando registros…" loading /> : error ? <StateMessage title={error} action={refresh} /> : !data?.registros?.length ? <p className="admin-list-empty">Nenhum registro encontrado com estes filtros.</p> : <>
      {view === 'notificacoes' ? <div className="admin-notification-list">{data.registros.map((record) => <button key={record.id} className={record.lido ? 'is-read' : ''} onClick={() => onSelect(record)}><span>{record.lido ? 'Lido' : 'Não lido'}</span><h3>{record.nome}</h3><p>{record.conteudo}</p><time>{dateLabel(record.data)}</time></button>)}</div>
        : <div className="admin-record-table-wrap"><table className="admin-record-table"><thead><tr>{columns[view]?.map(([key, label]) => <th key={key}>{label}</th>)}<th><span className="admin-sr-only">Detalhes</span></th></tr></thead><tbody>{data.registros.map((record) => <tr key={(record._modulo || view) + ':' + (record.chave || record.id)}>{columns[view]?.map(([key]) => <td key={key}>{key === 'alertas' ? <span>{[record.baixa_frequencia && 'Baixa frequência', record.pendencia_financeira && 'Financeiro'].filter(Boolean).join(' · ') || 'Em dia'}</span> : key === 'status' && view === 'agenda' ? lessonState(record, now).label : renderValue(key, record[key])}</td>)}<td><button aria-label={'Ver detalhes de ' + (record.nome || 'pedido ' + record.id)} onClick={() => onSelect(record)}><Icon name="chevron" /></button></td></tr>)}</tbody></table></div>}
      <div className="admin-pagination"><span>{data.total} registro{data.total === 1 ? '' : 's'} · Página {list.pagina + 1} de {pageCount || 1}</span><button disabled={!list.pagina} onClick={() => setList((current) => ({ ...current, pagina: current.pagina - 1 }))}>Anterior</button><button disabled={list.pagina + 1 >= pageCount} onClick={() => setList((current) => ({ ...current, pagina: current.pagina + 1 }))}>Próxima</button></div>
    </>}
  </section>
}
function ProfileView({ data, settings, openView }) {
  return <section className="admin-records"><button className="admin-back" onClick={() => openView('dashboard')}>← Visão geral</button><h2>{settings ? 'Configurações da conta' : 'Meu perfil'}</h2><dl className="admin-profile-details">{[['nome', 'Nome'], ['email', 'E-mail'], ['telefone', 'Telefone'], ['perfil', 'Perfil de acesso']].map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{data?.[key] || '—'}</dd></div>)}</dl>{settings && <div className="admin-account-links"><button onClick={() => openView('professores')}>Professores</button><button onClick={() => openView('matriculas')}>Matrículas</button><button onClick={() => openView('produtos')}>Produtos</button><button onClick={() => openView('pedidos')}>Pedidos da loja</button></div>}</section>
}
function RecordDialog({ record, onClose, onRead }) {
  const dialogRef = useRef(null)
  useEffect(() => { dialogRef.current?.showModal() }, [])
  return <dialog className="admin-dialog" ref={dialogRef} onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <button className="admin-dialog-close" aria-label="Fechar detalhes" onClick={onClose}><Icon name="close" /></button>
    <h2>{record.nome || 'Pedido #' + record.id}</h2>
    <dl>{Object.entries(record).filter(([key]) => fieldNames[key]).map(([key, value]) => <div key={key}><dt>{fieldNames[key]}</dt><dd>{renderValue(key, value)}</dd></div>)}</dl>
    {record._modulo === 'notificacoes' && !record.lido && <button className="admin-action" onClick={() => onRead(record)}>Marcar como lido</button>}
  </dialog>
}

function StudentProfileDialog({ student, onClose }) {
  const dialogRef = useRef(null)
  const [tab, setTab] = useState('overview')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [savedStudent, setSavedStudent] = useState({})
  const [purchases, setPurchases] = useState([])
  const [purchasesLoading, setPurchasesLoading] = useState(false)
  const [purchasesError, setPurchasesError] = useState('')
  const [settlingPurchaseId, setSettlingPurchaseId] = useState(null)
  const [studentDetails, setStudentDetails] = useState(null)
  const [studentDetailsLoading, setStudentDetailsLoading] = useState(false)
  const [studentDetailsError, setStudentDetailsError] = useState('')
  const [profileForm, setProfileForm] = useState({ nome: student.nome || '', email: student.email || '', telefone: student.telefone || '', cpf: student.cpf || '' })
  const displayStudent = { ...student, ...savedStudent, ...(savedStudent.id ? profileForm : {}) }
  const enrollment = '#' + String(student.id).padStart(4, '0')
  const active = /^(ativo|ativa)$/i.test(student.status?.trim())
  const tabs = [
    ['overview', 'Visão geral', 'tab-overview'], ['personal', 'Dados pessoais', 'tab-personal'], ['enrollment', 'Matrícula', 'tab-enrollment'],
    ['class', 'Turma', 'tab-class'], ['attendance', 'Frequência', 'tab-attendance'], ['finance', 'Financeiro', 'tab-finance'],
    ['evolution', 'Evolução', 'tab-evolution'], ['purchases', 'Compras', 'tab-purchases'], ['documents', 'Documentos', 'tab-documents'],
  ]

  useEffect(() => { dialogRef.current?.showModal() }, [])

  useEffect(() => {
    if (!['overview', 'purchases'].includes(tab) || purchasesLoading || purchases.length || purchasesError) return
    setPurchasesLoading(true)
    setPurchasesError('')
    supabase.rpc('compras_aluno_admin', { p_id_aluno: Number(student.id) })
      .then(({ data, error }) => {
        if (error) setPurchasesError(error.message || 'Não foi possível carregar as compras.')
        else setPurchases(Array.isArray(data) ? data : [])
      })
      .finally(() => setPurchasesLoading(false))
  }, [tab, student.id, purchases.length, purchasesLoading, purchasesError])

  useEffect(() => {
    if (!['overview', 'evolution', 'finance'].includes(tab) || studentDetails || studentDetailsLoading) return
    setStudentDetailsLoading(true)
    setStudentDetailsError('')
    supabase.rpc('detalhes_aluno_admin', { p_id_aluno: Number(student.id) })
      .then(({ data, error }) => {
        if (error) setStudentDetailsError(error.message || 'Não foi possível carregar os detalhes do aluno.')
        else setStudentDetails(data || {})
      })
      .finally(() => setStudentDetailsLoading(false))
  }, [tab, student.id, studentDetails, studentDetailsLoading])

  const openEditor = () => {
    setProfileForm({ nome: displayStudent.nome || '', email: displayStudent.email || '', telefone: displayStudent.telefone || '', cpf: displayStudent.cpf || '' })
    setEditError('')
    setEditing(true)
    setTab('personal')
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setEditError('')
    const { data, error } = await supabase.rpc('atualizar_dados_aluno_admin', {
      p_id_aluno: Number(student.id),
      p_nome: profileForm.nome,
      p_email: profileForm.email,
      p_telefone: profileForm.telefone || null,
      p_cpf: profileForm.cpf || null,
    })
    if (error) setEditError(error.message || 'Não foi possível salvar os dados.')
    else {
      setSavedStudent(data || {})
      setEditing(false)
    }
    setSaving(false)
  }

  const settlePurchase = async (purchaseId) => {
    if (settlingPurchaseId) return
    setSettlingPurchaseId(purchaseId)
    const { data, error } = await supabase.rpc('dar_baixa_pedido_admin', { p_id_pedido: Number(purchaseId) })
    if (error) setPurchasesError(error.message || 'Não foi possível dar baixa no pedido.')
    else setPurchases((current) => current.map((purchase) => purchase.id_pedido === purchaseId ? { ...purchase, status: data?.status || 'concluido' } : purchase))
    setSettlingPurchaseId(null)
  }

  return <dialog className="admin-student-dialog" ref={dialogRef} onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <button className="admin-dialog-close" aria-label="Fechar perfil" onClick={onClose}><Icon name="close" /></button>
    <header className="admin-student-dialog__header">
      <Avatar name={displayStudent.nome} photo={displayStudent.foto || displayStudent.foto_perfil} />
      <div>
        <h2>{displayStudent.nome || 'Aluno'}</h2>
        <p>Matrícula {enrollment}</p>
        <span className={'admin-student-dialog__status ' + (active ? 'is-active' : '')}><i />{student.status || 'Não informado'}</span>
      </div>
    </header>
    <nav className="admin-student-dialog__tabs" aria-label="Seções do perfil" role="tablist">
      {tabs.map(([key, label, icon]) => <button key={key} type="button" className={tab === key ? 'is-active' : ''} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}><Icon name={icon} />{label}</button>)}
    </nav>
    {tab === 'overview' ? <div className="admin-student-dialog__overview">
      <section className="admin-student-dialog__card admin-student-dialog__card--personal">
        <div className="admin-student-dialog__card-heading"><h3><Icon name="profile" />Dados gerais</h3><button type="button" onClick={openEditor}>Editar</button></div>
        <dl><div><dt>Nome completo</dt><dd>{student.nome || 'Não informado'}</dd></div><div><dt>Data de nascimento</dt><dd>Não informado</dd></div><div><dt>E-mail</dt><dd>{student.email || 'Não informado'}</dd></div><div><dt>Telefone</dt><dd>{student.telefone || 'Não informado'}</dd></div><div><dt>CPF</dt><dd>Não informado</dd></div></dl>
      </section>
      <div className="admin-student-dialog__side">
        <section className="admin-student-dialog__card"><div className="admin-student-dialog__card-heading"><h3><Icon name="dance" />Turma atual</h3></div><strong className="admin-student-dialog__headline">{student.modalidade || student.turma || 'Sem turma ativa'}</strong><dl><div><dt>Nível</dt><dd>{student.turma || 'Não informado'}</dd></div><div><dt>Matrícula</dt><dd>{enrollment}</dd></div></dl><span className="admin-student-dialog__pill">{active ? 'Matrícula ativa' : student.status || 'Status não informado'}</span></section>
        <section className="admin-student-dialog__card"><div className="admin-student-dialog__card-heading"><h3><Icon name="bag" />Última compra</h3><small>{purchases.length ? `Pedido #${purchases[0].id_pedido}` : 'Sem dados'}</small></div>{purchases[0] ? <><strong className="admin-student-dialog__headline">{purchases[0].itens_pedido?.[0]?.produto?.nome || 'Pedido'}</strong><p className="admin-student-dialog__empty">{purchases[0].itens_pedido?.length || 0} item(ns) · {purchases[0].status}</p></> : <p className="admin-student-dialog__empty">Nenhuma compra registrada.</p>}<button className="admin-student-dialog__outline" type="button" onClick={() => setTab('purchases')}>Ver minhas compras <Icon name="arrow" /></button></section>
      </div>
      <section className="admin-student-dialog__card admin-student-dialog__card--finance"><div className="admin-student-dialog__card-heading"><h3><Icon name="finance" />Financeiro</h3><small>{studentDetails?.financeiro?.proximo_vencimento ? 'Em aberto' : 'Sem dados'}</small></div><div className="admin-student-dialog__finance-value">{studentDetails?.financeiro?.proximo_vencimento ? `R$ ${Number(studentDetails.financeiro.proximo_vencimento.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não informado'}</div><p>Próxima mensalidade</p><span className="admin-student-dialog__pill admin-student-dialog__pill--warning">{studentDetails?.financeiro?.proximo_vencimento?.status || (student.pendencia_financeira ? 'Em aberto' : 'Sem pendências')}</span><button className="admin-student-dialog__outline" type="button" onClick={() => setTab('finance')}>Ver financeiro <Icon name="arrow" /></button></section>
    </div> : <section className="admin-student-dialog__section"><h3>{tabs.find(([key]) => key === tab)?.[1]}</h3>{tab === 'personal' && editing && <form className="admin-student-dialog__edit-form" onSubmit={saveProfile}>
      <label>Nome completo<input value={profileForm.nome} onChange={(event) => setProfileForm({ ...profileForm, nome: event.target.value })} required /></label>
      <label>E-mail<input type="email" value={profileForm.email} onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })} required /></label>
      <label>Telefone<input value={profileForm.telefone} onChange={(event) => setProfileForm({ ...profileForm, telefone: event.target.value })} /></label>
      <label>CPF<input value={profileForm.cpf} onChange={(event) => setProfileForm({ ...profileForm, cpf: event.target.value })} /></label>
      {editError && <p className="admin-student-dialog__edit-error" role="alert">{editError}</p>}
      <div className="admin-student-dialog__edit-actions"><button type="button" onClick={() => setEditing(false)}>Cancelar</button><button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar alterações'}</button></div>
    </form>}{!editing && <div className="admin-student-dialog__detail-grid">
      {tab === 'personal' && <><Detail label="Nome completo" value={student.nome} /><Detail label="E-mail" value={student.email} /><Detail label="Telefone" value={student.telefone} /><Detail label="CPF" value="Não informado" /></>}
      {tab === 'enrollment' && <><Detail label="Número da matrícula" value={enrollment} /><Detail label="Data da matrícula" value={dateLabel(student.data)} /><Detail label="Status" value={student.status || 'Não informado'} /></>}
      {tab === 'class' && <><Detail label="Turma" value={student.turma} /><Detail label="Modalidade" value={student.modalidade} /></>}
      {tab === 'attendance' && <><Detail label="Frequência" value={percentage(student.frequencia)} /><Detail label="Aulas" value={student.aulas} /><Detail label="Presenças" value={student.presencas} /></>}
      {tab === 'finance' && <AdminFinanceDetail details={studentDetails} loading={studentDetailsLoading} error={studentDetailsError} />}
      {tab === 'evolution' && <AdminEvolutionDetail details={studentDetails} loading={studentDetailsLoading} error={studentDetailsError} />}
      {tab === 'purchases' && <PurchasesDetail purchases={purchases} loading={purchasesLoading} error={purchasesError} onSettle={settlePurchase} settlingId={settlingPurchaseId} />}
      {tab === 'documents' && <Detail label="Documentos" value="Nenhum documento disponível" />}
    </div>}</section>}
  </dialog>
}

function AdminEvolutionDetail({ details, loading, error }) {
  if (loading) return <div className="admin-student-dialog__detail-grid"><div><dt>Evolução</dt><dd>Carregando avaliações...</dd></div></div>
  if (error) return <div className="admin-student-dialog__detail-grid"><div><dt>Evolução</dt><dd>{error}</dd></div></div>
  const records = details?.evolucao || []
  if (!records.length) return <div className="admin-student-dialog__detail-grid"><div><dt>Evolução</dt><dd>Nenhuma avaliação registrada</dd></div></div>
  return <div className="admin-student-dialog__metrics-list">{records.map((record, index) => <article key={`${record.data}-${index}`}><span>{dateLabel(record.data)}</span><strong>{record.nota ?? '—'}<small>/100</small></strong><div><i style={{ width: `${Math.min(Number(record.nota) || 0, 100)}%` }} /></div></article>)}</div>
}

function AdminFinanceDetail({ details, loading, error }) {
  if (loading) return <div className="admin-student-dialog__detail-grid"><div><dt>Financeiro</dt><dd>Carregando mensalidades...</dd></div></div>
  if (error) return <div className="admin-student-dialog__detail-grid"><div><dt>Financeiro</dt><dd>{error}</dd></div></div>
  const finance = details?.financeiro || {}
  const next = finance.proximo_vencimento
  return <div className="admin-student-dialog__finance-detail"><div className="admin-student-dialog__finance-summary"><span>Total pago no ano</span><strong>R$ {Number(finance.total_pago_ano || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>{next && <small>Próximo vencimento: {dateLabel(next.vencimento)} · R$ {Number(next.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</small>}</div><div className="admin-student-dialog__finance-list">{(finance.mensalidades || []).map((item, index) => <div key={`${item.competencia}-${index}`}><span>{dateLabel(item.competencia, { month: 'long', year: 'numeric' })}</span><strong>R$ {Number(item.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong><em className={/^pago|quitado/i.test(item.status || '') ? 'is-paid' : ''}>{item.status || 'Pendente'}</em></div>)}</div></div>
}

function PurchasesDetail({ purchases, loading, error, onSettle, settlingId }) {
  if (loading) return <div className="admin-student-dialog__detail-grid"><div><dt>Compras</dt><dd>Carregando...</dd></div></div>
  if (error) return <div className="admin-student-dialog__detail-grid"><div><dt>Compras</dt><dd>{error}</dd></div></div>
  if (!purchases.length) return <div className="admin-student-dialog__detail-grid"><div><dt>Compras</dt><dd>Nenhuma compra registrada</dd></div></div>
  return <div className="admin-student-dialog__purchase-list">{purchases.map((purchase) => <article key={purchase.id_pedido} className="admin-student-dialog__purchase">
    <header><strong>Pedido #{purchase.id_pedido}</strong><span>{purchase.criado_em ? dateLabel(purchase.criado_em, { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}</span></header>
    {purchase.itens_pedido?.map((item, index) => <p key={`${purchase.id_pedido}-${index}`}><span>{item.produto?.nome || 'Produto'} <small>{item.quantidade} un. · Tam. {item.tamanho}</small></span><strong>{(Number(item.preco_unitario || 0) * Number(item.quantidade || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></p>)}
    <footer><span>{purchase.forma_pagamento === 'pix' ? 'PIX' : 'Cartão no Studio'} · {purchase.status}</span><strong>R$ {Number(purchase.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></footer>
    <button type="button" className={`admin-student-dialog__settle ${purchase.status === 'concluido' ? 'is-settled' : ''}`} disabled={purchase.status === 'concluido' || settlingId === purchase.id_pedido} onClick={() => onSettle(purchase.id_pedido)}>{purchase.status === 'concluido' ? 'Baixa realizada' : settlingId === purchase.id_pedido ? 'Salvando...' : 'Dar baixa no pedido'}</button>
  </article>)}</div>
}

function Detail({ label, value }) {
  return <div><dt>{label}</dt><dd>{value == null || value === '' ? 'Não informado' : value}</dd></div>
}

