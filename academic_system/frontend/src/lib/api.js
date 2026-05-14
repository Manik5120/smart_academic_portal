const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '')
const TOKEN_KEY = 'access_token'
const USER_KEY = 'user'
const TOKEN_EXPIRY_SKEW_MS = 5000

function buildUrl(endpoint) {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint
  }

  if (endpoint.startsWith('/api/')) {
    return endpoint
  }

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${API_BASE_URL}${normalizedEndpoint}`
}

function isPublicAuthEndpoint(endpoint) {
  return /\/auth\/(login|register)(\?|$)/.test(endpoint)
}

async function parseResponse(response) {
  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function getUser() {
  const rawUser = localStorage.getItem(USER_KEY)
  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser)
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export function setUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }
}

export function removeUser() {
  localStorage.removeItem(USER_KEY)
}

export function clearAuthSession() {
  removeToken()
  removeUser()
}

export function getTokenExpiresAt(token = getToken()) {
  if (!token || typeof token !== 'string') {
    return null
  }

  const [, payload] = token.split('.')
  if (!payload || typeof globalThis.atob !== 'function') {
    return null
  }

  try {
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/')
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      '='
    )
    const decodedPayload = JSON.parse(globalThis.atob(paddedPayload))
    return typeof decodedPayload.exp === 'number' ? decodedPayload.exp * 1000 : null
  } catch {
    return null
  }
}

export function isTokenExpired(token = getToken()) {
  if (!token) {
    return true
  }

  const expiresAt = getTokenExpiresAt(token)
  if (!expiresAt) {
    return false
  }

  return Date.now() >= expiresAt - TOKEN_EXPIRY_SKEW_MS
}

export function redirectToLogin() {
  clearAuthSession()

  if (typeof window === 'undefined' || window.location.pathname === '/login') {
    return
  }

  window.location.replace('/login')
}

export async function api(endpoint, options = {}) {
  const headers = new Headers(options.headers || {})
  const token = getToken()
  const method = (options.method || 'GET').toUpperCase()
  const isFormData = options.body instanceof FormData
  const publicAuthEndpoint = isPublicAuthEndpoint(endpoint)

  if (token && !publicAuthEndpoint && isTokenExpired(token)) {
    redirectToLogin()
    const error = new Error('Your session has expired. Please login again.')
    error.status = 401
    throw error
  }

  if (token && !publicAuthEndpoint && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (!isFormData && options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  const response = await fetch(buildUrl(endpoint), {
    ...options,
    method,
    headers,
  })

  const data = await parseResponse(response)

  if (!response.ok) {
    if (response.status === 401) {
      redirectToLogin()
    }

    const message =
      (typeof data === 'object' && data !== null && (data.detail || data.message)) ||
      (typeof data === 'string' && data) ||
      `Request failed with status ${response.status}`

    const error = new Error(
      typeof message === 'string' ? message : JSON.stringify(message)
    )
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}
