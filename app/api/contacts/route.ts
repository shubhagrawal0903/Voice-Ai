import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const contacts = await prisma.contact.findMany({
      include: {
        calls: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(contacts)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, phone } = await req.json()
    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
    }
    const contact = await prisma.contact.create({
      data: { name, phone },
    })
    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await prisma.call.deleteMany({ where: { contactId: id } })
    await prisma.contact.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 })
  }
}
