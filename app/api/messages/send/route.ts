import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabase'

type SendMessagePayload = {
  conversationId: string
  body: string
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as SendMessagePayload

    const conversationId = payload.conversationId?.trim()
    const messageBody = payload.body?.trim()

    if (!conversationId || !messageBody) {
      return NextResponse.json(
        { error: 'conversationId and body are required' },
        { status: 400 }
      )
    }

    const { data: conversation, error: conversationError } = await supabaseAdmin
      .from('conversations')
      .select('id, contact_id')
      .eq('id', conversationId)
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
      .select('id, phone')
      .eq('id', conversation.contact_id)
      .maybeSingle()

    if (contactError) {
      return NextResponse.json(
        { error: contactError.message },
        { status: 500 }
      )
    }

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    const fromNumber = process.env.DIDWW_SMS_FROM_NUMBER || '+10000000000'
    const toNumber = contact.phone
    const now = new Date().toISOString()

    const { data: insertedMessage, error: insertMessageError } =
      await supabaseAdmin
        .from('messages')
        .insert({
          conversation_id: conversationId,
          direction: 'outbound',
          body: messageBody,
          from_number: fromNumber,
          to_number: toNumber,
          status: 'pending',
          created_at: now,
        })
        .select('id')
        .single()

    if (insertMessageError) {
      return NextResponse.json(
        { error: insertMessageError.message },
        { status: 500 }
      )
    }

    const { error: updateConversationError } = await supabaseAdmin
      .from('conversations')
      .update({
        last_message_at: now,
      })
      .eq('id', conversationId)

    if (updateConversationError) {
      return NextResponse.json(
        { error: updateConversationError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: insertedMessage.id,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unexpected error',
      },
      { status: 500 }
    )
  }
}
