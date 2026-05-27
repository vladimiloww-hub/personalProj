import { getIronSession, IronSession } from 'iron-session'
import { cookies } from 'next/headers'

export type SessionData = {
  sessionId?: string
  questUnlocked?: boolean
  isAdmin?: boolean
}

export const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'gogo_session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
  },
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, SESSION_OPTIONS)
}
