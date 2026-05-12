import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { callId } = await req.json()

    const call = await prisma.call.findUnique({ where: { id: callId } })
    if (!call?.vapiCallId) return NextResponse.json({ error: 'Call not found' }, { status: 404 })

    const blandRes = await fetch(`https://api.bland.ai/v1/calls/${call.vapiCallId}`, {
      headers: {
        'Authorization': process.env.BLAND_API_KEY!,
      },
    })

    const blandData = await blandRes.json()
    console.log('[Bland Sync]', blandData)

    const transcript = blandData.transcripts
      ? blandData.transcripts.map((t: any) => `${t.user}: ${t.text}`).join('\n')
      : null

    const recordingUrl = blandData.recording_url || null
    const status = blandData.status === 'completed' ? 'completed' : blandData.status || call.status
    const duration = blandData.call_length ? Math.floor(blandData.call_length) : null

    const summary = blandData.summary || null

    const updated = await prisma.call.update({
      where: { id: callId },
      data: {
        status,
        transcript,
        recordingUrl,
        summary,
        duration,
        endedAt: blandData.end_at ? new Date(blandData.end_at) : call.endedAt,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}