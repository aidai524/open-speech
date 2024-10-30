import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { createReadStream } from 'fs'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_URL,
  timeout: 120000, // 设置 120 秒超时
  maxRetries: 3,  // 最大重试次数
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

    // 创建临时文件
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const path = join('/tmp', 'audio.webm')
    await writeFile(path, buffer)
    
    console.log('File saved to:', path)

    // 先不指定语言，让 Whisper 自动检测语言
    console.log('Starting transcription...')
    const transcription = await openai.audio.transcriptions.create({
      file: createReadStream(path),
      model: 'whisper-1',
      // 移除 language 参数，让模型自动检测语言
      response_format: 'verbose_json'  // 获取更详细的响应，包括检测到的语言
    })

    console.log('Transcription completed:', transcription)
    return NextResponse.json({ 
      text: transcription.text,
      language: transcription.language  // 返回检测到的语言
    })
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json(
      { error: 'Transcription failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 