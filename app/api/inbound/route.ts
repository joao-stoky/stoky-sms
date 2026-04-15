import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { from, to, message } = body

    if (!from || !to || !message) {
      return NextResponse.json(
        { error: 'from, to and message are required' },
        { status: 400 }
      )
    }

    console.log('Inbound test:', { from, to, message })

    return NextResponse.json({
      success: true,
      direction: 'inbound',
      from,
      to,
      message
    })
  } catch {
    return NextResponse.json(
      { error: 'invalid request body' },
      { status: 400 }
    )
  }
}