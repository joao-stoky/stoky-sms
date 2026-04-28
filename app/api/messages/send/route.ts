import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabase'

type SendMessagePayload = {
  conversationId: string
  body: string
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, '')
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

    const username = process.env.DIDWW_SMS_USERNAME
    const password = process.env.DIDWW_SMS_PASSWORD
    const fromNumberRaw = process.env.DIDWW_SMS_FROM_NUMBER
    const baseUrl =
      process.env.DIDWW_SMS_BASE_URL || 'https://us.sms-out.didww.com'

    if (!username || !password || !fromNumberRaw) {
      return NextResponse.json(
        { error: 'Missing DIDWW env vars' },
        { status: 500 }
      )
    }

    const fromNumber = normalizePhone(fromNumberRaw)
    const now = new Date().toISOString()

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

    if (!contact?.phone) {
      return NextResponse.json(
        { error: 'Contact phone not found' },
        { status: 404 }
      )
    }

    const toNumber = normalizePhone(contact.phone)

    if (!toNumber) {
      return NextResponse.json(
        { error: 'Invalid contact phone' },
        { status: 400 }
      )
    }

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

    if (insertMessageError || !insertedMessage) {
      return NextResponse.json(
        { error: insertMessageError?.message || 'Failed to create message' },
        { status: 500 }
      )
    }

    const auth = Buffer.from(`${username}:${password}`).toString('base64')

    const didwwRes = await fetch(`${baseUrl}/outbound_messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        data: {
          type: 'outbound_messages',
          attributes: {
            destination: toNumber,
            source: fromNumber,
            content: messageBody,
          },
        },
      }),
    })

    const didwwText = await didwwRes.text()

let didwwResponse: unknown = didwwText

    try {
      didwwResponse = JSON.parse(didwwText)
    } catch {}

const providerMessageId =
  typeof didwwResponse === 'object' &&
  didwwResponse !== null &&
  'data' in didwwResponse &&
  typeof didwwResponse.data === 'object' &&
  didwwResponse.data !== null &&
  'id' in didwwResponse.data &&
  typeof didwwResponse.data.id === 'string'
    ? didwwResponse.data.id
    : null

    if (!didwwRes.ok) {
      await supabaseAdmin
        .from('messages')
        .update({
          status: 'failed',
          error_message:
            typeof didwwResponse === 'string'
              ? didwwResponse
              : JSON.stringify(didwwResponse),
        })
        .eq('id', insertedMessage.id)

      return NextResponse.json(
        {
          success: false,
          messageId: insertedMessage.id,
          provider_status: didwwRes.status,
          didww_response: didwwResponse,
        },
        { status: didwwRes.status }
      )
    }

    const { error: updateMessageError } = await supabaseAdmin
      .from('messages')
      .update({
        status: 'sent',
      })
      .eq('id', insertedMessage.id)

    if (updateMessageError) {
      return NextResponse.json(
        { error: updateMessageError.message },
        { status: 500 }
      )
    }

    const { error: updateConversationError } = await supabaseAdmin
      .from('conversations')
      .update({
        last_message_at: now,
        last_message_preview: messageBody,
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
      provider_status: didwwRes.status,
      didww_response: didwwResponse,
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