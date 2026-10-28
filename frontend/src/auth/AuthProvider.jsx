import axios from 'axios'
import { useMemo, useState } from 'react'
import AuthContext from './auth-context'

const STORAGE_KEY = 'jerry-beauty-auth'

function readStoredAuth() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored)
    return parsed?.token && parsed?.user ? parsed : null
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

axios.interceptors.request.use((config) => {
  let token
  try {
    token = readStoredAuth()?.token
  } catch {
    token = null
  }
  if (token) config.headers.Authorization = `Token ${token}`
  return config
})

export default function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth)

  async function signIn(username, password) {
    const response = await axios.post('/api/login/', { username, password })
    const nextAuth = {
      token: response.data.token,
      user: {
        ...response.data.user,
        role: String(response.data.user?.role ?? '').toLowerCase(),
      },
    }
    if (!nextAuth.token || !nextAuth.user?.role) {
      throw new Error('The login response did not include an authentication token and user role.')
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuth))
    setAuth(nextAuth)
    return nextAuth.user
  }

  function signOut() {
    localStorage.removeItem(STORAGE_KEY)
    setAuth(null)
  }

  const value = useMemo(() => ({
    user: auth?.user ?? null,
    token: auth?.token ?? null,
    signIn,
    signOut,
  }), [auth])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
