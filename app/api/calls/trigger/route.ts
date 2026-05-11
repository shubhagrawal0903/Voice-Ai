import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { contactId } = await req.json()

    const contact = await prisma.contact.findUnique({ where: { id: contactId } })
    if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

    // Trigger call via Vapi REST API
    const vapiRes = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistantId: process.env.VAPI_ASSISTANT_ID,
        phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
        customer: {
          name: contact.name,
          number: contact.phone,
        },
      }),
    })

    const vapiData = await vapiRes.json()

    if (!vapiRes.ok) {
      return NextResponse.json({ error: vapiData.message || 'Vapi call failed' }, { status: 400 })
    }

    // Save call record to DB
    const call = await prisma.call.create({
      data: {
        contactId: contact.id,
        vapiCallId: vapiData.id,
        status: vapiData.status || 'initiated',
      },
    })

    return NextResponse.json({ call, vapiData })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to trigger call' }, { status: 500 })
  }
}
