import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import calendarIcon from '../assets/icone-calendario-rosa.png'
import bellIcon from '../assets/student-icon-bell.png'
import homeNavIcon from '../assets/student-icon-home.png'
import peopleNavIcon from '../assets/pessoas-azul-adm.png'
import chartNavIcon from '../assets/student-icon-chart.png'
import calendarNavIcon from '../assets/student-icon-calendar.png'
import bellNavIcon from '../assets/student-icon-bell.png'
import profileNavIcon from '../assets/perfil-adm.png'
import logoutNavIcon from '../assets/student-icon-logout.png'
import danceNavIcon from '../assets/student-icon-dance.png'
import evolutionNavIcon from '../assets/evolucao-azul-adm.png'
import './TeacherDashboard.css'

const menu = [
  ['inicio', 'Início'], ['turmas', 'Minhas turmas'], ['alunos', 'Meus alunos'],
  ['frequencia', 'Frequência'], ['evolucao', 'Evolução'], ['agenda', 'Agenda'],
  ['avisos', 'Avisos'], ['notificacoes', 'Notificações'], ['perfil', 'Meu perfil'],
]
const evaluationItems = ['Postura', 'Flexibilidade', 'Equilíbrio', 'Coordenação', 'Musicalidade', 'Técnica', 'Expressão', 'Disciplina']

const menuGroups = [
  { id: 'inicio', icon: 'home', items: [['inicio', 'In\u00edcio']] },
  { id: 'turmas-alunos', icon: 'users', items: [['turmas', 'Minhas turmas'], ['alunos', 'Meus alunos']] },
  { id: 'frequencia-evolucao', icon: 'chart', items: [['frequencia', 'Frequ\u00eancia'], ['evolucao', 'Evolu\u00e7\u00e3o']] },
  { id: 'agenda', icon: 'calendar', items: [['agenda', 'Agenda']] },
  { id: 'avisos-notificacoes', icon: 'bell', items: [['avisos', 'Avisos'], ['notificacoes', 'Notifica\u00e7\u00f5es']] },
]

function Icon({ name }) {
  const images = { home: homeNavIcon, users: peopleNavIcon, dance: danceNavIcon, evolution: evolutionNavIcon, chart: chartNavIcon, calendar: calendarNavIcon, bell: bellNavIcon, user: profileNavIcon, logout: logoutNavIcon }
  if (images[name]) return <img className={'teacher-nav-icon teacher-nav-icon--' + name} src={images[name]} alt="" aria-hidden="true" />
  const paths = { home: 'M3 10 12 3l9 7v10H3zM9 21v-6h6v6', users: 'M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20M9.5 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM16 3.5a3.5 3.5 0 0 1 0 6.8M17 14.5a4 4 0 0 1 4 4V20', calendar: 'M4 5h16v16H4zM8 3v4M16 3v4M4 10h16', chart: 'M4 19V5M4 19h17M8 16v-4M13 16V8M18 16V5', bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4', notifications: 'M5 5h14v14H5zM8 9h8M8 13h5', user: 'M20 21a8 8 0 0 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8', logout: 'M10 17l5-5-5-5M15 12H3M21 4v16', check: 'm5 12 4 4L19 6' }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name] || paths.home} /></svg>
}

const formatDate = (value, options = { dateStyle: 'medium' }) => value ? new Intl.DateTimeFormat('pt-BR', options).format(new Date(`${value}T12:00:00`)) : '—'
const formatTime = (value) => value ? String(value).slice(0, 5) : '—'

export default function TeacherDashboard({ session, navigate }) {
  const [data, setData] = useState(null)
  const [view, setView] = useState('inicio')
  const [selectedClass, setSelectedClass] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedLesson, setSelectedLesson] = useState(null)
  const [attendance, setAttendance] = useState({})
  const [evaluation, setEvaluation] = useState({})
  const [observation, setObservation] = useState('')
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackVisible, setFeedbackVisible] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [openNavGroup, setOpenNavGroup] = useState(null)

  const load = async () => {
    setLoading(true); setError('')
    const result = await supabase.rpc('painel_professora')
    if (result.error) setError(result.error.code === '42501' ? 'Esta conta não possui acesso de professora.' : 'Não foi possível carregar sua dashboard.')
    else setData(result.data)
    setLoading(false)
  }
  useEffect(() => { if (session?.user?.id) load(); else setLoading(false) }, [session?.user?.id])
  useEffect(() => { if (message) { const timer = window.setTimeout(() => setMessage(''), 3500); return () => window.clearTimeout(timer) } }, [message])

  const classes = data?.turmas || []
  const students = data?.alunos || []
  const lessons = data?.agenda || []
  const filteredStudents = useMemo(() => selectedClass ? students.filter((student) => student.turma_id === selectedClass.id) : students, [students, selectedClass])
  const chooseView = (next) => { setView(next); setError(''); setMessage('') }
  const chooseLesson = (lesson) => { setSelectedLesson(lesson); setView('frequencia'); setAttendance({}) }
  const saveAttendance = async () => {
    if (!selectedLesson) return
    setSaving(true); setError('')
    const entries = Object.entries(attendance)
    const results = await Promise.all(entries.map(([studentId, present]) => supabase.rpc('professora_registrar_frequencia', { p_id_aula: selectedLesson.id, p_id_aluno: Number(studentId), p_presente: present })))
    const failure = results.find((result) => result.error)
    if (failure) setError('Não foi possível salvar a frequência. Tente novamente.')
    else { setMessage('Frequência registrada com sucesso.'); await load() }
    setSaving(false)
  }
  const saveEvolution = async (event) => {
    event.preventDefault(); if (!selectedStudent || !selectedClass) return
    setSaving(true); setError('')
    const result = await supabase.rpc('professora_salvar_evolucao', { p_id_aluno: selectedStudent.id, p_id_turma: selectedClass.id || selectedStudent.turma_id, p_avaliacao: evaluation, p_observacao: observation })
    if (result.error) setError('Não foi possível salvar a evolução.')
    else { setMessage('Evolução salva com sucesso.'); setObservation('') }
    setSaving(false)
  }
  const saveFeedback = async (event) => {
    event.preventDefault(); if (!selectedStudent) return
    setSaving(true); setError('')
    const result = await supabase.rpc('professora_salvar_feedback', { p_id_aluno: selectedStudent.id, p_id_turma: selectedStudent.turma_id, p_texto: feedbackText, p_visivel_aluno: feedbackVisible })
    if (result.error) setError('Não foi possível enviar o feedback.')
    else { setMessage('Feedback enviado com sucesso.'); setFeedbackText('') }
    setSaving(false)
  }
  const signOut = async () => { await supabase.auth.signOut({ scope: 'local' }); navigate('entrar') }

  if (loading) return <main className="teacher-dashboard teacher-dashboard--loading"><div className="teacher-skeleton" /><div className="teacher-skeleton teacher-skeleton--wide" /><div className="teacher-skeleton" /></main>
  if (!session || error && !data) return <main className="teacher-dashboard teacher-dashboard--state"><h1>Área da professora</h1><p>{error || 'Entre novamente para continuar.'}</p><button type="button" onClick={() => navigate('entrar')}>Voltar para o login</button></main>

  const professorName = data.professora?.nome || data.usuario?.nome || 'Professora'
  return <main className="teacher-dashboard">
    <aside className="teacher-sidebar">
      <div className="teacher-brand"><span>STUDIO</span><strong>KELI DALPIAN</strong></div>
      <button type="button" className="teacher-sidebar__profile" onClick={() => chooseView('perfil')} aria-label="Abrir meu perfil"><Icon name="user" /><div><strong>{professorName}</strong><small>Professora</small></div></button>
      <nav aria-label="Navegação da professora">{menu.map(([id, label]) => {
        const iconByMenu = {
          inicio: 'home',
          turmas: 'calendar',
          alunos: 'users',
          frequencia: 'dance',
          evolucao: 'evolution',
          agenda: 'chart',
          avisos: 'bell',
          notificacoes: 'notifications',
          perfil: 'user',
        }
        return <button key={id} type="button" className={view === id ? 'is-active' : ''} onClick={() => chooseView(id)}><Icon name={iconByMenu[id]} /><span>{label}</span></button>
      })}</nav>
      <nav className="teacher-sidebar__grouped-nav" aria-label="Navegação agrupada">{menuGroups.map((group) => {
        const isGroupActive = group.items.some(([id]) => view === id)
        const isOpen = openNavGroup === group.id
        const primary = group.items[0]
        return <div className="teacher-nav-group" key={group.id}>
          <button type="button" className={isGroupActive ? 'is-active' : ''} aria-label={group.items.map(([, label]) => label).join(' / ')} aria-expanded={group.items.length > 1 ? isOpen : undefined} onClick={() => {
            if (group.items.length > 1) setOpenNavGroup(isOpen ? null : group.id)
            chooseView(primary[0])
          }}><Icon name={group.icon} /><span>{group.items.map(([, label]) => label).join(' / ')}</span></button>
          {group.items.length > 1 && isOpen && <div className="teacher-nav-submenu">{group.items.map(([id, label]) => <button key={id} type="button" className={view === id ? 'is-active' : ''} onClick={() => { chooseView(id); setOpenNavGroup(null) }}>{label}</button>)}</div>}
        </div>
      })}</nav>
      <button className="teacher-sidebar__logout" type="button" onClick={signOut}><Icon name="logout" /> Sair</button>
    </aside>
    <section className="teacher-content">
      <header className="teacher-header"><div><h1>{view === 'inicio' ? `Olá, ${professorName.split(' ')[0]}!` : menu.find(([id]) => id === view)?.[1]}</h1><p>{view === 'inicio' ? 'Acompanhe suas turmas, alunos e atividades de hoje.' : 'Informações das suas turmas e alunos.'}</p></div><div className="teacher-header__right"><time><img src={calendarIcon} alt="" />{new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}</time><button type="button" aria-label="Abrir avisos" onClick={() => chooseView('avisos')}><img src={bellIcon} alt="" />{(data.avisos || []).filter((notice) => !notice.lido).length > 0 && <span>{(data.avisos || []).filter((notice) => !notice.lido).length}</span>}</button></div></header>
      {message && <div className="teacher-feedback teacher-feedback--success" role="status"><Icon name="check" />{message}</div>}
      {error && data && <div className="teacher-feedback teacher-feedback--error" role="alert">{error}</div>}
      {view === 'inicio' && <Home data={data} classes={classes} lessons={lessons} onClass={(item) => { setSelectedClass(item); chooseView('turmas') }} onLesson={chooseLesson} onPending={(item) => { setSelectedStudent(item); setSelectedClass(classes.find((itemClass) => itemClass.id === item.turma_id) || null); chooseView('feedback') }} />}
      {(view === 'turmas' || view === 'alunos') && <TeacherTabs tabs={[['turmas', 'Minhas turmas'], ['alunos', 'Meus alunos']]} active={view} onChange={chooseView} />}
      {view === 'turmas' && <Classes classes={classes} students={students} selectedClass={selectedClass} onSelect={(item) => setSelectedClass(item)} onStudent={(item) => { setSelectedStudent(item); chooseView('alunos') }} />}
      {view === 'alunos' && <Students students={filteredStudents} onSelect={(item) => { setSelectedStudent(item); setSelectedClass(classes.find((itemClass) => itemClass.id === item.turma_id) || null) }} selected={selectedStudent} />}
      {(view === 'frequencia' || view === 'evolucao') && <TeacherTabs tabs={[['frequencia', 'Frequência'], ['evolucao', 'Evolução']]} active={view} onChange={chooseView} />}
      {view === 'frequencia' && <Attendance lessons={lessons} students={filteredStudents} selectedLesson={selectedLesson} setSelectedLesson={setSelectedLesson} attendance={attendance} setAttendance={setAttendance} onSave={saveAttendance} saving={saving} />}
      {view === 'evolucao' && <Evolution students={students} selectedStudent={selectedStudent} setSelectedStudent={setSelectedStudent} evaluation={evaluation} setEvaluation={setEvaluation} observation={observation} setObservation={setObservation} onSave={saveEvolution} saving={saving} />}
      {view === 'agenda' && <Agenda lessons={lessons} />}
      {(view === 'avisos' || view === 'notificacoes') && <TeacherTabs tabs={[['avisos', 'Avisos'], ['notificacoes', 'Notifica\u00e7\u00f5es']]} active={view} onChange={chooseView} />}
      {view === 'avisos' && <Notices notices={data.avisos || []} onRead={async (notice) => { await supabase.rpc('professora_marcar_aviso_lido', { p_id_comunicado: notice.id }); load() }} onReadAll={async () => { await supabase.rpc('professora_marcar_todos_avisos_lidos'); load() }} />}
      {view === 'notificacoes' && <Notices notices={(data.avisos || []).filter((notice) => !notice.lido)} empty="Você não possui novas notificações." onReadAll={async () => { await supabase.rpc('professora_marcar_todos_avisos_lidos'); load() }} />}
      {view === 'perfil' && <Profile data={data} onSave={async (values) => { const result = await supabase.from('usuario').update({ telefone: values.telefone, email: values.email }).eq('id_usuario', session.user.id); if (result.error) setError('Não foi possível atualizar o perfil.'); else if (values.password) { const passwordResult = await supabase.auth.updateUser({ password: values.password }); if (passwordResult.error) { setError('Os dados foram salvos, mas não foi possível atualizar a senha.'); return } setMessage('Perfil e senha atualizados com sucesso.'); load() } else { setMessage('Perfil atualizado com sucesso.'); load() } }} />}
      {view === 'feedback' && <Feedback students={students} selectedStudent={selectedStudent} setSelectedStudent={setSelectedStudent} text={feedbackText} setText={setFeedbackText} visible={feedbackVisible} setVisible={setFeedbackVisible} onSave={saveFeedback} saving={saving} />}
    </section>
  </main>
}

function TeacherTabs({ tabs, active, onChange }) {
  return <div className="teacher-tabs" role="tablist">{tabs.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={active === id} className={active === id ? 'is-active' : ''} onClick={() => onChange(id)}>{label}</button>)}</div>
}
function Section({ title, action, children }) { return <section className="teacher-section"><div className="teacher-section__heading"><h2>{title}</h2>{action}</div>{children}</section> }
function Home({ data, classes, lessons, onClass, onLesson, onPending }) { const stats = data.indicadores || {}; return <><div className="teacher-stats">{[['Aulas hoje', stats.aulas_hoje], ['Alunos', stats.alunos], ['Turmas', stats.turmas], ['Pendências', stats.pendencias]].map(([label, value]) => <article key={label}><small>{label}</small><strong>{value ?? 0}</strong></article>)}</div><div className="teacher-grid"><Section title="Próximas aulas"><div className="teacher-list">{lessons.slice(0, 5).map((lesson) => <button type="button" className="teacher-lesson" key={lesson.id} onClick={() => onLesson(lesson)}><time>{formatTime(lesson.inicio)}</time><span><strong>{lesson.turma}</strong><small>{formatDate(lesson.data)} · {lesson.sala}</small></span><b>Ver turma</b></button>)}{!lessons.length && <Empty text="Nenhuma aula encontrada no período." />}</div></Section><Section title="Minhas turmas"><div className="teacher-class-grid">{classes.slice(0, 4).map((item) => <button type="button" key={item.id} onClick={() => onClass(item)}><strong>{item.nome}</strong><span>{item.modalidade || 'Dança'} · {item.alunos || 0} alunos</span><small>{item.dia || 'Horário a definir'} · {item.horario || '—'}</small></button>)}{!classes.length && <Empty text="Você ainda não possui turmas atribuídas." />}</div></Section></div><Section title="Atividades pendentes"><div className="teacher-pending"><button type="button" onClick={() => lessons[0] && onLesson(lessons[0])}>Registrar frequência <span>Realizar →</span></button><button type="button" onClick={() => studentsFirst(data) && onPending(studentsFirst(data))}>Enviar feedback <span>Realizar →</span></button></div></Section></> }
function studentsFirst(data) { return data.alunos?.[0] }
function Classes({ classes, students, selectedClass, onSelect, onStudent }) { const members = selectedClass ? students.filter((student) => student.turma_id === selectedClass.id) : []; return <div className="teacher-grid teacher-grid--single"><Section title="Minhas turmas"><div className="teacher-class-grid teacher-class-grid--large">{classes.map((item) => <button type="button" className={selectedClass?.id === item.id ? 'is-selected' : ''} key={item.id} onClick={() => onSelect(item)}><strong>{item.nome}</strong><span>{item.modalidade || 'Dança'} · {item.alunos || 0} alunos</span><small>{item.dia || 'Dias a definir'} · {item.horario || 'Horário a definir'}</small></button>)}{!classes.length && <Empty text="Você ainda não possui turmas atribuídas." />}</div></Section>{selectedClass && <Section title={`Alunos — ${selectedClass.nome}`}><div className="teacher-student-list">{members.map((student) => <button type="button" key={student.id} onClick={() => onStudent(student)}><span>{student.nome?.slice(0, 1)}</span><strong>{student.nome}</strong><small>{student.frequencia ? `${student.frequencia}% de frequência` : 'Sem registros ainda'}</small></button>)}{!members.length && <Empty text="Nenhum aluno encontrado." />}</div></Section>}</div> }
function Students({ students, selected, onSelect }) { return <Section title="Meus alunos"><div className="teacher-student-list">{students.map((student) => <button type="button" className={selected?.id === student.id ? 'is-selected' : ''} key={student.id} onClick={() => onSelect(student)}><span>{student.nome?.slice(0, 1)}</span><strong>{student.nome}</strong><small>{student.turma} · {student.frequencia ? `${student.frequencia}%` : 'Sem frequência'}</small></button>)}{!students.length && <Empty text="Nenhum aluno encontrado." />}</div>{selected && <div className="teacher-profile-card"><h3>{selected.nome}</h3><p>Turma: {selected.turma}</p><p>Última presença: {formatDate(selected.ultima_presenca)}</p><p>Frequência: {selected.frequencia ? `${selected.frequencia}%` : 'Sem registros'}</p></div>}</Section> }
function Attendance({ lessons, students, selectedLesson, setSelectedLesson, attendance, setAttendance, onSave, saving }) { const classStudents = selectedLesson ? students.filter((student) => student.turma_id === selectedLesson.turma_id) : students; return <Section title="Registro de frequência" action={<button className="teacher-button" type="button" disabled={!selectedLesson || saving} onClick={onSave}>{saving ? 'Salvando…' : 'Salvar frequência'}</button>}><label className="teacher-field">Aula<select value={selectedLesson?.id || ''} onChange={(event) => setSelectedLesson(lessons.find((item) => String(item.id) === event.target.value) || null)}><option value="">Selecione uma aula</option>{lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{formatDate(lesson.data)} · {formatTime(lesson.inicio)} · {lesson.turma}</option>)}</select></label><div className="teacher-attendance-list">{classStudents.map((student) => <div key={student.id}><strong>{student.nome}</strong><div><button type="button" className={attendance[student.id] === true ? 'is-present' : ''} onClick={() => setAttendance((current) => ({ ...current, [student.id]: true }))}>Presente</button><button type="button" className={attendance[student.id] === false ? 'is-absent' : ''} onClick={() => setAttendance((current) => ({ ...current, [student.id]: false }))}>Falta</button></div></div>)}{selectedLesson && !classStudents.length && <Empty text="Nenhum aluno matriculado nesta turma." />}</div></Section> }
function Evolution({ students, selectedStudent, setSelectedStudent, evaluation, setEvaluation, observation, setObservation, onSave, saving }) { return <Section title="Evolução do aluno"><label className="teacher-field">Aluno<select value={selectedStudent?.id || ''} onChange={(event) => setSelectedStudent(students.find((item) => String(item.id) === event.target.value) || null)}><option value="">Selecione um aluno</option>{students.map((student) => <option key={student.id} value={student.id}>{student.nome} · {student.turma}</option>)}</select></label><form className="teacher-evaluation" onSubmit={onSave}>{evaluationItems.map((item) => <label key={item}>{item}<select value={evaluation[item] || ''} onChange={(event) => setEvaluation((current) => ({ ...current, [item]: event.target.value }))}><option value="">Avaliação</option><option value="1">1 — Iniciando</option><option value="2">2 — Em desenvolvimento</option><option value="3">3 — Bom</option><option value="4">4 — Muito bom</option><option value="5">5 — Excelente</option></select></label>)}<label className="teacher-field teacher-field--full">Observações<textarea value={observation} onChange={(event) => setObservation(event.target.value)} placeholder="Digite uma observação sobre a evolução da aluna…" /></label><button className="teacher-button" type="submit" disabled={!selectedStudent || saving}>{saving ? 'Salvando…' : 'Salvar evolução'}</button></form></Section> }
function Feedback({ students, selectedStudent, setSelectedStudent, text, setText, visible, setVisible, onSave, saving }) { return <Section title="Novo feedback"><form className="teacher-form" onSubmit={onSave}><label className="teacher-field">Aluno<select required value={selectedStudent?.id || ''} onChange={(event) => setSelectedStudent(students.find((item) => String(item.id) === event.target.value) || null)}><option value="">Selecione um aluno</option>{students.map((student) => <option key={student.id} value={student.id}>{student.nome} · {student.turma}</option>)}</select></label><label className="teacher-field">Feedback<textarea required minLength={5} value={text} onChange={(event) => setText(event.target.value)} placeholder="Escreva um feedback pedagógico…" /></label><label className="teacher-check"><input type="checkbox" checked={visible} onChange={(event) => setVisible(event.target.checked)} /> Visível para o aluno</label><button className="teacher-button" type="submit" disabled={saving}>{saving ? 'Enviando…' : 'Enviar feedback'}</button></form></Section> }
function Agenda({ lessons }) {
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const leadingDays = (monthStart.getDay() + 6) % 7
  const cells = Array.from({ length: leadingDays + daysInMonth }, (_, index) => index < leadingDays ? null : index - leadingDays + 1)
  const lessonsByDay = lessons.reduce((items, lesson) => { const day = String(lesson.data || '').slice(8, 10); if (day) items[day] = [...(items[day] || []), lesson]; return items }, {})
  return <Section title="Agenda"><div className="teacher-agenda-calendar"><header><div><strong>{new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(today)}</strong><span>Confira suas aulas e compromissos</span></div><span className="teacher-agenda-calendar__today">Hoje</span></header><div className="teacher-agenda-calendar__week">{['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].map((day) => <span key={day}>{day}</span>)}</div><div className="teacher-agenda-calendar__days">{cells.map((day, index) => <div className={(day && String(day).padStart(2, '0') in lessonsByDay ? 'has-lesson ' : '') + (day === today.getDate() ? 'is-today' : '')} key={index}>{day && <><b>{day}</b>{lessonsByDay[String(day).padStart(2, '0')]?.slice(0, 2).map((lesson) => <small key={lesson.id}>{formatTime(lesson.inicio)} · {lesson.turma}</small>)}</>}</div>)}</div></div></Section>
}
function Notices({ notices, onRead, onReadAll, empty = 'Nenhum aviso encontrado.' }) { return <Section title="Avisos" action={onReadAll && notices.length ? <button className="teacher-button" type="button" onClick={onReadAll}>Marcar todas como lidas</button> : null}><div className="teacher-notices">{notices.map((notice) => <article className={!notice.lido ? 'is-unread' : ''} key={notice.id}><div><strong>{notice.titulo}</strong><time>{formatDate(notice.data)}</time></div><p>{notice.conteudo}</p>{!notice.lido && onRead && <button type="button" onClick={() => onRead(notice)}>Marcar como lido</button>}</article>)}{!notices.length && <Empty text={empty} />}</div></Section> }
function Profile({ data, onSave }) { const [form, setForm] = useState({ email: data.usuario?.email || '', telefone: data.usuario?.telefone || '', password: '' }); return <Section title="Meu perfil"><form className="teacher-profile-edit" onSubmit={(event) => { event.preventDefault(); onSave(form) }}><div className="teacher-profile-avatar">{(data.professora?.nome || 'P').slice(0, 1)}</div><h3>{data.professora?.nome}</h3><p>{data.professora?.especialidade || 'Professora'}</p><label className="teacher-field">E-mail<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label><label className="teacher-field">Telefone<input value={form.telefone} onChange={(event) => setForm({ ...form, telefone: event.target.value })} /></label><label className="teacher-field">Nova senha<input type="password" minLength="8" placeholder="Deixe em branco para manter" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label><button className="teacher-button" type="submit">Salvar perfil</button></form></Section> }
function Empty({ text }) { return <p className="teacher-empty">{text}</p> }
