import { redirect } from 'react-router'
import { getAuthFromCookies } from '../lib/cookies'

export function validateSession(request: Request) {
  const cookieHeader = request.headers.get('Cookie')
  const { token } = getAuthFromCookies(cookieHeader)

  if (!token) {
    throw redirect('/auth')
  }

  return token
}
