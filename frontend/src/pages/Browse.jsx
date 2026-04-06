import { useState, useEffect, useCallback } from 'react'
import ListingCard from '../components/ListingCard.jsx'
import { fetchListings } from '../api/listings.js'
import shoppingImg from '../assets/shopping.png'
import coolGirlImg from '../assets/cool_girl.png'
import stylishGirlImg from '../assets/stylish_girl.png'
import './Browse.css'

function Browse() {
  const [listings, setListings] = useState([])
  const [cursor, setCursor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchListings()
      .then((data) => {
        if (!cancelled) {
          setListings(data.items || [])
          setCursor(data.nextCursor || null)
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not load listings right now.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    try {
      const data = await fetchListings(cursor)
      setListings((prev) => [...prev, ...(data.items || [])])
      setCursor(data.nextCursor || null)
    } catch {
      // silently fail load-more — user can retry
    } finally {
      setLoadingMore(false)
    }
  }, [cursor, loadingMore])

  if (loading) {
    return (
      <section className="browse">
        <p className="browse__status">Loading the circle...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="browse">
        <p className="browse__status">{error}</p>
      </section>
    )
  }

  return (
    <section className="browse">
      <div className="browse__header">
        <div className="browse__header-text">
          <h2 className="browse__heading">The Circle</h2>
          <p className="browse__sub">Pieces looking for a new home</p>
        </div>
        <img
          src={shoppingImg}
          alt=""
          className="browse__header-img"
        />
      </div>
      {listings.length === 0 ? (
        <div className="browse__empty">
          <div className="browse__empty-avatars">
            <img src={coolGirlImg} alt="" className="browse__empty-avatar" />
            <img src={stylishGirlImg} alt="" className="browse__empty-avatar" />
          </div>
          <p className="browse__empty-text">Nothing here yet — be the first to pass something on.</p>
        </div>
      ) : (
        <>
          <div className="browse__grid">
            {listings.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
          {cursor && (
            <div className="browse__load-more">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="browse__load-more-btn"
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default Browse
