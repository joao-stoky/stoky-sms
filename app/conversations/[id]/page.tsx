import Link from 'next/link'
import ReplyBox from './reply-box'
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
  const baseUrl =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : ''

  const res = await fetch(`${baseUrl}/api/conversations/${id}`, {
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error('Failed to load conversation')
  }

  return res.json()
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