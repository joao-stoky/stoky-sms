import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabase'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params

  const { data: conversation, error: conversationError } = await supabaseAdmin
    .from('conversations')
    .select('id, contact_id, last_message_at, created_at')
    .eq('id', id)
    .maybeSingle()

  if (conversationError) {
    return NextResponse.json(
      { error: conversationError.message },
      { status: 500 }
    )
  }

  if (!conversation) {
    return NextResponse.json(
      { error: 'Conversation not found' },
      { status: 404 }
    )
  }

  const { data: contact, error: contactError } = await supabaseAdmin
    .from('contacts')
    .select('id, phone, name')
    .eq('id', conversation.contact_id)
    .maybeSingle()

  if (contactError) {
    return NextResponse.json(
      { error: contactError.message },
      { status: 500 }
    )
  }

  const { data: messages, error: messagesError } = await supabaseAdmin
    .from('messages')
    .select(`
      id,
      direction,
      body,
      from_number,
      to_number,
      status,
      created_at
    `)
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  if (messagesError) {
    return NextResponse.json(
      { error: messagesError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ...conversation,
    contact,
    messages: messages || [],
  })
}
