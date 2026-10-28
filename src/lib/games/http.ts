import { NextResponse, type NextRequest } from 'next/server'
import type { RoomAction } from '@/app/games/lib/online/types'
import { isRecord } from '@/app/games/lib/sanitize'

export const TOKEN_HEADER = 'x-room-token'

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}

export const fail = (error: string, status: number) => json({ error }, status)

export const notConfigured = () => fail('Онлайн-игра пока не настроена', 503)

export const tokenOf = (req: NextRequest) => req.headers.get(TOKEN_HEADER)

export async function body(req: NextRequest): Promise<Record<string, unknown>> {
  const data: unknown = await req.json().catch(() => null)
  return isRecord(data) ? data : {}
}

export function parseAction(raw: unknown): RoomAction | null {
  if (!isRecord(raw)) return null
  if ((raw.type === 'secret' || raw.type === 'guess') && typeof raw.value === 'string' && raw.value.length <= 16) {
    return { type: raw.type, value: raw.value }
  }
  if (raw.type === 'next' && Number.isInteger(raw.round)) return { type: 'next', round: raw.round as number }
  return null
}
