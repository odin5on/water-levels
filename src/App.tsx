import { Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { StationPage } from './pages/StationPage'
import { AboutPage } from './pages/AboutPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/station/:siteId" element={<StationPage />} />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  )
}
