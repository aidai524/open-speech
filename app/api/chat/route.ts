import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const chatAI = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_URL,
  timeout: 120000,
  maxRetries: 3,
})

const speechAI = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_URL,
  timeout: 120000,
  maxRetries: 3,
})

const TIMEOUT = 110000

export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    console.log('[Chat API] Received request')
    const { message, enableVoice } = await request.json()
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('CHAT_TIMEOUT')), TIMEOUT)
    })

    const responsePromise = (async () => {
      // 获取 AI 回复
      console.log('[Chat API] Requesting chat completion')
      const completion = await chatAI.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: message }],
        max_tokens: 5000,
        temperature: 0.7,
      })

      const reply = completion.choices[0].message.content

      if (!reply) {
        throw new Error('CHAT_NO_REPLY')
      }

      // 只在启用语音时生成语音
      if (enableVoice) {
        try {
          console.log('[Chat API] Generating speech')
          const mp3 = await speechAI.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: reply.slice(0, 500),
          })

          const audioData = await mp3.arrayBuffer()
          const base64Audio = Buffer.from(audioData).toString('base64')

          console.log('[Chat API] Response ready with audio')
          return { audio: base64Audio, text: reply }
        } catch (speechError) {
          console.error('[Chat API] Speech synthesis error:', speechError)
          return { text: reply, speechError: 'SPEECH_GENERATION_FAILED' }
        }
      }

      // 语音未启用时只返回文本
      console.log('[Chat API] Response ready (text only)')
      return { text: reply }
    })()

    const result = await Promise.race([responsePromise, timeoutPromise])
    return NextResponse.json(result)

  } catch (error) {
    console.error('[Chat API] Error:', error)
    
    let errorCode = 'CHAT_UNKNOWN_ERROR'
    let statusCode = 500
    let message = 'Unknown error'

    if (error instanceof Error) {
      if (error.message === 'CHAT_TIMEOUT') {
        errorCode = 'CHAT_TIMEOUT'
        statusCode = 504
        message = 'Chat request timed out'
      } else if (error.message === 'CHAT_NO_REPLY') {
        errorCode = 'CHAT_NO_REPLY'
        message = 'No reply from AI'
      } else if (error.message.includes('fetch failed')) {
        errorCode = 'CHAT_SERVICE_UNAVAILABLE'
        statusCode = 503
        message = 'Chat service temporarily unavailable'
      } else {
        message = error.message
      }
    }
    
    return NextResponse.json(
      { 
        error: errorCode,
        message,
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.stack : undefined
      },
      { status: statusCode }
    )
  }
} 