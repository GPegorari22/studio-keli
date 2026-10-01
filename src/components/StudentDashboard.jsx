import { Component, useCallback, useEffect, useId, useState } from 'react'
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
import evolutionPageIcon from '../assets/icone-evolucao-rosa.png'
import attendancePageIcon from '../assets/icone-frequencia-rosa.png'
import storePageIcon from '../assets/icone-loja-rosa.png'
import profileDataIcon from '../assets/pessoa.png'
import profileGroupIcon from '../assets/pessoas.png'
import profileFinanceIcon from '../assets/financeiro.png'
import profilePurchaseIcon from '../assets/icone-loja-rosa.png'
import bannerProdutosWide from '../assets/banner-produtos-wide.png'
import bannerOfertas from '../assets/banner-ofertas.png'
import storePointeShoes from '../assets/store-pointe-shoes.png'
import storeCategoryShoes from '../assets/store-category-shoes.png'
import storeCategoryClothes from '../assets/store-category-clothes.png'
import storeCategoryAccessories from '../assets/store-category-accessories.png'
import storeCategoryOther from '../assets/store-category-other.png'
import evolutionStudentImage from '../assets/card-imagemAluno.png'
import feedbackImage from '../assets/professora-generica.png'
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
  historico_frequencia: [],
  historico_avaliacoes: [],
  avaliacao: null,
  financeiro: { proximo_vencimento: null, total_pago_ano: 0, mensalidades: [] },
}
const icons = { profile: profileIcon, home: homeIcon, calendar: calendarIcon, dance: danceIcon, chart: chartIcon, bag: bagIcon, logout: logoutIcon, bell: bellIcon }
const criterionDescriptions = {
  'Técnica': 'Precisão e controle em cada movimento.',
  'Flexibilidade': 'Amplitude e leveza para ir mais longe.',
  'Expressão': 'Sua personalidade ganha movimento.',
  'Disciplina': 'Constância e dedicação a cada aula.',
}

const storeCategoryKind = (name) => {
  const value = String(name || '').toLowerCase()
  if (value.includes('vest')) return 'clothes'
  if (value.includes('acess')) return 'accessories'
  if (value.includes('calç') || value.includes('calc')) return 'shoes'
  return 'other'
}

const storeCategoryImages = { shoes: storeCategoryShoes, clothes: storeCategoryClothes, accessories: storeCategoryAccessories, other: storeCategoryOther }
const storeCategoryKey = (name) => String(name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
const storeCategoryOrder = ['acessorios', 'calcados', 'vestuario', 'outros']

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
        <text className="student-gauge__number" x="100" y="107" textAnchor="middle">{hasAttendance ? `${percent}%` : ''}</text>
        <text className="student-gauge__label" x="100" y="125" textAnchor="middle">FREQUÊNCIA</text>
      </svg>
    </div>
  )
}

function ProgressChart({ criteria }) {
  const criterionOrder = ['Técnica', 'Tecnica', 'Flexibilidade', 'Expressão', 'Expressao', 'Disciplina']
  const values = (criteria || []).slice().sort((first, second) => criterionOrder.indexOf(first.nome) - criterionOrder.indexOf(second.nome)).slice(0, 4).map((criterion, index) => ({
    ...criterion,
    value: normaliseScore(criterion.nota),
    color: index % 2 ? '#203b61' : '#dd6985',
  }))

  if (!values.length) return <p className="student-empty-chart">Sua evolução aparecerá aqui apàs a primeira avaliação.</p>

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
                <span>{criterion.value == null ? '' : `${Math.round(criterion.value)}%`} <strong>{criterion.nome}</strong></span>
                <p>{criterionDescriptions[criterion.nome] || 'Seu desenvolvimento nas aulas de dança.'}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="student-progress-chart__scale" aria-hidden="true">
          {values.map((criterion, index) => <span key={criterion.nome || index} style={{ '--criterion-color': criterion.color }}><i />{criterion.value == null ? '' : `${Math.round(criterion.value)}%`}</span>)}
        </div>
      </div>
    </div>
  )
}

function Evolution({ criteria, studentName, evaluation, evaluationHistory }) {
  const [activeTrajectoryPoint, setActiveTrajectoryPoint] = useState(null)
  const evaluationDate = evaluation?.data ? shortDate.format(toDate(evaluation.data)) : 'Sem registro'
  const feedback = evaluation?.observacoes || 'Sua avaliação será atualizada pelo Studio apàs o próximo acompanhamento.'
  const trajectory = (evaluationHistory || []).slice(-6)
  const points = trajectory.map((entry, index) => {
    const x = trajectory.length === 1 ? 34 : 34 + (441 * index) / (trajectory.length - 1)
    const score = Math.max(0, Math.min(100, Number(entry.nota) || 0))
    return { x, y: 135 - (score * 1.05), label: entry.data ? new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(toDate(entry.data)).slice(0, 3).toUpperCase() : '' }
  })
  const polyline = points.map(({ x, y }) => `${x},${y}`).join(' ')
  return (
    <section className="student-evolution-page" id="evolucao" aria-label="Sua evolução" tabIndex={-1}>
      <header className="student-evolution-page__header">
        <div>
          <h2>Minha Evolução</h2>
          <p>Acompanhe seu desenvolvimento e descubra até onde seus movimentos podem chegar.</p>
        </div>
        <div className="student-evolution-page__status">
          <span>Última avaliação: {evaluationDate}</span>
          <span>Método de avaliação: {evaluation?.metas || 'ROYAL BALLET'}</span>
        </div>
        <Icon name="bell" />
      </header>
      <div className="student-evolution-page__overview">
        <section aria-labelledby="evolution-chart-title">
          <h3 id="evolution-chart-title">Keli Dance Evolution</h3>
          <ProgressChart criteria={criteria} />
        </section>
        <figure className="student-evolution-page__image">
          <img src={evolutionStudentImage} alt="Bailarina em movimento" />
        </figure>
      </div>
      <section className="student-evolution-page__trajectory" aria-labelledby="trajectory-title">
          <h3 id="trajectory-title">Minha trajetória</h3>
          {points.length ? <svg viewBox="0 0 520 170" role="img" aria-label="Histórico das avaliações do aluno">
            <path d="M34 135H492M34 100H492M34 65H492M34 30H492" />
            <text x="2" y="138">0%</text><text x="2" y="103">33%</text><text x="2" y="68">66%</text><text x="2" y="33">100%</text>
            <polyline points={polyline} />
            {points.map(({ x, y, label }, index) => {
              const entry = trajectory[index]
              const score = Math.round(Number(entry.nota) || 0)
              const tooltipX = Math.max(4, Math.min(430, x - 34))
              return <g key={`${x}-${y}`} onMouseEnter={() => setActiveTrajectoryPoint(index)} onMouseLeave={() => setActiveTrajectoryPoint(null)} onFocus={() => setActiveTrajectoryPoint(index)} onBlur={() => setActiveTrajectoryPoint(null)} tabIndex="0">
                <title>{`${label}: ${score}%`}</title>
                <circle cx={x} cy={y} r="5" />
                <text x={x} y="158" textAnchor="middle">{label}</text>
                {activeTrajectoryPoint === index && <g className="student-evolution-page__trajectory-tooltip" pointerEvents="none">
                  <rect x={tooltipX} y={Math.max(4, y - 39)} width="68" height="27" rx="4" />
                  <text x={tooltipX + 34} y={Math.max(16, y - 23)} textAnchor="middle">{entry.data ? shortDate.format(toDate(entry.data)) : label}</text>
                  <text x={tooltipX + 34} y={Math.max(27, y - 13)} textAnchor="middle">Média: {score}%</text>
                </g>}
              </g>
            })}
          </svg> : <p className="student-empty-chart">Sua trajetória aparecerá apàs a primeira avaliação.</p>}
      </section>
      <section className="student-evolution-page__feedback" aria-labelledby="feedback-title">
        <div className="student-evolution-page__feedback-avatar"><img src={feedbackImage} alt={`Professora responsvel pelo feedback de ${studentName}`} /></div>
        <div><h3 id="feedback-title">Feedback</h3><p>{feedback}</p></div>
      </section>
    </section>
  )
}

function AttendancePage({ attendance, attendanceHistory, financial }) {
  const [lessonFilter, setLessonFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedPayment, setSelectedPayment] = useState(null)
  const percent = attendance?.percentual == null ? null : Math.max(0, Math.min(100, Number(attendance.percentual) || 0))
  const presentCount = Number(attendance?.presencas) || 0
  const absenceCount = Number(attendance?.faltas) || 0
  const history = (attendanceHistory || []).slice(0, 8)
  const lessonOptions = [...new Set(history.map((lesson) => lesson.modalidade).filter(Boolean))]
  const filteredHistory = history.filter((lesson) => (
    (lessonFilter === 'all' || lesson.modalidade === lessonFilter)
    && (statusFilter === 'all' || (statusFilter === 'present' ? lesson.presente : !lesson.presente))
  ))
  const formatMoney = (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const nextDue = financial?.proximo_vencimento
  const monthlyPayments = financial?.mensalidades || []
  const historyPayments = monthlyPayments.filter((payment) => !(nextDue && payment.competencia === nextDue.competencia && payment.vencimento === nextDue.vencimento))
  const competenceLabel = (value) => {
    if (!value) return 'Sem mensalidade em aberto'
    const date = toDate(value)
    const month = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(date)
    return `${month.charAt(0).toUpperCase()}${month.slice(1)}, ${date.getFullYear()}`
  }
  const historyCompetenceLabel = (value) => {
    if (!value) return 'Sem mensalidade registrada'
    const date = toDate(value)
    const month = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(date).toUpperCase()
    return `${month} / ${date.getFullYear()}`
  }
  const paymentStatusLabel = (value) => value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : 'Sem status'
  const dateLabel = (value) => value ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(toDate(value)) : ''

  return (
    <section className="student-attendance-page" id="frequencia" aria-label="Minha Frequncia" tabIndex={-1}>
      <header className="student-attendance-page__header">
        <div><h2><img className="student-page-title__icon" src={attendancePageIcon} alt="" aria-hidden="true" />Minha Frequncia</h2><p>Acompanhe sua presença e mantenha seu ritmo.</p></div>
        <Icon name="bell" />
      </header>
      <div className="student-attendance-page__summary">
        <section className="student-attendance-page__gauge" aria-label={percent == null ? 'Sem registros de frequência' : `${percent}% de frequência`}>
          <AttendanceChart attendance={attendance} />
          <div className="student-attendance-page__legend"><span><i className="is-presence" />PRESENA</span><span><i className="is-absence" />FALTAS</span></div>
        </section>
        <div className="student-attendance-page__counters"><strong>{presentCount} aulas presentes</strong><strong>{absenceCount} faltas</strong><strong>{Number(attendance?.justificadas) || 0} justificadas</strong></div>
      </div>
      <section className="student-attendance-page__history" aria-labelledby="attendance-history-title">
        <header><div><h3 id="attendance-history-title">Histórico de presença</h3><p>Confira seu histórico de aulas e mantenha sua frequência em dia.</p></div><div className="student-attendance-page__filters"><label><span className="sr-only">Filtrar modalidade</span><select value={lessonFilter} onChange={(event) => setLessonFilter(event.target.value)}><option value="all">Todas as aulas</option>{lessonOptions.map((lesson) => <option value={lesson} key={lesson}>{lesson}</option>)}</select></label><label><span className="sr-only">Filtrar status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Todos os status</option><option value="present">Presentes</option><option value="absent">Faltas</option></select></label></div></header>
        <div className="student-attendance-page__table" role="table" aria-label="Histórico de presença">
          <div className="student-attendance-page__row student-attendance-page__row--head" role="row"><span>DATA</span><span>AULA</span><span>PROFESSORA</span><span>SITUAÇÃO</span></div>
          {filteredHistory.length ? filteredHistory.map((lesson, index) => <div className="student-attendance-page__row" role="row" key={`${lesson.id_aula}-${index}`}><span>{lesson.data ? shortDate.format(toDate(lesson.data)) : '--/--'}</span><span>{lesson.modalidade || 'Aula'}</span><span>{lesson.professora || 'Studio Keli'}</span><span className={lesson.presente ? 'is-present' : 'is-absent'}>{lesson.presente ? 'Presente' : 'Faltou'}</span></div>) : <p className="student-empty-chart">Nenhuma aula corresponde aos filtros selecionados.</p>}
        </div>
        <div className="student-attendance-page__stats"><span>Frequncia atual <strong>{percent == null ? '' : `${percent}%`}</strong></span><span>Presenças <strong>{presentCount}</strong></span><span>Faltas <strong>{absenceCount}</strong></span><span>Justificadas <strong>{Number(attendance?.justificadas) || 0}</strong></span></div>
      </section>
      <section className="student-finance" aria-labelledby="finance-title">
        <header><h3 id="finance-title">Meu Financeiro</h3><p>Acompanhe suas mensalidades e pagamentos em um s lugar.</p></header>
        <div className="student-finance__highlights"><div><strong>PRÓXIMO VENCIMENTO</strong><span>{nextDue ? `${dateLabel(nextDue.vencimento)} - ${formatMoney(nextDue.valor)}` : 'Nenhum vencimento pendente'}</span></div><div><strong>TOTAL PAGO EM 2026:</strong><span>{formatMoney(financial?.total_pago_ano)}</span></div></div>
        <div className="student-finance__body"><div className="student-finance__current"><span>{competenceLabel(nextDue?.competencia)}</span><strong>{nextDue ? formatMoney(nextDue.valor) : 'R$ 0,00'}</strong><button type="button" onClick={() => nextDue && setSelectedPayment(nextDue)} disabled={!nextDue}>DETALHES</button></div><div className="student-finance__months"><strong>Histórico de mensalidades</strong>{historyPayments.length ? historyPayments.slice(0, 3).map((monthlyPayment) => <button type="button" key={`${monthlyPayment.competencia}-${monthlyPayment.vencimento}`} onClick={() => setSelectedPayment(monthlyPayment)}><span>{historyCompetenceLabel(monthlyPayment.competencia)}</span><small>{paymentStatusLabel(monthlyPayment.status)}  {dateLabel(monthlyPayment.vencimento)}</small></button>) : <span>Nenhuma mensalidade registrada</span>}</div></div>
        {selectedPayment && <div className="student-finance__modal-backdrop" role="presentation" onClick={() => setSelectedPayment(null)}><section className="student-finance__modal" role="dialog" aria-modal="true" aria-labelledby="payment-details-title" onClick={(event) => event.stopPropagation()}><button type="button" aria-label="Fechar detalhes" onClick={() => setSelectedPayment(null)}></button><h4 id="payment-details-title">Detalhes da mensalidade</h4><p>{competenceLabel(selectedPayment.competencia)}</p><strong>{formatMoney(selectedPayment.valor)}</strong><span>Vencimento: {dateLabel(selectedPayment.vencimento)}</span><span>Status: {selectedPayment.status}</span></section></div>}
      </section>
    </section>
  )
}

class CartPageBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) return <section className="student-cart-page"><h1>Meu Carrinho</h1><p>Não foi possível atualizar o carrinho.</p><small>{this.state.error.message || String(this.state.error)}</small><button type="button" onClick={() => this.setState({ error: null })}>Tentar novamente</button></section>
    return this.props.children
  }
}

function CartPage({ onContinue }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [payment, setPayment] = useState('pix')
  const [orderRequested, setOrderRequested] = useState(false)
  const [orderSubmitting, setOrderSubmitting] = useState(false)
  const [orderData, setOrderData] = useState(null)
  const orderNumber = orderData?.id_pedido ? `#SKD-${new Date().getFullYear()}-${String(orderData.id_pedido).padStart(4, '0')}` : '#SKD-PENDENTE'
  const orderDate = new Intl.DateTimeFormat('pt-BR').format(new Date())

  const requestOrder = async () => {
    if (!items.length || orderSubmitting) return
    setOrderSubmitting(true)
    setMessage('')
    const { data, error } = await supabase.rpc('finalizar_pedido_aluno', { p_forma_pagamento: payment })
    if (error) {
      setMessage(`Não foi possível finalizar o pedido: ${error.message}`)
      setOrderSubmitting(false)
      return
    }
    setOrderData(data)
    setOrderRequested(true)
    setOrderSubmitting(false)
  }

  const loadCart = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data: cart, error: cartError } = await supabase.from('carrinho_aluno').select('id_carrinho').eq('id_usuario', user.id).maybeSingle()
    if (cartError) { setMessage(`Não foi possível carregar o carrinho: ${cartError.message}`); setItems([]); setLoading(false); return }
    if (!cart) { setItems([]); setLoading(false); return }
    const { data, error: itemsError } = await supabase.from('item_carrinho_aluno').select('id_item,id_produto,tamanho,quantidade,preco_unitario,produto(id_produto,nome,descricao,preco,estoque,imagem_produto(caminho,principal,ordem))').eq('id_carrinho', cart.id_carrinho).order('id_item')
    if (itemsError) { setMessage(`Não foi possível carregar os itens: ${itemsError.message}`); setItems([]); setLoading(false); return }
    setItems(data || [])
    setLoading(false)
  }, [])

  // eslint-disable-next-line react/set-state-in-effect
  useEffect(() => { loadCart() }, [loadCart])

  const updateQuantity = async (item, quantity) => {
    const previousQuantity = Number(item.quantidade)
    try {
      if (quantity < 1) {
        const { error } = await supabase.from('item_carrinho_aluno').delete().eq('id_item', item.id_item)
        if (error) throw error
        setItems((current) => current.filter((currentItem) => currentItem.id_item !== item.id_item))
        return
      }
      setItems((current) => current.map((currentItem) => currentItem.id_item === item.id_item ? { ...currentItem, quantidade: quantity } : currentItem))
      const { data: updated, error } = await supabase.rpc('atualizar_quantidade_item_carrinho', { p_id_item: item.id_item, p_quantidade: quantity })
      if (error) throw error
      if (!updated) throw new Error('item não encontrado no carrinho do usuário')
    } catch (error) {
      setItems((current) => current.map((currentItem) => currentItem.id_item === item.id_item ? { ...currentItem, quantidade: previousQuantity } : currentItem))
      setMessage(`Não foi possível atualizar a quantidade: ${error?.message || 'verifique a migration do carrinho'}`)
    }
  }

  const subtotal = items.reduce((total, item) => total + Number(item.preco_unitario || 0) * Number(item.quantidade || 0), 0)
  const imageForCartItem = (item) => {
    const product = Array.isArray(item.produto) ? item.produto[0] : item.produto
    const images = Array.isArray(product?.imagem_produto) ? product.imagem_produto : []
    return images.slice().sort((first, second) => Number(second.principal) - Number(first.principal) || Number(first.ordem || 0) - Number(second.ordem || 0))[0]?.caminho || storePointeShoes
  }
  const money = (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return <section className="student-cart-page" aria-label="Meu carrinho" tabIndex={-1}>
    <header className="student-cart-page__header"><div><h1>Meu Carrinho</h1><p>Revise os seus itens antes de finalizar o pedido.</p></div><div className="student-cart-page__actions"><button type="button" aria-label="Carrinho"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h6.9a2 2 0 0 0 1.9-1.4L20 7H6" /><circle cx="10" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></svg></button><Icon name="bell" /></div></header>
    <div className="student-cart-page__body"><section className="student-cart-page__items"><h2>Itens selecionados</h2>{loading ? <p>Carregando carrinho...</p> : items.length ? items.map((item) => <article className="student-cart-item" key={item.id_item}><div className="student-cart-item__image"><img src={imageForCartItem(item)} alt="" /></div><div className="student-cart-item__info"><h3>{item.produto?.nome || 'Produto'}</h3><small>{item.tamanho}</small><span> ✓ Tamanho cadastrado no produto</span><strong>{money(item.preco_unitario)}</strong></div><button type="button" className="student-cart-item__remove" onClick={() => updateQuantity(item, 0)}>× Remover</button><div className="student-cart-item__quantity"><button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); updateQuantity(item, Number(item.quantidade) - 1) }}>−</button><span>{item.quantidade}</span><button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); updateQuantity(item, Number(item.quantidade) + 1) }}>+</button></div><strong className="student-cart-item__total">{money(Number(item.preco_unitario) * Number(item.quantidade))}</strong></article>) : <p>Seu carrinho está vazio.</p>}<button type="button" className="student-cart-page__continue" onClick={onContinue}>← Continuar comprando <span>Precisa de mais algum item para sua aula?</span></button></section><aside className="student-cart-summary"><h2>Resumo do pedido</h2><p>{items.length} {items.length === 1 ? 'item' : 'itens'}</p>{items.map((item) => <div className="student-cart-summary__line" key={item.id_item}><span>{item.produto?.nome || 'Produto'}</span><strong>{money(Number(item.preco_unitario) * Number(item.quantidade))}</strong></div>)}<div className="student-cart-summary__line"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div className="student-cart-summary__line"><span>Retirada</span><strong>Grátis</strong></div><div className="student-cart-summary__total"><span>TOTAL</span><strong>{money(subtotal)}</strong></div><h3>Forma de recebimento</h3><label className="student-cart-summary__choice is-selected"><input type="radio" checked readOnly /> Retirada no Studio<small>Studio Keli Dalpian de Dança<br />Monte Alto — SP</small></label><h3>Como deseja pagar?</h3><div className="student-cart-summary__payments"><label className={payment === 'pix' ? 'is-selected' : ''}><input type="radio" name="payment" checked={payment === 'pix'} onChange={() => setPayment('pix')} /> PIX<small>Gerar código PIX</small></label><label className={payment === 'card' ? 'is-selected' : ''}><input type="radio" name="payment" checked={payment === 'card'} onChange={() => setPayment('card')} /> Cartão no Studio<small>Pagamento presencial</small></label></div><button type="button" className="student-cart-summary__finish" disabled={!items.length || orderSubmitting} onClick={requestOrder}>{orderSubmitting ? 'ENVIANDO...' : 'FINALIZAR PEDIDO'}</button>{message && <small className="student-cart-summary__message">{message}</small>}<small className="student-cart-summary__privacy">♧ Seus dados são utilizados apenas para processar seu pedido.</small></aside></div>
    {orderRequested && <div className="student-order-modal__backdrop" role="presentation" onClick={() => setOrderRequested(false)}><section className="student-order-modal" role="dialog" aria-modal="true" aria-labelledby="order-requested-title" onClick={(event) => event.stopPropagation()}><button type="button" className="student-order-modal__close" onClick={() => setOrderRequested(false)} aria-label="Fechar">×</button><h2 id="order-requested-title">Pedido solicitado!</h2><div className="student-order-modal__card"><div className="student-order-modal__meta"><span>PEDIDO Nº<strong>{orderNumber}</strong></span><span>Data do pedido<strong>{orderDate}</strong></span></div><h3>Resumo do pedido</h3><div className="student-order-modal__columns"><div>{items.map((item, index) => <div className="student-order-modal__item" key={item.id_item}><img src={imageForCartItem(item)} alt="" /><span><strong>Produto {index + 1}: {item.produto?.nome || 'Produto'}</strong><small>Categoria: Produto<br />Tamanho: {item.tamanho}<br />Quantidade: {item.quantidade}</small></span><b>{money(Number(item.preco_unitario) * Number(item.quantidade))}</b></div>)}</div><div className="student-order-modal__payment"><span>Forma de pagamento <b>{payment === 'pix' ? 'PIX' : 'Cartão no Studio'}</b></span><span>Subtotal <b>{money(subtotal)}</b></span><span>Retirada <b>Grátis</b></span><strong>Status: <b>{money(subtotal)}</b></strong><small>Pagamento pendente</small>{payment === 'pix' && <button type="button" onClick={() => setMessage('Código PIX será gerado após a confirmação do pedido.')}>GERAR CÓDIGO PIX</button>}<small>O pagamento será confirmado automaticamente após a identificação.</small></div></div><div className="student-order-modal__pickup"><strong>Onde retirar</strong><span>📍 Studio Keli Dalpian de Dança, Monte Alto — SP</span><span>Status: Pedido em preparação → Preparando → Pronto para retirada</span><small>Você receberá uma notificação quando seu pedido estiver disponível para retirada.</small></div></div><button type="button" className="student-order-modal__home" onClick={onContinue}>Página inicial →</button></section></div>}
  </section>
}

function ProfilePage({ student, nextLesson, financial }) {
  const [profile, setProfile] = useState(student || {})
  const [photoSaving, setPhotoSaving] = useState(false)
  const [photoMessage, setPhotoMessage] = useState('')
  const [latestOrder, setLatestOrder] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [purchasesOpen, setPurchasesOpen] = useState(false)
  const [financeOpen, setFinanceOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ nome: '', email: '', telefone: '', cpf: '' })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState('')
  useEffect(() => { supabase.rpc('dados_perfil_aluno').then(({ data }) => { if (data) setProfile((current) => ({ ...current, ...data })) }) }, [])
  useEffect(() => {
    let mounted = true
    supabase.from('pedidos').select('id_pedido,forma_pagamento,status,total,criado_em,itens_pedido(quantidade,tamanho,preco_unitario,produto(nome))').order('criado_em', { ascending: false }).limit(10).then(({ data }) => { if (mounted) { setRecentOrders(data || []); setLatestOrder(data?.[0] || null) } })
    return () => { mounted = false }
  }, [])
  const formatMoney = (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const dateLabel = (value) => value ? new Intl.DateTimeFormat('pt-BR').format(toDate(value)) : 'Não informado'
  const handlePhoto = (event) => { const file = event.target.files?.[0]; if (!file) return; if (!file.type.startsWith('image/')) { setPhotoMessage('Selecione uma imagem.'); return } const reader = new FileReader(); reader.onload = async () => { setPhotoSaving(true); const { data, error } = await supabase.rpc('atualizar_foto_perfil_aluno', { p_foto: reader.result }); if (error) setPhotoMessage(error.message); else { setProfile((current) => ({ ...current, foto_perfil: data?.foto_perfil || reader.result })); setPhotoMessage('Foto atualizada.'); } setPhotoSaving(false) }; reader.readAsDataURL(file) }
  const openProfileEditor = () => { setProfileForm({ nome: profile.nome || '', email: profile.email || '', telefone: profile.telefone || '', cpf: profile.cpf || '' }); setProfileError(''); setEditingProfile(true) }
  const saveProfile = async (event) => { event.preventDefault(); if (profileSaving) return; setProfileSaving(true); setProfileError(''); const { data, error } = await supabase.rpc('atualizar_dados_perfil_aluno', { p_nome: profileForm.nome, p_email: profileForm.email, p_telefone: profileForm.telefone || null, p_cpf: profileForm.cpf || null }); if (error) setProfileError(error.message); else { setProfile((current) => ({ ...current, ...data })); setEditingProfile(false) } setProfileSaving(false) }
  return <section className="student-profile-page" aria-label="Meu perfil" tabIndex={-1}><header className="student-profile-page__header"><div><h2>Meu perfil</h2><p>Aqui você encontra todas as suas informações do seu cadastro no Studio</p></div><div><Icon name="calendar" /><span>{ptDate.format(new Date())}</span><Icon name="bell" /></div></header><div className="student-profile-page__grid"><article className="student-profile-card student-profile-card--identity"><div className="student-profile-card__avatar">{profile.foto_perfil ? <img src={profile.foto_perfil} alt="Foto do perfil" /> : <Icon name="profile" />}</div><h3>{profile.nome || 'Aluno'}</h3><small>Aluno</small><label className="student-profile-card__photo-button">{photoSaving ? 'Salvando...' : 'Alterar foto'}<input type="file" accept="image/*" onChange={handlePhoto} disabled={photoSaving} /></label>{photoMessage && <small className="student-profile-card__photo-message">{photoMessage}</small>}<div className="student-profile-card__quote">A dança é<br />o movimento da alma.</div></article><article className="student-profile-card"><h3><img className="student-profile-card__heading-icon" src={profileDataIcon} alt="" aria-hidden="true" />Dados pessoais</h3><dl><dt>Nome completo</dt><dd>{profile.nome || 'Não informado'}</dd><dt>E-mail</dt><dd>{profile.email || 'Não informado'}</dd><dt>Telefone</dt><dd>{profile.telefone || 'Não informado'}</dd><dt>CPF</dt><dd>{profile.cpf || 'Não informado'}</dd></dl><button type="button" onClick={openProfileEditor}>✎ Editar dados</button></article><article className="student-profile-card"><h3><img className="student-profile-card__heading-icon" src={profileGroupIcon} alt="" aria-hidden="true" />Minha turma</h3><strong>{nextLesson?.modalidade || 'Sem turma ativa'}</strong><dl><dt>Nível</dt><dd>{nextLesson?.turma || 'Não informado'}</dd><dt>Próxima aula</dt><dd>{nextLesson?.data ? `${dateLabel(nextLesson.data)} às ${time(nextLesson.horario_inicio)}` : 'Não agendada'}</dd></dl><span className="student-profile-card__status">● Matrícula ativa</span></article><article className="student-profile-card"><h3><img className="student-profile-card__heading-icon" src={profileFinanceIcon} alt="" aria-hidden="true" />Situação financeira</h3><dl><dt>Mensalidade atual</dt><dd>{financial?.mensalidades?.[0]?.valor ? formatMoney(financial.mensalidades[0].valor) : 'R$ 0,00'}</dd><dt>Próximo vencimento</dt><dd>{financial?.proximo_vencimento?.vencimento ? dateLabel(financial.proximo_vencimento.vencimento) : 'Nenhum'}</dd><dt>Status</dt><dd>{financial?.proximo_vencimento?.status || 'Em dia'}</dd></dl><button type="button" onClick={() => setFinanceOpen(true)}>Ver financeiro →</button></article><article className="student-profile-card"><h3><img className="student-profile-card__heading-icon" src={profilePurchaseIcon} alt="" aria-hidden="true" />Última compra</h3>{latestOrder ? <><strong>{latestOrder.itens_pedido?.[0]?.produto?.nome || 'Pedido'}</strong><dl><dt>Total</dt><dd>{formatMoney(latestOrder.total)}</dd><dt>Pedido</dt><dd>#{latestOrder.id_pedido}</dd></dl><span className="student-profile-card__status">● {latestOrder.status}</span></> : <p>Nenhuma compra registrada.</p>}<button type="button" onClick={() => setPurchasesOpen(true)}>Ver minhas compras →</button></article></div>{financeOpen && <div className="student-finance-profile__backdrop" role="presentation" onClick={() => setFinanceOpen(false)}><section className="student-finance-profile student-finance-profile--compact" role="dialog" aria-modal="true" aria-labelledby="profile-finance-title" onClick={(event) => event.stopPropagation()}><button type="button" className="student-finance-profile__close" onClick={() => setFinanceOpen(false)} aria-label="Fechar">×</button><h2 id="profile-finance-title">Resumo financeiro</h2><div className="student-finance-profile__compact-list"><div><span>Mensalidade atual</span><strong>{financial?.mensalidades?.[0]?.valor ? formatMoney(financial.mensalidades[0].valor) : 'R$ 0,00'}</strong></div><div><span>Próximo vencimento</span><strong>{financial?.proximo_vencimento?.vencimento ? dateLabel(financial.proximo_vencimento.vencimento) : 'Nenhum'}</strong></div><div><span>Status</span><strong>{financial?.proximo_vencimento?.status || 'Em dia'}</strong></div></div><button type="button" className="student-finance-profile__button" onClick={() => setFinanceOpen(false)}>Fechar</button></section></div>}{purchasesOpen && <div className="student-purchases__backdrop" role="presentation" onClick={() => setPurchasesOpen(false)}><section className="student-purchases" role="dialog" aria-modal="true" aria-labelledby="purchases-title" onClick={(event) => event.stopPropagation()}><button type="button" className="student-purchases__close" onClick={() => setPurchasesOpen(false)} aria-label="Fechar">×</button><h2 id="purchases-title">Minhas compras</h2>{recentOrders.length ? <div className="student-purchases__list">{recentOrders.map((order) => <article className="student-purchases__order" key={order.id_pedido}><header><strong>Pedido #{order.id_pedido}</strong><span>{order.criado_em ? new Intl.DateTimeFormat('pt-BR').format(new Date(order.criado_em)) : ''}</span></header><div>{(order.itens_pedido || []).map((item, index) => <p key={index}><span>{item.produto?.nome || 'Produto'} · {item.quantidade} un. · Tam. {item.tamanho}</span><strong>{formatMoney(Number(item.preco_unitario) * Number(item.quantidade))}</strong></p>)}</div><footer><span>{order.forma_pagamento === 'pix' ? 'PIX' : 'Cartão no Studio'} · {order.status}</span><strong>{formatMoney(order.total)}</strong></footer></article>)}</div> : <p className="student-purchases__empty">Você ainda não realizou compras.</p>}</section></div>}{editingProfile && <div className="student-profile-edit__backdrop" role="presentation" onClick={() => setEditingProfile(false)}><form className="student-profile-edit" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title" onSubmit={saveProfile} onClick={(event) => event.stopPropagation()}><button type="button" className="student-profile-edit__close" onClick={() => setEditingProfile(false)} aria-label="Fechar">×</button><h2 id="edit-profile-title">Editar dados</h2><label>Nome completo<input value={profileForm.nome} onChange={(event) => setProfileForm({ ...profileForm, nome: event.target.value })} required /></label><label>E-mail<input type="email" value={profileForm.email} onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })} required /></label><label>Telefone<input value={profileForm.telefone} onChange={(event) => setProfileForm({ ...profileForm, telefone: event.target.value })} /></label><label>CPF<input value={profileForm.cpf} onChange={(event) => setProfileForm({ ...profileForm, cpf: event.target.value })} /></label>{profileError && <p role="alert">{profileError}</p>}<button type="submit" disabled={profileSaving}>{profileSaving ? 'Salvando...' : 'Salvar alterações'}</button></form></div>}</section>
}

function StorePage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedSize, setSelectedSize] = useState('29')
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [cartMessage, setCartMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCart, setShowCart] = useState(false)

  useEffect(() => {
    let mounted = true
    Promise.all([
      supabase.from('categoria_produto').select('id_categoria,nome,descricao,status').order('nome'),
      supabase.from('produto').select('id_produto,nome,descricao,preco,estoque,id_categoria,status,tamanhos_disponiveis,imagem_produto(caminho,principal,ordem)').order('nome'),
    ]).then(([categoryResult, productResult]) => {
      if (!mounted) return
      const uniqueCategories = (categoryResult.data || [])
        .filter((category) => storeCategoryOrder.includes(storeCategoryKey(category.nome)))
        .filter((category, index, list) => list.findIndex((item) => storeCategoryKey(item.nome) === storeCategoryKey(category.nome)) === index)
        .sort((first, second) => storeCategoryOrder.indexOf(storeCategoryKey(first.nome)) - storeCategoryOrder.indexOf(storeCategoryKey(second.nome)))
      setCategories(uniqueCategories)
      setProducts(productResult.data || [])
      setLoading(false)
    }).catch(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const visibleProducts = products.filter((product) => (selectedCategory == null || product.id_categoria === selectedCategory) && (!searchTerm.trim() || `${product.nome} ${product.descricao || ''}`.toLowerCase().includes(searchTerm.trim().toLowerCase())))
  const selectedProductCategory = selectedProduct ? categories.find((category) => category.id_categoria === selectedProduct.id_categoria) : null
  const productSizes = Array.isArray(selectedProduct?.tamanhos_disponiveis) && selectedProduct.tamanhos_disponiveis.length ? selectedProduct.tamanhos_disponiveis : ['Único']
  const imageFor = (product) => product.imagem_produto?.slice().sort((first, second) => Number(second.principal) - Number(first.principal) || first.ordem - second.ordem)[0]?.caminho || storePointeShoes
  const money = (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const installment = (value) => money(Number(value || 0) / 10)
  const addSelectedProductToCart = async () => {
    if (!selectedProduct || !selectedProduct.estoque || addingToCart) return
    setAddingToCart(true)
    setCartMessage('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setCartMessage('Faça login para adicionar produtos ao carrinho.')
      setAddingToCart(false)
      return
    }
    const { data: cart, error: cartError } = await supabase.from('carrinho_aluno').upsert({ id_usuario: user.id, atualizado_em: new Date().toISOString() }, { onConflict: 'id_usuario' }).select('id_carrinho').single()
    if (cartError) {
      setCartMessage('Não foi possível abrir seu carrinho.')
      setAddingToCart(false)
      return
    }
    const { error: itemError } = await supabase.from('item_carrinho_aluno').upsert({ id_carrinho: cart.id_carrinho, id_produto: selectedProduct.id_produto, tamanho: selectedSize, quantidade: quantity, preco_unitario: selectedProduct.preco, atualizado_em: new Date().toISOString() }, { onConflict: 'id_carrinho,id_produto,tamanho' })
    setCartMessage(itemError ? 'Não foi possível adicionar este produto.' : 'Produto adicionado ao carrinho.')
    setAddingToCart(false)
  }

  if (showCart) return <CartPageBoundary><CartPage onContinue={() => setShowCart(false)} /></CartPageBoundary>

  return (
    <section className="store-page" aria-label="Loja" tabIndex={-1}>
      <header className="store-page__header">
        <h1>Loja</h1>
        <label className="store-page__search"><span className="sr-only">Pesquisar produtos</span><input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Pesquisar produtos" /><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></svg></label>
        <div className="store-page__header-actions"><button type="button" className="store-page__cart-button" aria-label="Abrir carrinho" onClick={() => setShowCart(true)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h6.9a2 2 0 0 0 1.9-1.4L20 7H6" /><circle cx="10" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></svg></button><Icon name="bell" /></div>
      </header>
      <div className="store-page__hero"><img src={bannerProdutosWide} alt="Seu movimento também veste você. Produtos selecionados para acompanhar sua jornada no Studio." /></div>
      <div className="store-page__categories" aria-label="Categorias de produtos">
        {categories.map((category) => <button type="button" className={`store-page__category${selectedCategory === category.id_categoria ? ' is-selected' : ''}`} key={category.id_categoria} onClick={() => setSelectedCategory(category.id_categoria)}><img src={storeCategoryImages[storeCategoryKind(category.nome)]} alt={category.nome} /></button>)}
      </div>
      <section className="store-page__catalog" aria-live="polite">
        <h2>{selectedCategory == null ? 'Recomendados' : categories.find((category) => category.id_categoria === selectedCategory)?.nome}</h2>
        {loading ? <p>Carregando produtos...</p> : visibleProducts.length ? <div className="store-page__products">{visibleProducts.map((product) => <button type="button" className="store-page__product" key={product.id_produto} onClick={() => { setSelectedProduct(product); setSelectedSize(product.tamanhos_disponiveis?.[0] || 'Único'); setQuantity(1); setCartMessage('') }}>{imageFor(product) ? <img src={imageFor(product)} alt="" /> : <span className="store-page__product-art" aria-hidden="true" />}<strong>{product.nome}</strong><span>{money(product.preco)}</span><em>ou 10x de {installment(product.preco)}</em><small>{product.estoque > 0 ? <>Adicionar <svg className="store-page__cart-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h6.9a2 2 0 0 0 1.9-1.4L20 7H6" /><circle cx="10" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></svg></> : 'Indisponível'}</small></button>)}</div> : <p>Nenhum produto disponível no momento.</p>}
      </section>
      <section className="store-page__pickup" aria-label="Ofertas e retirada de pedidos">
        <img className="store-page__offers" src={bannerOfertas} alt="Ofertas do Studio Keli Dalpian" />
        <div className="store-page__map-card">
          <iframe title="Localização do Studio Keli Dalpian" src="https://www.google.com/maps?q=Rua+25+de+Mar%C3%A7o%2C+27%2C+Monte+Alto+-+SP&output=embed" loading="lazy"></iframe>
          <div className="store-page__pickup-copy">
            <h2>Seu pedido, pertinho de você.</h2>
            <p>As compras realizadas pela loja podem ser retiradas diretamente no Studio Keli Dalpian.</p>
            <p>Assim que seu pedido estiver pronto, você receberá uma notificação na sua Área do aluno.</p>
          </div>
        </div>
      </section>
      {selectedProduct && <div className="store-page__modal-backdrop" role="presentation" onClick={() => setSelectedProduct(null)}><section className="store-page__modal" role="dialog" aria-modal="true" aria-label={selectedProduct.nome} onClick={(event) => event.stopPropagation()}><button type="button" className="store-page__modal-close" aria-label="Fechar produto" onClick={() => setSelectedProduct(null)}></button><div className="store-page__modal-media">{imageFor(selectedProduct) ? <img src={imageFor(selectedProduct)} alt={selectedProduct.nome} /> : <span className="store-page__modal-art" aria-hidden="true" />}</div><div className="store-page__modal-details"><small>{selectedProductCategory?.nome || 'PRODUTO'}</small><h2>{selectedProduct.nome}</h2><p>{selectedProduct.descricao || 'Produto selecionado pelo Studio para sua rotina de dança.'}</p><strong>{money(selectedProduct.preco)}</strong><span className="store-page__modal-stock">? {Number(selectedProduct.estoque || 0) > 0 ? 'Disponível em estoque' : 'Produto sem estoque'}</span><label>Selecione o tamanho</label><div className="store-page__modal-sizes">{productSizes.map((size) => <button type="button" className={selectedSize === size ? 'is-selected' : ''} key={size} onClick={() => setSelectedSize(size)}>{size}</button>)}</div><span className="store-page__modal-size-note">? ✓ Tamanho cadastrado no produto</span><label>Quantidade</label><div className="store-page__modal-quantity"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>-</button><span>{quantity}</span><button type="button" onClick={() => setQuantity((value) => Math.min(Number(selectedProduct.estoque || 0), value + 1))}>+</button></div><div className="store-page__modal-total"><span>Total</span><strong>{money(Number(selectedProduct.preco || 0) * quantity)}</strong></div><button className="store-page__modal-add" type="button" onClick={addSelectedProductToCart} disabled={!selectedProduct.estoque || addingToCart}>{addingToCart ? 'ADICIONANDO...' : selectedProduct.estoque ? 'ADICIONAR AO CARRINHO' : 'PRODUTO INDISPONVEL'}<svg className="store-page__cart-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h6.9a2 2 0 0 0 1.9-1.4L20 7H6" /><circle cx="10" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></svg></button>{cartMessage && <small className="store-page__modal-cart-message">{cartMessage}</small>}<small className="store-page__modal-pickup">g Retirada disponível no Studio Keli Dalpian</small></div></section></div>}
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
        <button type="button" aria-label="Màs anterior" onClick={() => changeMonth(-1)}></button>
        <span aria-live="polite">{month}</span>
        <button type="button" aria-label="Prximo màs" onClick={() => changeMonth(1)}></button>
      </header>
      <div className="student-calendar__week" aria-hidden="true">
        {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SB'].map((day) => <span key={day}>{day}</span>)}
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
  const [selectedDate, setSelectedDate] = useState(() => today.toISOString().slice(0, 10))
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [note, setNote] = useState('')
  const [savedNote, setSavedNote] = useState('')
  const year = displayedMonth.getFullYear()
  const monthIndex = displayedMonth.getMonth()
  const firstWeekday = displayedMonth.getDay()
  const month = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(displayedMonth).replace(' de ', ' ')
  const activeDays = new Set((scheduledClasses || []).map((lesson) => lesson.data))
  const days = Array.from({ length: 42 }, (_, index) => new Date(year, monthIndex, index - firstWeekday + 1))
  const changeMonth = (offset) => setDisplayedMonth(new Date(year, monthIndex + offset, 1))
  const selectDate = (date) => setSelectedDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`)
  const selectedLessons = (scheduledClasses || []).filter((lesson) => lesson.data === selectedDate)
  const filteredLessons = activeFilter === 'Todos' || activeFilter === 'Aulas' ? selectedLessons : []

  return (
    <section className="student-agenda" id="calendario" aria-label={`Calendário de ${month}`} tabIndex={-1}>
      <header className="student-agenda__header">
        <div>
          <h2>Minha Agenda</h2>
          <div className="student-agenda__month-nav">
            <button type="button" aria-label="Màs anterior" onClick={() => changeMonth(-1)}></button>
            <strong>{month}</strong>
            <button type="button" aria-label="Prximo màs" onClick={() => changeMonth(1)}></button>
          </div>
        </div>
        <Icon name="bell" />
      </header>
      <div className="student-agenda__toolbar" aria-label="Filtros da agenda">
        {['Hoje', 'Ver màs', 'Junho', 'Todos', 'Aulas', 'Ensaios', 'Espetculos', 'etc'].map((filter) => <button className={filter === activeFilter ? 'is-selected' : undefined} key={filter} type="button" onClick={() => { setActiveFilter(filter); if (filter === 'Hoje') { setDisplayedMonth(new Date(today.getFullYear(), today.getMonth(), 1)); selectDate(today) } }}>{filter}</button>)}
        <button type="button" className="student-agenda__clear" onClick={() => { setNote(''); setSavedNote('') }}>Limpar anotações</button>
      </div>
      <div className="student-agenda__body">
        <div className="student-agenda__calendar">
          <div className="student-agenda__week" aria-hidden="true">{['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SB'].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="student-agenda__days">
            {days.map((date) => {
              const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
              const isToday = date.toDateString() === today.toDateString()
              const hasClass = activeDays.has(key)
              return <button type="button" key={key} onClick={() => selectDate(date)} className={[date.getMonth() !== monthIndex && 'is-outside', isToday && 'is-today', hasClass && 'has-class', selectedDate === key && 'is-selected'].filter(Boolean).join(' ')} aria-label={`${ptDate.format(date)}${hasClass ? ', aula agendada' : ''}`}><span>{date.getDate()}</span></button>
            })}
          </div>
        </div>
        <aside className="student-agenda__notes">
          <div><strong>{selectedDate ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long' }).format(toDate(selectedDate)) : 'Selecione uma data'}</strong>{filteredLessons.length ? filteredLessons.map((lesson, index) => <p key={`${lesson.id_aula || lesson.data}-${index}`}><b>{time(lesson.horario_inicio)} - {time(lesson.horario_fim)}</b> · {lesson.modalidade || 'Aula'}<br />{lesson.turma || 'Studio Keli'}</p>) : <p>Nenhuma aula agendada nesse dia.</p>}</div>
          <div><strong>Anotação do dia</strong><label><input type="text" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ex: revisar modalidade" /><button type="button" onClick={() => setSavedNote(note)}>Salvar</button></label>{savedNote && <small>{savedNote}</small>}</div>
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
      const [{ data, error: requestError }, { data: historyData, error: historyError }, { data: evolutionData, error: evolutionError }, { data: attendanceData, error: attendanceError }] = await Promise.all([
        supabase.rpc('meu_painel_aluno'),
        supabase.rpc('historico_evolucao_aluno'),
        supabase.rpc('detalhes_evolucao_aluno'),
        supabase.rpc('detalhes_frequencia_aluno'),
      ])
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
          avaliacao: !evolutionError && evolutionData?.avaliacao ? evolutionData.avaliacao : data?.avaliacao,
          criterios: !evolutionError && Array.isArray(evolutionData?.criterios) && evolutionData.criterios.length ? evolutionData.criterios : (data?.criterios || []),
          historico_avaliacoes: historyError ? [] : (historyData || []),
          historico_frequencia: !attendanceError && Array.isArray(attendanceData?.historico_frequencia) ? attendanceData.historico_frequencia : (data?.historico_frequencia || []),
          financeiro: !attendanceError && attendanceData?.financeiro ? attendanceData.financeiro : (data?.financeiro || defaultDashboard.financeiro),
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
  const attendanceHistory = dashboard?.historico_frequencia || defaultDashboard.historico_frequencia
  const evaluation = dashboard?.avaliacao || defaultDashboard.avaliacao
  const evaluationHistory = dashboard?.historico_avaliacoes || defaultDashboard.historico_avaliacoes
  const evolutionEvaluation = evaluation || (evaluationHistory.length ? {
    data: evaluationHistory[evaluationHistory.length - 1]?.data,
    metas: 'ROYAL BALLET',
  } : null)
  const financial = dashboard?.financeiro || defaultDashboard.financeiro
  const dateLabel = ptDate.format(today)
  const studentFullName = dashboard?.aluno?.nome?.trim() || 'Aluno'
  const studentName = firstName(studentFullName) || 'Aluno'
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
      setNotice('Não foi possível confirmar sua presença agora. Tente novamente mais perto do horrio da aula.')
    } finally {
      setConfirming(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    navigate('inicio')
  }

  const lessonDate = toDate(nextLesson?.data)
  const lessonTitle = nextLesson?.modalidade?.includes(':') ? nextLesson.modalidade : `${lessonDate ? new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(lessonDate).toLocaleUpperCase('pt-BR') + ': ' : ''}${nextLesson?.modalidade || 'Aula de dança'}`

  return (
    <main className="student-page">
      <aside className="student-sidebar" aria-label="Navegação do perfil">
        <a className={`student-sidebar__profile ${activeView === 'profile' ? 'is-active' : ''}`} href="#perfil" onClick={(event) => { event.preventDefault(); setActiveView('profile') }} aria-label="Perfil do aluno" title="Perfil do aluno"><Icon name="profile" /></a>
        <nav aria-label="Área do aluno">
          {[
            ['home', 'visao-geral', 'Início'],
            ['calendar', 'calendario', 'Calendário'],
            ['dance', 'frequencia', 'Aulas'],
            ['chart', 'evolucao', 'Evolução'],
            ['bag', 'loja', 'Loja'],
          ].map(([icon, id, label]) => {
            const targetView = icon === 'calendar' ? 'agenda' : icon === 'chart' ? 'evolution' : icon === 'dance' ? 'attendance' : icon === 'bag' ? 'store' : 'home'
            const isActive = (icon === 'home' && activeView === 'home') || (icon === 'calendar' && activeView === 'agenda') || (icon === 'chart' && activeView === 'evolution') || (icon === 'dance' && activeView === 'attendance') || (icon === 'bag' && activeView === 'store')
            const activeSource = activeView === 'agenda' && icon === 'home' ? agendaHomeIcon : activeView === 'agenda' && icon === 'calendar' ? agendaCalendarIcon : activeView === 'evolution' && icon === 'chart' ? evolutionPageIcon : activeView === 'attendance' && icon === 'dance' ? attendancePageIcon : activeView === 'store' && icon === 'bag' ? storePageIcon : undefined
            return <a key={id} className={isActive ? 'is-active' : undefined} href={`#${id}`} onClick={(event) => { event.preventDefault(); setActiveView(targetView) }} aria-current={isActive ? 'page' : undefined} title={label}><Icon name={icon} source={activeSource} /><span>{label}</span></a>
          })}
        </nav>
        <button className="student-sidebar__logout" type="button" onClick={signOut} title="Sair"><Icon name="logout" /><span>Sair</span></button>
      </aside>

      <section className="student-content" id="visao-geral" aria-label="Perfil do aluno" tabIndex={-1}>
        <img className="student-content__ribbon" src={studentRibbon} alt="" aria-hidden="true" />
        <div className="student-workspace">
          {['home', 'agenda'].includes(activeView) && <header className="student-topbar">
            <h1>Olá, {studentName}!</h1>
            <div className="student-topbar__right">
              <span className="student-topbar__date"><Icon name="calendar" />{dateLabel}</span>
              <div className="student-notifications">
                <button type="button" aria-label="Notificações" aria-expanded={notificationsOpen} aria-controls="student-notifications" onClick={() => setNotificationsOpen((open) => !open)}><Icon name="bell" /></button>
                {notificationsOpen && <div className="student-notifications__panel" id="student-notifications" role="status">{nextLesson ? `Sua próxima aula será em ${shortDate.format(lessonDate)}, às ${time(nextLesson.horario_inicio)}.` : 'Nenhuma aula agendada no momento.'}</div>}
              </div>
            </div>
          </header>}

          {loading && <div className="student-state" role="status">Carregando seu perfil</div>}
          {!loading && error && <div className="student-state student-state--error" role="alert"><p>{error}</p><button type="button" onClick={() => { setLoading(true); loadDashboard() }}>Tentar novamente</button></div>}

          {activeView === 'profile' ? <ProfilePage student={dashboard.aluno} nextLesson={nextLesson} financial={financial} onFinance={() => setActiveView('attendance')} onStore={() => setActiveView('store')} /> : activeView === 'home' ? <>
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
                    <p><time dateTime={nextLesson.data} title={shortDate.format(lessonDate)}>{time(nextLesson.horario_inicio)}  {time(nextLesson.horario_fim)}</time></p>
                    <span>{nextLesson.turma}</span>
                  </div>
                  <button type="button" onClick={confirmAttendance} disabled={!nextLesson.id_aula || !nextLessonIsToday || confirming} title={!nextLessonIsToday ? 'Presença disponível no dia da aula' : undefined}>{confirming ? 'Confirmando' : 'Marcar presença'}</button>
                </> : <p className="student-empty-chart">Você ainda no tem uma próxima aula agendada.</p>}
                {notice && <p className="student-notice" role="status">{notice}</p>}
              </section>

              <section className="student-attendance-card" aria-label="Frequncia">
                <AttendanceChart attendance={attendance} />
                <div className="student-attendance-card__legend">
                  <span aria-label={`${attendance?.presencas || 0} presenças`}><i aria-hidden="true" />Presença</span>
                  <span aria-label={`${attendance?.faltas || 0} faltas`}><i className="is-navy" aria-hidden="true" />Faltas</span>
                </div>
              </section>
            </div>
            <section className="student-home-evolution" aria-labelledby="home-evolution-title"><div className="student-home-evolution__header"><h2 id="home-evolution-title">Sua evolução</h2><button type="button" onClick={() => setActiveView('evolution')}>Ver detalhes →</button></div><div className="student-home-evolution__content"><ProgressChart criteria={criteria} /><img src={evolutionStudentImage} alt="Bailarina em movimento" /></div></section>
            {!criteria.length && <p className="student-empty-chart">Sua evolução aparecerá aqui apàs a primeira avaliação.</p>}

          </> : activeView === 'agenda' ? <Agenda scheduledClasses={lessons} today={today} /> : activeView === 'evolution' ? <Evolution criteria={criteria} studentName={studentFullName} evaluation={evolutionEvaluation} evaluationHistory={evaluationHistory} /> : activeView === 'attendance' ? <AttendancePage attendance={attendance} attendanceHistory={attendanceHistory} financial={financial} /> : <StorePage />}
        </div>
        <footer className="student-footer">Studio Keli Dalpian <span>|</span>  {today.getFullYear()}</footer>
      </section>
    </main>
  )
}



