import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchListings } from '../api/listings.js'
import ListingCard from '../components/ListingCard.jsx'
import './Landing.css'

function Landing() {
  const [featured, setFeatured] = useState([])

  useEffect(() => {
    let cancelled = false
    fetchListings()
      .then((data) => {
        if (!cancelled) setFeatured(data.items.slice(0, 3))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  return (
    <div className="landing">
      <section className="landing__hero">
        <div className="landing__hero-content">
          <h1 className="landing__title">
            New<br />
            <span className="landing__title-indent">Homes</span>
          </h1>
          {/* Place recycling-logo.svg in frontend/public/ */}
          <img
            src="/recycling-logo.svg"
            alt="Recycle"
            className="landing__hero-logo"
          />
        </div>
        <p className="landing__subtitle">A hub to repurpose your clothes</p>
      </section>

      <section className="landing__banner">
        {/* Place hero-banner.jpg in frontend/public/ */}
        <img
          src="/hero-banner.jpg"
          alt="Clothes on a rack"
          className="landing__banner-image"
        />
        <div className="landing__banner-overlay" />
        <h2 className="landing__banner-text">Wear it,<br />pass it on</h2>
      </section>

      {featured.length > 0 && (
        <section className="landing__products">
          <h2 className="landing__products-heading">What&rsquo;s Here</h2>
          <div className="landing__products-grid">
            {featured.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
          <Link to="/browse" className="landing__products-link">
            View all &rarr;
          </Link>
        </section>
      )}
    </div>
  )
}

export default Landing
