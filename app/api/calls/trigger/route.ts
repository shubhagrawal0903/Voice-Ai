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
        task: `You are Maya, a customer service AI agent from Grand Hotel.

The customer has submitted a callback request. They want help with their hotel booking.

Your flow:
1. Greet: "Hi, this is Maya calling from Grand Hotel. I received your callback request. How may I assist you today?"
2. Listen to their issue carefully
3. Ask for booking ID: "Could you please provide your booking ID so I can pull up your reservation?"
4. Based on their request respond:
   - REBOOKING/RESCHEDULE: "Let me check availability... Great news! That date is available. I have successfully rescheduled your booking. You will receive a confirmation email shortly."
   - CANCELLATION: "I have processed your cancellation. You will receive a confirmation email within 24 hours."
   - COMPLAINT: "I sincerely apologize. I have escalated this to our manager who will contact you within 2 hours. We would like to offer you a 20% discount on your next stay as a goodwill gesture."
   - QUERY: Answer helpfully with relevant hotel information
5. Confirm: "Is there anything else I can help you with today?"
6. Close: "Thank you for choosing Grand Hotel. Have a wonderful day!"

CRITICAL RULES:
- For REBOOKING: ALWAYS ask "What date would you like to reschedule to?" BEFORE confirming. Never confirm reschedule without knowing the new date.
- For CANCELLATION: Always confirm "Are you sure you want to cancel?" before processing.
- Never assume any date — always ask explicitly.

Be warm, empathetic and professional. Always confirm the action taken so the customer feels assured.`,
        voice: "maya",
        first_sentence: "Hi, this is Maya calling from Grand Hotel. I received your callback request. How may I assist you today?",
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