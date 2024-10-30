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
    console.log('Received transcription request')
    const formData = await request.formData()
    const file = formData.get('file') as Blob
    
    if (!file) {
      console.log('No file provided')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log('File size:', file.size)

    // 获取音频数据
    const audioData = await file.arrayBuffer()

    // 直接使用 arrayBuffer 而不是文件系统
    console.log('Starting transcription...')
    const transcription = await openai.audio.transcriptions.create({
      file: new File([audioData], 'audio.webm', { type: 'audio/webm' }),
      model: 'whisper-1',
      response_format: 'verbose_json'
    })

    console.log('Transcription completed:', transcription)
    return NextResponse.json({ 
      text: transcription.text,
      language: transcription.language
    })
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json(
      { error: 'Transcription failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 