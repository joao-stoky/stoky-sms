'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type ReplyBoxProps = {
  conversationId: string
}

export default function ReplyBox({ conversationId }: ReplyBoxProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSend() {
    if (!message.trim()) return

    try {
      setSending(true)
      setError('')

      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          body: message,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      setMessage('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="border-t border-white/10 bg-[#202c33] px-3 py-3 sm:px-6 sm:py-4">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-end gap-3 rounded-[28px] bg-[#2a3942] p-2 shadow-lg ring-1 ring-white/5">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void handleSend()
              }
            }}
            placeholder="Type your SMS reply"
            className="max-h-40 min-h-[54px] flex-1 resize-none rounded-[22px] bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-[#9fb3c8]"
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !message.trim()}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#25d366] text-lg font-semibold text-[#0b141a] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Send message"
          >
            {sending ? '…' : '➤'}
          </button>
        </div>

        {error ? <div className="mt-3 text-sm text-red-300">{error}</div> : null}
      </div>
    </div>
  )
}
