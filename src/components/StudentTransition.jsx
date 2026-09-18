import { useEffect } from 'react'
import logoRosa from '../assets/logo-rosa.png'
import './StudentDashboard.css'

export default function StudentTransition({ navigate }) {
  useEffect(() => {
    const timer = window.setTimeout(() => navigate('aluno'), 1650)
    return () => window.clearTimeout(timer)
  }, [navigate])

  return (
    <main className="student-transition" aria-label="Abrindo seu perfil">
      <div className="student-transition__halo" aria-hidden="true"></div>
      <img className="student-transition__logo" src={logoRosa} alt="Studio Keli Dalpian" />
      <p>Preparando seu espaço de dança</p>
      <button type="button" onClick={() => navigate('aluno')}>Pular animação</button>
    </main>
  )
}
