import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_URL,
})

export async function POST(request: Request) {
  try {
    const { message } = await request.json()

    // 获取 AI 回复
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
    })

    const reply = completion.choices[0].message.content

    if (!reply) {
      throw new Error('No reply from AI')
    }

    // 生成语音
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: reply,
    })

    // 获取音频数据并转换为 Base64
    const audioData = await mp3.arrayBuffer()
    const base64Audio = Buffer.from(audioData).toString('base64')

    // 返回 Base64 编码的音频数据和文本
    return NextResponse.json({
      audio: base64Audio,
      text: reply,
    })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Chat failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 