import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .select(`
      id,
      contact_id,
      last_message_at,
      created_at
    `)
    .order('last_message_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const contactIds = [...new Set((data || []).map((item) => item.contact_id).filter(Boolean))]

  let contactsById: Record<string, { id: string; phone: string; name: string | null }> = {}

  if (contactIds.length > 0) {
    const { data: contacts, error: contactsError } = await supabaseAdmin
      .from('contacts')
      .select('id, phone, name')
      .in('id', contactIds)

    if (contactsError) {
      return NextResponse.json({ error: contactsError.message }, { status: 500 })
    }

    contactsById = Object.fromEntries((contacts || []).map((contact) => [contact.id, contact]))
  }

  const result = (data || []).map((conversation) => ({
    ...conversation,
    contact: contactsById[conversation.contact_id] || null,
  }))

  return NextResponse.json(result)
}
