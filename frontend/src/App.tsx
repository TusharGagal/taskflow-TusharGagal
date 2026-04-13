import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import LoginPage from './pages/loginPage'
import ProjectsPage from './pages/projectsPage'
import ProjectDetailPage from './pages/projectDetailPage'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/projects" element={
          <ProtectedRoute><ProjectsPage /></ProtectedRoute>
        } />
        <Route path="/projects/:id" element={
          <ProtectedRoute><ProjectDetailPage /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/projects" replace />} />
      </Routes>
    </BrowserRouter>
  )
}