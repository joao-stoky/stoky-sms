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
    <div className="border-t border-zinc-800 p-5">
      <div className="space-y-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your SMS reply..."
          className="w-full min-h-[120px] rounded-xl bg-zinc-950 border border-zinc-700 px-4 py-3 text-sm text-white outline-none focus:border-zinc-500"
        />

        {error ? (
          <div className="text-sm text-red-400">{error}</div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send message'}
          </button>
        </div>
      </div>
    </div>
  )
}
