import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const calls = await prisma.call.findMany({
      include: { contact: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(calls)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 })
  }
}
