import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// 添加 Edge Runtime 配置
export const runtime = 'edge'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_URL,
  timeout: 120000,
  maxRetries: 3,
})

export async function POST(request: Request) {
  try {
    console.log('[Transcribe API] Received request')
    const formData = await request.formData()
    const file = formData.get('file') as Blob
    
    if (!file) {
      console.log('[Transcribe API] No file provided')
      return NextResponse.json(
        { error: 'TRANSCRIBE_NO_FILE', message: 'No file provided' },
        { status: 400 }
      )
    }

    console.log('[Transcribe API] File size:', file.size)

    // 获取音频数据
    const audioData = await file.arrayBuffer()

    // 直接使用 arrayBuffer 而不是文件系统
    console.log('[Transcribe API] Starting transcription...')
    const transcription = await openai.audio.transcriptions.create({
      file: new File([audioData], 'audio.webm', { type: 'audio/webm' }),
      model: 'whisper-1',
      response_format: 'verbose_json'
    })

    console.log('[Transcribe API] Transcription completed')
    return NextResponse.json({ 
      text: transcription.text,
      language: transcription.language
    })
  } catch (error) {
    console.error('[Transcribe API] Error:', error)
    return NextResponse.json(
      { 
        error: 'TRANSCRIBE_FAILED', 
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 