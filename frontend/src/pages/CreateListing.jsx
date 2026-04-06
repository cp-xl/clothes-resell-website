import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createListing, getUploadUrl, uploadImage } from '../api/listings.js'
import './CreateListing.css'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function CreateListing() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    price: '',
    description: '',
    backstory: '',
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleImageSelect(e) {
    const file = e.target.files[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please upload a JPG, PNG, or WebP image.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be under 10 MB.')
      return
    }

    setError(null)
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!form.title.trim() || !form.price.trim()) {
      setError('Title and price are required.')
      return
    }

    setSubmitting(true)
    try {
      let imageUrl = ''
      if (imageFile) {
        const { uploadUrl, fileUrl } = await getUploadUrl(imageFile.name, imageFile.type)
        await uploadImage(uploadUrl, imageFile)
        imageUrl = fileUrl
      }

      const listing = await createListing({
        title: form.title.trim(),
        price: parseFloat(form.price),
        description: form.description.trim(),
        backstory: form.backstory.trim(),
        imageUrl,
      })

      navigate(`/listing/${listing.id}`)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="create">
      <h2 className="create__heading">Pass something on</h2>
      <p className="create__sub">Give your garment a new home</p>

      <form className="create__form" onSubmit={handleSubmit}>
        <div className="create__upload">
          <label className="create__upload-area" htmlFor="image-input">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="create__upload-preview" />
            ) : (
              <div className="create__upload-placeholder">
                <span className="create__upload-icon">+</span>
                <span>Upload a photo</span>
                <span className="create__upload-hint">Good lighting, simple background</span>
              </div>
            )}
            <input
              id="image-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageSelect}
              className="create__upload-input"
            />
          </label>
        </div>

        <div className="create__fields">
          <div className="create__field">
            <label htmlFor="title" className="create__label">What is it?</label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="e.g. Vintage denim jacket"
              value={form.title}
              onChange={handleChange}
              className="create__input"
              maxLength={100}
            />
          </div>

          <div className="create__field">
            <label htmlFor="price" className="create__label">Your price ($)</label>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.price}
              onChange={handleChange}
              className="create__input"
            />
          </div>

          <div className="create__field">
            <label htmlFor="description" className="create__label">Size</label>
            <select
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              className="create__select"
            >
              <option value="">Select a size</option>
              <option value="XS (EU 32-34)">XS (EU 32-34)</option>
              <option value="S (EU 36-38)">S (EU 36-38)</option>
              <option value="M (EU 40-42)">M (EU 40-42)</option>
              <option value="L (EU 44-46)">L (EU 44-46)</option>
              <option value="XL (EU 48-50)">XL (EU 48-50)</option>
            </select>
          </div>

          <div className="create__field">
            <label htmlFor="backstory" className="create__label">
              What&rsquo;s the story behind this piece?
            </label>
            <p className="create__field-hint">You could start with where you found it...</p>
            <textarea
              id="backstory"
              name="backstory"
              placeholder="Picked this up at a market in Portland..."
              value={form.backstory}
              onChange={handleChange}
              className="create__textarea"
              rows={3}
              maxLength={500}
            />
          </div>

          {error && <p className="create__error">{error}</p>}

          <button
            type="submit"
            className="create__submit"
            disabled={submitting}
          >
            {submitting ? 'Sending...' : 'Send it to the circle'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default CreateListing
