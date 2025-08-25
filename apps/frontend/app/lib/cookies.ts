export class CookieManager {
  static set(name: string, value: string, options: {
    maxAge?: number // in seconds
    path?: string
    secure?: boolean
    httpOnly?: boolean
    sameSite?: 'strict' | 'lax' | 'none'
  } = {}) {
    if (typeof document === 'undefined') return false

    const {
      maxAge = 7 * 24 * 60 * 60, // 7 days default
      path = '/',
      secure = process.env.NODE_ENV === 'production',
      sameSite = 'lax'
    } = options

    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`
    cookieString += `; Max-Age=${maxAge}`
    cookieString += `; Path=${path}`
    cookieString += `; SameSite=${sameSite}`
    
    if (secure) {
      cookieString += '; Secure'
    }

    document.cookie = cookieString
    return true
  }

  static get(name: string, cookieHeader?: string | null): string | null {
    // Server-side: use provided cookie header
    if (cookieHeader) {
      const cookies = cookieHeader.split(';')
      for (const cookie of cookies) {
        const [cookieName, cookieValue] = cookie.trim().split('=')
        if (decodeURIComponent(cookieName) === name) {
          return decodeURIComponent(cookieValue || '')
        }
      }
      return null
    }

    // Client-side: use document.cookie
    if (typeof document === 'undefined') return null

    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=')
      if (decodeURIComponent(cookieName) === name) {
        return decodeURIComponent(cookieValue || '')
      }
    }
    return null
  }

  static remove(name: string, path: string = '/') {
    if (typeof document === 'undefined') return false

    document.cookie = `${encodeURIComponent(name)}=; Max-Age=0; Path=${path}`
    return true
  }

  static getAll(cookieHeader?: string | null): Record<string, string> {
    const cookies: Record<string, string> = {}
    
    // Server-side: use provided cookie header
    if (cookieHeader) {
      cookieHeader.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=')
        if (name && value) {
          cookies[decodeURIComponent(name)] = decodeURIComponent(value)
        }
      })
      return cookies
    }

    // Client-side: use document.cookie
    if (typeof document === 'undefined') return cookies

    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=')
      if (name && value) {
        cookies[decodeURIComponent(name)] = decodeURIComponent(value)
      }
    })
    return cookies
  }
}

export function getAuthFromCookies(cookieHeader?: string | null) {
  const token = CookieManager.get('auth_token', cookieHeader || undefined)
  const userStr = CookieManager.get('auth_user', cookieHeader || undefined)
  
  let user = null
  if (userStr) {
    try {
      user = JSON.parse(userStr)
    } catch (error) {
      console.error('Failed to parse user data from cookie:', error)
    }
  }
  
  return { token, user }
}