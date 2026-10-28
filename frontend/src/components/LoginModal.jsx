import { Eye, EyeOff, LockKeyhole, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../auth/useAuth'

function roleDestination(role) {
  const normalizedRole = String(role).toLowerCase()
  if (normalizedRole === 'admin') return '/admin'
  if (normalizedRole === 'employee') return '/employee'
  return null
}

function loginError(error) {
  const data = error.response?.data
  if (typeof data?.detail === 'string') return data.detail
  if (data && typeof data === 'object') {
    const messages = Object.values(data).flat().filter((message) => typeof message === 'string')
    if (messages.length) return messages.join(' ')
  }
  if (error.response?.status === 401) return 'Those sign-in details were not recognized.'
  if (error.response) return `Sign-in failed (${error.response.status}). Please check the details and try again.`
  return 'Could not reach the sign-in service. Check your connection and try again.'
}

export default function LoginModal({ isOpen, onClose, redirectTo, allowedRoles }) {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setErrorMessage('')
    try {
      const user = await signIn(username.trim(), password)
      onClose?.()
      const normalizedRole = String(user.role).toLowerCase()
      const rolePath = roleDestination(normalizedRole)
      if (allowedRoles && !allowedRoles.includes(normalizedRole)) {
        navigate(rolePath ?? '/', { replace: true })
      } else if (rolePath) {
        navigate(rolePath, { replace: true })
      } else if (redirectTo) {
        navigate(redirectTo, { replace: true })
      }
    } catch (error) {
      setErrorMessage(loginError(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        className="relative w-full max-w-md rounded-[30px] border border-white/10 bg-[#1a121a] p-6 text-stone-50 shadow-2xl sm:p-8"
      >
        <button
          type="button"
          aria-label="Close sign-in"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-stone-400 transition hover:bg-white/10 hover:text-white"
        >
          <X size={18} />
        </button>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f2cfac]/10 text-[#f2cfac]">
          <LockKeyhole size={22} />
        </span>
        <p className="mt-6 text-xs uppercase tracking-[0.25em] text-[#d3a075]">Jerry Beauty Salon</p>
        <h2 id="login-title" className="mt-2 text-3xl font-semibold">Welcome back</h2>
        <p className="mt-2 text-sm leading-6 text-stone-400">Sign in with your salon account. Your access is determined by your account role.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label htmlFor="login-username" className="block text-sm font-medium">
            Username or email
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-2 block w-full rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3 text-white placeholder:text-stone-600 focus:border-[#f2cfac] focus:outline-none"
              placeholder="Your username or email"
            />
          </label>
          <label htmlFor="login-password" className="block text-sm font-medium">
            Password
            <span className="relative mt-2 block">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="block w-full rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3 pr-12 text-white placeholder:text-stone-600 focus:border-[#f2cfac] focus:outline-none"
                placeholder="Enter your password"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-stone-400 transition hover:bg-white/10 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>

          {errorMessage && (
            <p role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-[#f2cfac] px-6 py-3 text-sm font-semibold text-[#211814] transition hover:bg-[#f8d8bf] disabled:cursor-wait disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </div>
  )
}
