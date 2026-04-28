'use client'

import { useMemo, useState } from 'react'
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

type ConversationListProps = {
  conversations: Conversation[]
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

function normalizePhone(phone: string | null | undefined) {
  return phone?.replace(/\D/g, '') || ''
}

export default function ConversationList({ conversations }: ConversationListProps) {
  const [search, setSearch] = useState('')

  const latestConversations = useMemo(() => {
    const seen = new Set<string>()

    return conversations.filter((conversation) => {
      const normalizedPhone = normalizePhone(conversation.contact?.phone)
      const key = normalizedPhone || conversation.contact_id || conversation.id

      if (seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    })
  }, [conversations])

  const filteredConversations = useMemo(() => {
    const searchTerm = search.trim().toLowerCase()
    const normalizedSearch = normalizePhone(search)

    if (!searchTerm) {
      return latestConversations
    }

    return latestConversations.filter((conversation) => {
      const name = conversation.contact?.name || ''
      const phone = conversation.contact?.phone || ''
      const normalizedPhone = normalizePhone(phone)

      return (
        name.toLowerCase().includes(searchTerm) ||
        phone.toLowerCase().includes(searchTerm) ||
        normalizedPhone.includes(normalizedSearch)
      )
    })
  }, [latestConversations, search])

  return (
    <>
      <div className="border-b border-white/10 px-5 py-4">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or phone..."
          className="w-full rounded-2xl bg-[#202c33] px-4 py-3 text-sm text-white outline-none placeholder:text-[#9fb3c8] focus:ring-2 focus:ring-[#25d366]/40"
        />

        <div className="mt-2 px-1 text-xs text-[#9fb3c8]">
          {filteredConversations.length > 0
            ? `${filteredConversations.length} conversation${filteredConversations.length === 1 ? '' : 's'} found`
            : 'No conversations found'}
        </div>
      </div>

      <div className="max-h-[70vh] overflow-y-auto lg:max-h-[calc(100vh-220px)]">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => {
            const name =
              conversation.contact?.name?.trim() ||
              conversation.contact?.phone ||
              'Unknown contact'

            const phone = conversation.contact?.phone || ''

            return (
              <Link
                key={conversation.id}
                href={`/conversations/${conversation.id}`}
                className="flex items-center gap-4 border-b border-white/5 px-5 py-4 transition hover:bg-white/5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#233138] text-sm font-semibold text-[#d1f4cc]">
                  {getInitials(
                    conversation.contact?.name || null,
                    conversation.contact?.phone || null
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="truncate text-sm font-semibold text-white">
                      {name}
                    </div>

                    <div className="shrink-0 text-[11px] text-[#9fb3c8]">
                      {formatConversationTime(conversation.last_message_at)}
                    </div>
                  </div>

                  <div className="mt-1 truncate text-sm text-[#9fb3c8]">
                    {phone}
                  </div>

                  <div className="mt-1 text-xs text-[#7d8f9f]">
                    Tap to open chat
                  </div>
                </div>
              </Link>
            )
          })
        ) : (
          <div className="px-5 py-10 text-sm text-[#9fb3c8]">
            {search.trim()
              ? 'No conversations match your search.'
              : 'No conversations yet. Once your SMS messages arrive, they will appear here.'}
          </div>
        )}
      </div>
    </>
  )
}