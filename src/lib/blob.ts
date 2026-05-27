import { put } from '@vercel/blob'

export async function uploadPhoto(file: File, folder: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const blob = await put(filename, file, { access: 'public' })
  return blob.url
}
