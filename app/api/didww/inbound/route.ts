import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabase'

export async function GET() {
  return NextResponse.json({ ok: true, route: 'didww inbound alive' })
}

type DidwwInboundPayload = {
  SMS_SRC_ADDR?: string
  SMS_DST_ADDR?: string
  SMS_TEXT?: string
  SMS_TIME?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as DidwwInboundPayload

    const fromNumber = body.SMS_SRC_ADDR?.trim()
    const toNumber = body.SMS_DST_ADDR?.trim()
    const messageText = body.SMS_TEXT?.trim()
    const smsTime = body.SMS_TIME
      ? new Date(body.SMS_TIME).toISOString()
      : new Date().toISOString()

    if (!fromNumber || !toNumber || !messageText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let contactId: string
    let conversationId: string

    const { data: existingContact, error: contactLookupError } =
      await supabaseAdmin
        .from('contacts')
        .select('id, phone, name')
        .eq('phone', fromNumber)
        .maybeSingle()

    if (contactLookupError) {
      return NextResponse.json(
        { error: contactLookupError.message },
        { status: 500 }
      )
    }

    if (existingContact) {
      contactId = existingContact.id
    } else {
      const { data: newContact, error: createContactError } =
        await supabaseAdmin
          .from('contacts')
          .insert({
            phone: fromNumber,
            name: null,
          })
          .select('id')
          .single()

      if (createContactError || !newContact) {
        return NextResponse.json(
          { error: createContactError?.message || 'Failed to create contact' },
          { status: 500 }
        )
      }

      contactId = newContact.id
    }

    const { data: existingConversation, error: conversationLookupError } =
      await supabaseAdmin
        .from('conversations')
        .select('id, unread_count')
        .eq('contact_id', contactId)
        .maybeSingle()

    if (conversationLookupError) {
      return NextResponse.json(
        { error: conversationLookupError.message },
        { status: 500 }
      )
    }

    if (existingConversation) {
      conversationId = existingConversation.id
    } else {
      const { data: newConversation, error: createConversationError } =
        await supabaseAdmin
          .from('conversations')
          .insert({
            contact_id: contactId,
            last_message_at: smsTime,
            last_message_preview: messageText,
            unread_count: 0,
          })
          .select('id')
          .single()

      if (createConversationError || !newConversation) {
        return NextResponse.json(
          {
            error:
              createConversationError?.message ||
              'Failed to create conversation',
          },
          { status: 500 }
        )
      }

      conversationId = newConversation.id
    }

    const { error: insertMessageError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        direction: 'inbound',
        body: messageText,
        from_number: fromNumber,
        to_number: toNumber,
        status: 'received',
        created_at: smsTime,
      })

    if (insertMessageError) {
      return NextResponse.json(
        { error: insertMessageError.message },
        { status: 500 }
      )
    }

    const currentUnreadCount = existingConversation?.unread_count ?? 0

    const { error: updateConversationError } = await supabaseAdmin
      .from('conversations')
      .update({
        last_message_at: smsTime,
        last_message_preview: messageText,
        unread_count: currentUnreadCount + 1,
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
      contactId,
      conversationId,
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