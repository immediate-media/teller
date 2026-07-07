import { NextResponse } from 'next/server'
import { listResults } from '@/lib/store'

export async function GET() {
  const results = await listResults()
  return NextResponse.json(results)
}
