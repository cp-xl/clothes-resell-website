import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchListing } from '../api/listings.js'
import { sanitizeImageUrl } from '../api/sanitize.js'
import './ListingDetail.css'

function ListingDetail() {
  const { id } = useParams()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchListing(id)
      .then((data) => {
        if (!cancelled) setListing(data)
      })
      .catch(() => {
        if (!cancelled) setListing(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <section className="detail">
        <p className="detail__status">Loading...</p>
      </section>
    )
  }

  if (!listing) {
    return (
      <section className="detail">
        <p className="detail__status">Listing not found.</p>
        <Link to="/browse" className="detail__back">Back to the circle</Link>
      </section>
    )
  }

  return (
    <section className="detail">
      <Link to="/browse" className="detail__back">&larr; Back to the circle</Link>
      <div className="detail__content">
        <div className="detail__image-wrap">
          {sanitizeImageUrl(listing.imageUrl) ? (
            <img src={sanitizeImageUrl(listing.imageUrl)} alt={listing.title} className="detail__image" />
          ) : (
            <div className="detail__placeholder">No photo</div>
          )}
        </div>
        <div className="detail__info">
          <h2 className="detail__title">{listing.title}</h2>
          <p className="detail__price">${listing.price}</p>
          {listing.description && (
            <p className="detail__description">{listing.description}</p>
          )}
          {listing.backstory && (
            <div className="detail__backstory">
              <h3 className="detail__backstory-label">The backstory</h3>
              <p>{listing.backstory}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default ListingDetail
