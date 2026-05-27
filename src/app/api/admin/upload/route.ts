import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { uploadPhoto } from '@/lib/blob'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const url = await uploadPhoto(file, 'locations')
  return NextResponse.json({ url })
}
