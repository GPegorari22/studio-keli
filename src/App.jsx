import { useState, useEffect } from 'react'
import bannerInicio from './assets/banner-inicio.png'
import sapateado from './assets/sapateado.png'
import jazz from './assets/jazz.png'
import balletClassico from './assets/ballet-classico.png'
import logoRosa from './assets/logo-rosa.png'
import tourStudio from './assets/tour-studio.mp4'
import fundoProfessoras from './assets/fundo-professoras.png'
import './App.css'

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

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
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

  const changeModality = (direction) => {
    setActiveModalityIndex((index) => (index + direction + modalities.length) % modalities.length)
  }

  const changeTeacher = (direction) => {
    setActiveTeacherIndex((index) => (index + direction + teachers.length) % teachers.length)
  }

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
