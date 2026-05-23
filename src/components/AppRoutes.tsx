import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Layout } from './Layout'
import { HomePage } from '../pages/HomePage'
import { HotelsPage } from '../pages/HotelsPage'
import { AdminPage } from '../pages/AdminPage'
import { LoginPage } from '../pages/LoginPage'
import { SetupPage } from '../pages/SetupPage'

export function AppRoutes() {
  const { needsSetup, state } = useApp()

  if (needsSetup) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="*" element={<Navigate to="/setup" replace />} />
        </Routes>
      </BrowserRouter>
    )
  }

  if (!state) {
    return null
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/setup" element={<Navigate to="/" replace />} />
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/hotels" element={<HotelsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
