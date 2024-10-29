import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_URL,
})

// 设置超时时间为 8 秒
const TIMEOUT = 8000

export async function POST(request: Request) {
  try {
    const { message } = await request.json()

    // 创建一个带超时的 Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), TIMEOUT)
    })

    // 创建 AI 回复的 Promise
    const responsePromise = (async () => {
      // 获取 AI 回复
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: message }],
        temperature: 0.7,
        max_tokens: 500, // 减少 token 数量以加快响应
      })

      const reply = completion.choices[0].message.content

      if (!reply) {
        throw new Error('No reply from AI')
      }

      // 生成语音
      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: reply.slice(0, 1000), // 限制语音长度
      })

      // 获取音频数据并转换为 Base64
      const audioData = await mp3.arrayBuffer()
      const base64Audio = Buffer.from(audioData).toString('base64')

      return { audio: base64Audio, text: reply }
    })()

    // 使用 Promise.race 来处理超时
    const result = await Promise.race([responsePromise, timeoutPromise])
    return NextResponse.json(result)

  } catch (error) {
    console.error('Chat error:', error)
    
    // 根据错误类型返回不同的状态码
    const statusCode = error instanceof Error && error.message === 'Request timeout' ? 504 : 500
    
    return NextResponse.json(
      { 
        error: 'Chat failed', 
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    )
  }
} 