import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// 添加 Edge Runtime 配置
export const runtime = 'edge'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_URL,
  timeout: 30000,
  maxRetries: 2,
})

export async function POST(request: Request) {
  const startTime = Date.now()
  const timings: Record<string, number> = {}

  try {
    console.log('[Transcribe API] Received request')
    const formData = await request.formData()
    const file = formData.get('file') as Blob
    
    timings.formDataParsing = Date.now() - startTime

    if (!file) {
      console.log('[Transcribe API] No file provided')
      return NextResponse.json(
        { error: 'TRANSCRIBE_NO_FILE', message: 'No file provided' },
        { status: 400 }
      )
    }

    console.log('[Transcribe API] File size:', file.size)
    const arrayBufferStart = Date.now()
    const audioData = await file.arrayBuffer()
    timings.arrayBufferConversion = Date.now() - arrayBufferStart

    console.log('[Transcribe API] Starting transcription...')
    const transcriptionStart = Date.now()
    const transcription = await openai.audio.transcriptions.create({
      file: new File([audioData], 'audio.webm', { type: 'audio/webm' }),
      model: 'whisper-1',
      response_format: 'verbose_json',
      temperature: 0.2,
      prompt: "这是一段中文对话。"
    })
    timings.transcription = Date.now() - transcriptionStart

    const totalTime = Date.now() - startTime
    console.log('[Transcribe API] Performance metrics:', {
      totalTime,
      ...timings,
      percentage: {
        formDataParsing: ((timings.formDataParsing / totalTime) * 100).toFixed(2) + '%',
        arrayBufferConversion: ((timings.arrayBufferConversion / totalTime) * 100).toFixed(2) + '%',
        transcription: ((timings.transcription / totalTime) * 100).toFixed(2) + '%'
      }
    })

    return NextResponse.json({ 
      text: transcription.text,
      language: transcription.language,
      timings
    })
  } catch (error) {
    console.error('[Transcribe API] Error:', error)
    return NextResponse.json(
      { 
        error: 'TRANSCRIBE_FAILED', 
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
        timings
      },
      { status: 500 }
    )
  }
} 