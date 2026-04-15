import Link from 'next/link'
import { supabaseAdmin } from '@/src/lib/supabase'

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

function formatConversationTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
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

async function getConversations(): Promise<Conversation[]> {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .select(`
      id,
      contact_id,
      last_message_at,
      created_at
    `)
    .order('last_message_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const contactIds = [...new Set((data || []).map((item) => item.contact_id).filter(Boolean))]

  let contactsById: Record<string, Contact> = {}

  if (contactIds.length > 0) {
    const { data: contacts, error: contactsError } = await supabaseAdmin
      .from('contacts')
      .select('id, phone, name')
      .in('id', contactIds)

    if (contactsError) {
      throw new Error(contactsError.message)
    }

    contactsById = Object.fromEntries(
      (contacts || []).map((contact) => [contact.id, contact])
    )
  }

  return (data || []).map((conversation) => ({
    ...conversation,
    contact: contactsById[conversation.contact_id] || null,
  }))
}

export default async function HomePage() {
  const conversations = await getConversations()
  const featuredConversation = conversations[0] || null

  return (
    <main className="min-h-screen bg-[#0b141a] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 lg:px-6 lg:py-6">
        <div className="grid min-h-[calc(100vh-2rem)] overflow-hidden rounded-[28px] border border-white/10 bg-[#111b21] shadow-2xl lg:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="border-b border-white/10 bg-[#111b21] lg:border-b-0 lg:border-r">
            <div className="border-b border-white/10 bg-[#202c33] px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25d366] text-base font-bold text-[#0b141a]">
                  SS
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">Stoky SMS</h1>
                  <p className="text-sm text-[#9fb3c8]">Your inbox in a friendlier chat layout</p>
                </div>
              </div>
            </div>

            <div className="border-b border-white/10 px-5 py-4">
              <div className="rounded-2xl bg-[#202c33] px-4 py-3 text-sm text-[#9fb3c8]">
                {conversations.length > 0
                  ? `${conversations.length} conversation${conversations.length === 1 ? '' : 's'} available`
                  : 'No conversations yet'}
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto lg:max-h-[calc(100vh-180px)]">
              {conversations.length > 0 ? (
                conversations.map((conversation) => {
                  const name = conversation.contact?.name || 'Unknown contact'
                  const phone = conversation.contact?.phone || 'No phone'

                  return (
                    <Link
                      key={conversation.id}
                      href={`/conversations/${conversation.id}`}
                      className="flex items-center gap-4 border-b border-white/5 px-5 py-4 transition hover:bg-white/5"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#233138] text-sm font-semibold text-[#d1f4cc]">
                        {getInitials(conversation.contact?.name || null, conversation.contact?.phone || null)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="truncate text-sm font-semibold text-white">{name}</div>
                          <div className="shrink-0 text-[11px] text-[#9fb3c8]">
                            {formatConversationTime(conversation.last_message_at)}
                          </div>
                        </div>

                        <div className="mt-1 truncate text-sm text-[#9fb3c8]">{phone}</div>
                        <div className="mt-1 text-xs text-[#7d8f9f]">Tap to open chat</div>
                      </div>
                    </Link>
                  )
                })
              ) : (
                <div className="px-5 py-10 text-sm text-[#9fb3c8]">
                  No conversations yet. Once your SMS messages arrive, they will appear here.
                </div>
              )}
            </div>
          </aside>

          <section className="relative hidden min-h-full bg-[#0b141a] lg:flex lg:flex-col">
            <div className="border-b border-white/10 bg-[#202c33] px-8 py-5">
              <p className="text-sm font-medium text-white">Preview</p>
              <p className="mt-1 text-sm text-[#9fb3c8]">
                Open a conversation on the left to see the full thread.
              </p>
            </div>

            <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(37,211,102,0.14),_transparent_28%),linear-gradient(180deg,#0b141a_0%,#111b21_100%)] p-10">
              <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />

              <div className="relative w-full max-w-xl rounded-[32px] border border-white/10 bg-[#111b21]/95 p-8 shadow-2xl backdrop-blur">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-lg font-bold text-[#0b141a]">
                    {featuredConversation
                      ? getInitials(
                          featuredConversation.contact?.name || null,
                          featuredConversation.contact?.phone || null
                        )
                      : '💬'}
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-white">
                      {featuredConversation?.contact?.name || 'Your SMS conversations'}
                    </div>
                    <div className="text-sm text-[#9fb3c8]">
                      {featuredConversation?.contact?.phone || 'Cleaner layout, easier replies, better focus'}
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <div className="max-w-[82%] rounded-[20px] rounded-tl-md bg-[#202c33] px-4 py-3 text-sm text-white shadow">
                    Incoming messages can feel much more natural in a chat style interface.
                  </div>
                  <div className="ml-auto max-w-[82%] rounded-[20px] rounded-tr-md bg-[#005c4b] px-4 py-3 text-sm text-white shadow">
                    This redesign gives your inbox a cleaner WhatsApp inspired look without changing your backend flow.
                  </div>
                  <div className="max-w-[82%] rounded-[20px] rounded-tl-md bg-[#202c33] px-4 py-3 text-sm text-white shadow">
                    You can keep your DIDWW and Supabase logic exactly as it is.
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
