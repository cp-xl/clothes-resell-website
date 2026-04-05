import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Landing from './pages/Landing.jsx'
import Browse from './pages/Browse.jsx'
import CreateListing from './pages/CreateListing.jsx'
import ListingDetail from './pages/ListingDetail.jsx'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/sell" element={<CreateListing />} />
        <Route path="/listing/:id" element={<ListingDetail />} />
      </Route>
    </Routes>
  )
}

export default App
