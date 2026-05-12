import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (phone.startsWith('+')) return '+' + digits
  if (digits.length === 10) return '+91' + digits
  if (digits.length === 12 && digits.startsWith('91')) return '+' + digits
  return '+' + digits
}

export async function POST(req: NextRequest) {
  try {
    const { contactId } = await req.json()

    const contact = await prisma.contact.findUnique({ where: { id: contactId } })
    if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

    const phoneNumber = toE164(contact.phone)

    const blandRes = await fetch('https://api.bland.ai/v1/calls', {
      method: 'POST',
      headers: {
        'Authorization': process.env.BLAND_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: phoneNumber,
        task: `You are a hotel customer service AI agent calling a guest.

When guest answers:
1. Introduce: "Hi, this is Maya calling from Grand Hotel. Could you please provide your booking ID?"
2. Listen to their problem - rebooking, cancellation, room issues etc.
3. Respond helpfully:
   - Rebooking: "Of course! What date would you like to rebook to?"
   - Cancellation: "Let me check our cancellation policy for your booking."
   - Room issues: "I sincerely apologize. Let me escalate this to our team right away."
4. Confirm: "Is there anything else I can help you with today?"
5. End: "Thank you for choosing Grand Hotel. Have a wonderful day!"

Be empathetic, professional and solution-focused.`,
        voice: "maya",
        first_sentence: "Hi, this is Maya calling from Grand Hotel. How are you doing today?",
        wait_for_greeting: true,
        record: true,
      }),
    })

    const blandData = await blandRes.json()
    console.log('[Bland AI] Response:', blandData)

    if (!blandRes.ok) {
      return NextResponse.json({ error: blandData.message || 'Call failed' }, { status: 400 })
    }

    const call = await prisma.call.create({
      data: {
        contactId: contact.id,
        vapiCallId: blandData.call_id,
        status: 'initiated',
      },
    })

    return NextResponse.json({ call, blandData })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to trigger call' }, { status: 500 })
  }
}