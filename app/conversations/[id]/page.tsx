import Link from 'next/link'
import ReplyBox from './reply-box'
import { supabaseAdmin } from '@/src/lib/supabase'

type Contact = {
  id: string
  phone: string
  name: string | null
}

type Message = {
  id: string
  direction: 'inbound' | 'outbound'
  body: string
  from_number: string
  to_number: string
  status: string
  created_at: string
}

type ConversationResponse = {
  id: string
  contact_id: string
  last_message_at: string
  created_at: string
  contact: Contact | null
  messages: Message[]
}

function formatHeaderTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function formatBubbleTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function formatDateChip(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function getInitials(name: string | null, phone: string | null) {
  if (name?.trim()) {
    return name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('')
  }

  return phone?.slice(-2) || 'SM'
}

async function getConversation(id: string): Promise<ConversationResponse> {
  const { data: conversation, error: conversationError } = await supabaseAdmin
    .from('conversations')
    .select('id, contact_id, last_message_at, created_at')
    .eq('id', id)
    .maybeSingle()

  if (conversationError) {
    throw new Error(conversationError.message)
  }

  if (!conversation) {
    throw new Error('Conversation not found')
  }

  const { data: contact, error: contactError } = await supabaseAdmin
    .from('contacts')
    .select('id, phone, name')
    .eq('id', conversation.contact_id)
    .maybeSingle()

  if (contactError) {
    throw new Error(contactError.message)
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
    throw new Error(messagesError.message)
  }

  return {
    ...conversation,
    contact,
    messages: messages || [],
  }
}

type PageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function ConversationPage({ params }: PageProps) {
  const { id } = await params
  const conversation = await getConversation(id)
  const grouped = conversation.messages.reduce<Array<{ label: string; items: Message[] }>>((acc, message) => {
    const label = formatDateChip(message.created_at)
    const last = acc[acc.length - 1]

    if (last && last.label === label) {
      last.items.push(message)
      return acc
    }

    acc.push({ label, items: [message] })
    return acc
  }, [])

  return (
    <main className="min-h-screen bg-[#0b141a] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 lg:px-6 lg:py-6">
        <div className="grid min-h-[calc(100vh-2rem)] overflow-hidden rounded-[28px] border border-white/10 bg-[#111b21] shadow-2xl lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="hidden border-r border-white/10 bg-[#111b21] lg:block">
            <div className="border-b border-white/10 bg-[#202c33] px-5 py-5">
              <div className="text-lg font-semibold">Stoky SMS</div>
              <div className="mt-1 text-sm text-[#9fb3c8]">Conversation view</div>
            </div>

            <div className="p-5">
              <Link
                href="/"
                className="inline-flex items-center rounded-full bg-[#202c33] px-4 py-2 text-sm text-white transition hover:bg-[#2a3942]"
              >
                ← Back to inbox
              </Link>

              <div className="mt-6 rounded-[24px] bg-[#0f171c] p-5 ring-1 ring-white/5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#233138] text-lg font-semibold text-[#d1f4cc]">
                  {getInitials(conversation.contact?.name || null, conversation.contact?.phone || null)}
                </div>

                <div className="mt-4 text-lg font-semibold text-white">
                  {conversation.contact?.name || 'Unknown contact'}
                </div>
                <div className="mt-1 text-sm text-[#9fb3c8]">
                  {conversation.contact?.phone || 'No phone'}
                </div>

                <div className="mt-5 rounded-2xl bg-[#202c33] px-4 py-3 text-sm text-[#c9d7e3]">
                  Last activity {formatHeaderTime(conversation.last_message_at)}
                </div>
              </div>
            </div>
          </aside>

          <section className="flex min-h-full flex-col bg-[#0b141a]">
            <div className="border-b border-white/10 bg-[#202c33] px-4 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-lg text-white transition hover:bg-white/10 lg:hidden"
                >
                  ←
                </Link>

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#233138] text-sm font-semibold text-[#d1f4cc]">
                  {getInitials(conversation.contact?.name || null, conversation.contact?.phone || null)}
                </div>

                <div className="min-w-0">
                  <h1 className="truncate text-base font-semibold text-white sm:text-lg">
                    {conversation.contact?.name || 'Unknown contact'}
                  </h1>
                  <p className="truncate text-sm text-[#9fb3c8]">
                    {conversation.contact?.phone || 'No phone'}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(11,20,26,0.94),rgba(11,20,26,0.97)),radial-gradient(circle_at_top,rgba(37,211,102,0.1),transparent_26%)] px-3 py-5 sm:px-6">
              <div className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:22px_22px]" />

              <div className="relative mx-auto flex max-w-4xl flex-col gap-5">
                {grouped.length > 0 ? (
                  grouped.map((group) => (
                    <div key={group.label} className="space-y-4">
                      <div className="flex justify-center">
                        <span className="rounded-full bg-[#1f2c34] px-4 py-1.5 text-xs font-medium text-[#c9d7e3] shadow">
                          {group.label}
                        </span>
                      </div>

                      {group.items.map((message) => {
                        const outbound = message.direction === 'outbound'

                        return (
                          <div
                            key={message.id}
                            className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[88%] rounded-[22px] px-4 py-3 text-sm shadow-lg sm:max-w-[75%] ${
                                outbound
                                  ? 'rounded-tr-md bg-[#005c4b] text-white'
                                  : 'rounded-tl-md bg-[#202c33] text-white'
                              }`}
                            >
                              <div className="whitespace-pre-wrap break-words leading-6">{message.body}</div>
                              <div className="mt-2 flex items-center justify-end gap-2 text-[11px] text-white/65">
                                <span>{formatBubbleTime(message.created_at)}</span>
                                <span className="rounded-full bg-black/10 px-2 py-0.5 capitalize">
                                  {message.status || message.direction}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))
                ) : (
                  <div className="mx-auto mt-10 max-w-md rounded-[28px] bg-[#1f2c34] px-6 py-8 text-center text-sm text-[#c9d7e3] shadow-lg">
                    No messages yet. This conversation will show inbound and outbound SMS here.
                  </div>
                )}
              </div>
            </div>

            <ReplyBox conversationId={conversation.id} />
          </section>
        </div>
      </div>
    </main>
  )
}
