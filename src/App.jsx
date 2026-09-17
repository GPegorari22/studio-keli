import { useState, useEffect, useRef } from 'react'
import bannerInicio from './assets/banner-inicio.png'
import sapateado from './assets/sapateado.png'
import jazz from './assets/jazz.png'
import balletClassico from './assets/ballet-classico.png'
import bale1 from './assets/bale-1.png'
import bale2 from './assets/bale-2.png'
import jazz1 from './assets/jazz-1.png'
import jazz2 from './assets/jazz-2.png'
import sapateado1 from './assets/sapateado-1.png'
import sapateado2 from './assets/sapateado-2.png'
import logoRosa from './assets/logo-rosa.png'
import logoBranca from './assets/logo-branca.png'
import tourStudio from './assets/tour-studio.mp4'
import separacaoPagina from './assets/separacao-pagina.png'
import enrolados from './assets/enrolados.png'
import brancaNeve from './assets/branca-neve.png'
import belaFera from './assets/bela-fera.png'
import './App.css'
import inscricao from './assets/inscrição.png'
import { supabase } from './lib/supabase.js'

const navigation = ['Modalidades', 'Studio', 'Espetáculos', 'Loja']
const modalities = [
  { name: 'Sapateado', image: sapateado, slug: 'sapateado' },
  { name: 'Ballet Clássico', image: balletClassico, slug: 'ballet-classico', featured: true },
  { name: 'Jazz', image: jazz, slug: 'jazz' },
]
const teachers = [
  { name: 'Sapateado', image: sapateado, slug: 'professora-sapateado' },
  { name: 'Ballet Clássico', image: balletClassico, slug: 'keli-dalpian', featured: true },
  { name: 'Jazz', image: jazz, slug: 'professora-jazz' },
]

const shows = [
  { name: 'Enrolados', image: enrolados, slug: 'enrolados', year: '2022' },
  { name: 'Branca de Neve', image: brancaNeve, slug: 'branca-de-neve', featured: true, year: '2025' },
  { name: 'Bela e a Fera', image: belaFera, slug: 'bela-e-a-fera', year: '2023' },
]

const balletClassGroups = [
  {
    id: 'baby-class',
    name: 'Baby Class',
    description: 'Turmas de 2 a 6 anos pensadas para introduzir a técnica de forma lúdica, desenvolvendo coordenação, musicalidade e consciência corporal.',
  },
  {
    id: 'infantil',
    name: 'Infantil',
    description: 'Turmas para crianças que avançam nos fundamentos do ballet, com exercícios que desenvolvem postura, ritmo e autonomia.',
  },
  {
    id: 'juvenil',
    name: 'Juvenil',
    description: 'Aulas que aprofundam técnica, flexibilidade e interpretação, respeitando o ritmo de desenvolvimento de cada bailarino.',
  },
  {
    id: 'adulto',
    name: 'Adulto',
    description: 'Uma turma acolhedora para aprender ou retomar o ballet, unindo técnica, condicionamento e expressão corporal.',
  },
]

const modalityDetails = {
  'ballet-classico': {
    name: 'Ballet Clássico',
    tagline: 'Onde técnica encontra',
    emphasis: 'expressão.',
    description: 'O Ballet Clássico trabalha postura, coordenação, musicalidade, flexibilidade e consciência corporal, desenvolvendo não apenas a técnica, mas também a confiança e a expressão de cada bailarino.',
    skills: ['Técnica', 'Musicalidade', 'Flexibilidade', 'Coordenação'],
    images: [bale1, bale2],
    classes: balletClassGroups,
  },
  jazz: {
    name: 'Jazz',
    tagline: 'Onde ritmo encontra',
    emphasis: 'personalidade.',
    description: 'O Jazz combina técnica, ritmo e liberdade de expressão em movimentos cheios de energia. Giros, saltos e sequências coreográficas exploram a musicalidade, a coordenação e a criatividade de cada bailarino.',
    skills: ['Expressão corporal', 'Musicalidade', 'Flexibilidade', 'Coordenação'],
    images: [jazz1, jazz2],
    classes: [
      {
        id: 'infantil',
        name: 'Infantil',
        description: 'Uma introdução lúdica ao Jazz, com jogos de ritmo e pequenas coreografias que estimulam a coordenação, a criatividade e a expressão corporal.',
      },
      {
        id: 'juvenil',
        name: 'Juvenil',
        description: 'Sequências dinâmicas, giros e saltos para explorar a técnica do Jazz, desenvolver musicalidade e descobrir a própria presença de palco.',
      },
      {
        id: 'adulto',
        name: 'Adulto',
        description: 'Um espaço para começar ou retomar o Jazz, explorando técnica, ritmo e expressão em coreografias que respeitam o ritmo de cada aluno.',
      },
    ],
  },
  sapateado: {
    name: 'Sapateado',
    tagline: 'Onde cada passo vira',
    emphasis: 'música.',
    description: 'O Sapateado transforma os pés em instrumentos de percussão, unindo dança e música. Batidas, pausas e sequências de passos exploram o ritmo, a coordenação e a criatividade de cada bailarino.',
    skills: ['Ritmo', 'Musicalidade', 'Coordenação', 'Criatividade'],
    images: [sapateado1, sapateado2],
    classes: [
      {
        id: 'infantil',
        name: 'Infantil',
        description: 'Uma descoberta lúdica dos sons e movimentos do Sapateado, com brincadeiras rítmicas e primeiros passos que estimulam a coordenação e a musicalidade.',
      },
      {
        id: 'juvenil',
        name: 'Juvenil',
        description: 'Sequências de passos e combinações rítmicas para desenvolver precisão, explorar diferentes sons e expressar a criatividade em coreografias.',
      },
      {
        id: 'adulto',
        name: 'Adulto',
        description: 'Um espaço para começar ou retomar o Sapateado, trabalhando técnica, ritmo e expressão musical em sequências que respeitam o ritmo de cada aluno.',
      },
    ],
  },
}

const trialSchedules = [
  { id: 'terca-1800', day: 'Terça-feira', time: '18:00 — 19:00', room: 'Sala 02' },
  { id: 'quinta-1800', day: 'Quinta-feira', time: '18:00 — 19:00', room: 'Sala 02' },
]

const initialTrialForm = {
  modality: '',
  audience: '',
  experience: '',
  birthDate: '',
  schedule: '',
  fullName: '',
  email: '',
  phone: '',
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeModalSlug, setActiveModalSlug] = useState(null)
  const [openModalityClass, setOpenModalityClass] = useState(null)
  const modalRef = useRef(null)
  const [trialModalOpen, setTrialModalOpen] = useState(false)
  const [trialStep, setTrialStep] = useState(1)
  const [trialForm, setTrialForm] = useState(initialTrialForm)
  const [trialAttemptedStep, setTrialAttemptedStep] = useState(null)
  const [trialSubmitError, setTrialSubmitError] = useState('')
  const [trialSubmitting, setTrialSubmitting] = useState(false)
  const trialModalRef = useRef(null)
  const activeModal = modalityDetails[activeModalSlug]
  const [activeModalityIndex, setActiveModalityIndex] = useState(1)
  const displayedModalities = [-1, 0, 1].map((offset) => {
    const index = (activeModalityIndex + offset + modalities.length) % modalities.length
    return { ...modalities[index], featured: offset === 0 }
  })

  const [activeTeacherIndex, setActiveTeacherIndex] = useState(1)
  const displayedTeachers = [-1, 0, 1].map((offset) => {
    const index = (activeTeacherIndex + offset + teachers.length) % teachers.length
    return { ...teachers[index], featured: offset === 0 }
  })

  const [activeShowIndex, setActiveShowIndex] = useState(1)
  const displayedShows = [-1, 0, 1].map((offset) => {
    const index = (activeShowIndex + offset + shows.length) % shows.length
    return { ...shows[index], featured: offset === 0 }
  })

  const changeModality = (direction) => {
    setActiveModalityIndex((index) => (index + direction + modalities.length) % modalities.length)
  }

  const changeTeacher = (direction) => {
    setActiveTeacherIndex((index) => (index + direction + teachers.length) % teachers.length)
  }

  const changeShow = (direction) => {
    setActiveShowIndex((index) => (index + direction + shows.length) % shows.length)
  }

  const openTrialModal = () => {
    setTrialForm(initialTrialForm)
    setTrialStep(1)
    setTrialAttemptedStep(null)
    setTrialSubmitError('')
    setTrialSubmitting(false)
    setTrialModalOpen(true)
  }

  const updateTrialForm = (field, value) => {
    setTrialForm((current) => ({ ...current, [field]: value }))
    setTrialAttemptedStep(null)
    setTrialSubmitError('')
  }

  const isTrialStepValid = () => {
    if (trialStep === 1) return Boolean(trialForm.modality)
    if (trialStep === 2) return Boolean(trialForm.audience && trialForm.experience && trialForm.birthDate)
    if (trialStep === 3) return Boolean(trialForm.schedule)
    if (trialStep === 4) {
      return Boolean(
        trialForm.fullName.trim()
        && /^\S+@\S+\.\S+$/.test(trialForm.email)
        && trialForm.phone.trim(),
      )
    }
    return true
  }

  const advanceTrial = () => {
    if (!isTrialStepValid()) {
      setTrialAttemptedStep(trialStep)
      return
    }

    setTrialAttemptedStep(null)
    setTrialStep((current) => Math.min(current + 1, 5))
  }

  const selectedTrialModality = modalities.find((modality) => modality.slug === trialForm.modality)
  const selectedTrialSchedule = trialSchedules.find((schedule) => schedule.id === trialForm.schedule)

  const submitTrialRequest = async () => {
    if (!isTrialStepValid() || !selectedTrialModality || !selectedTrialSchedule) {
      setTrialAttemptedStep(4)
      return
    }

    setTrialSubmitting(true)
    setTrialSubmitError('')

    try {
      const { error } = await supabase
        .from('solicitacao_aula_experimental')
        .insert({
          nome_completo: trialForm.fullName.trim(),
          email: trialForm.email.trim().toLowerCase(),
          telefone: trialForm.phone.trim(),
          data_nascimento: trialForm.birthDate,
          destinatario: trialForm.audience,
          experiencia_danca: trialForm.experience,
          modalidade: selectedTrialModality.name,
          dia_semana: selectedTrialSchedule.day,
          horario_preferido: selectedTrialSchedule.time,
          sala_preferida: selectedTrialSchedule.room,
        })

      if (error) throw error

      setTrialStep(5)
    } catch {
      setTrialSubmitError('Não foi possível enviar sua solicitação agora. Tente novamente em instantes.')
    } finally {
      setTrialSubmitting(false)
    }
  }

  useEffect(() => {
    if (!activeModalSlug) return undefined

    const previousFocus = document.activeElement
    const focusableElements = modalRef.current.querySelectorAll('button, a[href], [tabindex="0"]')
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleModalKeyDown = (event) => {
      if (event.key === 'Escape') setActiveModalSlug(null)
      if (event.key !== 'Tab') return

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.body.classList.add('has-modal-open')
    firstElement.focus({ preventScroll: true })
    window.addEventListener('keydown', handleModalKeyDown)

    return () => {
      document.body.classList.remove('has-modal-open')
      window.removeEventListener('keydown', handleModalKeyDown)
      previousFocus?.focus({ preventScroll: true })
    }
  }, [activeModalSlug])

  useEffect(() => {
    if (!trialModalOpen) return undefined

    const previousFocus = document.activeElement
    const focusableElements = trialModalRef.current?.querySelectorAll('button, input, [tabindex="0"]') ?? []
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTrialKeyDown = (event) => {
      if (event.key === 'Escape') {
        setTrialModalOpen(false)
        return
      }

      if (event.key !== 'Tab' || !firstElement || !lastElement) return

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.body.classList.add('has-modal-open')
    firstElement?.focus({ preventScroll: true })
    window.addEventListener('keydown', handleTrialKeyDown)

    return () => {
      document.body.classList.remove('has-modal-open')
      window.removeEventListener('keydown', handleTrialKeyDown)
      previousFocus?.focus({ preventScroll: true })
    }
  }, [trialModalOpen])

  return (
    <main className="home-page">
      <section className="hero-section" aria-labelledby="home-title">
        <header className="site-header">
          <a className="brand" href="#inicio" aria-label="Keli Dalpian — início">
            <img src={logoRosa} alt="Keli Dalpian, Studio de Dança" />
          </a>

          <button
            className="menu-toggle"
            type="button"
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <nav className={menuOpen ? 'main-navigation is-open' : 'main-navigation'} aria-label="Navegação principal">
            {navigation.map((item) => (
              <a href={`#${item.toLowerCase().replace('é', 'e')}`} key={item}>
                {item}
                {item === 'Modalidades' && (
                  <svg viewBox="0 0 12 8" aria-hidden="true">
                    <path d="m1 1.25 5 5 5-5" />
                  </svg>
                )}
              </a>
            ))}
          </nav>

          <a className="login-button" href="#entrar">
            Entrar
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M13 5h5v14h-5" />
              <path d="m10 8 4 4-4 4" />
              <path d="M14 12H4" />
            </svg>
          </a>
        </header>

        <div className="hero-banner" id="inicio">
          <img src={bannerInicio} alt="Dançar é transformar movimento em história" />
        </div>

        <a className="scroll-indicator" href="#modalidades" aria-label="Ver modalidades">
          <svg viewBox="0 0 32 20" aria-hidden="true">
            <path d="m3 3 13 13L29 3" />
          </svg>
        </a>
      </section>

      <section
        className="modalities-section"
        id="modalidades"
        aria-labelledby="modalities-title"
      >
        <div className="modalities-heading">
          <h1 id="modalities-title">Modalidades</h1>
          <p>Encontre o seu movimento</p>
        </div>

        <div className="modalities-showcase">
          <button
            className="showcase-arrow showcase-arrow--previous"
            type="button"
            aria-label="Ver modalidade anterior"
            onClick={() => changeModality(-1)}
          ></button>
          <div className="modalities-list">
            {displayedModalities.map((modality) => (
              <a
                className={`modality ${modality.featured ? 'modality--featured' : ''}`}
                href={`#${modality.slug}`}
                key={modality.slug}
                aria-label={`Conheça ${modality.name}`}
                aria-haspopup={modalityDetails[modality.slug] ? 'dialog' : undefined}
                onClick={(event) => {
                  const details = modalityDetails[modality.slug]
                  if (details) {
                    event.preventDefault()
                    setOpenModalityClass(details.classes[0].id)
                    setActiveModalSlug(modality.slug)
                  }
                }}
              >
                <div className="modality-card">
                  <div className="modality-art">
                    <img src={modality.image} alt="" />
                  </div>
                  <h2>{modality.name}</h2>
                </div>
              </a>
            ))}
          </div>
          <button
            className="showcase-arrow showcase-arrow--next"
            type="button"
            aria-label="Ver proxima modalidade"
            onClick={() => changeModality(1)}
          ></button>
        </div>
      </section>
      <section className="studio-section" aria-labelledby="studio-title">
        <div className="studio-inner">
          <div className="studio-media">
            <div className="studio-card">
                <video src={tourStudio} className="studio-video" autoPlay muted loop playsInline aria-hidden="true" />
                <a className="studio-btn studio-btn--over" href="#endereco">Endereço do Studio →</a>
              </div>
          </div>

          <div className="studio-content">
            <h2 id="studio-title">Studio Keli Dalpian</h2>
            <p className="studio-lead">Onde cada movimento encontra seu espaço</p>
            <p>
              O Studio Keli Dalpian nasceu para transformar a dança em uma experiência de
              desenvolvimento, expressão e conexão.
            </p>
            <p>
              Em um ambiente acolhedor e inspirador, cada aluno é incentivado a descobrir
              seu potencial, desenvolver sua técnica e encontrar na dança uma forma única
              de se expressar. Mais do que ensinar movimentos, o Studio constrói histórias,
              memórias e vínculos que acompanham cada bailarino dentro e fora do palco.
            </p>

            <div className="studio-stats">
              <div className="stat"><AnimatedNumber target={4} duration={900} /><span className="stat-label">anos de História</span></div>
              <div className="stat"><AnimatedNumber target={300} duration={1400} /><span className="stat-label">alunos</span></div>
              <div className="stat"><AnimatedNumber target={4} duration={900} /><span className="stat-label">Espetáculos</span></div>
            </div>
            
          </div>
        </div>
      </section>

      <section className="teachers-section" aria-labelledby="teachers-title">
        <div className="teachers-inner">
          <div className="teachers-heading">
            <h2 id="teachers-title">PROFESSORAS</h2>
            <p>Conheça quem ensina, inspira e transforma através da dança.</p>
          </div>

          <div className="teachers-carousel">
            <button
              className="teacher-nav teacher-nav--prev"
              type="button"
              aria-label="Professor anterior"
              onClick={() => changeTeacher(-1)}
            >
              ‹
            </button>

            <div className="teachers-list">
              {displayedTeachers.map((teacher) => (
                <a
                  className={`teacher ${teacher.featured ? 'teacher--featured' : ''}`}
                  href={`#${teacher.slug}`}
                  key={teacher.slug}
                  aria-label={`Conheça ${teacher.name}`}
                >
                  <div className="teacher-card">
                    <div className="teacher-art">
                      <img src={teacher.image} alt="" />
                    </div>
                    <h2>{teacher.name}</h2>
                  </div>
                </a>
              ))}
            </div>

            <button
              className="teacher-nav teacher-nav--next"
              type="button"
              aria-label="Próxima professora"
              onClick={() => changeTeacher(1)}
            >
              ›
            </button>
          </div>
        </div>
      </section>
      <img src={separacaoPagina} alt="" className="separacao-pagina" />
      <section className="shows-section" aria-labelledby="shows-title">
        <div className="shows-inner">
          <h2 id="shows-title">ESPETÁCULOS</h2>
          <p className="shows-lead">Quando a dança ganha <strong>palco</strong>.</p>

          <div className="shows-carousel">
            <button
              className="showcase-arrow showcase-arrow--previous"
              type="button"
              aria-label="Espetáculo anterior"
              onClick={() => changeShow(-1)}
            >
              ‹
            </button>

            <div className="shows-list">
              {displayedShows.map((show) => (
                <a
                  key={show.slug}
                  href={`#${show.slug}`}
                  className={`show ${show.featured ? 'show--featured' : ''} show-${show.slug}`}
                  aria-label={`Conheça ${show.name}`}>
                  <div className="show-card">
                      <div className="show-art">
                        <img src={show.image} alt={show.name} />
                      </div>
                      <span className="show-year">{show.year}</span>
                    </div>
                    <h3 className="show-title">{show.name}</h3>
                </a>
              ))}
            </div>

            <button
              className="showcase-arrow showcase-arrow--next"
              type="button"
              aria-label="Próximo espetáculo"
              onClick={() => changeShow(1)}
            >
              ›
            </button>
          </div>
        </div>
      </section>

      <section className="inscricao-section" id="inscricao" aria-labelledby="inscricao-title">
        <div className="inscricao-inner">
          <div className="inscricao-art" aria-hidden="true">
            <img src={inscricao} alt="Inscrição" />
          </div>

          <div className="inscricao-content">
            <h2 id="inscricao-title">Marque uma aula experimental</h2>
            <p>Sua jornada também pode começar aqui. Nunca dançou antes? Não tem problema.</p>
            <button className="btn btn-primary" type="button" onClick={openTrialModal}>Inscreva-se</button>
          </div>
        </div>
      </section>
      <footer className="site-footer" aria-labelledby="footer-title">
        <div className="footer-top">
          <div className="footer-logo">
            <img src={logoBranca} alt="Keli Dalpian" />
          </div>

          <div className="footer-inner">
            <p className="footer-tagline">Dança • Arte • Movimento</p>

              <div className="footer-grid">
                <div className="footer-col">
                  <a href="#studio">STUDIO →</a>
                  <a href="#equipe">EQUIPE →</a>
                  <a href="#loja">LOJA →</a>
                </div>

                <div className="footer-col">
                  <a href="#modalidades">MODALIDADES →</a>
                  <a href="#espetaculos">ESPETÁCULOS →</a>
                  <a href="#perfil">PERFIL →</a>
                </div>

                <div className="footer-social">
                  <a className="social-link" href="#" aria-label="Instagram">
                    <img className="social-img" src="https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/instagram.svg" alt="Instagram" />
                    <span>Instagram</span>
                  </a>
                  <a className="social-link" href="#" aria-label="Whatsapp">
                    <img className="social-img" src="https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/whatsapp.svg" alt="Whatsapp" />
                    <span>Whatsapp</span>
                  </a>
                </div>
              </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>Studio Keli Dalpian | © 2026</p>
        </div>
      </footer>

      {trialModalOpen && (
        <div
          className="trial-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setTrialModalOpen(false)
          }}
        >
          <section
            className="trial-modal"
            ref={trialModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="trial-modal-title"
            aria-describedby="trial-modal-subtitle"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="trial-modal__close" type="button" aria-label="Fechar agendamento da aula experimental" onClick={() => setTrialModalOpen(false)}>
              <span></span><span></span>
            </button>

            <div className="trial-modal__loop trial-modal__loop--top" aria-hidden="true"></div>
            <div className="trial-modal__loop trial-modal__loop--bottom" aria-hidden="true"></div>

            <header className="trial-modal__header">
              <div aria-hidden="true"></div>
              <div>
                <h2 id="trial-modal-title">Aula Experimental</h2>
                <p id="trial-modal-subtitle">
                  {trialStep === 1 || trialStep === 4 ? 'Sua primeira dança.' : 'Quase lá! Queremos encontrar a turma ideal para você!'}
                </p>
              </div>
              <div aria-hidden="true"></div>
            </header>

            {trialStep === 1 && (
              <section className="trial-modal__step" aria-labelledby="trial-step-one-title">
                <h3 id="trial-step-one-title"><span>1.</span> Escolha a modalidade</h3>
                <p className="trial-modal__question">Qual modalidade você gostaria de experimentar?</p>

                <div className="trial-modality-options">
                  {[modalities[1], modalities[2], modalities[0]].map((modality) => {
                    const isSelected = trialForm.modality === modality.slug

                    return (
                      <button
                        className={`trial-modality-option ${isSelected ? 'is-selected' : ''}`}
                        type="button"
                        key={modality.slug}
                        aria-pressed={isSelected}
                        onClick={() => updateTrialForm('modality', modality.slug)}
                      >
                        <span className="trial-modality-option__image"><img src={modality.image} alt="" /></span>
                        <span>{modality.name}</span>
                      </button>
                    )
                  })}
                </div>

                {trialAttemptedStep === 1 && <p className="trial-modal__error" role="alert">Escolha uma modalidade para continuar.</p>}
              </section>
            )}

            {trialStep === 2 && (
              <section className="trial-modal__step trial-modal__step--profile" aria-labelledby="trial-step-two-title">
                <h3 id="trial-step-two-title"><span>2.</span> Conte-nos um pouco sobre você</h3>

                <div className="trial-profile-grid">
                  <fieldset className="trial-fieldset">
                    <legend>Para quem é a aula?</legend>
                    <label><input type="radio" name="audience" value="Para mim" checked={trialForm.audience === 'Para mim'} onChange={(event) => updateTrialForm('audience', event.target.value)} /><span>Para mim</span></label>
                    <label><input type="radio" name="audience" value="Para o meu filho" checked={trialForm.audience === 'Para o meu filho'} onChange={(event) => updateTrialForm('audience', event.target.value)} /><span>Para o meu filho</span></label>
                  </fieldset>

                  <fieldset className="trial-fieldset">
                    <legend>Já teve outra experiência com dança?</legend>
                    <label><input type="radio" name="experience" value="Nunca" checked={trialForm.experience === 'Nunca'} onChange={(event) => updateTrialForm('experience', event.target.value)} /><span>Nunca</span></label>
                    <label><input type="radio" name="experience" value="Pratico dança" checked={trialForm.experience === 'Pratico dança'} onChange={(event) => updateTrialForm('experience', event.target.value)} /><span>Pratico dança</span></label>
                    <label><input type="radio" name="experience" value="Já pratiquei dança" checked={trialForm.experience === 'Já pratiquei dança'} onChange={(event) => updateTrialForm('experience', event.target.value)} /><span>Já pratiquei dança</span></label>
                  </fieldset>
                </div>

                <label className="trial-input-group">
                  <span>Data de nascimento</span>
                  <input type="date" value={trialForm.birthDate} onChange={(event) => updateTrialForm('birthDate', event.target.value)} />
                </label>
                {trialAttemptedStep === 2 && <p className="trial-modal__error" role="alert">Preencha as opções para encontrarmos a turma ideal.</p>}
              </section>
            )}

            {trialStep === 3 && (
              <section className="trial-modal__step" aria-labelledby="trial-step-three-title">
                <h3 id="trial-step-three-title"><span>3.</span> Disponibilidade e turmas</h3>
                <div className="trial-schedule-options">
                  {trialSchedules.map((schedule) => {
                    const isSelected = trialForm.schedule === schedule.id

                    return (
                      <button
                        type="button"
                        key={schedule.id}
                        className={`trial-schedule-option ${isSelected ? 'is-selected' : ''}`}
                        aria-pressed={isSelected}
                        onClick={() => updateTrialForm('schedule', schedule.id)}
                      >
                        <strong>{schedule.day}</strong>
                        <span>{schedule.time}</span>
                        <span>{schedule.room}</span>
                        <small>● Vagas disponíveis</small>
                      </button>
                    )
                  })}
                </div>
                {trialAttemptedStep === 3 && <p className="trial-modal__error" role="alert">Escolha um horário disponível para continuar.</p>}
              </section>
            )}

            {trialStep === 4 && (
              <section className="trial-modal__step trial-modal__step--contact" aria-labelledby="trial-step-four-title">
                <h3 id="trial-step-four-title"><span>4.</span> Dados e contato</h3>
                <p className="trial-modal__question">Só precisamos de alguns dados para confirmar seu agendamento.</p>

                <div className="trial-contact-fields">
                  <label className="trial-input-group"><span>Nome completo</span><input type="text" placeholder="Informe seu nome aqui" value={trialForm.fullName} onChange={(event) => updateTrialForm('fullName', event.target.value)} /></label>
                  <label className="trial-input-group"><span>E-mail</span><input type="email" placeholder="Digite seu e-mail aqui" value={trialForm.email} onChange={(event) => updateTrialForm('email', event.target.value)} /></label>
                  <label className="trial-input-group"><span>Telefone/WhatsApp</span><input type="tel" placeholder="+XX (XX) XXXXX-XXXX" value={trialForm.phone} onChange={(event) => updateTrialForm('phone', event.target.value)} /></label>
                </div>
                {trialAttemptedStep === 4 && <p className="trial-modal__error" role="alert">Informe nome, e-mail válido e telefone para finalizar.</p>}
                {trialSubmitError && <p className="trial-modal__error" role="alert">{trialSubmitError}</p>}
              </section>
            )}

            {trialStep === 5 && (
              <section className="trial-modal__success" aria-labelledby="trial-success-title">
                <div className="trial-success__monogram" aria-hidden="true">KD</div>
                <h3 id="trial-success-title">Aula solicitada!</h3>
                <p>Sua jornada começa aqui.</p>
                <div className="trial-success__summary">
                  <strong>{selectedTrialModality?.name}</strong>
                  <span>{selectedTrialSchedule?.day} · {selectedTrialSchedule?.time}</span>
                  <span>{selectedTrialSchedule?.room}</span>
                  <hr />
                  <span>Enviaremos a confirmação para seu e-mail/WhatsApp.</span>
                </div>
              </section>
            )}

            <footer className="trial-modal__actions">
              {trialStep > 1 && trialStep < 5 && <button className="trial-modal__back" type="button" onClick={() => { setTrialAttemptedStep(null); setTrialStep((current) => current - 1) }}>Voltar</button>}
              {trialStep < 5 ? (
                <button className="trial-modal__continue" type="button" onClick={trialStep === 4 ? submitTrialRequest : advanceTrial} disabled={trialSubmitting}>{trialSubmitting ? 'Enviando...' : trialStep === 4 ? 'Finalizar' : 'Continuar'}</button>
              ) : (
                <button className="trial-modal__continue" type="button" onClick={() => { setTrialModalOpen(false); document.getElementById('inicio')?.scrollIntoView({ behavior: 'smooth' }) }}>Página inicial →</button>
              )}
            </footer>
          </section>
        </div>
      )}

      {activeModal && (
        <div
          className="ballet-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveModalSlug(null)
          }}
        >
          <section
            className={`ballet-modal ballet-modal--${activeModalSlug}`}
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${activeModalSlug}-modal-title`}
            aria-describedby={`${activeModalSlug}-modal-description`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="ballet-modal__close" type="button" aria-label={`Fechar informações de ${activeModal.name}`} onClick={() => setActiveModalSlug(null)}>
              <span></span><span></span>
            </button>

            <header className="ballet-modal__header">
              <div className="ballet-modal__title-line" aria-hidden="true"></div>
              <div>
                <h2 id={`${activeModalSlug}-modal-title`}>{activeModal.name}</h2>
                <p>{activeModal.tagline}<br /><em>{activeModal.emphasis}</em></p>
              </div>
              <div className="ballet-modal__title-line" aria-hidden="true"></div>
            </header>

            <div className="ballet-modal__overview">
              <img className="ballet-modal__dancer ballet-modal__dancer--left" src={activeModal.images[0]} alt="" />

              <div className="ballet-modal__copy">
                <p id={`${activeModalSlug}-modal-description`}>{activeModal.description}</p>

                <h3>Habilidades<br />desenvolvidas:</h3>
                <ul>
                  {activeModal.skills.map((skill) => <li key={skill}>{skill}</li>)}
                </ul>
              </div>

              <img className="ballet-modal__dancer ballet-modal__dancer--right" src={activeModal.images[1]} alt="" />
            </div>

            <section className="ballet-modal__classes" aria-labelledby={`${activeModalSlug}-classes-title`}>
              <h3 id={`${activeModalSlug}-classes-title`}>Turmas</h3>
              {activeModal.classes.map((group) => {
                const isOpen = openModalityClass === group.id

                return (
                  <article className={`ballet-class ${isOpen ? 'is-open' : ''}`} key={group.id}>
                    <button
                      className="ballet-class__trigger"
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`${activeModalSlug}-${group.id}-content`}
                      onClick={() => setOpenModalityClass((current) => current === group.id ? null : group.id)}
                    >
                      <span>{group.name}</span>
                      <span className="ballet-class__chevron" aria-hidden="true"></span>
                    </button>
                    <div className="ballet-class__content" id={`${activeModalSlug}-${group.id}-content`} role="region" aria-label={`Informações da turma ${group.name}`} aria-hidden={!isOpen}>
                      <div><p>{group.description}</p></div>
                    </div>
                  </article>
                )
              })}
            </section>
            <div className="ballet-modal__flourish" aria-hidden="true"></div>
          </section>
        </div>
      )}
    </main>
  )
}

function AnimatedNumber({ target, duration = 1200 }) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let rafId
    let start
    const step = (timestamp) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      const current = Math.floor(progress * target)
      setValue(current)
      if (progress < 1) rafId = requestAnimationFrame(step)
    }
    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [target, duration])

  return <span className="stat-number">+{value}</span>
}

export default App
