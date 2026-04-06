import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchListings } from '../api/listings.js'
import ListingCard from '../components/ListingCard.jsx'
import recycleLogo from '../assets/recycle.svg'
import heroBanner from '../assets/newhome_clothes_background.png'
import webShopImg from '../assets/web_shop.png'
import girls2Img from '../assets/girls_2.png'
import windowShopImg from '../assets/window_shop.png'
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
          <img
            src={recycleLogo}
            alt="Recycle"
            className="landing__hero-logo"
          />
        </div>
        <p className="landing__subtitle">A hub to repurpose your clothes</p>
      </section>

      <section className="landing__banner">
        <img
          src={heroBanner}
          alt="Clothes on a rack"
          className="landing__banner-image"
        />
        <div className="landing__banner-overlay" />
        <h2 className="landing__banner-text">Wear it,<br />pass it on</h2>
      </section>

      <section className="landing__community">
        <img
          src={girls2Img}
          alt="Community"
          className="landing__community-img"
        />
        <div className="landing__community-text">
          <h2 className="landing__community-heading">Good vibes only</h2>
          <p className="landing__community-body">
            A community of people who believe clothes deserve more than one story.
          </p>
        </div>
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

      <section className="landing__how-it-works">
        <div className="landing__how-it-works-content">
          <img
            src={webShopImg}
            alt="Browse and shop"
            className="landing__how-it-works-img"
          />
          <div className="landing__how-it-works-text">
            <h2 className="landing__how-it-works-heading">Browse the circle</h2>
            <p className="landing__how-it-works-body">
              Every piece has a backstory. Find something that speaks to you.
            </p>
            <Link to="/browse" className="landing__how-it-works-link">
              Start browsing &rarr;
            </Link>
          </div>
        </div>
      </section>

      <section className="landing__cta">
        <div className="landing__cta-content">
          <div className="landing__cta-text">
            <h2 className="landing__cta-heading">Send it to the circle</h2>
            <p className="landing__cta-body">
              Give your garment a new home. Snap a photo, tell its story, pass it on.
            </p>
            <Link to="/sell" className="landing__cta-link">
              Start selling &rarr;
            </Link>
          </div>
          <img
            src={windowShopImg}
            alt="List your clothes"
            className="landing__cta-img"
          />
        </div>
      </section>
    </div>
  )
}

export default Landing
