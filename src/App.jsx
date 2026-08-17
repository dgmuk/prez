import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Consultation from './pages/Consultation'
import LeadDetail from './pages/LeadDetail'
import Stats from './pages/Stats'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/consult/:id" element={<Consultation />} />
        <Route path="/lead/:id" element={<LeadDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
