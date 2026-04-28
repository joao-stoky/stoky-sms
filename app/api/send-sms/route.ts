import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { to, message } = body

    const username = process.env.DIDWW_SMS_USERNAME
    const password = process.env.DIDWW_SMS_PASSWORD
    const from = process.env.DIDWW_SMS_FROM_NUMBER
    const baseUrl =
  process.env.DIDWW_SMS_BASE_URL || 'https://us.sms-out.didww.com'

    if (!to || !message) {
      return NextResponse.json(
        { error: 'to and message are required' },
        { status: 400 }
      )
    }

    if (!username || !password || !from) {
      return NextResponse.json(
        { error: 'Missing DIDWW env vars' },
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
            destination: to,
            source: from,
            content: message,
          },
        },
      }),
    })

    const text = await didwwRes.text()

    let parsed: unknown = text
    try {
      parsed = JSON.parse(text)
    } catch {}

    return NextResponse.json(
      {
        success: didwwRes.ok,
        provider_status: didwwRes.status,
        didww_response: parsed,
      },
      { status: didwwRes.ok ? 200 : didwwRes.status }
    )
  } catch (error) {
    return NextResponse.json(
      {
        error: 'internal_error',
        details: error instanceof Error ? error.message : 'unknown error',
      },
      { status: 500 }
    )
  }
}