import { redirect } from 'next/navigation'
import { getSession } from './session'

export async function requireQuestSession() {
  const session = await getSession()
  if (!session.questUnlocked) redirect('/')
  return session
}

export async function requireAdminSession() {
  const session = await getSession()
  if (!session.isAdmin) redirect('/admin/login')
  return session
}
