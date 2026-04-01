import { NextResponse } from 'next/server'
import { listLocations } from '@/lib/square/api'

export async function GET() {
  try {
    const locations = await listLocations()
    return NextResponse.json(locations)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/square/locations]', message)
    return NextResponse.json({ error: message, locations: [] }, { status: 502 })
  }
}
