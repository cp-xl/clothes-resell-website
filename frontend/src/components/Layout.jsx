import { Outlet, Link } from 'react-router-dom'
import './Layout.css'

function Layout() {
  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="header__logo">chewie&co</Link>
        <nav className="header__nav">
          <Link to="/browse" className="header__link">Browse</Link>
          <Link to="/sell" className="header__link">Sell</Link>
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <p className="footer__motto">Wear it, pass it on.</p>
      </footer>
    </div>
  )
}

export default Layout
