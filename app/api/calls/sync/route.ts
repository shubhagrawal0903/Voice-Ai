import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { callId } = await req.json()

    const call = await prisma.call.findUnique({ where: { id: callId } })
    if (!call?.vapiCallId) return NextResponse.json({ error: 'Call not found' }, { status: 404 })

    const vapiRes = await fetch(`https://api.vapi.ai/call/${call.vapiCallId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
      },
    })

    const vapiData = await vapiRes.json()

    const transcript = vapiData.artifact?.transcript || call.transcript
    const recordingUrl = vapiData.artifact?.recordingUrl || call.recordingUrl
    const duration = vapiData.endedAt && vapiData.startedAt
      ? Math.floor((new Date(vapiData.endedAt).getTime() - new Date(vapiData.startedAt).getTime()) / 1000)
      : call.duration

    const updated = await prisma.call.update({
      where: { id: callId },
      data: {
        status: vapiData.status || call.status,
        transcript,
        recordingUrl,
        duration,
        endedAt: vapiData.endedAt ? new Date(vapiData.endedAt) : call.endedAt,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
