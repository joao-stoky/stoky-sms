import Link from 'next/link'

type Contact = {
  id: string
  phone: string
  name: string | null
}

type Conversation = {
  id: string
  contact_id: string
  last_message_at: string
  created_at: string
  contact: Contact | null
}

async function getConversations(): Promise<Conversation[]> {
  const baseUrl =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : ''

  const res = await fetch(`${baseUrl}/api/conversations`, {
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error('Failed to load conversations')
  }

  return res.json()
}

export default async function HomePage() {
  const conversations = await getConversations()

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold mb-2">Stoky SMS Inbox</h1>
        <p className="text-zinc-400 mb-8">
          Incoming and outgoing SMS conversations
        </p>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          <div className="border-b border-zinc-800 px-5 py-4 font-medium">
            Conversations
          </div>

          <div className="divide-y divide-zinc-800">
            {conversations.length > 0 ? (
              conversations.map((conversation) => (
                <Link
                  key={conversation.id}
                  href={`/conversations/${conversation.id}`}
                  className="block px-5 py-4 hover:bg-zinc-800/60 transition"
                >
                  <div className="font-semibold">
                    {conversation.contact?.name || 'Unknown contact'}
                  </div>
                  <div className="text-sm text-zinc-400">
                    {conversation.contact?.phone || 'No phone'}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Last message: {conversation.last_message_at}
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-5 py-8 text-zinc-400">
                No conversations yet
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
