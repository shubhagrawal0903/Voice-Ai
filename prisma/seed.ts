require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

function daysAgo(days: number, hours = 10): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hours, 0, 0, 0)
  return d
}

async function main() {
  console.log('Seeding database...')

  // Clear existing data
  await prisma.call.deleteMany()
  await prisma.contact.deleteMany()

  // Create contacts
  const contacts = await Promise.all([
    prisma.contact.create({ data: { name: 'Rahul Sharma', phone: '+919876543210', createdAt: daysAgo(7) } }),
    prisma.contact.create({ data: { name: 'Priya Patel', phone: '+918765432109', createdAt: daysAgo(6) } }),
    prisma.contact.create({ data: { name: 'Amit Kumar', phone: '+917654321098', createdAt: daysAgo(6) } }),
    prisma.contact.create({ data: { name: 'Sneha Gupta', phone: '+916543210987', createdAt: daysAgo(5) } }),
    prisma.contact.create({ data: { name: 'Vikram Singh', phone: '+915432109876', createdAt: daysAgo(4) } }),
    prisma.contact.create({ data: { name: 'Anjali Mehta', phone: '+914321098765', createdAt: daysAgo(3) } }),
    prisma.contact.create({ data: { name: 'Rohit Verma', phone: '+913210987654', createdAt: daysAgo(2) } }),
    prisma.contact.create({ data: { name: 'Kavya Nair', phone: '+912109876543', createdAt: daysAgo(1) } }),
  ])

  const transcripts = [
    `assistant: Hi, this is Maya calling from Grand Hotel. How are you doing today?
user: I'm doing well, thank you.
assistant: Could you please provide your booking ID?
user: Yes, my booking ID is GH-1234.
assistant: Thank you! How can I help you today?
user: I need to reschedule my booking from 15th May to 20th May.
assistant: Of course! I've updated your reservation to May 20th. Is there anything else?
user: No, that's all. Thank you!
assistant: Thank you for choosing Grand Hotel. Have a wonderful day!`,

    `assistant: Hi, this is Maya from Grand Hotel. How are you today?
user: Fine thanks.
assistant: Could you provide your booking ID please?
user: It's GH-5678.
assistant: How can I assist you?
user: I want to cancel my booking for tomorrow.
assistant: I understand. I've processed your cancellation. You'll receive a confirmation email shortly.
user: Great, thank you.
assistant: Thank you for letting us know. Have a great day!`,

    `assistant: Hello, this is Maya calling from Grand Hotel!
user: Hi Maya.
assistant: Could you please share your booking ID?
user: GH-9012.
assistant: How may I help you today?
user: I have a complaint about my room. The AC was not working last night.
assistant: I sincerely apologize for the inconvenience. I've escalated this to our maintenance team and you'll receive a discount on your next stay.
user: Thank you, I appreciate that.
assistant: We value your feedback. Thank you for choosing Grand Hotel!`,
  ]

  const summaries = [
    'Guest called to reschedule booking from May 15th to May 20th. Request was processed successfully and reservation updated.',
    'Guest requested cancellation of next day booking. Cancellation was processed and confirmation to be sent via email.',
    'Guest complained about non-functional AC in room. Issue escalated to maintenance team and discount offered for next stay.',
  ]

  // Create calls
  const callsData = [
    { contact: contacts[0], status: 'completed', daysAgo: 6, duration: 67, transcript: transcripts[0], summary: summaries[0] },
    { contact: contacts[1], status: 'completed', daysAgo: 6, duration: 45, transcript: transcripts[1], summary: summaries[1] },
    { contact: contacts[2], status: 'failed', daysAgo: 5, duration: null, transcript: null, summary: null },
    { contact: contacts[3], status: 'completed', daysAgo: 5, duration: 89, transcript: transcripts[2], summary: summaries[2] },
    { contact: contacts[4], status: 'completed', daysAgo: 4, duration: 120, transcript: transcripts[0], summary: summaries[0] },
    { contact: contacts[5], status: 'failed', daysAgo: 4, duration: null, transcript: null, summary: null },
    { contact: contacts[6], status: 'completed', daysAgo: 3, duration: 55, transcript: transcripts[1], summary: summaries[1] },
    { contact: contacts[0], status: 'completed', daysAgo: 3, duration: 78, transcript: transcripts[2], summary: summaries[2] },
    { contact: contacts[1], status: 'completed', daysAgo: 2, duration: 95, transcript: transcripts[0], summary: summaries[0] },
    { contact: contacts[7], status: 'failed', daysAgo: 2, duration: null, transcript: null, summary: null },
    { contact: contacts[2], status: 'completed', daysAgo: 1, duration: 110, transcript: transcripts[1], summary: summaries[1] },
    { contact: contacts[3], status: 'completed', daysAgo: 1, duration: 63, transcript: transcripts[2], summary: summaries[2] },
    { contact: contacts[4], status: 'completed', daysAgo: 0, duration: 88, transcript: transcripts[0], summary: summaries[0] },
    { contact: contacts[5], status: 'completed', daysAgo: 0, duration: 72, transcript: transcripts[1], summary: summaries[1] },
    { contact: contacts[6], status: 'initiated', daysAgo: 0, duration: null, transcript: null, summary: null },
  ]

  for (const c of callsData) {
    const startedAt = daysAgo(c.daysAgo, Math.floor(Math.random() * 12) + 9)
    await prisma.call.create({
      data: {
        contactId: c.contact.id,
        vapiCallId: `demo-${Math.random().toString(36).substr(2, 9)}`,
        status: c.status,
        transcript: c.transcript,
        summary: c.summary,
        recordingUrl: c.status === 'completed' ? 'https://api.bland.ai/v1/recordings/demo' : null,
        duration: c.duration,
        startedAt,
        endedAt: c.duration ? new Date(startedAt.getTime() + c.duration * 1000) : null,
        createdAt: startedAt,
      }
    })
  }

  console.log('✅ Seeded 8 contacts and 15 calls!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())