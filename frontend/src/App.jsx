import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AdminDashboard from './pages/AdminDashboard'
import BookingPage from './pages/BookingPage'
import EmployeePortal from './pages/EmployeePortal'
import LandingPage from './pages/LandingPage'
import LoginModal from './components/LoginModal'
import AuthProvider from './auth/AuthProvider'
import useAuth from './auth/useAuth'

function ProtectedRoute({ roles, children }) {
  const { user } = useAuth()
  const location = useLocation()
  const [showLogin, setShowLogin] = useState(true)

  if (!user) {
    return (
      <>
        <main className="flex min-h-screen items-center justify-center bg-[#120d14] px-4 text-center text-stone-50">
          <div>
            <p className="text-sm text-stone-400">Sign in with an authorized salon account to continue.</p>
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="mt-5 rounded-full bg-[#f2cfac] px-6 py-3 text-sm font-semibold text-[#211814]"
            >
              Sign in
            </button>
            <a href="/" className="ml-4 text-sm text-stone-300 hover:text-white">Back to salon</a>
          </div>
        </main>
        <LoginModal
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          redirectTo={location.pathname}
          allowedRoles={roles}
        />
      </>
    )
  }

  if (!roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/book" element={<BookingPage />} />
          <Route path="/employee" element={(
            <ProtectedRoute roles={['employee', 'admin']}>
              <EmployeePortal />
            </ProtectedRoute>
          )} />
          <Route path="/admin" element={(
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          )} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
