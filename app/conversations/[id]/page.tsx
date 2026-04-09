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

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm text-zinc-400 hover:text-white transition"
          >
            ← Back to inbox
          </Link>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          <div className="border-b border-zinc-800 px-5 py-4">
            <h1 className="text-2xl font-bold">
              {conversation.contact?.name || 'Unknown contact'}
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              {conversation.contact?.phone || 'No phone'}
            </p>
          </div>

          <div className="p-5 space-y-4">
            {conversation.messages.length > 0 ? (
              conversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.direction === 'inbound'
                      ? 'bg-zinc-800 text-white'
                      : 'bg-blue-600 text-white ml-auto'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">
                    {message.body}
                  </div>
                  <div className="text-[11px] opacity-70 mt-2">
                    {message.direction} • {message.created_at}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-zinc-400">No messages yet</div>
            )}
          </div>

          <ReplyBox conversationId={conversation.id} />
        </div>
      </div>
    </main>
  )
}
