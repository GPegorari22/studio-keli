import React, { useCallback, useEffect, useRef, useState } from 'react'
import welcomeBanner from '../assets/admin-welcome.png'
import featureBanner from '../assets/admin-features.png'
import profileIcon from '../assets/perfil-adm.png'
import homeIcon from '../assets/student-icon-home.png'
import danceIcon from '../assets/student-icon-dance.png'
import calendarIcon from '../assets/student-icon-calendar.png'
import chartIcon from '../assets/student-icon-chart.png'
import adminLogoutIcon from '../assets/sair-adm.png'
import adminAgendaIcon from '../assets/agenda-azul.png'
import adminSapatilhaIcon from '../assets/sapatilha-azul.png'
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
import centralAvisoImage from '../assets/centralaviso.png'
import storePointeShoes from '../assets/store-pointe-shoes.png'
import { supabase } from '../lib/supabase.js'
import './AdminDashboard.css'

const timezone = 'America/Sao_Paulo'
const imageIcons = { profile: profileIcon, home: homeIcon, dance: danceIcon, calendar: calendarIcon, chart: chartIcon, logout: adminLogoutIcon, bell: bellIcon, people: peopleIcon, finance: financeIcon, bag: bagIcon }
const statIcons = { people: statPeopleIcon, dance: statDanceIcon, calendar: statCalendarIcon, chart: statChartIcon, bag: statBagIcon }
const navIcons = { home: adminHomeIcon, users: adminPeopleIcon, dance: adminSapatilhaIcon, calendar: adminAgendaIcon, chart: adminEvolutionIcon, settings: adminSettingsIcon }
const navigation = [
  ['dashboard', 'Início', 'home'], ['alunos', 'Alunos', 'users'], ['matriculas', 'Matrículas', 'dance'],
  ['agenda', 'Agenda', 'calendar'], ['frequencia', 'Frequência', 'chart'], ['configuracoes', 'Configurações', 'settings'],
]
const moduleNames = { alunos: 'Alunos', professores: 'Professores', turmas: 'Turmas', agenda: 'Agenda de aulas', frequencia: 'Frequência dos alunos', financeiro: 'Financeiro', matriculas: 'Matrículas', pedidos: 'Pedidos da loja', produtos: 'Produtos', notificacoes: 'Notificações', busca: 'Resultados da busca' }
const searchAreas = [['alunos', 'Alunos'], ['professores', 'Professores'], ['turmas', 'Turmas'], ['agenda', 'Agenda'], ['frequencia', 'Frequência'], ['financeiro', 'Financeiro'], ['matriculas', 'Matrículas'], ['pedidos', 'Pedidos da loja'], ['produtos', 'Produtos'], ['notificacoes', 'Notificações']]
navigation[4] = ['financeiro', 'Financeiro', 'chart']
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
    star: <><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" /></>,
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
function money(value) { return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }) }
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
  const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false)
  const [enrollmentLead, setEnrollmentLead] = useState(null)
  const [classModalOpen, setClassModalOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState(null)
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
    if (!session?.user?.id || !moduleNames[view] || view === 'busca') { if (view === 'busca') { setRecords(null); setListLoading(false) } return undefined }
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
    const firstSearchDay = new Date(today + 'T12:00:00-03:00')
    firstSearchDay.setUTCDate(firstSearchDay.getUTCDate() - 1066)
    setList({ busca: query, filtro: filter, pagina: 0, inicio: agenda ? today : module === 'busca' ? studioDate(firstSearchDay) : '', fim: agenda ? studioDate(lastDay) : module === 'busca' ? studioDate(lastDay) : '' })
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
  const matchingSearchAreas = searchAreas.filter(([, label]) => !search.trim() || label.toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR')))

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
        <div className="admin-search-wrap"><form className="admin-search" role="search" onSubmit={(event) => { event.preventDefault(); const exact = matchingSearchAreas.find(([, label]) => label.toLocaleLowerCase('pt-BR') === search.trim().toLocaleLowerCase('pt-BR')); if (exact) { setSearch(''); openView(exact[0]) } }}>
          <label className="admin-sr-only" htmlFor="admin-search">Pesquisar no sistema</label>
          <input id="admin-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar no sistema" />
          <button type="submit" aria-label="Buscar"><Icon name="search" /></button>
        </form>{search.trim() && <div className="admin-search-dropdown" role="listbox"><small>Áreas encontradas</small>{matchingSearchAreas.map(([module, label]) => <button type="button" key={module} onClick={() => { setSearch(''); openView(module) }}><span>{label}</span><Icon name="arrow" /></button>)}{!matchingSearchAreas.length && <p>Nenhuma área encontrada.</p>}</div>}</div>
        <button className="admin-bell" type="button" aria-label={'Notificações' + (dashboard?.notificacoes_nao_lidas ? ', ' + dashboard.notificacoes_nao_lidas + ' não lidas' : '')} onClick={() => openView('notificacoes')}><Icon name="bell" />{dashboard?.notificacoes_nao_lidas > 0 && <span>{dashboard.notificacoes_nao_lidas}</span>}</button>
      </header>
      <div className="admin-body">
        {!canShow && !sessionLoading ? <StateMessage title="Entre para acessar o painel administrativo." action={() => navigate('entrar')} actionLabel="Entrar" />
          : (loading || sessionLoading) && !dashboard ? <StateMessage title="Carregando dados do Studio…" loading />
            : error ? <StateMessage title={error} action={refresh} />
              : dashboard && view === 'dashboard' ? <DashboardContent data={dashboard} now={now} period={period} setPeriod={setPeriod} classId={classId} setClassId={setClassId} openView={openView} loading={loading} />
                : dashboard && view === 'configuracoes' ? <AdminSettingsWorkspace data={dashboard} openView={openView} />
                : dashboard && view === 'perfil' ? <ProfileView data={dashboard.usuario} settings={false} openView={openView} />
                : dashboard && ['alunos', 'professores', 'turmas'].includes(view) ? <PeopleView view={view} data={dashboard} list={list} setList={setList} records={records} loading={listLoading} error={listError} refresh={refresh} openView={openView} onSelect={setSelected} turmas={dashboard.turmas} classId={classId} setClassId={setClassId} onOpenClass={(turma = null) => { setSelectedClass(turma); setClassModalOpen(true) }} />
                : dashboard && view === 'matriculas' ? <MatriculasView data={dashboard} list={list} setList={setList} records={records} loading={listLoading} error={listError} refresh={refresh} openView={openView} onSelect={setSelected} onOpenEnrollment={(lead = null) => { setEnrollmentLead(lead); setEnrollmentModalOpen(true) }} />
                : dashboard && view === 'turmas' ? <TurmasView onBack={() => openView('dashboard')} onOpenClass={(turma = null) => { setSelectedClass(turma); setClassModalOpen(true) }} />
                  : dashboard && view === 'agenda' ? <AgendaView today={today} openView={openView} />
                  : dashboard && view === 'financeiro' ? <FinanceiroView data={dashboard} list={list} setList={setList} records={records} loading={listLoading} error={listError} refresh={refresh} openView={openView} />
                  : dashboard && view === 'notificacoes' ? <NotificationsView data={dashboard} records={records} loading={listLoading} error={listError} refresh={refresh} openView={openView} onSelect={setSelected} />
                  : dashboard && view === 'relatorios' ? <ReportsView data={dashboard} openView={openView} />
                : dashboard && view === 'busca' ? <SearchAreasView query={list.busca} openView={openView} />
                : dashboard && <RecordsView view={view} list={list} setList={setList} data={records} loading={listLoading} error={listError} refresh={refresh} openView={openView} onSelect={setSelected} turmas={dashboard.turmas} classId={classId} setClassId={setClassId} range={range} now={now} />}
      </div>
      <footer className="admin-footer">Studio Keli Dalpian&nbsp; | &nbsp;© {today.slice(0, 4)}</footer>
    </section>
    {selected && (selected._modulo === 'alunos'
      ? <StudentProfileDialog student={selected} onClose={() => setSelected(null)} />
      : <RecordDialog record={selected} onClose={() => setSelected(null)} onRead={readNotification} />)}
    {enrollmentModalOpen && <EnrollmentModal initialStudent={enrollmentLead} turmas={dashboard?.turmas || []} onClose={() => { setEnrollmentModalOpen(false); setEnrollmentLead(null) }} onSaved={() => { setEnrollmentModalOpen(false); setEnrollmentLead(null); refresh() }} />}
    {classModalOpen && <ClassModalFixed turma={selectedClass} onClose={() => { setClassModalOpen(false); setSelectedClass(null) }} onSaved={() => { setClassModalOpen(false); setSelectedClass(null); refresh() }} />}
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
    <div className="admin-alert-grid">{alerts.map((alert) => <article key={alert.key} className={'admin-alert admin-alert--' + alert.color}><span className="admin-alert-icon"><Icon name={alert.icon} /></span><div><h3>{alert.title}</h3><p><strong>{data?.pendencias?.[alert.key] ?? 0}</strong> {alert.text}</p><button type="button" onClick={() => openView(alert.module, alert.filter)}>{alert.action}<Icon name="arrow" /></button></div></article>)}</div>
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
function MatriculasView({ data, list, setList, loading, refresh, openView, onOpenEnrollment }) {
  const [potentialStudents, setPotentialStudents] = useState([])
  const [potentialLoading, setPotentialLoading] = useState(true)
  const [potentialError, setPotentialError] = useState('')
  const pending = potentialStudents.length
  const active = data?.indicadores?.alunos_ativos || 0
    const modalities = [
      ['Sapateado', sapateadoImage],
      ['Ballet clássico', balletClassicoImage],
      ['Jazz', jazzImage],
    ]
  const changeSearch = (event) => setList((current) => ({ ...current, busca: event.target.value, pagina: 0 }))
  useEffect(() => {
    let activeRequest = true
    setPotentialLoading(true)
    setPotentialError('')
    supabase.rpc('listar_possiveis_alunos_admin').then(({ data: leads, error: requestError }) => {
      if (!activeRequest) return
      if (requestError || !Array.isArray(leads)) {
        setPotentialError('Não foi possível carregar os potenciais alunos.')
        setPotentialStudents([])
      } else setPotentialStudents(leads)
      setPotentialLoading(false)
    }).catch(() => {
      if (activeRequest) {
        setPotentialError('Não foi possível conectar ao banco.')
        setPotentialLoading(false)
      }
    })
    return () => { activeRequest = false }
  }, [data, list.busca])
  const filteredPotentialStudents = potentialStudents.filter((student) => {
    const query = String(list.busca || '').toLocaleLowerCase('pt-BR')
    return !query || [student.nome, student.email, student.telefone].some((value) => String(value || '').toLocaleLowerCase('pt-BR').includes(query))
  })
  return <section className="admin-enrollments" aria-busy={loading}>
    <header className="admin-enrollments__heading"><div><h2>Matrículas</h2><p>Acompanhe o processamento e andamento<br />das matrículas do Studio.</p></div><div className="admin-enrollments__actions"><button type="button" aria-label="Pesquisar" onClick={() => document.getElementById('admin-enrollment-search')?.focus()}><Icon name="search" /></button><button type="button" aria-label="Notificações" onClick={() => openView('notificacoes')}><Icon name="bell" /></button></div></header>
    <div className="admin-enrollments__stats"><article><span><Icon name="enroll-active" /></span><small>Matrículas ativas</small><strong>{active}</strong><em>Alunos matriculados</em></article><article><span><Icon name="enroll-pending" /></span><small>Aguardando aprovação</small><strong>{pending}</strong><em>Potenciais alunos</em></article><article><span><Icon name="enroll-new" /></span><small>Pré-cadastros</small><strong>{potentialStudents.length}</strong><em>Aula experimental</em></article><article><span><Icon name="enroll-closed" /></span><small>Encerradas</small><strong>04</strong><em>Concluídas</em></article><article className="is-featured"><strong>Nova matrícula</strong><p>Cadastre um novo aluno no Studio.</p><button type="button" onClick={() => onOpenEnrollment()}>Fazer matrícula</button></article></div>
    <section className="admin-enrollments__requests"><header><div><h3><Icon name="tab-overview" />Solicitações de aula experimental</h3><p>Potenciais alunos aguardando aprovação para matrícula.</p></div><select aria-label="Filtrar solicitações"><option>Todos os potenciais alunos</option></select></header><label className="admin-enrollments__search"><Icon name="search" /><input id="admin-enrollment-search" value={list.busca} onChange={changeSearch} placeholder="Buscar potencial aluno..." /></label>{potentialLoading ? <StateMessage title="Carregando potenciais alunos..." loading /> : potentialError ? <StateMessage title={potentialError} action={refresh} /> : <div className="admin-enrollments__table-wrap"><table><thead><tr><th>Potencial aluno</th><th>Modalidade</th><th>Data da solicitação</th><th>Status</th><th>Ações</th></tr></thead><tbody>{filteredPotentialStudents.slice(0, 8).map((lead) => <tr key={lead.id_possivel_aluno}><td><span className="admin-enrollment-person"><Avatar name={lead.nome} /><span><strong>{lead.nome || 'Potencial aluno'}</strong><small>Pré-cadastro #{String(lead.id_possivel_aluno).padStart(4, '0')}</small></span></span></td><td>{lead.modalidade || lead.turma || 'Não informada'}</td><td>{dateLabel(lead.data_contato || lead.data_aula_experimental)}</td><td><span className="admin-enrollment-status pending">{lead.status || 'NOVO'}</span></td><td><button type="button" onClick={() => onOpenEnrollment(lead)}>Aprovar</button></td></tr>)}</tbody></table>{!filteredPotentialStudents.length && <p className="admin-list-empty">Nenhum potencial aluno aguardando aprovação.</p>}</div>}</section>
    <section className="admin-enrollments__modalities"><h3>Modalidades</h3><p>Aqui você pode administrar as modalidades<br />de dança disponíveis no Studio.</p><div className="modalities-list">{modalities.map(([name, image], index) => <button className="modality admin-enrollments__modality" key={`${name}-${index}`} type="button" aria-label={'Administrar ' + name} onClick={() => openView('turmas')}><div className="modality-card"><div className="modality-art"><img src={image} alt="" /></div><h2>{name}</h2></div><span className="admin-enrollments__modality-action">Administrar</span></button>)}</div><button className="admin-enrollments__add" type="button" onClick={() => openView('turmas')}>Adicionar +</button></section>
  </section>
}

function EnrollmentModal({ initialStudent = null, turmas, onClose, onSaved }) {
  const [potentialStudents, setPotentialStudents] = useState([])
  const [studentMode, setStudentMode] = useState('existing')
  const [studentQuery, setStudentQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(initialStudent)
  const [minor, setMinor] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [classOptions, setClassOptions] = useState(turmas)
  const [classesLoading, setClassesLoading] = useState(false)
  const [form, setForm] = useState({
    nome: initialStudent?.nome || '',
    email: initialStudent?.email || '',
    telefone: initialStudent?.telefone || '',
    cpf: '',
    dataNascimento: initialStudent?.data_nascimento || '',
    modalidade: 'Ballet clássico',
    turmaId: String(turmas[0]?.id || ''),
    turma: turmas[0]?.nome || '',
    professor: turmas[0]?.professora || 'Keli Dalpian',
    inicio: studioDate(),
    termino: '',
    plano: 'Mensal',
    valor: '150,00',
    vencimento: '10',
    responsavel: initialStudent?.nome_responsavel || '',
    telefoneResponsavel: initialStudent?.telefone_responsavel || '',
    emailResponsavel: '',
    observacoes: initialStudent?.observacoes || '',
    status: 'Ativa',
  })

  useEffect(() => {
    const closeWithEscape = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', closeWithEscape)
    return () => document.removeEventListener('keydown', closeWithEscape)
  }, [onClose])

  useEffect(() => {
    let active = true
    supabase.rpc('listar_possiveis_alunos_admin').then(({ data, error }) => {
      if (!active) return
      if (!error && Array.isArray(data)) {
        setPotentialStudents(data)
        if (data.length) {
          const firstLead = initialStudent || data[0]
          setSelectedStudent(firstLead)
          setForm((current) => ({ ...current, nome: firstLead.nome || '', email: firstLead.email || '', telefone: firstLead.telefone || '', dataNascimento: firstLead.data_nascimento || '', responsavel: firstLead.nome_responsavel || '', telefoneResponsavel: firstLead.telefone_responsavel || '', observacoes: firstLead.observacoes || '' }))
        }
      }
    }).catch(() => {})
    return () => { active = false }
  }, [initialStudent])

  useEffect(() => {
    let active = true
    supabase.rpc('listar_turmas_admin').then(({ data, error }) => {
      if (!active) return
      if (!error && Array.isArray(data)) {
        setClassOptions(data)
        if (data.length) setForm((current) => {
          const firstClass = data.find((turma) => String(turma.id) === String(current.turmaId)) || data[0]
          return { ...current, turmaId: String(firstClass.id), turma: firstClass.nome, modalidade: firstClass.modalidade || current.modalidade, professor: firstClass.professora || current.professor }
        })
      }
      setClassesLoading(false)
    }).catch(() => { if (active) setClassesLoading(false) })
    return () => { active = false }
  }, [])

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const filteredStudents = potentialStudents.filter((student) => {
    const query = studentQuery.toLocaleLowerCase('pt-BR')
    return [student.nome, student.email, student.telefone].some((value) => String(value || '').toLocaleLowerCase('pt-BR').includes(query))
  })
  const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
  const modalityOptions = [...new Set(classOptions.map((turma) => turma.modalidade).filter(Boolean))]
  const availableClasses = classOptions.filter((turma) => !turma.modalidade || !form.modalidade || normalize(turma.modalidade) === normalize(form.modalidade))
  const selectedClass = classOptions.find((turma) => String(turma.id) === String(form.turmaId)) || classOptions.find((turma) => turma.nome === form.turma)
  useEffect(() => {
    if (studentMode !== 'existing' || !selectedStudent?.id_turma) return
    const requestedClass = classOptions.find((turma) => String(turma.id) === String(selectedStudent.id_turma))
    if (!requestedClass) return
    setForm((current) => ({ ...current, turmaId: String(requestedClass.id), turma: requestedClass.nome || '', modalidade: requestedClass.modalidade || current.modalidade, professor: requestedClass.professora || current.professor }))
  }, [studentMode, selectedStudent, classOptions])
  const changeModality = (value) => {
    const nextClass = classOptions.find((turma) => !turma.modalidade || normalize(turma.modalidade) === normalize(value))
    setForm((current) => ({ ...current, modalidade: value, turmaId: String(nextClass?.id || ''), turma: nextClass?.nome || '', professor: nextClass?.professora || current.professor }))
  }
  const changeClass = (value) => {
    const nextClass = classOptions.find((turma) => String(turma.id) === value)
    setForm((current) => ({ ...current, turmaId: value, turma: nextClass?.nome || '', professor: nextClass?.professora || current.professor, modalidade: nextClass?.modalidade || current.modalidade }))
  }

  const selectStudent = (student) => {
    setSelectedStudent(student)
    setForm((current) => ({ ...current, nome: student.nome || '', email: student.email || '', telefone: student.telefone || '', cpf: student.cpf || '', dataNascimento: student.data_nascimento || '', responsavel: student.nome_responsavel || '', telefoneResponsavel: student.telefone_responsavel || '', observacoes: student.observacoes || '' }))
  }

  const submit = async (event) => {
    event.preventDefault()
    if (saving) return
    const turmaSelecionada = classOptions.find((turma) => String(turma.id) === String(form.turmaId))
    if (!turmaSelecionada?.id) {
      setSaveError('Selecione uma turma válida antes de salvar.')
      return
    }
    setSaving(true)
    setSaveError('')
    const valor = Number(String(form.valor || '').replace(',', '.'))
    const enrollmentPayload = {
      p_nome: form.nome,
      p_email: form.email,
      p_telefone: form.telefone || null,
      p_cpf: form.cpf || null,
      p_data_nascimento: form.dataNascimento || null,
      p_id_turma: Number(turmaSelecionada.id),
      p_data_matricula: form.inicio,
      p_data_termino: form.termino || null,
      p_plano: form.plano,
      p_valor: Number.isFinite(valor) ? valor : null,
      p_vencimento_dia: Number(form.vencimento),
      p_nome_responsavel: form.responsavel || null,
      p_telefone_responsavel: form.telefoneResponsavel || null,
      p_email_responsavel: form.emailResponsavel || null,
      p_observacoes: form.observacoes || null,
      p_status: form.status,
    }
    const rpcName = studentMode === 'existing' && selectedStudent?.id_possivel_aluno ? 'aprovar_possivel_aluno_admin' : 'criar_matricula_admin'
    const rpcPayload = rpcName === 'aprovar_possivel_aluno_admin'
      ? { p_id_possivel_aluno: Number(selectedStudent.id_possivel_aluno), ...enrollmentPayload }
      : { ...enrollmentPayload, p_id_aluno: null }
    const { error } = await supabase.rpc(rpcName, rpcPayload)
    if (error) {
      setSaveError(error.message || 'Não foi possível salvar a matrícula.')
      setSaving(false)
      return
    }
    setSaved(true)
    window.setTimeout(() => onSaved(), 650)
  }

  return <div className="admin-enrollment-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="admin-enrollment-modal" role="dialog" aria-modal="true" aria-labelledby="enrollment-modal-title" onMouseDown={(event) => event.stopPropagation()}>
      <header className="admin-enrollment-modal__header">
        <div>
          <span className="admin-enrollment-modal__eyebrow"><Icon name="tab-enrollment" /> Nova matrícula</span>
          <h2 id="enrollment-modal-title">Cadastrar matrícula</h2>
          <p>Preencha os dados do aluno e as informações da nova matrícula.</p>
        </div>
        <button className="admin-enrollment-modal__close" type="button" aria-label="Fechar modal" onClick={onClose}><Icon name="close" /></button>
      </header>

      <form onSubmit={submit}>
        <div className="admin-enrollment-modal__flow" aria-label="Resumo da matrícula">
          <span>Aluno</span><b>›</b><strong>{form.modalidade}</strong><b>›</b><span>{selectedClass?.nome || form.turma || 'Selecione a turma'}</span><b>›</b><span>{selectedClass?.professora || form.professor || 'Professor'}</span><b>›</b><strong>{form.plano}</strong>
        </div>

        <div className="admin-enrollment-modal__body">
          <div className="admin-enrollment-modal__left">
            <section className="admin-enrollment-modal__panel">
              <div className="admin-enrollment-modal__section-title"><Icon name="tab-personal" /><h3>Dados do aluno</h3></div>
              <div className="admin-enrollment-modal__tabs"><button type="button" className={studentMode === 'existing' ? 'is-active' : ''} onClick={() => setStudentMode('existing')}>Pré-cadastro / aula teste</button><button type="button" className={studentMode === 'new' ? 'is-active' : ''} onClick={() => { setStudentMode('new'); setSelectedStudent(null); setForm((current) => ({ ...current, nome: '', email: '', telefone: '', cpf: '', dataNascimento: '' })) }}>Novo aluno</button></div>
              {studentMode === 'existing' ? <>
                <label className="admin-enrollment-modal__search"><Icon name="search" /><input value={studentQuery} onChange={(event) => setStudentQuery(event.target.value)} placeholder="Pesquise por nome, telefone ou e-mail..." /></label>
                {selectedStudent ? <button className="admin-enrollment-modal__student" type="button" onClick={() => setStudentMode('new')}><Avatar name={selectedStudent.nome} photo={selectedStudent.foto} /><span><strong>{selectedStudent.nome}</strong><small>Pré-cadastro #{String(selectedStudent.id || '').padStart(4, '0')}</small><small>{selectedStudent.email || 'E-mail não informado'}{selectedStudent.telefone ? ' · ' + selectedStudent.telefone : ''}</small></span><em>Potencial aluno</em></button> : <div className="admin-enrollment-modal__empty">{filteredStudents.length ? 'Selecione um potencial aluno para continuar.' : 'Nenhum pré-cadastro de aula teste encontrado.'}</div>}
                {filteredStudents.length > 0 && selectedStudent && studentQuery && filteredStudents.every((student) => student.id !== selectedStudent.id) && <div className="admin-enrollment-modal__student-results">{filteredStudents.map((student) => <button type="button" key={student.id} onClick={() => selectStudent(student)}>{student.nome}</button>)}</div>}
              </> : <div className="admin-enrollment-modal__form-grid admin-enrollment-modal__form-grid--student">
                <Field label="Nome completo" required value={form.nome} onChange={(value) => setField('nome', value)} className="wide" />
                <Field label="Data de nascimento" type="date" required value={form.dataNascimento} onChange={(value) => setField('dataNascimento', value)} />
                <Field label="CPF" required value={form.cpf} onChange={(value) => setField('cpf', value)} placeholder="000.000.000-00" />
                <Field label="E-mail" type="email" required value={form.email} onChange={(value) => setField('email', value)} />
                <Field label="Telefone" required value={form.telefone} onChange={(value) => setField('telefone', value)} placeholder="(00) 00000-0000" />
              </div>}
            </section>

            <section className="admin-enrollment-modal__panel">
              <div className="admin-enrollment-modal__section-title"><Icon name="tab-enrollment" /><h3>Dados da matrícula</h3></div>
              <div className="admin-enrollment-modal__form-grid">
                <SelectField label="Modalidade" required value={form.modalidade} onChange={changeModality} options={modalityOptions.length ? modalityOptions : ['Ballet clássico', 'Jazz', 'Sapateado']} />
                <label className="admin-enrollment-modal__field"><span>Turma<b>*</b></span><div><select value={form.turmaId} onChange={(event) => changeClass(event.target.value)} required disabled={classesLoading || !availableClasses.length}><option value="">{classesLoading ? 'Carregando turmas...' : 'Selecione uma turma'}</option>{availableClasses.map((turma) => <option key={turma.id} value={turma.id}>{turma.nome}{turma.horario ? ' · ' + String(turma.horario).slice(0, 5) : ''}</option>)}</select></div></label>
                <Field label="Data de início" required type="date" value={form.inicio} onChange={(value) => setField('inicio', value)} />
                <Field label="Data de término (opcional)" type="date" value={form.termino} onChange={(value) => setField('termino', value)} />
                <SelectField label="Plano de pagamento" required value={form.plano} onChange={(value) => setField('plano', value)} options={['Mensal', 'Trimestral', 'Semestral', 'Anual']} />
                <Field label="Valor da matrícula" value={form.valor} onChange={(value) => setField('valor', value)} prefix="R$" />
              </div>
              <div className="admin-enrollment-modal__note"><Icon name="warning" />A matrícula será ativada após o pagamento da primeira mensalidade.</div>
            </section>
          </div>

          <div className="admin-enrollment-modal__right">
            <section className="admin-enrollment-modal__panel admin-enrollment-modal__selected-class"><div className="admin-enrollment-modal__section-title"><Icon name="tab-class" /><h3>Modalidade e turma selecionada</h3></div><div className="admin-enrollment-modal__class-icon"><Icon name="tab-class" /></div><strong>{form.modalidade}</strong><b>{selectedClass?.nome || form.turma || 'Selecione uma turma'}</b><p>As informações da modalidade e da turma serão exibidas aqui.</p></section>
            <section className="admin-enrollment-modal__panel"><div className="admin-enrollment-modal__section-title"><Icon name="tab-personal" /><h3>Responsável</h3></div><div className="admin-enrollment-modal__form-grid"><Field label="Nome do responsável" value={form.responsavel} onChange={(value) => setField('responsavel', value)} className="wide" /><Field label="Telefone" value={form.telefoneResponsavel} onChange={(value) => setField('telefoneResponsavel', value)} placeholder="(00) 00000-0000" /><Field label="E-mail" type="email" value={form.emailResponsavel} onChange={(value) => setField('emailResponsavel', value)} placeholder="email@exemplo.com" /></div><label className="admin-enrollment-modal__check"><input type="checkbox" checked={minor} onChange={(event) => setMinor(event.target.checked)} />Aluno menor de idade</label></section>
            <section className="admin-enrollment-modal__panel"><div className="admin-enrollment-modal__section-title"><Icon name="document" /><h3>Observações</h3></div><textarea value={form.observacoes} onChange={(event) => setField('observacoes', event.target.value)} placeholder="Informações adicionais (opcional)..." maxLength={500} /><small className="admin-enrollment-modal__counter">{form.observacoes.length}/500</small><div className="admin-enrollment-modal__status"><span>Status da matrícula</span><label><input type="radio" name="enrollment-status" checked={form.status === 'Ativa'} onChange={() => setField('status', 'Ativa')} />Ativa</label><label><input type="radio" name="enrollment-status" checked={form.status === 'Pendente'} onChange={() => setField('status', 'Pendente')} />Pendente</label></div></section>
          </div>
        </div>

        {saveError && <p className="admin-enrollment-modal__error" role="alert">{saveError}</p>}
        <footer className="admin-enrollment-modal__footer"><button type="button" onClick={onClose}>Cancelar</button><button className="is-primary" type="submit" disabled={saving || saved}><Icon name="tab-enrollment" />{saved ? 'Matrícula criada!' : saving ? 'Salvando...' : 'Salvar matrícula'}</button></footer>
      </form>
    </section>
  </div>
}

function Field({ label, value, onChange, type = 'text', placeholder = '', required = false, className = '', prefix = '' }) {
  return <label className={'admin-enrollment-modal__field ' + className}><span>{label}{required && <b>*</b>}</span><div>{prefix && <em>{prefix}</em>}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} /></div></label>
}

function SelectField({ label, value, onChange, options, required = false }) {
  return <label className="admin-enrollment-modal__field"><span>{label}{required && <b>*</b>}</span><div><select value={value} onChange={(event) => onChange(event.target.value)} required={required}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></div></label>
}

function PeopleView({ view = 'alunos', data, list, setList, records, loading, error, refresh, openView, onSelect, turmas, classId, setClassId, onOpenClass }) {
  if (view === 'professores' || view === 'turmas') return <><PeopleTop data={data} openView={openView} /><PeopleDirectory view={view} list={list} setList={setList} records={records} loading={loading} error={error} refresh={refresh} openView={openView} onSelect={onSelect} onOpenClass={onOpenClass} /></>
  const stats = data.indicadores || {}
  const pending = data.pendencias?.matriculas || 0
  const options = filterOptions('alunos')
  const modalityOptions = [...new Set(['Ballet clássico', 'Jazz', 'Sapateado', ...(turmas || []).map((turma) => turma.modalidade).filter(Boolean)])].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  const [changingStudentId, setChangingStudentId] = useState(null)
  const [filtersOpen, setFiltersOpen] = useState(true)
  const change = (field, value) => setList((current) => ({ ...current, [field]: value, pagina: 0 }))
  const students = records?.registros || []
  const toggleStudentStatus = async (student) => {
    const nextStatus = /inativ/i.test(student.status || '') ? 'ativo' : 'inativo'
    setChangingStudentId(student.id)
    const { error: requestError } = await supabase.rpc('admin_alterar_status_aluno', { p_id_aluno: Number(student.id), p_status: nextStatus })
    setChangingStudentId(null)
    if (requestError) { window.alert(requestError.message || 'Não foi possível alterar o status do aluno.'); return }
    refresh()
  }
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
    </div>
    <div className={'admin-people-filters' + (filtersOpen ? ' is-open' : ' is-collapsed')}>
      <label className="admin-people-search"><Icon name="search" /><span className="admin-sr-only">Pesquisar alunos</span><input id="admin-people-search" placeholder="Pesquisar por nome, matrícula ou e-mail..." value={list.busca} onChange={(event) => change('busca', event.target.value)} /></label>
      <select aria-label="Filtrar status" value={list.filtro} onChange={(event) => change('filtro', event.target.value)}>{options.map(([value, label]) => <option key={value} value={value}>{value === '' ? 'Todos os status' : label}</option>)}</select>
      <select aria-label="Filtrar turma" value={classId} onChange={(event) => setClassId(event.target.value)}><option value="">Todas as turmas</option>{turmas?.map((turma) => <option key={turma.id} value={turma.id}>{turma.nome}</option>)}</select>
      <select aria-label="Filtrar modalidade" value={list.modalidade || ''} onChange={(event) => change('modalidade', event.target.value)}><option value="">Todas as modalidades</option>{modalityOptions.map((modality) => <option key={modality} value={modality}>{modality}</option>)}</select>
      <button type="button" className={'admin-people-filter-button' + (filtersOpen ? ' is-active' : '')} onClick={() => setFiltersOpen((current) => !current)} aria-expanded={filtersOpen}><Icon name="filter" /> Filtros</button>
    </div>
    {loading ? <StateMessage title="Carregando alunos..." loading /> : error ? <StateMessage title={error} action={refresh} /> : <div className="admin-people-table-wrap">
      <table className="admin-people-table"><thead><tr><th>Aluno</th><th>Matrícula</th><th>Turma</th><th>Modalidade</th><th>Status</th><th><span className="admin-sr-only">Ações</span></th></tr></thead><tbody>
        {students.map((student) => <tr key={student.id}>
          <td><button className="admin-people-student" type="button" onClick={() => onSelect({ ...student, _modulo: 'alunos' })}><Avatar name={student.nome} photo={student.foto} /><span><strong>{student.nome}</strong><small>{student.email || 'E-mail não informado'}<br />{student.telefone || 'Telefone não informado'}</small></span></button></td>
          <td>#{String(student.id).padStart(4, '0')}</td><td>{student.turma || '—'}</td><td>{student.modalidade || '—'}</td>
          <td><span className={'admin-people-status ' + (/pendente|aguardando/i.test(student.status || '') ? 'pending' : 'active')}>{student.status || 'Ativo'}</span></td>
          <td><button className="admin-people-view" type="button" onClick={() => onSelect({ ...student, _modulo: 'alunos' })} aria-label={'Ver perfil de ' + student.nome}><span>◉</span> Ver perfil</button><button className="admin-people-deactivate" type="button" onClick={() => toggleStudentStatus(student)} disabled={changingStudentId === student.id}>{changingStudentId === student.id ? '...' : /inativ/i.test(student.status || '') ? 'Ativar' : 'Desativar'}</button></td>
        </tr>)}
      </tbody></table>{!students.length && <p className="admin-list-empty">Nenhum aluno encontrado com estes filtros.</p>}
    </div>}
    {records && <div className="admin-pagination"><span>{records.total} aluno{records.total === 1 ? '' : 's'} encontrados</span><button disabled={!list.pagina} onClick={() => setList((current) => ({ ...current, pagina: current.pagina - 1 }))}>Anterior</button><button disabled={(list.pagina + 1) * 25 >= records.total} onClick={() => setList((current) => ({ ...current, pagina: current.pagina + 1 }))}>Próxima</button></div>}
  </section>
}
function PeopleTop({ data, openView }) {
  return <div className="admin-people-top"><header className="admin-people-heading"><div><h2>Gestão de Pessoas</h2><p>Gerencie alunos, professores e turmas do<br />Studio aqui.</p></div><div className="admin-people-heading-actions"><button type="button" aria-label="Pesquisar" onClick={() => document.getElementById('admin-people-search')?.focus()}><Icon name="search" /></button><button type="button" aria-label="Notificações" onClick={() => openView('notificacoes')}><Icon name="bell" /></button></div></header><div className="admin-people-stats"><PeopleStat icon="people" label="Alunos ativos" value={data.indicadores?.alunos_ativos} note="cadastros ativos" /><PeopleStat icon="dance" label="Professores" value={data.indicadores?.professores} note="profissionais ativos" /><PeopleStat icon="calendar" label="Turmas ativas" value={data.indicadores?.turmas_ativas} note="turmas do Studio" /><PeopleStat icon="document" label="Matrículas pendentes" value={data.pendencias?.matriculas || 0} note="aguardando aprovação" /></div></div>
}
function PeopleDirectory({ view, list, setList, records, loading, error, refresh, openView, onSelect, onOpenClass }) {
  const [roster, setRoster] = useState({})
  const [creating, setCreating] = useState(false)
  const [teacherModal, setTeacherModal] = useState(false)
  const [teacherForm, setTeacherForm] = useState({ nome: '', email: '', telefone: '', especialidade: '' })
  const [teacherError, setTeacherError] = useState('')
  const [detailClass, setDetailClass] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  useEffect(() => {
    if (view !== 'turmas') return undefined
    let active = true
    Promise.all((records?.registros || []).map((turma) => supabase.rpc('admin_listagem', { p_modulo: 'alunos', p_busca: '', p_filtro: '', p_inicio: null, p_fim: null, p_turma: Number(turma.id), p_pagina: 0 }).then(({ data: result }) => [turma.id, result?.registros || []]))).then((entries) => { if (!active) return; setRoster(Object.fromEntries(entries.map(([id, students]) => [id, students.map((student) => student.nome || 'Aluno')]))) })
    return () => { active = false }
  }, [view, records])
  const change = (value) => setList((current) => ({ ...current, busca: value, pagina: 0 }))
  const createTeacher = async (event) => { event.preventDefault(); if (!teacherForm.nome.trim()) { setTeacherError('Informe o nome do professor.'); return } setCreating(true); setTeacherError(''); const result = await supabase.from('professor').insert({ nome: teacherForm.nome.trim(), email: teacherForm.email.trim() || null, telefone: teacherForm.telefone.trim() || null, especialidade: teacherForm.especialidade.trim() || null, status: 'ativo' }); setCreating(false); if (result.error) setTeacherError(result.error.message || 'Não foi possível cadastrar o professor.'); else { setTeacherModal(false); setTeacherForm({ nome: '', email: '', telefone: '', especialidade: '' }); refresh() } }
  const rows = records?.registros || []
  const deleteClass = async (turma) => {
    if (!window.confirm(`Apagar a turma "${turma.nome}"? As matrículas e aulas vinculadas serão preservadas.`)) return
    setDeletingId(turma.id)
    const { error: requestError } = await supabase.rpc('excluir_turma_admin', { p_id_turma: Number(turma.id) })
    setDeletingId(null)
    if (requestError) { setDetailClass({ ...turma, _error: requestError.message || 'Não foi possível apagar a turma.' }); return }
    setDetailClass(null)
    refresh()
  }
  useEffect(() => {
    if (view !== 'turmas') return undefined
    const filterButton = document.querySelector('.admin-people-filter-button')
    if (filterButton) {
      filterButton.innerHTML = '<span aria-hidden="true">＋</span> Nova turma'
      filterButton.onclick = () => onOpenClass?.()
    }
    const table = document.querySelector('.admin-people-table')
    const header = table?.querySelector('thead tr')
    if (header && !header.querySelector('[data-class-actions-heading]')) {
      const cell = document.createElement('th'); cell.dataset.classActionsHeading = 'true'; cell.textContent = 'Ações'; header.appendChild(cell)
    }
    const tableRows = table?.querySelectorAll('tbody tr') || []
    tableRows.forEach((tableRow, index) => {
      tableRow.querySelector('[data-class-actions]')?.parentElement?.remove()
      const turma = rows[index]
      if (!turma) return
      const cell = document.createElement('td'); cell.className = 'admin-class-actions'; cell.dataset.classActions = 'true'
      const details = document.createElement('button'); details.type = 'button'; details.textContent = 'Detalhes'; details.onclick = () => onSelect?.({ ...turma, _modulo: 'turmas' })
      const edit = document.createElement('button'); edit.type = 'button'; edit.textContent = 'Editar'; edit.onclick = () => onOpenClass?.(turma)
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = deletingId === turma.id ? '...' : 'Apagar'; remove.className = 'is-danger'; remove.disabled = deletingId === turma.id; remove.onclick = () => deleteClass(turma)
      cell.append(details, edit, remove); tableRow.appendChild(cell)
    })
    return undefined
  }, [view, rows, onOpenClass, onSelect, deletingId])
  useEffect(() => {
    if (view !== 'professores') return undefined
    const button = document.querySelector('.admin-people-new')
    if (!button) return undefined
    const openTeacherModal = (event) => {
      event.preventDefault(); event.stopImmediatePropagation()
      if (document.querySelector('.admin-teacher-modal-backdrop')) return
      const backdrop = document.createElement('div'); backdrop.className = 'admin-teacher-modal-backdrop'
      backdrop.innerHTML = '<form class="admin-teacher-modal"><button type="button" class="admin-teacher-modal__close" aria-label="Fechar">×</button><h2>Cadastrar professor</h2><p>Preencha os dados do professor para adicioná-lo ao Studio.</p><label>Nome completo<input name="nome" required placeholder="Informe o nome completo" /></label><label>E-mail<input name="email" type="email" placeholder="professor@exemplo.com" /></label><label>Telefone<input name="telefone" placeholder="(00) 00000-0000" /></label><label>Especialidade<input name="especialidade" placeholder="Ex.: Ballet clássico" /></label><p class="admin-teacher-modal__error" role="alert"></p><footer><button type="button" class="admin-teacher-modal__cancel">Cancelar</button><button type="submit" class="admin-teacher-modal__submit">Cadastrar professor</button></footer></form>'
      document.body.appendChild(backdrop)
      const form = backdrop.querySelector('form')
      const definedModalities = ['Ballet clássico', 'Jazz', 'Sapateado']
      const modalityInputForOptions = form?.querySelector('[name="especialidade"]')
      const modalityLabelForOptions = modalityInputForOptions?.closest('label')
      if (modalityInputForOptions && modalityLabelForOptions) {
        modalityInputForOptions.type = 'hidden'
        const options = document.createElement('div'); options.className = 'admin-teacher-modal__modality-options'
        options.innerHTML = definedModalities.map((modality) => `<button type="button" data-modality-option="${modality}">${modality}</button>`).join('')
        modalityLabelForOptions.appendChild(options)
        options.querySelectorAll('[data-modality-option]').forEach((option) => { option.onclick = () => { const value = option.dataset.modalityOption; const values = (modalityInputForOptions.dataset.values || '').split('|').filter(Boolean); const next = values.includes(value) ? values.filter((item) => item !== value) : [...values, value]; modalityInputForOptions.dataset.values = next.join('|'); modalityInputForOptions.value = ''; option.classList.toggle('is-selected', next.includes(value)) } })
      }
      const modalityInput = backdrop.querySelector('[name="especialidade"]')
      const modalityLabel = modalityInput?.closest('label')
      if (modalityInput && modalityLabel) {
        modalityLabel.firstChild.textContent = 'Modalidades'
        modalityInput.placeholder = 'Digite uma modalidade e pressione Enter'
        modalityInput.dataset.values = ''
        const chips = document.createElement('div'); chips.className = 'admin-teacher-modal__chips'; modalityLabel.appendChild(chips)
        const addModality = () => { const value = modalityInput.value.trim().replace(/,$/, ''); if (!value) return; const values = [...new Set((modalityInput.dataset.values || '').split('|').filter(Boolean).concat(value))]; modalityInput.dataset.values = values.join('|'); modalityInput.value = ''; chips.innerHTML = values.map((item) => `<span>${item}<button type="button" data-remove-modality="${item}">×</button></span>`).join(''); chips.querySelectorAll('[data-remove-modality]').forEach((removeButton) => { removeButton.onclick = () => { modalityInput.dataset.values = (modalityInput.dataset.values || '').split('|').filter((item) => item !== removeButton.dataset.removeModality).join('|'); removeButton.parentElement.remove() } }) }
        modalityInput.addEventListener('keydown', (keyEvent) => { if (keyEvent.key === 'Enter' || keyEvent.key === ',') { keyEvent.preventDefault(); addModality() } })
        form?.addEventListener('submit', () => { addModality(); modalityInput.value = (modalityInput.dataset.values || '').split('|').filter(Boolean).join(', ') }, true)
      }
      const close = () => backdrop.remove(); backdrop.querySelector('.admin-teacher-modal__close').onclick = close; backdrop.querySelector('.admin-teacher-modal__cancel').onclick = close
      form.onsubmit = async (submitEvent) => { submitEvent.preventDefault(); const fields = new FormData(form); const submit = form.querySelector('.admin-teacher-modal__submit'); const errorMessage = form.querySelector('.admin-teacher-modal__error'); submit.disabled = true; submit.textContent = 'Salvando...'; const result = await supabase.from('professor').insert({ nome: String(fields.get('nome') || '').trim(), email: String(fields.get('email') || '').trim() || null, telefone: String(fields.get('telefone') || '').trim() || null, especialidade: String(fields.get('especialidade') || '').trim() || null, status: 'ativo' }); if (result.error) { errorMessage.textContent = result.error.message || 'Não foi possível cadastrar o professor.'; submit.disabled = false; submit.textContent = 'Cadastrar professor' } else { close(); refresh() } }
    }
    button.addEventListener('click', openTeacherModal, true)
    return () => button.removeEventListener('click', openTeacherModal, true)
  }, [view, refresh])
  return <section className="admin-people" aria-busy={loading}><header className="admin-people-heading"><div><h2>Gestão de Pessoas</h2><p>Alunos, professores e turmas em uma única gestão.</p></div></header><div className="admin-people-toolbar"><div className="admin-people-tabs" role="tablist"><button type="button" className={view === 'alunos' ? 'is-active' : ''} onClick={() => openView('alunos')}>Alunos</button><button type="button" className={view === 'professores' ? 'is-active' : ''} onClick={() => openView('professores')}>Professores</button><button type="button" className={view === 'turmas' ? 'is-active' : ''} onClick={() => openView('turmas')}>Turmas</button></div>{view === 'professores' && <button className="admin-people-new" type="button" onClick={createTeacher} disabled={creating}>{creating ? 'Salvando...' : '+ Novo professor'}</button>}</div><div className="admin-people-filters"><label className="admin-people-search"><Icon name="search" /><input value={list.busca} onChange={(event) => change(event.target.value)} placeholder={view === 'professores' ? 'Pesquisar professor...' : 'Pesquisar turma...'} /></label><button type="button" className="admin-people-filter-button" onClick={refresh}><Icon name="filter" /> Atualizar</button></div>{loading ? <StateMessage title="Carregando dados..." loading /> : error ? <StateMessage title={error} action={refresh} /> : <div className="admin-people-table-wrap"><table className="admin-people-table"><thead>{view === 'professores' ? <tr><th>Professor</th><th>Especialidade</th><th>E-mail</th><th>Status</th></tr> : <tr><th>Turma</th><th>Modalidade</th><th>Professor</th><th>Alunos matriculados</th><th>Horário</th><th>Status</th></tr>}</thead><tbody>{rows.map((row) => view === 'professores' ? <tr key={row.id}><td><strong>{row.nome || 'Professor'}</strong></td><td>{row.especialidade || '—'}</td><td>{row.email || '—'}</td><td><span className="admin-people-status active">{row.status || 'Ativo'}</span></td></tr> : <tr key={row.id}><td><strong>{row.nome || 'Turma'}</strong></td><td>{row.modalidade || '—'}</td><td>{row.professora || '—'}</td><td title={(roster[row.id] || []).join(', ')}>{roster[row.id]?.length || 0}{roster[row.id]?.length ? ` · ${(roster[row.id] || []).slice(0, 2).join(', ')}` : ''}</td><td>{row.dia || '—'} · {String(row.horario || '').slice(0, 5) || '—'}</td><td><span className="admin-people-status active">{row.status || 'Ativo'}</span></td></tr>)}</tbody></table>{!rows.length && <p className="admin-list-empty">Nenhum registro encontrado.</p>}</div>}</section>
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
function TurmasView({ onBack, onOpenClass }) {
  const [turmas, setTurmas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const loadClasses = () => {
    setLoading(true)
    setError('')
    supabase.rpc('listar_turmas_admin').then(({ data, error: requestError }) => {
      if (requestError || !Array.isArray(data)) setError(requestError?.message || 'Não foi possível carregar as turmas.')
      else setTurmas(data)
      setLoading(false)
    }).catch(() => { setError('Não foi possível conectar ao banco.'); setLoading(false) })
  }
  useEffect(() => { loadClasses() }, [])
  return <section className="admin-classes-view" aria-busy={loading}>
    <header className="admin-classes-view__heading"><div><button className="admin-back" type="button" onClick={onBack}>← Visão geral</button><h2>Turmas</h2><p>Cadastre e administre as turmas disponíveis no Studio.</p></div><button className="admin-action" type="button" onClick={() => onOpenClass()}>Cadastrar turma</button></header>
    {loading ? <StateMessage title="Carregando turmas..." loading /> : error ? <StateMessage title={error} action={loadClasses} /> : <div className="admin-classes-table-wrap"><table className="admin-classes-table"><thead><tr><th>Turma</th><th>Modalidade</th><th>Professora</th><th>Dia e horário</th><th>Vagas</th><th>Status</th><th>Ação</th></tr></thead><tbody>{turmas.map((turma) => <tr key={turma.id}><td><strong>{turma.nome}</strong></td><td>{turma.modalidade || '—'}</td><td>{turma.professora || '—'}</td><td>{turma.dia || '—'} · {String(turma.horario || '').slice(0, 5) || '—'}</td><td>{turma.capacidade || '—'}</td><td><span className="admin-class-status">{turma.status || 'ativo'}</span></td><td><button type="button" onClick={() => onOpenClass(turma)}>Editar</button></td></tr>)}</tbody></table>{!turmas.length && <p className="admin-list-empty">Nenhuma turma cadastrada.</p>}</div>}
  </section>
}

function AgendaView({ today, openView }) {
  const [cursor, setCursor] = useState(() => new Date(today + 'T12:00:00'))
  const [selectedDate, setSelectedDate] = useState(today)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const monthTitle = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(cursor)
  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1, 12)
  const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 12)
  const isoDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const loadAgenda = () => {
    setLoading(true)
    setError('')
    supabase.rpc('admin_listagem', { p_modulo: 'agenda', p_busca: '', p_filtro: '', p_inicio: isoDate(monthStart), p_fim: isoDate(monthEnd), p_turma: null, p_pagina: 0 }).then(({ data, error: requestError }) => {
      if (requestError || !data) setError(requestError?.message || 'Não foi possível carregar a agenda.')
      else setEvents(data.registros || [])
      setLoading(false)
    }).catch(() => { setError('Não foi possível conectar ao banco.'); setLoading(false) })
  }
  useEffect(() => { loadAgenda() }, [cursor.getFullYear(), cursor.getMonth()])
  useEffect(() => {
    const notice = document.querySelector('.admin-agenda-notice')
    const publishButton = notice?.querySelector('button:last-child')
    if (!notice || !publishButton) return undefined
    const fields = notice.querySelectorAll('input, select, textarea')
    const publish = async () => {
      const title = fields[0]?.value?.trim()
      const recipients = 'alunos'
      const type = fields[2]?.value || 'Informativo'
      const date = fields[3]?.value || today
      const message = fields[4]?.value?.trim()
      const fixed = Boolean(fields[5]?.checked)
      const whatsapp = Boolean(fields[6]?.checked)
      if (!title || !message) {
        window.alert('Informe o título e a mensagem do aviso.')
        return
      }
      publishButton.disabled = true
      publishButton.textContent = 'Publicando...'
      const { data, error: requestError } = await supabase.rpc('publicar_aviso_admin', { p_titulo: title, p_conteudo: message, p_data_publicacao: date, p_tipo: type, p_destinatarios: recipients, p_fixar: fixed, p_enviar_whatsapp: whatsapp })
      publishButton.disabled = false
      publishButton.textContent = '+ Publicar aviso'
      if (requestError) {
        window.alert(requestError.message || 'Não foi possível publicar o aviso.')
        return
      }
      if (fields[0]) fields[0].value = ''
      if (fields[4]) fields[4].value = ''
      const totalRecipients = Number(data?.destinatarios || 0)
      window.alert(totalRecipients ? `Aviso publicado para ${totalRecipients} aluno(s).` : 'Aviso salvo, mas nenhum aluno possui uma conta vinculada para receber a notificação.')
    }
    publishButton.addEventListener('click', publish)
    return () => publishButton.removeEventListener('click', publish)
  }, [cursor.getFullYear(), cursor.getMonth(), today])
  const cells = Array.from({ length: 42 }, (_, index) => {
    const firstDay = (monthStart.getDay() + 6) % 7
    const date = new Date(monthStart)
    date.setDate(index - firstDay + 1)
    return date
  })
  const selectedEvents = events.filter((event) => event.data === selectedDate)
  const eventFor = (date) => events.filter((event) => event.data === isoDate(date))
  const shiftMonth = (amount) => { const next = new Date(cursor); next.setMonth(next.getMonth() + amount); setCursor(next); setSelectedDate(isoDate(new Date(next.getFullYear(), next.getMonth(), 1, 12))) }
  return <section className="admin-agenda-view" aria-busy={loading}>
    <header className="admin-agenda-view__heading"><div><h2>Agenda Administrativa</h2><p>Organize aulas, compromissos e avisos do Studio.</p></div><div className="admin-agenda-view__actions"><button type="button" aria-label="Pesquisar" onClick={() => openView('busca')}><Icon name="search" /></button><button type="button" aria-label="Notificações" onClick={() => openView('notificacoes')}><Icon name="bell" /></button></div></header>
    <div className="admin-agenda-toolbar"><div className="admin-agenda-month"><button type="button" aria-label="Mês anterior" onClick={() => shiftMonth(-1)}>‹</button><strong>{monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1)}</strong><button type="button" aria-label="Próximo mês" onClick={() => shiftMonth(1)}>›</button></div><div className="admin-agenda-filters"><button type="button" onClick={() => { setCursor(new Date(today + 'T12:00:00')); setSelectedDate(today) }}>Hoje</button><button type="button">Ver mês</button><button type="button">Aulas</button><button type="button">Ensaios</button><button type="button">Espetáculos</button><button type="button">Avisos</button><button type="button" onClick={() => { setEvents([]); setSelectedDate(today) }}>Limpar filtros</button></div></div>
    <div className="admin-agenda-layout"><section className="admin-agenda-calendar"><div className="admin-agenda-weekdays">{['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => <span key={day + index}>{day}</span>)}</div><div className="admin-agenda-grid">{cells.map((date) => { const dateKey = isoDate(date); const dayEvents = eventFor(date); const outside = date.getMonth() !== cursor.getMonth(); return <button key={dateKey} type="button" className={'admin-agenda-day' + (outside ? ' is-outside' : '') + (dateKey === selectedDate ? ' is-selected' : '')} onClick={() => setSelectedDate(dateKey)}><time>{date.getDate()}</time>{dayEvents.slice(0, 2).map((event, index) => <span key={event.id || index} className={'admin-agenda-dot admin-agenda-dot--' + (index % 3)} title={event.nome}>{event.nome}</span>)}</button> })}</div></section><aside className="admin-agenda-side"><section className="admin-agenda-day-panel"><h3>Agenda do dia</h3><strong>{dateLabel(selectedDate, { day: '2-digit', month: 'long' })}</strong>{selectedEvents.length ? selectedEvents.map((event, index) => <p key={event.id || index}><i className={'admin-agenda-dot admin-agenda-dot--' + (index % 3)} />{event.inicio?.slice(0, 5) || '—'} — {event.nome || 'Compromisso'}<small>{event.modalidade || event.professora || 'Studio'}</small></p>) : <p className="admin-agenda-empty">Nenhum compromisso neste dia.</p>}</section><section className="admin-agenda-commitment"><h3>Novo compromisso</h3><p>Adicione um compromisso à agenda administrativa.</p><button type="button" onClick={() => { const field = document.querySelector('.admin-agenda-notice__title input'); field?.scrollIntoView({ behavior: 'smooth', block: 'center' }); field?.focus() }}>+ Adicionar à agenda</button></section></aside></div>
    <div className="admin-agenda-bottom"><img className="admin-agenda-notice-art" src={centralAvisoImage} alt="Central de avisos: crie um aviso para comunicar alunos, professores ou responsáveis." /><section className="admin-agenda-notice"><label className="admin-agenda-notice__title">Título do aviso<input placeholder="Ex: Alteração no horário da aula." /></label><label>Destinatários<select><option>Selecionar destinatários</option><option>Todos os alunos</option><option>Professores</option><option>Responsáveis</option></select></label><label>Tipo de aviso<select><option>Informativo</option><option>Urgente</option></select></label><label>Data de publicação<input type="date" defaultValue="2026-09-23" /></label><label className="admin-agenda-notice__message">Mensagem<textarea placeholder="Digite aqui o conteúdo do aviso..." /></label><div className="admin-agenda-notice__options"><label><input type="checkbox" defaultChecked /> Fixar aviso</label><label><input type="checkbox" /> Enviar no WhatsApp</label></div><div><button type="button">Cancelar</button><button type="button">Publicar aviso</button></div></section></div>
  </section>
}

function ClassModal({ turma, onClose, onSaved }) {
  const [form, setForm] = useState({ nome: turma?.nome || '', modalidade: turma?.modalidade || '', professora: turma?.professora || '', dia: turma?.dia || 'segunda-feira', horario: String(turma?.horario || '').slice(0, 5), capacidade: turma?.capacidade || 20, status: turma?.status || 'ativo' })
  const [modalities, setModalities] = useState(() => turma?.modalidade ? [turma.modalidade] : [])
  const [professors, setProfessors] = useState(() => turma?.professora ? [{ nome: turma.professora }] : [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  useEffect(() => {
    let active = true
    supabase.rpc('listar_turmas_admin').then(({ data, error: requestError }) => {
      if (!active || requestError || !Array.isArray(data)) return
      const values = [...new Set(data.map((item) => item.modalidade).filter(Boolean))]
      setModalities((current) => [...new Set([...current, ...values])])
    }).catch(() => {})
    supabase.from('professor').select('nome').eq('status', 'ativo').order('nome').then(({ data }) => {
      if (!active || !Array.isArray(data)) return
      setProfessors((current) => [...new Map([...current, ...data].filter((item) => item.nome).map((item) => [item.nome, item])).values()])
    }).catch(() => {})
    return () => { active = false }
  }, [])
  useEffect(() => {
    const label = [...document.querySelectorAll('.admin-class-modal label')].find((item) => item.textContent.includes('Professora'))
    const input = label?.querySelector('input')
    if (!label || !input || !professors.length || label.querySelector('select')) return undefined
    const select = document.createElement('select')
    select.required = true
    select.innerHTML = '<option value="">Selecione uma professora</option>' + professors.map((professor) => `<option value="${String(professor.nome).replaceAll('"', '&quot;')}">${professor.nome}</option>`).join('')
    select.value = form.professora
    select.onchange = () => setField('professora', select.value)
    input.replaceWith(select)
    return undefined
  }, [professors, form.professora])
  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    const { error: requestError } = await supabase.rpc('salvar_turma_admin', { p_id_turma: turma?.id || null, p_nome: form.nome, p_modalidade: form.modalidade, p_professora: form.professora, p_dia_semana: form.dia, p_horario: form.horario || null, p_capacidade: Number(form.capacidade), p_status: form.status })
    if (requestError) { setError(requestError.message || 'Não foi possível salvar a turma.'); setSaving(false); return }
    onSaved()
  }
  return <div className="admin-class-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="admin-class-modal" role="dialog" aria-modal="true" aria-labelledby="class-modal-title" onMouseDown={(event) => event.stopPropagation()}><button className="admin-class-modal__close" type="button" onClick={onClose} aria-label="Fechar"><Icon name="close" /></button><h2 id="class-modal-title">{turma ? 'Editar turma' : 'Cadastrar turma'}</h2><p>Preencha os dados da turma e salve para disponibilizá-la nas matrículas.</p><form onSubmit={submit}><div className="admin-class-form-grid"><Field label="Nome da turma" required value={form.nome} onChange={(value) => setField('nome', value)} className="wide" /><label className="admin-enrollment-modal__field"><span>Modalidade<b>*</b></span><select value={form.modalidade} onChange={(event) => setField('modalidade', event.target.value)} required><option value="">Selecione uma modalidade</option>{modalities.map((modality) => <option key={modality} value={modality}>{modality}</option>)}</select></label><Field label="Professora" required value={form.professora} onChange={(value) => setField('professora', value)} /><label className="admin-enrollment-modal__field"><span>Dia da semana<b>*</b></span><select value={form.dia} onChange={(event) => setField('dia', event.target.value)}>{['segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'].map((day) => <option key={day}>{day}</option>)}</select></label><Field label="Horário" type="time" required value={form.horario} onChange={(value) => setField('horario', value)} /><Field label="Capacidade" type="number" required value={form.capacidade} onChange={(value) => setField('capacidade', value)} /><label className="admin-enrollment-modal__field"><span>Status</span><select value={form.status} onChange={(event) => setField('status', event.target.value)}><option value="ativo">Ativa</option><option value="inativo">Inativa</option></select></label></div>{error && <p className="admin-class-modal__error" role="alert">{error}</p>}<footer><button type="button" onClick={onClose}>Cancelar</button><button className="is-primary" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar turma'}</button></footer></form></section></div>
}

function ClassModalFixed({ turma, onClose, onSaved }) {
  const [form, setForm] = useState({ nome: turma?.nome || '', modalidade: turma?.modalidade || '', professora: turma?.professora || '', dia: turma?.dia || 'segunda-feira', horario: String(turma?.horario || '').slice(0, 5), capacidade: turma?.capacidade || 20, status: turma?.status || 'ativo' })
  const [modalities, setModalities] = useState(['Ballet clássico', 'Jazz', 'Sapateado'])
  const [professors, setProfessors] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  useEffect(() => {
    let active = true
    Promise.all([
      supabase.rpc('listar_turmas_admin'),
      supabase.rpc('admin_listagem', { p_modulo: 'professores', p_busca: '', p_filtro: 'ativos', p_inicio: null, p_fim: null, p_turma: null, p_pagina: 0 }),
    ]).then(([classes, teachers]) => {
      if (!active) return
      const classModalities = Array.isArray(classes.data) ? classes.data.map((item) => item.modalidade).filter(Boolean) : []
      const teacherRows = teachers.data?.registros || []
      setModalities((current) => [...new Set([...current, ...classModalities, turma?.modalidade].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')))
      setProfessors([...new Map([...teacherRows.map((item) => ({ nome: item.nome })), turma?.professora ? { nome: turma.professora } : null].filter((item) => item?.nome).map((item) => [item.nome, item])).values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')))
    }).catch(() => {
      if (turma?.professora) setProfessors([{ nome: turma.professora }])
    })
    return () => { active = false }
  }, [turma])

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    const { error: requestError } = await supabase.rpc('salvar_turma_admin', { p_id_turma: turma?.id || null, p_nome: form.nome, p_modalidade: form.modalidade, p_professora: form.professora, p_dia_semana: form.dia, p_horario: form.horario || null, p_capacidade: Number(form.capacidade), p_status: form.status })
    if (requestError) { setError(requestError.message || 'Não foi possível salvar a turma.'); setSaving(false); return }
    onSaved()
  }

  return <div className="admin-class-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="admin-class-modal" role="dialog" aria-modal="true" aria-labelledby="class-modal-fixed-title" onMouseDown={(event) => event.stopPropagation()}><button className="admin-class-modal__close" type="button" onClick={onClose} aria-label="Fechar"><Icon name="close" /></button><h2 id="class-modal-fixed-title">{turma ? 'Editar turma' : 'Cadastrar turma'}</h2><p>Preencha os dados da turma e salve para disponibilizá-la nas matrículas.</p><form onSubmit={submit}><div className="admin-class-form-grid"><Field label="Nome da turma" required value={form.nome} onChange={(value) => setField('nome', value)} className="wide" /><label className="admin-enrollment-modal__field"><span>Modalidade<b>*</b></span><div><select value={form.modalidade} onChange={(event) => setField('modalidade', event.target.value)} required><option value="">Selecione uma modalidade</option>{modalities.map((modality) => <option key={modality} value={modality}>{modality}</option>)}</select></div></label><label className="admin-enrollment-modal__field"><span>Professora<b>*</b></span><div><select value={form.professora} onChange={(event) => setField('professora', event.target.value)} required><option value="">Selecione uma professora</option>{professors.map((professor) => <option key={professor.nome} value={professor.nome}>{professor.nome}</option>)}</select></div></label><label className="admin-enrollment-modal__field"><span>Dia da semana<b>*</b></span><div><select value={form.dia} onChange={(event) => setField('dia', event.target.value)}>{['segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'].map((day) => <option key={day}>{day}</option>)}</select></div></label><Field label="Horário" type="time" required value={form.horario} onChange={(value) => setField('horario', value)} /><Field label="Capacidade" type="number" required value={form.capacidade} onChange={(value) => setField('capacidade', value)} /><label className="admin-enrollment-modal__field"><span>Status</span><div><select value={form.status} onChange={(event) => setField('status', event.target.value)}><option value="ativo">Ativa</option><option value="inativo">Inativa</option></select></div></label></div>{error && <p className="admin-class-modal__error" role="alert">{error}</p>}<footer><button type="button" onClick={onClose}>Cancelar</button><button className="is-primary" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar turma'}</button></footer></form></section></div>
}

function FinanceiroView({ data, list, setList, records, loading, error, refresh, openView }) {
  const [financeSummary, setFinanceSummary] = useState(null)
  const [activeChartIndex, setActiveChartIndex] = useState(null)
  const [billingRows, setBillingRows] = useState([])
  const [billingSavingId, setBillingSavingId] = useState(null)
  useEffect(() => {
    let active = true
    const loadFinanceData = async () => {
      const [{ data: summary, error: summaryError }, { data: kanban, error: kanbanError }] = await Promise.all([
        supabase.rpc('admin_resumo_financeiro'),
        supabase.rpc('admin_mensalidades_kanban'),
      ])
      if (!active) return
      if (!summaryError && summary) setFinanceSummary(summary)
      if (!kanbanError && Array.isArray(kanban)) setBillingRows(kanban)
    }
    loadFinanceData().catch(() => {})
    const interval = window.setInterval(() => loadFinanceData().catch(() => {}), 30000)
    const onVisibilityChange = () => { if (document.visibilityState === 'visible') loadFinanceData().catch(() => {}) }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => { active = false; window.clearInterval(interval); document.removeEventListener('visibilitychange', onVisibilityChange) }
  }, [records?.pagina])
  useEffect(() => {
    if (!financeSummary) return
    const growth = document.querySelector('.admin-finance-growth strong')
    const target = document.querySelector('.admin-finance-target strong')
    const revenueBadge = document.querySelector('.admin-finance-stats .is-revenue em')
    const revenueCard = document.querySelector('.admin-finance-stats .is-revenue')
    const paidCard = document.querySelector('.admin-finance-stats .is-paid')
    const openCard = document.querySelector('.admin-finance-stats .is-open')
    const overdueCard = document.querySelector('.admin-finance-stats .is-overdue')
    if (growth) growth.textContent = `${Number(financeSummary.crescimento || 0) >= 0 ? '+' : ''}${Number(financeSummary.crescimento || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
    if (target) target.textContent = money(financeSummary.receita_mes)
    if (revenueBadge) revenueBadge.textContent = `${Number(financeSummary.crescimento || 0) >= 0 ? '↑' : '↓'} ${Math.abs(Number(financeSummary.crescimento || 0)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
    if (revenueCard) {
      const value = revenueCard.querySelector('strong')
      const note = revenueCard.querySelector('span:not(.admin-finance-stat-icon)')
      if (value) value.textContent = money(financeSummary.receita_mes)
      if (note) note.textContent = `${Number(financeSummary.crescimento || 0) >= 0 ? '↑' : '↓'} ${Math.abs(Number(financeSummary.crescimento || 0)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% em relação ao mês anterior`
    }
    if (paidCard) {
      const value = paidCard.querySelector('strong')
      const note = paidCard.querySelector('span:not(.admin-finance-stat-icon)')
      if (value) value.textContent = money(financeSummary.recebido_mes)
      if (note) note.textContent = financeSummary.receita_mes ? `${((Number(financeSummary.recebido_mes || 0) / Number(financeSummary.receita_mes)) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% da receita prevista` : 'Sem receita prevista'
    }
    if (openCard) {
      const value = openCard.querySelector('strong')
      const note = openCard.querySelector('span:not(.admin-finance-stat-icon)')
      if (value) value.textContent = money(financeSummary.aberto)
      if (note) note.textContent = `${financeSummary.status?.em_aberto || 0} mensalidades pendentes`
    }
    if (overdueCard) {
      const badge = overdueCard.querySelector('b')
      const value = overdueCard.querySelector('strong')
      const note = overdueCard.querySelector('span:not(.admin-finance-stat-icon)')
      if (badge) badge.textContent = String(financeSummary.status?.atrasado || 0)
      if (value) value.textContent = money(financeSummary.atrasado)
      if (note) note.textContent = `${financeSummary.status?.atrasado || 0} pagamentos em atraso`
    }
  }, [financeSummary])
  const rows = billingRows.length ? billingRows : (records?.registros || [])
  const today = new Date()
  const billingBoardRows = rows.filter((row) => {
    const status = String(row.status || '').toLowerCase()
    const isPaid = /pago|paga|quitad/.test(status)
    const dateValue = row.data || row.vencimento
    const dueDate = dateValue ? new Date(`${String(dateValue).slice(0, 10)}T12:00:00`) : null
    const isOverdue = !isPaid && dueDate instanceof Date && !Number.isNaN(dueDate.getTime()) && dueDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const isCurrentMonth = dueDate instanceof Date && !Number.isNaN(dueDate.getTime()) && dueDate.getFullYear() === today.getFullYear() && dueDate.getMonth() === today.getMonth()
    return isCurrentMonth || isOverdue
  })
  const totalOpen = Number(financeSummary?.aberto ?? rows.reduce((sum, row) => sum + Number(row.saldo || row.valor || 0), 0))
  const totalBilled = Number(financeSummary?.receita_mes ?? rows.reduce((sum, row) => sum + Number(row.valor || 0), 0))
  const overdue = Number(financeSummary?.status?.atrasado ?? rows.filter((row) => /venc|atras|aberto/i.test(String(row.status || ''))).length)
  const paid = Number(financeSummary?.status?.pago ?? 0)
  const updateSearch = (event) => setList((current) => ({ ...current, busca: event.target.value, pagina: 0 }))
  const summaryMonths = Array.isArray(financeSummary?.evolucao) ? financeSummary.evolucao : []
  const monthLabels = summaryMonths.length ? summaryMonths.map((item) => new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(item.mes + 'T12:00:00')).replace('.', '')) : ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
  const monthValues = summaryMonths.length ? summaryMonths.map((item) => Number(item.recebido || 0)) : []
  const maxMonth = Math.max(...monthValues, 1)
  const chartBase = Math.max(...summaryMonths.flatMap((item) => [Number(item.recebido || 0), Number(item.previsto || 0)]), 1)
  const receivedLine = summaryMonths.length ? summaryMonths.map((item) => Math.max(8, (Number(item.recebido || 0) / chartBase) * 92)) : [38, 37, 54, 68, 82, 91]
  const plannedLine = summaryMonths.length ? summaryMonths.map((item) => Math.max(8, (Number(item.previsto || 0) / chartBase) * 92)) : [42, 43, 61, 73, 88, 100]
  const chartX = (index) => 24 + index * 49
  const chartY = (value) => 118 - value
  const chartItems = summaryMonths.length ? summaryMonths : monthLabels.map((month, index) => ({ mes: month, recebido: monthValues[index] || 0, previsto: 0 }))
  const activeChartItem = activeChartIndex === null ? null : chartItems[activeChartIndex]
  const activeChartDate = activeChartItem?.mes && /^\d{4}-\d{2}-\d{2}$/.test(String(activeChartItem.mes))
    ? `${activeChartItem.mes}T12:00:00`
    : activeChartItem?.mes && /^\d{4}-\d{2}$/.test(String(activeChartItem.mes))
      ? `${activeChartItem.mes}-01T12:00:00`
      : null
  const activeChartMonth = activeChartDate
    ? new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(activeChartDate))
    : activeChartItem?.mes || ''
  const activeChartPosition = activeChartIndex === null ? undefined : {
    left: `${(chartX(activeChartIndex) / 280) * 100}%`,
    top: `${Math.max(8, (chartY(receivedLine[activeChartIndex]) / 150) * 100)}%`,
  }
  const [billingLaneById, setBillingLaneById] = useState({})
  const [draggingBillingId, setDraggingBillingId] = useState(null)
  const billingLaneFor = (row) => {
    const id = row.id || row.chave
    if (billingLaneById[id]) return billingLaneById[id]
    const status = String(row.status || '').toLowerCase()
    if (/pago|paga|quitad/.test(status)) return 'pago'
    if (/atras|vencid/.test(status) || (row.data && new Date(row.data) < new Date())) return 'atrasado'
    if (/aberto|pendente/.test(status)) return 'aberto'
    return 'receber'
  }
  const billingColumns = [
    ['receber', 'A receber', 'is-receivable'],
    ['aberto', 'Em aberto', 'is-open'],
    ['atrasado', 'Atrasado', 'is-overdue'],
    ['pago', 'Pago', 'is-paid'],
  ]
  const moveBilling = async (id, lane) => {
    const statusByLane = { receber: 'A Vencer', aberto: 'Em Aberto', atrasado: 'Atrasado', pago: 'Pago' }
    const status = statusByLane[lane]
    const previousLane = billingLaneFor(billingRows.find((row) => (row.id || row.chave) === id) || {})
    setBillingLaneById((current) => ({ ...current, [id]: lane }))
    setBillingSavingId(id)
    const { error: requestError } = await supabase.rpc('admin_atualizar_status_mensalidade', { p_id_mensalidade: Number(id), p_status: status })
    setBillingSavingId(null)
    if (requestError) {
      setBillingLaneById((current) => ({ ...current, [id]: previousLane }))
      window.alert(requestError.message || 'Não foi possível atualizar o status da mensalidade.')
      return
    }
    setBillingRows((current) => current.map((row) => (row.id || row.chave) === id ? { ...row, status } : row))
    const [{ data: refreshedSummary }, { data: refreshedKanban }] = await Promise.all([
      supabase.rpc('admin_resumo_financeiro'),
      supabase.rpc('admin_mensalidades_kanban'),
    ])
    if (refreshedSummary) setFinanceSummary(refreshedSummary)
    if (Array.isArray(refreshedKanban)) setBillingRows(refreshedKanban)
  }
  const receivedPoints = receivedLine.map((value, index) => `${chartX(index)},${chartY(value)}`).join(' ')
  const plannedPoints = plannedLine.map((value, index) => `${chartX(index)},${chartY(value)}`).join(' ')
  useEffect(() => {
    const chart = document.querySelector('.admin-finance-line-chart')
    if (!chart) return undefined
    const points = [...chart.querySelectorAll('svg circle')]
    const enter = (event) => setActiveChartIndex(points.indexOf(event.currentTarget))
    const leave = () => setActiveChartIndex(null)
    points.forEach((point) => {
      point.addEventListener('mouseenter', enter)
      point.addEventListener('focus', enter)
      point.addEventListener('mouseleave', leave)
      point.addEventListener('blur', leave)
    })
    return () => points.forEach((point) => {
      point.removeEventListener('mouseenter', enter)
      point.removeEventListener('focus', enter)
      point.removeEventListener('mouseleave', leave)
      point.removeEventListener('blur', leave)
    })
  }, [summaryMonths.length])
  useEffect(() => {
    const tooltip = document.querySelector('.admin-finance-chart-tooltip')
    if (!tooltip) return
    tooltip.classList.toggle('admin-finance-chart-tooltip--active', activeChartItem !== null)
    if (!activeChartItem) return
    const title = tooltip.querySelector('strong')
    const spans = tooltip.querySelectorAll('span')
    if (title) title.textContent = activeChartMonth
    if (spans[0]) spans[0].textContent = `Recebido: ${money(activeChartItem.recebido)}`
    if (spans[1]) spans[1].textContent = `Previsto: ${money(activeChartItem.previsto)}`
    const chart = tooltip.closest('.admin-finance-line-chart')
    const svg = chart?.querySelector('svg')
    if (chart && svg && activeChartIndex !== null) {
      const chartRect = chart.getBoundingClientRect()
      const svgRect = svg.getBoundingClientRect()
      tooltip.style.left = `${svgRect.left - chartRect.left + (chartX(activeChartIndex) / 280) * svgRect.width}px`
      tooltip.style.top = `${svgRect.top - chartRect.top + (chartY(receivedLine[activeChartIndex]) / 150) * svgRect.height}px`
    } else {
      Object.assign(tooltip.style, activeChartPosition || {})
    }
  }, [activeChartItem, activeChartMonth, activeChartPosition])
  const statusGroups = [
    ['A vencer', Number(financeSummary?.status?.a_vencer ?? Math.max(0, rows.length - overdue)), 'is-green'],
    ['Em aberto', Number(financeSummary?.status?.em_aberto ?? Math.max(0, overdue - Math.round(overdue * .35))), 'is-yellow'],
    ['Atrasado', overdue, 'is-red'],
    ['Pago', paid, 'is-blue'],
  ]
  return <section className="admin-finance-view" aria-busy={loading}>
    <header className="admin-finance-heading"><div><h2>Gestão Geral</h2><p>Acompanhe o andamento financeiro, notificações e relatórios sobre o Studio.</p></div><div className="admin-finance-heading__actions"><button className="is-active" type="button">Financeiro</button><button type="button" onClick={() => openView('notificacoes')}>Notificações</button><button type="button" onClick={() => openView('relatorios')}>Relatórios</button><button type="button" aria-label="Pesquisar" onClick={() => document.querySelector('.admin-finance-table-actions input')?.focus()}><Icon name="search" /></button><button type="button" aria-label="Notificações" onClick={() => openView('notificacoes')}><Icon name="bell" /></button></div></header>
    <div className="admin-finance-toolbar"><div><h3>Financeiro</h3><p>Visão geral das movimentações financeiras</p></div><span>Período atual</span><button type="button" onClick={() => setList((current) => ({ ...current, filtro: current.filtro === 'vencidas' ? '' : 'vencidas', pagina: 0 }))}>{list.filtro === 'vencidas' ? 'Todas as mensalidades' : 'Ver vencidas'}</button></div>
    <div className="admin-finance-stats"><article className="is-revenue"><div className="admin-finance-stat-top"><span className="admin-finance-stat-icon"><Icon name="tab-evolution" /></span><em>↑ 4,4%</em></div><small>Receita do mês</small><strong>{money(totalBilled || totalOpen)}</strong><span>↑ 3,4% em relação ao mês anterior</span></article><article className="is-paid"><div className="admin-finance-stat-top"><span className="admin-finance-stat-icon"><Icon name="tab-documents" /></span></div><small>Recebido</small><strong>{money(Math.max(0, totalBilled - totalOpen))}</strong><span>88,6% da receita prevista</span></article><article className="is-open"><div className="admin-finance-stat-top"><span className="admin-finance-stat-icon"><Icon name="enroll-pending" /></span></div><small>Em aberto</small><strong>{money(totalOpen)}</strong><span>{rows.length} mensalidades pendentes</span></article><article className="is-overdue"><div className="admin-finance-stat-top"><span className="admin-finance-stat-icon"><Icon name="warning" /></span><b>5</b></div><small>Atrasado</small><strong>{money(totalOpen * .4)}</strong><span>{Math.max(0, overdue)} pagamentos em atraso</span></article></div>
    <div className="admin-finance-main-grid"><section className="admin-finance-card admin-finance-chart"><header><div><h3>Evolução financeira</h3><p>Receita recebida nos últimos 6 meses</p></div><div className="admin-finance-chart-legend"><span><i className="is-received" />Recebido</span><span><i className="is-planned" />Previsto</span></div></header><div className="admin-finance-line-chart" aria-label="Evolução financeira por mês"><svg viewBox="0 0 280 150" role="img" aria-label="Linha de receita recebida e prevista"><g className="admin-finance-chart-grid"><line x1="24" y1="25" x2="270" y2="25" /><line x1="24" y1="55" x2="270" y2="55" /><line x1="24" y1="85" x2="270" y2="85" /><line x1="24" y1="115" x2="270" y2="115" /></g><text x="2" y="28">R$ 31k</text><text x="2" y="58">R$ 27k</text><text x="2" y="88">R$ 23k</text><polyline className="admin-finance-line admin-finance-line--planned" points={plannedPoints} /><polyline className="admin-finance-line admin-finance-line--received" points={receivedPoints} />{receivedLine.map((value, index) => <circle key={monthLabels[index]} cx={chartX(index)} cy={chartY(value)} r="3.2" />)}<g className="admin-finance-chart-months">{monthLabels.map((month, index) => <text key={month} x={chartX(index)} y="141">{month.toUpperCase()}</text>)}</g></svg><div className="admin-finance-chart-tooltip"><strong>JUNHO 2026</strong><span>Recebido: {money(totalBilled || 25450)}</span><span>Previsto: {money(Math.max(totalBilled || 30000, 30000))}</span></div><aside className="admin-finance-growth"><small>CRESCIMENTO</small><strong>+32,3%</strong><span>desde janeiro</span><i>Evolução<br />consistente</i></aside><div className="admin-finance-target"><small>Meta mês</small><strong>{money(totalBilled || 30000)}</strong></div></div></section><section className="admin-finance-card admin-finance-status"><header><h3>Status das mensalidades</h3><span>{rows.length} registros</span></header><div className="admin-finance-donut" style={{ '--finance-progress': `${Math.min(100, Math.max(8, rows.length ? (paid / Math.max(rows.length, paid)) * 100 : 8))}%` }}><strong>{rows.length || 0}</strong><span>mensalidades</span></div><ul>{statusGroups.map(([label, value, tone]) => <li key={label}><i className={tone} /><span>{label}</span><b>{value}</b></li>)}</ul></section></div>
    <section className="admin-finance-table-card"><header><div><h3>Mensalidades</h3><p>Acompanhe os pagamentos e valores em aberto dos alunos.</p></div><div className="admin-finance-table-actions"><label><Icon name="search" /><input value={list.busca} onChange={updateSearch} placeholder="Pesquisar aluno" /></label><button type="button" onClick={() => setList((current) => ({ ...current, filtro: current.filtro ? '' : 'vencidas', pagina: 0 }))}>Filtros</button></div></header>{loading ? <StateMessage title="Carregando mensalidades..." loading /> : error ? <StateMessage title={error} action={refresh} /> : <div className="admin-finance-table-wrap"><table><thead><tr><th>Aluno</th><th>Competência</th><th>Vencimento</th><th>Valor</th><th>Status</th><th>Ação</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id || row.chave}><td><strong>{row.nome || 'Aluno'}</strong></td><td>{row.competencia || '—'}</td><td>{dateLabel(row.data)}</td><td>{money(row.saldo || row.valor)}</td><td><span className={'admin-finance-status-pill ' + (/venc|atras|aberto/i.test(String(row.status || '')) ? 'is-red' : 'is-green')}>{row.status || 'Em aberto'}</span></td><td><button type="button" onClick={() => openView('alunos', '', row.nome)}>Ver aluno</button></td></tr>)}</tbody></table>{!rows.length && <p className="admin-list-empty">Nenhuma mensalidade encontrada.</p>}</div>}<footer><span>{records?.total || 0} mensalidades encontradas</span><div><button type="button" disabled={!list.pagina} onClick={() => setList((current) => ({ ...current, pagina: current.pagina - 1 }))}>Anterior</button><button type="button" disabled={rows.length < 25} onClick={() => setList((current) => ({ ...current, pagina: current.pagina + 1 }))}>Próxima</button></div></footer></section>
    <section className="admin-finance-management"><header><div><h3>Gestão de mensalidades</h3><p>Arraste os pagamentos para atualizar o status financeiro.</p></div><button type="button" onClick={() => refresh()}>+ Nova cobrança</button><button type="button" onClick={() => setList((current) => ({ ...current, filtro: current.filtro ? '' : 'vencidas', pagina: 0 }))}>Filtros</button><button type="button" onClick={() => document.querySelector('.admin-finance-table-actions input')?.focus()}>Buscar aluno</button></header><div className="admin-finance-management-grid admin-finance-kanban">{billingColumns.map(([lane, label, tone]) => { const laneRows = billingBoardRows.filter((row) => billingLaneFor(row) === lane); const laneTotal = laneRows.reduce((sum, row) => sum + Number(row.saldo || row.valor || 0), 0); return <article key={lane} className={'admin-finance-kanban-column ' + tone} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggingBillingId) moveBilling(draggingBillingId, lane); setDraggingBillingId(null) }}><div className="admin-finance-kanban-heading"><strong>{label}</strong><span>({String(laneRows.length).padStart(2, '0')} cobranças {money(laneTotal)})</span></div><div className="admin-finance-kanban-list">{laneRows.map((row) => { const id = row.id || row.chave; return <div key={id} className={'admin-finance-billing-card' + (draggingBillingId === id ? ' is-dragging' : '')} draggable onDragStart={() => setDraggingBillingId(id)} onDragEnd={() => setDraggingBillingId(null)}><div className="admin-finance-billing-avatar">{String(row.nome || 'Aluno').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</div><div className="admin-finance-billing-info"><strong>{row.nome || 'Aluno'}</strong><span>{row.competencia || 'Mensalidade'}</span><b>Valor: {money(row.saldo || row.valor)}</b><small>{billingLaneFor(row) === 'pago' ? '✓ Pago em: ' : '▣ Venc: '}{dateLabel(row.data)}</small></div>{billingLaneFor(row) === 'pago' && <i className="admin-finance-billing-check">✓</i>}</div>})}{!laneRows.length && <p className="admin-finance-kanban-empty">Solte uma cobrança aqui</p>}</div></article>})}</div></section>
  </section>
}

function ReportsView({ data, openView }) {
  const [selectedReport, setSelectedReport] = useState(null)
  const [generated, setGenerated] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [reportResult, setReportResult] = useState(null)
  const [exportFormat, setExportFormat] = useState('')
  const [form, setForm] = useState({ inicio: '2026-01-01', fim: '2026-09-30', modalidade: 'Todas as modalidades', turma: 'Todas as turmas', professor: 'Todos os professores' })
  const reportCards = [
    ['alunos', 'Relatório de alunos', 'Dados cadastrais, situação das matrículas e distribuição dos alunos.', 'users'],
    ['frequencia', 'Relatório de frequência', 'Presenças, faltas e frequência dos alunos por período.', 'enroll-new'],
    ['financeiro', 'Relatório financeiro', 'Mensalidades, pagamentos, valores em aberto e atrasados.', 'tab-attendance'],
    ['modalidades', 'Relatório de modalidades', 'Turmas, alunos e ocupação de cada modalidade.', 'tab-class'],
    ['loja', 'Relatório da loja', 'Pedidos, produtos vendidos, estoque e movimentações.', 'tab-purchases'],
    ['espetaculos', 'Relatório de espetáculos', 'Participantes, apresentações e informações específicas.', 'star'],
  ]
  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const _openPrintableReport = (result, printWindow) => {
    const escapeHtml = (value) => String(value ?? '').replace(/[&<>\"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' })[character])
    const rows = result?.registros || []
    const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))]
    const tableHead = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')
    const tableBody = rows.map((row) => `<tr>${headers.map((header) => `<td>${escapeHtml(row[header])}</td>`).join('')}</tr>`).join('')
    printWindow.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório ${escapeHtml(result?.tipo || '')}</title><style>body{font-family:Arial,sans-serif;color:#14253a;padding:32px}h1{font-size:22px;margin:0 0 6px}p{color:#667582;margin:0 0 22px}table{width:100%;border-collapse:collapse;font-size:11px}th{background:#14253a;color:#fff;text-align:left}th,td{padding:8px;border:1px solid #dce2e6}tr:nth-child(even){background:#f6f8f9}@media print{body{padding:0}}</style></head><body><h1>Relatório de ${escapeHtml(result?.tipo || 'dados')}</h1><p>Período: ${escapeHtml(result?.inicio)} até ${escapeHtml(result?.fim)} · ${escapeHtml(result?.total || 0)} registro(s)</p><table><thead><tr>${tableHead}</tr></thead><tbody>${tableBody || `<tr><td colspan="${Math.max(headers.length, 1)}">Nenhum registro encontrado.</td></tr>`}</tbody></table></body></html>`)
    printWindow.document.close()
    let printed = false
    const print = () => {
      if (printed || printWindow.closed) return
      printed = true
      printWindow.focus()
      printWindow.print()
      setTimeout(() => printWindow.close(), 300)
    }
    printWindow.onload = () => setTimeout(print, 100)
    setTimeout(print, 500)
  }
  const generate = async (format = '') => {
    if (!selectedReport) return
    if (format) {
      setExportFormat(format)
      document.documentElement.dataset.reportFormat = format
      return
    }
    if (!exportFormat) {
      window.alert('Escolha Excel ou CSV antes de gerar o relatório.')
      return
    }
    setGenerating(true)
    const cleanFilter = (value) => value && !value.toLowerCase().startsWith('todas') && !value.toLowerCase().startsWith('todos') ? value : null
    const { data: result, error: requestError } = await supabase.rpc('admin_gerar_relatorio', { p_tipo: selectedReport, p_inicio: form.inicio, p_fim: form.fim, p_modalidade: cleanFilter(form.modalidade), p_turma: cleanFilter(form.turma), p_professor: cleanFilter(form.professor) })
    setGenerating(false)
    if (requestError) { window.alert(requestError.message || 'Não foi possível gerar o relatório.'); return }
    setReportResult(result)
    setGenerated(true)
    if (exportFormat) {
      const reportRows = result?.registros || []
      const headers = [...new Set(reportRows.flatMap((row) => Object.keys(row)))]
      const csv = [headers.join(';'), ...reportRows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? '')).join(';'))].join('\n')
      const extension = exportFormat === 'excel' ? 'xls' : 'csv'
      const blob = new Blob([`\uFEFF${csv}`], { type: exportFormat === 'excel' ? 'application/vnd.ms-excel' : 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedReport}-${form.inicio}-${form.fim}.${extension}`
      link.click()
      URL.revokeObjectURL(url)
    }
  }
  return <section className="admin-reports-view">
    <header className="admin-finance-heading"><div><h2>Gestão Geral</h2><p>Acompanhe o andamento financeiro, notificações e relatórios específicos sobre o Studio.</p></div><div className="admin-finance-heading__actions"><button type="button" onClick={() => openView('financeiro')}>Financeiro</button><button type="button" onClick={() => openView('notificacoes')}>Notificações</button><button className="is-active" type="button">Relatórios</button><button type="button" aria-label="Pesquisar"><Icon name="search" /></button><button type="button" aria-label="Notificações" onClick={() => openView('notificacoes')}><Icon name="bell" /></button></div></header>
    <div className="admin-reports-heading"><h3>Relatórios</h3><p>Escolha um relatório para gerar uma visão organizada dos dados do Studio.</p></div>
    <div className="admin-report-cards">{reportCards.map(([id, title, description, icon]) => <button key={id} type="button" className={'admin-report-card' + (selectedReport === id ? ' is-selected' : '')} onClick={() => { setSelectedReport(id); setGenerated(false) }}><span><Icon name={icon} /></span><strong>{title}</strong><small>{description}</small><em>Gerar →</em></button>)}</div>
    <button className="admin-reports-generate" type="button" onClick={() => selectedReport && generate()} disabled={!selectedReport}>Gerar relatório</button>
    {generated && <p className="admin-report-success">Relatório preparado com {reportResult?.total || 0} registro(s) atuais do banco.</p>}
    {selectedReport && <div className="admin-report-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedReport(null)}><section className="admin-report-modal" role="dialog" aria-modal="true" aria-labelledby="admin-report-title" onMouseDown={(event) => event.stopPropagation()}><button className="admin-report-modal__close" type="button" onClick={() => setSelectedReport(null)} aria-label="Fechar">×</button><label>Tipo de relatório<select value={selectedReport} onChange={(event) => setSelectedReport(event.target.value)}>{reportCards.map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select></label><h3 id="admin-report-title">Período</h3><div className="admin-report-modal__row"><label>Data inicial<input type="date" value={form.inicio} onChange={(event) => updateField('inicio', event.target.value)} /></label><span>→</span><label>Data final<input type="date" value={form.fim} onChange={(event) => updateField('fim', event.target.value)} /></label></div><h3>Filtros</h3><div className="admin-report-modal__row admin-report-modal__filters"><label>Modalidade<select value={form.modalidade} onChange={(event) => updateField('modalidade', event.target.value)}><option>Todas as modalidades</option></select></label><label>Turma<select value={form.turma} onChange={(event) => updateField('turma', event.target.value)}><option>Todas as turmas</option>{(data?.turmas || []).map((turma) => <option key={turma.id}>{turma.nome}</option>)}</select></label><label>Professor<select value={form.professor} onChange={(event) => updateField('professor', event.target.value)}><option>Todos os professores</option></select></label></div><button className="admin-report-modal__generate" type="button" onClick={() => generate()} disabled={generating}>{generating ? 'Gerando...' : '▥ Gerar relatório'}</button><div className="admin-report-modal__exports"><span>Escolha o formato do arquivo após gerar o relatório.</span><button type="button" onClick={() => generate('pdf')} disabled={generating}>PDF</button><button type="button" onClick={() => generate('excel')} disabled={generating}>Excel</button><button type="button" onClick={() => generate('csv')} disabled={generating}>CSV</button></div></section></div>}
  </section>
}

function NotificationsView({ data, records, loading, error, refresh, openView, onSelect }) {
  const [filter, setFilter] = useState('todos')
  const [notifications, setNotifications] = useState(records?.registros || [])
  useEffect(() => {
    let active = true
    const loadNotifications = async () => {
      const { data: result, error: requestError } = await supabase.rpc('admin_listar_notificacoes')
      if (active && !requestError && Array.isArray(result)) setNotifications(result)
    }
    loadNotifications().catch(() => {})
    const interval = window.setInterval(() => loadNotifications().catch(() => {}), 30000)
    const onVisibilityChange = () => { if (document.visibilityState === 'visible') loadNotifications().catch(() => {}) }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => { active = false; window.clearInterval(interval); document.removeEventListener('visibilitychange', onVisibilityChange) }
  }, [records])
  const categoryFor = (record) => {
    const text = `${record.nome || ''} ${record.conteudo || ''}`.toLowerCase()
    if (/matr[ií]cul/.test(text)) return 'matriculas'
    if (/finance|mensalidade|pagamento|atras/.test(text)) return 'financeiro'
    if (/agenda|ensaio|aula|hor[aá]rio/.test(text)) return 'agenda'
    return 'sistema'
  }
  const filtered = notifications.filter((record) => filter === 'todos' || (filter === 'nao_lidas' ? !record.lido : categoryFor(record) === filter))
  const unread = notifications.filter((record) => !record.lido).length
  const filters = [['todos', 'Todos'], ['nao_lidas', 'Não lidos'], ['matriculas', 'Matrículas'], ['financeiro', 'Financeiro'], ['agenda', 'Agenda'], ['sistema', 'Sistema']]
  const iconFor = (record) => {
    const category = categoryFor(record)
    if (category === 'financeiro') return 'finance'
    if (category === 'agenda') return 'calendar'
    if (category === 'matriculas') return 'enroll-pending'
    return 'bell'
  }
  return <section className="admin-notifications-view" aria-busy={loading}>
    <header className="admin-finance-heading"><div><h2>Gestão Geral</h2><p>Acompanhe o andamento financeiro, notificações e relatórios sobre o Studio.</p></div><div className="admin-finance-heading__actions"><button type="button" onClick={() => openView('financeiro')}>Financeiro</button><button className="is-active" type="button">Notificações</button><button type="button" onClick={() => openView('relatorios')}>Relatórios</button><button type="button" aria-label="Pesquisar"><Icon name="search" /></button><button type="button" aria-label="Notificações"><Icon name="bell" /></button></div></header>
    <div className="admin-notifications-toolbar"><div><h3>Central de Notificações</h3><p>Acompanhe os avisos e atualizações importantes do Studio.</p></div><span>{unread} pendentes</span></div>
    <nav className="admin-notifications-filters" aria-label="Filtros de notificações">{filters.map(([value, label]) => <button key={value} type="button" className={filter === value ? 'is-active' : ''} onClick={() => setFilter(value)}>{label}</button>)}</nav>
    {loading ? <StateMessage title="Carregando notificações..." loading /> : error ? <StateMessage title={error} action={refresh} /> : <><div className="admin-notifications-summary">Exibindo {filtered.length} notificações <span>·</span> {filter === 'todos' ? 'Todas' : filters.find(([value]) => value === filter)?.[1]} <button type="button" onClick={refresh}>Atualização ↻</button></div><div className="admin-notification-cards">{filtered.map((record) => <button key={record.id} type="button" className={'admin-notification-card' + (!record.lido ? ' is-unread' : '')} onClick={() => onSelect(record)}><span className="admin-notification-card__icon"><Icon name={iconFor(record)} /></span><span className="admin-notification-card__body"><strong>{record.nome || 'Aviso do Studio'}</strong><span>{record.conteudo || 'Nova atualização disponível.'}</span><time>{dateLabel(record.data)}{record.lido ? ' · lido' : ' · não lido'}</time></span><span className="admin-notification-card__action">Ver detalhes <Icon name="arrow" /></span>{!record.lido && <i className="admin-notification-card__dot" />}</button>)}{!filtered.length && <p className="admin-list-empty">Nenhuma notificação encontrada.</p>}</div></>}
  </section>
}

function SearchAreasView({ query, openView }) {
  const normalized = String(query || '').trim().toLocaleLowerCase('pt-BR')
  const areas = searchAreas.filter(([, label]) => !normalized || label.toLocaleLowerCase('pt-BR').includes(normalized))
  return <section className="admin-records admin-search-only"><div className="admin-records-heading"><div><button className="admin-back" onClick={() => openView('dashboard')}>← Visão geral</button><h2>Áreas do painel</h2></div></div><section className="admin-search-areas" aria-label="Áreas administrativas"><header><div><h3>Pesquisar áreas</h3><p>Escolha uma área para abrir sua gestão.</p></div><span>{areas.length} encontradas</span></header><div>{areas.map(([module, label]) => <button type="button" key={module} onClick={() => openView(module)}>{label}<Icon name="arrow" /></button>)}{!areas.length && <p>Nenhuma área corresponde à busca.</p>}</div></section></section>
}
function RecordsView({ view, list, setList, data, loading, error, refresh, openView, onSelect, turmas, classId, setClassId, range, now }) {
  const options = filterOptions(view)
  const pageCount = Math.ceil((data?.total || 0) / 25)
  const change = (field, value) => setList((current) => ({ ...current, [field]: value, pagina: 0 }))
  const searchText = String(list.busca || '').trim().toLocaleLowerCase('pt-BR')
  const matchingAreas = view === 'busca' ? searchAreas.filter(([, label]) => !searchText || label.toLocaleLowerCase('pt-BR').includes(searchText)) : []
  return <section className="admin-records" aria-busy={loading}>
    <div className="admin-records-heading"><div><button className="admin-back" onClick={() => openView('dashboard')}>← Visão geral</button><h2>{moduleNames[view]}</h2></div><button className="admin-action" onClick={refresh}>Atualizar</button></div>
    {view === 'busca' && <section className="admin-search-areas" aria-label="Áreas administrativas encontradas"><header><div><h3>Áreas do painel</h3><p>Acesse diretamente uma área administrativa.</p></div><span>{matchingAreas.length} áreas</span></header><div>{matchingAreas.map(([module, label]) => <button type="button" key={module} onClick={() => openView(module)}>{label}<Icon name="arrow" /></button>)}{!matchingAreas.length && <p>Nenhuma área corresponde à busca.</p>}</div></section>}
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
function AdminSettingsWorkspace({ data, openView }) {
  const [tab, setTab] = useState('configuracoes')
  const [users, setUsers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [settingsError, setSettingsError] = useState('')
  const [productModal, setProductModal] = useState(false)
  const [saved, setSaved] = useState(false)
  const defaultSettings = {
    nome_studio: data?.usuario?.nome || 'Studio de Dança Keli Dalpian',
    telefone: data?.usuario?.telefone || '',
    email: data?.usuario?.email || '',
    endereco: '',
    notificacoes_automaticas: true,
    lembretes_mensalidade: true,
    avisos_aula: true,
    idioma: 'Português (BR)',
    fuso_horario: 'Brasília (BR)',
    enviar_avisos_administrativos: true,
    enviar_confirmacao_matriculas: true,
  }
  const [settingsForm, setSettingsForm] = useState(defaultSettings)

  useEffect(() => {
    let active = true
    setSettingsLoading(true)
    supabase.rpc('admin_obter_configuracoes').then(({ data: settings, error }) => {
      if (!active) return
      if (error) setSettingsError('Não foi possível carregar as configurações salvas.')
      else if (settings) setSettingsForm((current) => ({ ...current, ...settings }))
      setSettingsLoading(false)
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    if (!['usuarios', 'produtos'].includes(tab)) return undefined
    setLoading(true)
    const request = tab === 'usuarios'
      ? supabase.rpc('admin_listar_usuarios_admin')
      : supabase.from('produto').select('id_produto,nome,preco,estoque,estoque_minimo,status,id_categoria,tamanhos_disponiveis,categoria_produto(nome),imagem_produto(caminho,principal,ordem)').order('nome').limit(50)
    request.then(({ data: rows }) => {
      if (!active) return
      if (tab === 'usuarios') setUsers(rows || [])
      else setProducts(rows || [])
      setLoading(false)
    }).catch(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [tab])

  const saveSettings = async (event) => {
    event.preventDefault()
    setSaved(false)
    setSettingsError('')
    const { data: savedSettings, error } = await supabase.rpc('admin_salvar_configuracoes', {
      p_nome_studio: settingsForm.nome_studio,
      p_telefone: settingsForm.telefone,
      p_email: settingsForm.email,
      p_endereco: settingsForm.endereco,
      p_notificacoes_automaticas: settingsForm.notificacoes_automaticas,
      p_lembretes_mensalidade: settingsForm.lembretes_mensalidade,
      p_avisos_aula: settingsForm.avisos_aula,
      p_idioma: settingsForm.idioma,
      p_fuso_horario: settingsForm.fuso_horario,
      p_enviar_avisos_administrativos: settingsForm.enviar_avisos_administrativos,
      p_enviar_confirmacao_matriculas: settingsForm.enviar_confirmacao_matriculas,
    })
    if (error) {
      setSettingsError(error.message || 'Não foi possível salvar as configurações.')
      return
    }
    if (savedSettings) setSettingsForm((current) => ({ ...current, ...savedSettings }))
    setSaved(true)
  }

  if (tab === 'configuracoes') return <AdminSettingsForm tab={tab} setTab={setTab} settingsForm={settingsForm} setSettingsForm={setSettingsForm} saveSettings={saveSettings} saved={saved} loading={settingsLoading} error={settingsError} reset={() => setSettingsForm(defaultSettings)} />
  if (tab === 'usuarios') return <AdminUsersView tab={tab} setTab={setTab} users={users} loading={loading} />
  if (tab === 'produtos') return <AdminProductsView tab={tab} setTab={setTab} products={products} setProducts={setProducts} loading={loading} />

  return <section className="admin-settings-workspace">
    <header className="admin-settings-heading"><div><h2>Gestão Geral</h2><p>Acompanhe as configurações, usuários e produtos do Studio.</p></div><div className="admin-settings-heading__actions"><button className={tab === 'configuracoes' ? 'is-active' : ''} type="button" onClick={() => setTab('configuracoes')}>Configurações</button><button className={tab === 'usuarios' ? 'is-active' : ''} type="button" onClick={() => setTab('usuarios')}>Usuários</button><button className={tab === 'produtos' ? 'is-active' : ''} type="button" onClick={() => setTab('produtos')}>Loja</button><button type="button" aria-label="Pesquisar"><Icon name="search" /></button><button type="button" aria-label="Notificações" onClick={() => openView('notificacoes')}><Icon name="bell" /></button></div></header>
    <div className="admin-settings-tabs"><button className={tab === 'configuracoes' ? 'is-active' : ''} type="button" onClick={() => setTab('configuracoes')}>Todos</button><button className={tab === 'usuarios' ? 'is-active' : ''} type="button" onClick={() => setTab('usuarios')}>Usuários</button><button className={tab === 'produtos' ? 'is-active' : ''} type="button" onClick={() => setTab('produtos')}>Loja</button></div>
    {tab === 'configuracoes' && <><div className="admin-settings-banner"><div><strong>Configurações do Sistema</strong><p>Ajuste preferências e controles importantes para o funcionamento do programa do Studio.</p></div><span><Icon name="settings" /></span></div><form className="admin-settings-form" onSubmit={saveSettings}><h3>Informações do Studio</h3><div className="admin-settings-fields"><label>Nome do Studio<input value={settingsForm.nome} onChange={(event) => setSettingsForm((current) => ({ ...current, nome: event.target.value }))} /></label><label>Telefone/WhatsApp<input value={settingsForm.telefone} onChange={(event) => setSettingsForm((current) => ({ ...current, telefone: event.target.value }))} /></label><label>E-mail<input value={settingsForm.email} onChange={(event) => setSettingsForm((current) => ({ ...current, email: event.target.value }))} /></label><label>Endereço<input placeholder="Rua, número e cidade" /></label></div><h3>Preferências do sistema</h3><div className="admin-settings-preferences"><label><span>Notificações automáticas</span><input type="checkbox" defaultChecked /></label><label><span>Lembretes de mensalidade</span><input type="checkbox" defaultChecked /></label><label><span>Aulas em dia</span><input type="checkbox" defaultChecked /></label></div><div className="admin-settings-actions"><button type="button" onClick={() => setSettingsForm({ nome: data?.usuario?.nome || '', telefone: data?.usuario?.telefone || '', email: data?.usuario?.email || '' })}>Cancelar</button><button type="submit">{saved ? 'Salvo' : 'Salvar alterações'}</button></div></form></>}
    {tab === 'usuarios' && <section className="admin-settings-table"><header><div><h3>Usuários e permissões</h3><p>Gerencie o acesso das pessoas ao sistema.</p></div><button type="button">+ Novo usuário</button></header><div className="admin-settings-table__filters"><input placeholder="Buscar usuário" /><select><option>Todos os perfis</option><option>Administrador</option><option>Professor</option><option>Aluno</option></select></div>{loading ? <StateMessage title="Carregando usuários..." loading /> : <table><thead><tr><th>Usuário</th><th>Perfil</th><th>Acesso</th><th>Status</th><th>Ação</th></tr></thead><tbody>{users.map((user) => <tr key={user.id_usuario}><td><strong>{user.nome || 'Usuário'}</strong><small>{user.email || '—'}</small></td><td>Administrador</td><td>Completo</td><td><span className="admin-settings-status">{user.status || 'Ativo'}</span></td><td><button type="button">Editar</button></td></tr>)}</tbody></table>}</section>}
    {tab === 'produtos' && <section className="admin-settings-table"><header><div><h3>Estoque e produtos</h3><p>Cadastre produtos e acompanhe as quantidades disponíveis e o valor da loja.</p></div><button type="button" onClick={() => setProductModal(true)}>+ Cadastrar novo produto</button></header><div className="admin-settings-kpis"><article><strong>{products.length}</strong><span>Produtos cadastrados</span></article><article><strong>{products.reduce((total, product) => total + Math.max(0, Number(product.estoque) || 0), 0)}</strong><span>Itens em estoque</span></article><article><strong>{money(products.reduce((total, product) => total + Number(product.preco || 0), 0))}</strong><span>Valor dos produtos</span></article></div><div className="admin-settings-table__filters"><input placeholder="Pesquisar produto" /><select><option>Todas as categorias</option></select><select><option>Todos os status</option></select><button type="button">Filtrar</button></div>{loading ? <StateMessage title="Carregando produtos..." loading /> : <table><thead><tr><th>Produto</th><th>Categoria</th><th>Estoque</th><th>Preço</th><th>Status</th><th>Ação</th></tr></thead><tbody>{products.map((product) => <tr key={product.id_produto}><td><strong>{product.nome}</strong></td><td>—</td><td>{product.estoque ?? 0}</td><td>{money(product.preco)}</td><td><span className="admin-settings-status">{product.status || 'Ativo'}</span></td><td><button type="button">Editar</button></td></tr>)}</tbody></table>}</section>}
    {productModal && <div className="admin-settings-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setProductModal(false)}><form className="admin-settings-product-modal" onSubmit={(event) => { event.preventDefault(); setProductModal(false) }}><button className="admin-settings-modal__close" type="button" onClick={() => setProductModal(false)}>×</button><h3>Cadastrar Produto</h3><p>Preencha as informações do novo produto.</p><label>Nome do produto<input required placeholder="Ex.: Collant rosa" /></label><div><label>Categoria<select><option>Vestuário</option><option>Acessórios</option><option>Calçados</option></select></label><label>Preço<input type="number" step="0.01" placeholder="R$ 0,00" /></label></div><div><label>Estoque<input type="number" placeholder="0" /></label><label>Estoque mínimo<input type="number" placeholder="0" /></label></div><button className="admin-settings-product-modal__submit" type="submit">Cadastrar produto</button></form></div>}
  </section>
}

function AdminSettingsForm({ tab, setTab, settingsForm, setSettingsForm, saveSettings, saved, loading, error, reset }) {
  const update = (key, value) => setSettingsForm((current) => ({ ...current, [key]: value }))
  return <section className="admin-settings-workspace">
    <header className="admin-settings-heading"><div><h2>Configurações</h2></div><div className="admin-settings-heading__actions"><button type="button" aria-label="Pesquisar"><Icon name="search" /></button><button type="button" aria-label="Notificações"><Icon name="bell" /></button></div></header>
    <div className="admin-settings-tabs"><button className={tab === 'configuracoes' ? 'is-active' : ''} type="button" onClick={() => setTab('configuracoes')}>Todos</button><button className={tab === 'usuarios' ? 'is-active' : ''} type="button" onClick={() => setTab('usuarios')}>Usuários</button><button className={tab === 'produtos' ? 'is-active' : ''} type="button" onClick={() => setTab('produtos')}>Loja</button></div>
    <div className="admin-settings-banner"><div><strong>Configurações do Sistema</strong><p>Ajuste preferências e controles importantes para o funcionamento do programa do Studio.</p></div><span><Icon name="settings" /></span></div>
    <form className="admin-settings-form" onSubmit={saveSettings}>
      <h3>Informações do Studio</h3>
      <div className="admin-settings-fields">
        <label>Nome do Studio<input value={settingsForm.nome_studio} onChange={(event) => update('nome_studio', event.target.value)} disabled={loading} /></label>
        <label>Telefone/WhatsApp<input value={settingsForm.telefone} onChange={(event) => update('telefone', event.target.value)} disabled={loading} /></label>
        <label>E-mail<input type="email" value={settingsForm.email} onChange={(event) => update('email', event.target.value)} disabled={loading} /></label>
        <label>Endereço<input value={settingsForm.endereco} onChange={(event) => update('endereco', event.target.value)} placeholder="Rua, número e cidade" disabled={loading} /></label>
      </div>
      <h3>Preferências do sistema</h3>
      <div className="admin-settings-preferences">
        <div className="admin-settings-preferences__switches">
          <label><span>Notificações automáticas</span><input type="checkbox" checked={settingsForm.notificacoes_automaticas} onChange={(event) => update('notificacoes_automaticas', event.target.checked)} disabled={loading} /></label>
          <label><span>Lembretes de mensalidade</span><input type="checkbox" checked={settingsForm.lembretes_mensalidade} onChange={(event) => update('lembretes_mensalidade', event.target.checked)} disabled={loading} /></label>
          <label><span>Avisos de aula</span><input type="checkbox" checked={settingsForm.avisos_aula} onChange={(event) => update('avisos_aula', event.target.checked)} disabled={loading} /></label>
        </div>
        <div className="admin-settings-preferences__details">
          <label>Idioma<select value={settingsForm.idioma} onChange={(event) => update('idioma', event.target.value)} disabled={loading}><option>Português (BR)</option><option>English (US)</option></select></label>
          <label>Fuso horário<select value={settingsForm.fuso_horario} onChange={(event) => update('fuso_horario', event.target.value)} disabled={loading}><option>Brasília (BR)</option><option>São Paulo (BR)</option></select></label>
          <fieldset><legend>Permissões de contato - e-mail</legend><label><input type="checkbox" checked={settingsForm.enviar_avisos_administrativos} onChange={(event) => update('enviar_avisos_administrativos', event.target.checked)} disabled={loading} /> Enviar avisos administrativos</label><label><input type="checkbox" checked={settingsForm.enviar_confirmacao_matriculas} onChange={(event) => update('enviar_confirmacao_matriculas', event.target.checked)} disabled={loading} /> Enviar confirmação de matrículas</label></fieldset>
        </div>
      </div>
      {error && <p className="admin-settings-error" role="alert">{error}</p>}
      <div className="admin-settings-actions"><button type="button" onClick={reset} disabled={loading}>Cancelar</button><button type="submit" disabled={loading}>{loading ? 'Carregando...' : saved ? 'Salvo' : 'Salvar alterações'}</button></div>
    </form>
  </section>
}

function AdminUsersView({ tab, setTab, users, loading }) {
  const [localUsers, setLocalUsers] = useState(users)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('todos')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ nome: '', email: '', senha: '', perfil: 'Administrador', status: 'ativo', permissoes: { financeiro: true, notificacoes: true, relatorios: true, usuarios: false, loja: true } })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [currentUserId, setCurrentUserId] = useState(null)
  useEffect(() => setLocalUsers(users), [users])
  useEffect(() => { supabase.auth.getUser().then(({ data: authData }) => setCurrentUserId(authData.user?.id || null)) }, [])
  const visibleUsers = localUsers.filter((user) => {
    const matchesSearch = !search.trim() || `${user.nome || ''} ${user.email || ''}`.toLowerCase().includes(search.trim().toLowerCase())
    const matchesFilter = filter === 'todos' || (filter === 'ativos' ? !/inativ|bloquead/i.test(user.status || '') : true)
    return matchesSearch && matchesFilter
  })
  const openCreate = () => { setError(''); setForm({ nome: '', email: '', senha: '', perfil: 'Administrador', status: 'ativo', permissoes: { financeiro: true, notificacoes: true, relatorios: true, usuarios: false, loja: true } }); setModal('create') }
  const openEdit = (user) => { setError(''); setForm({ id_usuario: user.id_usuario, nome: user.nome || '', email: user.email || '', senha: '', perfil: user.perfil || 'Administrador', status: /bloquead|inativ/i.test(user.status || '') ? 'bloqueado' : 'ativo', permissoes: { financeiro: true, notificacoes: true, relatorios: true, usuarios: false, loja: true, ...(user.permissoes || {}) } }); setModal('edit') }
  const saveUser = async (event) => {
    event.preventDefault(); setSaving(true); setError('')
    const result = modal === 'create'
      ? await supabase.rpc('admin_criar_usuario_admin', { p_nome: form.nome, p_email: form.email, p_senha: form.senha, p_permissoes: { ...form.permissoes, perfil: form.perfil } })
      : await supabase.rpc('admin_atualizar_usuario_admin', { p_id_usuario: form.id_usuario, p_nome: form.nome, p_status: form.status, p_permissoes: form.permissoes })
    if (result.error) { setError(result.error.message || 'Não foi possível salvar o usuário.'); setSaving(false); return }
    const { data: refreshed } = await supabase.rpc('admin_listar_usuarios_admin')
    setLocalUsers(refreshed || []); setModal(null); setSaving(false)
  }
  const toggleUserStatus = async (user) => {
    if (user.id_usuario === currentUserId) return
    const nextStatus = /bloquead|inativ/i.test(user.status || '') ? 'ativo' : 'bloqueado'
    const { error: requestError } = await supabase.rpc('admin_atualizar_usuario_admin', { p_id_usuario: user.id_usuario, p_nome: user.nome, p_status: nextStatus, p_permissoes: user.permissoes || {} })
    if (requestError) { window.alert(requestError.message || 'Não foi possível alterar o status do usuário.'); return }
    setLocalUsers((current) => current.map((item) => item.id_usuario === user.id_usuario ? { ...item, status: nextStatus } : item))
  }
  return <section className="admin-settings-workspace admin-users-workspace">
    <header className="admin-settings-heading"><div><h2>Configurações</h2></div><div className="admin-settings-heading__actions"><button type="button" aria-label="Pesquisar"><Icon name="search" /></button><button type="button" aria-label="Notificações"><Icon name="bell" /></button></div></header>
    <div className="admin-settings-tabs"><button className={tab === 'configuracoes' ? 'is-active' : ''} type="button" onClick={() => setTab('configuracoes')}>Todos</button><button className={tab === 'usuarios' ? 'is-active' : ''} type="button" onClick={() => setTab('usuarios')}>Usuários</button><button className={tab === 'produtos' ? 'is-active' : ''} type="button" onClick={() => setTab('produtos')}>Loja</button></div>
    <div className="admin-users-banner"><div><strong>Usuários e permissões</strong><p>Gerencie os perfis que possuem acesso ao sistema e suas respectivas funcionalidades.</p></div><span className="admin-users-banner__people" aria-hidden="true" /></div>
    <div className="admin-users-toolbar"><div className="admin-users-filters"><button className={filter === 'todos' ? 'is-active' : ''} type="button" onClick={() => setFilter('todos')}>Todos</button><button className={filter === 'ativos' ? 'is-active' : ''} type="button" onClick={() => setFilter('ativos')}>Ativos</button><button type="button">Administradores</button><button type="button">Secretaria</button><button type="button">Professoras</button></div><div className="admin-users-actions"><button type="button">☰ Filtros</button><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar usuário..." /><button type="button" onClick={openCreate}>+ Novo usuário</button></div></div>
    {loading ? <StateMessage title="Carregando usuários..." loading /> : <div className="admin-users-table-wrap"><table className="admin-users-table"><thead><tr><th>Usuário</th><th>Perfil</th><th>Acesso</th><th>Último acesso</th><th>Status</th><th>Permissões</th><th>Ações</th></tr></thead><tbody>{visibleUsers.map((user) => { const isSelf = user.id_usuario === currentUserId; const isDisabled = /inativ|bloquead/i.test(user.status || ''); return <tr key={user.id_usuario}><td><span className="admin-users-person"><i>{(user.nome || 'U').slice(0, 1).toUpperCase()}</i><span><strong>{user.nome || 'Usuário'}</strong><small>{user.email || '—'}</small></span></span></td><td>{user.perfil || 'Administrador'}</td><td>{user.acesso || 'Administrador'}</td><td>{user.ultimo_acesso ? new Date(user.ultimo_acesso).toLocaleDateString('pt-BR') : '—'}</td><td><em className={isDisabled ? 'is-blocked' : 'is-active'}>{isDisabled ? 'Bloqueado' : user.status || 'Ativo'}</em></td><td><button type="button" onClick={() => openEdit(user)}>Ver permissões</button></td><td><button type="button" onClick={() => openEdit(user)}>Editar</button><button className="admin-users-status-action" type="button" onClick={() => toggleUserStatus(user)} disabled={isSelf} title={isSelf ? 'Você não pode desativar seu próprio usuário' : undefined}>{isDisabled ? 'Ativar' : 'Desativar'}</button><button type="button" onClick={() => openEdit(user)} aria-label="Mais ações">⋮</button></td></tr> })}</tbody></table>{!visibleUsers.length && <p className="admin-list-empty">Nenhum usuário encontrado.</p>}</div>}
    {modal && <div className="admin-user-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setModal(null)}><form className="admin-user-modal" onSubmit={saveUser}><button type="button" className="admin-settings-modal__close" onClick={() => setModal(null)}>×</button><h3>{modal === 'create' ? 'Cadastrar usuário' : 'Editar usuário'}</h3><label>Nome<input required value={form.nome} onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))} /></label><label>E-mail<input required type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} disabled={modal === 'edit'} /></label>{modal === 'create' && <><label>Tipo de usuário<select value={form.perfil} onChange={(event) => setForm((current) => ({ ...current, perfil: event.target.value }))}><option>Administrador</option><option>Secretaria</option><option>Professor</option><option>Aluno</option></select></label><label>Senha<input required minLength="6" type="password" value={form.senha} onChange={(event) => setForm((current) => ({ ...current, senha: event.target.value }))} /></label></>}{modal === 'edit' && <><label>Tipo de usuário<select value={form.perfil} disabled><option>{form.perfil}</option></select></label><label>Status<select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}><option value="ativo">Ativo</option><option value="bloqueado">Bloqueado</option></select></label></>}<fieldset><legend>Permissões</legend>{[['financeiro', 'Financeiro'], ['notificacoes', 'Notificações'], ['relatorios', 'Relatórios'], ['usuarios', 'Usuários'], ['loja', 'Loja']].map(([key, label]) => <label key={key}><input type="checkbox" checked={form.permissoes[key]} onChange={(event) => setForm((current) => ({ ...current, permissoes: { ...current.permissoes, [key]: event.target.checked } }))} /> {label}</label>)}</fieldset>{error && <p className="admin-settings-error">{error}</p>}<button className="admin-user-modal__submit" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar usuário'}</button></form></div>}
  </section>
}

function AdminProductsView({ tab, setTab, products, setProducts, loading }) {
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ id_produto: null, nome: '', descricao: '', preco: '', estoque: '', estoque_minimo: '', id_categoria: '', status: 'Ativo', tamanhos_disponiveis: 'Único', imagem: '' })
  const filteredProducts = products.filter((product) => !search.trim() || String(product.nome || '').toLowerCase().includes(search.trim().toLowerCase()))
  const totalValue = products.reduce((total, product) => total + Number(product.preco || 0), 0)
  const imageFor = (product) => product.imagem_produto?.slice().sort((first, second) => Number(second.principal) - Number(first.principal) || Number(first.ordem || 0) - Number(second.ordem || 0))[0]?.caminho || storePointeShoes
  const productQuery = 'id_produto,nome,descricao,preco,estoque,estoque_minimo,status,id_categoria,tamanhos_disponiveis,categoria_produto(nome),imagem_produto(caminho,principal,ordem)'
  const reloadProducts = async () => { const { data, error: requestError } = await supabase.from('produto').select(productQuery).order('nome').limit(50); if (!requestError) setProducts(data || []); return requestError }
  const openCreate = () => { setError(''); setForm({ id_produto: null, nome: '', descricao: '', preco: '', estoque: '', estoque_minimo: '', id_categoria: categories[0]?.id_categoria || '', status: 'Ativo', tamanhos_disponiveis: 'Único', imagem: '' }); setModal('create') }
  const openEdit = (product) => { setError(''); setForm({ id_produto: product.id_produto, nome: product.nome || '', descricao: product.descricao || '', preco: product.preco ?? '', estoque: product.estoque ?? '', estoque_minimo: product.estoque_minimo ?? '', id_categoria: product.id_categoria || '', status: product.status || 'Ativo', tamanhos_disponiveis: Array.isArray(product.tamanhos_disponiveis) ? product.tamanhos_disponiveis.join(', ') : product.tamanhos_disponiveis || 'Único', imagem: product.imagem_produto?.slice().sort((first, second) => Number(second.principal) - Number(first.principal) || Number(first.ordem || 0) - Number(second.ordem || 0))[0]?.caminho || '' }); setModal('edit') }
  const chooseImage = (event) => { const file = event.target.files?.[0]; if (!file) return; if (!file.type.startsWith('image/')) { setError('Selecione um arquivo de imagem válido.'); return } if (file.size > 5 * 1024 * 1024) { setError('A imagem deve ter no máximo 5 MB.'); return } const reader = new FileReader(); reader.onload = () => setForm((current) => ({ ...current, imagem: String(reader.result || '') })); reader.readAsDataURL(file) }
  const saveProduct = async (event) => { event.preventDefault(); setSaving(true); setError(''); const payload = { nome: form.nome.trim(), descricao: form.descricao.trim() || null, preco: Number(form.preco || 0), estoque: Number(form.estoque || 0), estoque_minimo: Number(form.estoque_minimo || 0), id_categoria: form.id_categoria ? Number(form.id_categoria) : null, status: form.status, tamanhos_disponiveis: form.tamanhos_disponiveis.split(',').map((item) => item.trim()).filter(Boolean) || ['Único'] }; let productId = form.id_produto; let requestError; if (modal === 'create') { const result = await supabase.from('produto').insert(payload).select('id_produto').single(); productId = result.data?.id_produto; requestError = result.error } else { requestError = (await supabase.from('produto').update(payload).eq('id_produto', form.id_produto)).error } if (requestError || !productId) { setError(requestError?.message || 'Não foi possível salvar o produto.'); setSaving(false); return } if (form.imagem) { await supabase.from('imagem_produto').delete().eq('id_produto', productId).eq('principal', true); const imageResult = await supabase.from('imagem_produto').insert({ id_produto: productId, caminho: form.imagem, principal: true, ordem: 1 }); if (imageResult.error) { setError(imageResult.error.message || 'Produto salvo, mas não foi possível salvar a imagem.'); setSaving(false); return } } await reloadProducts(); setModal(null); setSaving(false) }
  const deleteProduct = async (product) => { if (!window.confirm(`Apagar o produto "${product.nome}"?`)) return; const { error: requestError } = await supabase.from('produto').delete().eq('id_produto', product.id_produto); if (requestError) { window.alert(requestError.message || 'Não foi possível apagar o produto.'); return } await reloadProducts() }
  useEffect(() => { supabase.from('categoria_produto').select('id_categoria,nome').order('nome').then(({ data }) => setCategories(data || [])) }, [])
  useEffect(() => {
    const cards = [...document.querySelectorAll('.admin-products-order-card')]
    const columns = [...document.querySelectorAll('.admin-products-order-columns article')]
    const handleDragStart = (event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', 'pedido'); event.currentTarget.classList.add('is-dragging') }
    const handleDragEnd = (event) => event.currentTarget.classList.remove('is-dragging')
    const handleDragOver = (event) => event.preventDefault()
    const handleDrop = (event) => { event.preventDefault(); const card = document.querySelector('.admin-products-order-card.is-dragging'); if (card) event.currentTarget.appendChild(card) }
    cards.forEach((card) => { card.draggable = true; card.addEventListener('dragstart', handleDragStart); card.addEventListener('dragend', handleDragEnd) })
    columns.forEach((column) => { column.addEventListener('dragover', handleDragOver); column.addEventListener('drop', handleDrop) })
    return () => { cards.forEach((card) => { card.removeEventListener('dragstart', handleDragStart); card.removeEventListener('dragend', handleDragEnd) }); columns.forEach((column) => { column.removeEventListener('dragover', handleDragOver); column.removeEventListener('drop', handleDrop) }) }
  }, [products.length])
  return <section className="admin-settings-workspace admin-products-workspace">
    <header className="admin-settings-heading"><div><h2>Configurações</h2></div><div className="admin-settings-heading__actions"><button type="button" aria-label="Pesquisar"><Icon name="search" /></button><button type="button" aria-label="Notificações"><Icon name="bell" /></button></div></header>
    <div className="admin-settings-tabs"><button className={tab === 'configuracoes' ? 'is-active' : ''} type="button" onClick={() => setTab('configuracoes')}>Todos</button><button className={tab === 'usuarios' ? 'is-active' : ''} type="button" onClick={() => setTab('usuarios')}>Usuários</button><button className={tab === 'produtos' ? 'is-active' : ''} type="button" onClick={() => setTab('produtos')}>Loja</button></div>
    <div className="admin-products-banner" aria-label="Estoque e produtos" />
    <div className="admin-products-kpis"><article><strong>{products.length}</strong><span>Produtos cadastrados</span></article><article><strong>{products.reduce((total, product) => total + Math.max(0, Number(product.estoque) || 0), 0)}</strong><span>Itens em estoque</span></article><article><strong>{money(totalValue)}</strong><span>Valor em estoque</span></article></div>
    <div className="admin-products-toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar produto..." /><select><option>Categoria</option><option>Vestuário</option><option>Calçados</option></select><select><option>Tamanho</option></select><select><option>Status</option></select><select><option>Estoque</option></select><button type="button">Ordenar⌄</button></div>
    {loading ? <StateMessage title="Carregando produtos..." loading /> : <table className="admin-products-table"><thead><tr><th>Produto</th><th>Categoria</th><th>Tamanho</th><th>Estoque</th><th>Preço</th><th>Status</th><th>Ações</th></tr></thead><tbody>{filteredProducts.map((product) => { const category = Array.isArray(product.categoria_produto) ? product.categoria_produto[0]?.nome : product.categoria_produto?.nome; const sizes = Array.isArray(product.tamanhos_disponiveis) ? product.tamanhos_disponiveis.join(', ') : product.tamanhos_disponiveis || 'Único'; const available = Number(product.estoque || 0) > 0 && !/inativ|indispon/i.test(product.status || ''); return <tr key={product.id_produto}><td><span className="admin-products-product"><img src={imageFor(product)} alt="" /><strong>{product.nome || 'Produto'}</strong></span></td><td>{category || '—'}</td><td>{sizes}</td><td>{product.estoque ?? 0}</td><td>{money(product.preco)}</td><td><em className={available ? 'is-available' : 'is-unavailable'}>● {available ? 'Disponível' : 'Indisponível'}</em></td><td><div className="admin-products-actions"><button type="button" onClick={() => openEdit(product)}>Editar</button><button type="button" onClick={() => deleteProduct(product)}>Apagar</button></div></td></tr> })}</tbody></table>}
    <button className="admin-products-new" type="button" onClick={openCreate}>CADASTRAR NOVO PRODUTO +</button>
    <section className="admin-products-orders"><h3>Pedidos da Loja</h3><div className="admin-products-order-columns">{['Novos pedidos', 'Em preparação', 'Pronto para retirada', 'Entregues'].map((title, index) => <article key={title}><header><strong>{title}</strong><span>{index + 1}</span></header><div className="admin-products-order-card"><b>{index === 0 ? '#2026-014' : '#2026-011'}</b><span>{index === 0 ? 'Pedido recebido' : 'Pedido em acompanhamento'}</span><small>Hoje, 14:30</small><em>{index === 3 ? 'Concluído' : 'Ver pedido'}</em></div><div className="admin-products-order-card"><b>Pedido #{String(index + 8).padStart(3, '0')}</b><span>Produtos do Studio</span><small>08/10/2026</small></div></article>)}</div></section>
    {modal && <ProductModal modal={modal} setModal={setModal} form={form} setForm={setForm} categories={categories} chooseImage={chooseImage} error={error} saving={saving} saveProduct={saveProduct} />}
  </section>
}

function ProductModal({ modal, setModal, form, setForm, categories, chooseImage, error, saving, saveProduct }) {
  const [controlStock, setControlStock] = useState(true)
  const [studentsOnly, setStudentsOnly] = useState(false)
  const [featured, setFeatured] = useState(false)
  const [addingSize, setAddingSize] = useState(false)
  const [sizeDraft, setSizeDraft] = useState('')
  const sizes = String(form.tamanhos_disponiveis || '').split(',').map((size) => size.trim()).filter((size) => size && size.toLowerCase() !== 'único')
  const toggleSize = (size) => setForm((current) => ({ ...current, tamanhos_disponiveis: sizes.includes(size) ? sizes.filter((item) => item !== size).join(', ') : [...sizes, size].join(', ') }))
  const addSize = () => { const nextSize = sizeDraft.trim(); if (!nextSize || sizes.includes(nextSize)) return; setForm((current) => ({ ...current, tamanhos_disponiveis: [...sizes, nextSize].join(', ') })); setSizeDraft(''); setAddingSize(false) }
  useEffect(() => {
    const button = document.querySelector('.admin-product-create-modal .admin-product-add-size')
    if (!button) return undefined
    const handleAddSize = () => { const nextSize = window.prompt('Digite o novo tamanho:'); if (nextSize?.trim()) { const value = nextSize.trim(); if (!sizes.includes(value)) setForm((current) => ({ ...current, tamanhos_disponiveis: [...sizes, value].join(', ') })) } }
    button.addEventListener('click', handleAddSize)
    return () => button.removeEventListener('click', handleAddSize)
  }, [sizes.join(',')])
  useEffect(() => {
    const container = document.querySelector('.admin-product-create-modal .admin-product-size-chips')
    if (!container) return undefined
    const extraSizes = ['29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', 'PP', 'P', 'M', 'G', 'GG', 'XG']
    extraSizes.forEach((size) => {
      if (container.querySelector(`[data-extra-size="${size}"]`)) return
      const chip = document.createElement('button')
      chip.type = 'button'
      chip.dataset.extraSize = size
      chip.textContent = size
      chip.className = sizes.includes(size) ? 'is-selected' : ''
      chip.addEventListener('click', () => setForm((current) => ({ ...current, tamanhos_disponiveis: sizes.includes(size) ? sizes.filter((item) => item !== size).join(', ') : [...sizes, size].join(', ') })))
      container.appendChild(chip)
    })
    if (!container.querySelector('[data-letter-size-label]')) {
      const firstLetter = container.querySelector('[data-extra-size="PP"]')
      if (firstLetter) {
        const label = document.createElement('span')
        label.dataset.letterSizeLabel = 'true'
        label.textContent = 'Tamanhos em letras'
        label.className = 'admin-product-letter-size-label'
        container.insertBefore(label, firstLetter)
      }
    }
  }, [sizes.join(',')])
  useEffect(() => {
    setForm((current) => ({ ...current, status: undefined }))
  }, [])
  return <div className="admin-settings-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setModal(null)}><form className="admin-settings-product-modal admin-product-create-modal" onSubmit={saveProduct}>
    <button className="admin-settings-modal__close" type="button" onClick={() => setModal(null)} aria-label="Fechar">×</button><h3>{modal === 'create' ? 'Cadastrar Produto' : 'Editar Produto'}</h3>
    <div className="admin-product-modal-grid">
      <section className="admin-product-modal-column"><h4>1. INFORMAÇÕES BÁSICAS</h4><label>Nome Completo<input required value={form.nome} placeholder="Informe o nome do produto" onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))} /></label><label>Descrição<textarea value={form.descricao} placeholder="Descreva o produto aqui..." onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))} /></label><label>Categoria<select value={form.id_categoria} onChange={(event) => setForm((current) => ({ ...current, id_categoria: event.target.value }))}><option value="">Sem categoria</option>{categories.map((category) => <option value={category.id_categoria} key={category.id_categoria}>{category.nome}</option>)}</select></label></section>
      <section className="admin-product-modal-column"><h4>2. PREÇO E ESTOQUE</h4><label>Preço de venda:<input required min="0" step="0.01" type="number" value={form.preco} placeholder="R$ 0,00" onChange={(event) => setForm((current) => ({ ...current, preco: event.target.value }))} /></label><label>Estoque<input required min="0" type="number" value={form.estoque} placeholder="0" onChange={(event) => setForm((current) => ({ ...current, estoque: event.target.value }))} /></label><label>Controlar estoque <input className="admin-product-toggle" type="checkbox" checked={controlStock} onChange={(event) => setControlStock(event.target.checked)} /></label><small>A quantidade dos produtos em estoque será atualizada automaticamente após os pedidos processados.</small><h4>3. CONFIGURAÇÕES</h4><label>Permitir compra com o estoque esgotado <input className="admin-product-toggle" type="checkbox" /></label><label>Disponível somente para alunos matriculados <input className="admin-product-toggle" type="checkbox" checked={studentsOnly} onChange={(event) => setStudentsOnly(event.target.checked)} /></label><label>Produto em destaque <input className="admin-product-toggle" type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} /></label></section>
      <section className="admin-product-modal-column"><h4>4. VARIAÇÕES DO PRODUTO</h4><label>Tamanhos:</label><div className="admin-product-size-chips">{['24', '25', '26', '27', '28'].map((size) => <button type="button" key={size} className={sizes.includes(size) ? 'is-selected' : ''} onClick={() => toggleSize(size)}>{size}</button>)}</div><button type="button" className="admin-product-add-size">Adicionar tamanho +</button><div className="admin-product-variants-table"><span>Tamanho</span><span>Estoque</span><span>Valor</span>{sizes.slice(0, 4).map((size) => <React.Fragment key={size}><b>{size}</b><input aria-label={'Estoque tamanho ' + size} type="number" min="0" value={form.estoque} onChange={(event) => setForm((current) => ({ ...current, estoque: event.target.value }))} /><em>R$ {Number(form.preco || 0).toFixed(2).replace('.', ',')}</em></React.Fragment>)}</div><label className="admin-product-image-upload">Imagem do produto<input type="file" accept="image/*" onChange={chooseImage} /><span>{form.imagem ? 'Imagem selecionada' : 'Adicionar imagem do produto'}</span><small>JPG, PNG ou WEBP</small></label></section>
    </div>
    {error && <p className="admin-settings-error">{error}</p>}<button className="admin-settings-product-modal__submit" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'CADASTRAR'}</button>
  </form></div>
}

function ProfileView({ data, settings, openView }) {
  const name = data?.nome || 'Administrador'
  const initials = name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()
  return <section className="admin-profile-page"><button className="admin-back" onClick={() => openView('dashboard')}>← Visão geral</button><header className="admin-profile-hero"><div className="admin-profile-avatar">{initials}</div><div><span className="admin-profile-eyebrow">Perfil administrativo</span><h2>{name}</h2><p>{data?.email || 'Acesso administrativo do Studio Keli Dalpian'}</p></div><span className="admin-profile-active">● Conta ativa</span></header><div className="admin-profile-content"><section className="admin-profile-panel"><header><div><span className="admin-profile-eyebrow">Informações da conta</span><h3>Dados pessoais</h3></div><button type="button" onClick={() => openView('configuracoes')}>Editar configurações</button></header><dl className="admin-profile-details">{[['nome', 'Nome completo'], ['email', 'E-mail'], ['telefone', 'Telefone'], ['perfil', 'Perfil de acesso']].map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{data?.[key] || 'Não informado'}</dd></div>)}</dl></section><aside className="admin-profile-panel admin-profile-access"><span className="admin-profile-eyebrow">Acesso rápido</span><h3>Gestão do Studio</h3><p>Entre diretamente nas áreas mais usadas do painel administrativo.</p><div className="admin-account-links"><button onClick={() => openView('alunos')}>Alunos</button><button onClick={() => openView('professores')}>Professores</button><button onClick={() => openView('matriculas')}>Matrículas</button><button onClick={() => openView('produtos')}>Produtos</button><button onClick={() => openView('financeiro')}>Financeiro</button><button onClick={() => openView('notificacoes')}>Notificações</button></div></aside></div><section className="admin-profile-security"><div><span className="admin-profile-security-icon">✓</span><div><h3>Segurança da conta</h3><p>Seu perfil tem acesso às ferramentas administrativas autorizadas.</p></div></div><button type="button" onClick={() => openView('configuracoes')}>Gerenciar conta</button></section></section>
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

