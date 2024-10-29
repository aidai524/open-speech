export interface ChatMessage {
  id: string
  content: string
  type: 'user' | 'assistant'
  created_at: string
}

export interface ChatHistory {
  messages: ChatMessage[]
} 