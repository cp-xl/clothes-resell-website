import { Outlet, Link } from 'react-router-dom'
import './Layout.css'

function Layout() {
  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="logo">NewHome</Link>
        <nav className="nav">
          <Link to="/browse" className="nav-link">Browse</Link>
          <Link to="/sell" className="nav-link nav-link--sell">Sell</Link>
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <p className="footer-motto">Wear it, pass it on.</p>
      </footer>
    </div>
  )
}

export default Layout
