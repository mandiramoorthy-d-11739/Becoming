'use client'
import { motion } from 'framer-motion'
import { Message } from '@/types'

interface UserMessageProps {
  message: Message
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <motion.div
      className="flex justify-end"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-tr-lg bg-violet-600 px-4 py-3 text-sm leading-relaxed text-white">
        {message.content}
      </div>
    </motion.div>
  )
}
