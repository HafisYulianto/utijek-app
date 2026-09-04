'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage } from '@/types/database.types'
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid'
import { formatTimeAgo } from '@/lib/utils/formatters'

interface LiveChatDrawerProps {
  orderId: string
  userId: string
  onClose: () => void
}

export default function LiveChatDrawer({ orderId, userId, onClose }: LiveChatDrawerProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load initial messages
  useEffect(() => {
    supabase
      .from('chat_messages')
      .select('*, sender:profiles(full_name, avatar_url)')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data as ChatMessage[])
      })
  }, [orderId])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orderId])

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setInput('')

    await (supabase.from('chat_messages') as any).insert({
      order_id: orderId,
      sender_id: userId,
      message: text,
    })
    setSending(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col max-w-md mx-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Chat Panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl flex flex-col max-h-[75vh] animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900">Chat UTIBASING</h3>
            <p className="text-xs text-gray-500">Negosiasi langsung dengan driver</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
            id="btn-close-chat"
          >
            <XMarkIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <span className="text-3xl">💬</span>
              <p className="text-sm text-gray-500 mt-2">Mulai negosiasi dengan driver</p>
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.sender_id === userId
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl ${
                    isMe
                      ? 'bg-uti-maroon text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-uti-maroon-200' : 'text-gray-400'}`}>
                    {formatTimeAgo(msg.created_at)}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-100 safe-pb flex items-center gap-2">
          <input
            type="text"
            className="flex-1 input-field py-2.5"
            placeholder="Ketik pesan..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            id="input-chat-message"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-xl bg-uti-maroon flex items-center justify-center disabled:opacity-50 transition-opacity"
            id="btn-send-chat"
          >
            <PaperAirplaneIcon className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
