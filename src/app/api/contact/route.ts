import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const { name, email, subject, message, locale, _honeypot } = body

  // honeypot check
  if (_honeypot) {
    return NextResponse.json({ success: true }) // tiše zahodíme
  }

  // základní validace
  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  if (message.length < 10) {
    return NextResponse.json({ error: 'Message too short' }, { status: 400 })
  }

  const ip_address =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null

  const supabase = await createClient()

  const { error } = await supabase.from('messages').insert({
    name,
    email,
    subject: subject || null,
    message,
    locale: locale === 'en' ? 'en' : 'cs',
    status: 'new',
    ip_address,
    honeypot_triggered: false,
  })

  if (error) {
    console.error('Failed to save message:', error.message)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}