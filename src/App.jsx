import { useState } from 'react'
import bannerInicio from './assets/banner-inicio.png'
import sapateado from './assets/sapateado.png'
import jazz from './assets/jazz.png'
import balletClassico from './assets/ballet-classico.png'
import logoRosa from './assets/logo-rosa.png'
import './App.css'

const navigation = ['Modalidades', 'Studio', 'Espetáculos', 'Loja']
const modalities = [
  { name: 'Sapateado', image: sapateado, slug: 'sapateado' },
  { name: 'Ballet Clássico', image: balletClassico, slug: 'ballet-classico', featured: true },
  { name: 'Jazz', image: jazz, slug: 'jazz' },
]

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeModalityIndex, setActiveModalityIndex] = useState(1)
  const displayedModalities = [-1, 0, 1].map((offset) => {
    const index = (activeModalityIndex + offset + modalities.length) % modalities.length
    return { ...modalities[index], featured: offset === 0 }
  })

  const changeModality = (direction) => {
    setActiveModalityIndex((index) => (index + direction + modalities.length) % modalities.length)
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
    </main>
  )
}

export default App
