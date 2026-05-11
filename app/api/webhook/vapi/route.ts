import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message } = body

    if (!message) return NextResponse.json({ received: true })

    const { type, call } = message

    if (!call?.id) return NextResponse.json({ received: true })

    if (type === 'end-of-call-report') {
      const transcript = call.artifact?.transcript || null
      const recordingUrl = call.artifact?.recordingUrl || null
      const duration = call.endedAt && call.startedAt
        ? Math.floor((new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000)
        : null

      await prisma.call.updateMany({
        where: { vapiCallId: call.id },
        data: {
          status: 'completed',
          transcript,
          recordingUrl,
          duration,
          endedAt: call.endedAt ? new Date(call.endedAt) : new Date(),
        },
      })
    }

    if (type === 'status-update') {
      await prisma.call.updateMany({
        where: { vapiCallId: call.id },
        data: { status: call.status },
      })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}
