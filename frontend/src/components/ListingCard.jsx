import { Link } from 'react-router-dom'
import { sanitizeImageUrl } from '../api/sanitize.js'
import './ListingCard.css'

function ListingCard({ listing }) {
  const safeImage = sanitizeImageUrl(listing.imageUrl)

  return (
    <div className="listing-card__wrapper">
      <Link to={`/listing/${listing.id}`} className="listing-card">
        <div className="listing-card__image-wrap">
          {safeImage ? (
            <img src={safeImage} alt={listing.title} className="listing-card__image" />
          ) : (
            <div className="listing-card__placeholder">No photo</div>
          )}
        </div>
        <div className="listing-card__info">
          <h3 className="listing-card__title">{listing.title}</h3>
          <p className="listing-card__price">${listing.price}</p>
        </div>
      </Link>
      {listing.sellerHandle && (
        <p className="listing-card__seller">by @{listing.sellerHandle}</p>
      )}
    </div>
  )
}

export default ListingCard
