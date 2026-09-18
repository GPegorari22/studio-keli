import logoReduzida from '../assets/logo-reduzida.png'

export default function AuthBrand({ className = '' }) {
  return <img className={className} src={logoReduzida} alt="" aria-hidden="true" />
}
