import { redirect } from 'react-router'
import { getAuthFromCookies } from '../lib/cookies'

export function validateSession(request: Request) {
  const cookieHeader = request.headers.get('Cookie')
  const { token, user } = getAuthFromCookies(cookieHeader)

  if (!token) {
    const url = new URL(request.url)
    if (url.pathname !== '/auth') {
      throw redirect('/auth')
    }

    return { token: null, user: null }
  }

  return { token, user }
}
