import { Link } from 'react-router-dom'
import './Landing.css'

function Landing() {
  return (
    <section className="landing">
      <div className="landing__hero">
        <h1 className="landing__title">NewHome Clothes</h1>
        <p className="landing__subtitle">
          A hub to repurpose second hand clothes
        </p>
        <p className="landing__tagline">
          Your friend&rsquo;s closet, but online.
        </p>
        <div className="landing__actions">
          <Link to="/browse" className="landing__btn landing__btn--browse">
            Browse the circle
          </Link>
          <Link to="/sell" className="landing__btn landing__btn--sell">
            Pass something on
          </Link>
        </div>
      </div>
      <div className="landing__motto-section">
        <p className="landing__motto">Wear it, pass it on.</p>
      </div>
    </section>
  )
}

export default Landing
