import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

/** True for the site admin (the same login as /admin). */
export async function isAdmin(): Promise<boolean> {
  try {
    return !!(await getSession()).isAdmin
  } catch {
    // No SESSION_SECRET configured: nobody is an admin.
    return false
  }
}

export const forbidden = () => NextResponse.json({ error: 'Нужно войти как админ' }, { status: 403 })
export const noStore = () => NextResponse.json({ error: 'Хранилище паков не настроено (Supabase)' }, { status: 503 })
export const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })
