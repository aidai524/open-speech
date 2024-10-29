"use client"

import { useState, useRef } from 'react'

interface MicrophoneInputProps {
  onTranscription: (text: string) => void
  onAIResponse: (text: string) => void
}

interface TranscriptionResult {
  text: string
  language: string
}

export default function MicrophoneInput({ onTranscription, onAIResponse }: MicrophoneInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setIsTranscribing(true)
        const text = await sendAudioToServer(audioBlob)
        if (text) {
          await processAIResponse(text)
        }
        setIsTranscribing(false)
      }

      mediaRecorder.start(1000)
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    }
  }

  const sendAudioToServer = async (audioBlob: Blob): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append('file', audioBlob, 'audio.webm')

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Transcription failed')
      }

      const data: TranscriptionResult = await response.json()
      
      // 根据检测到的语言设置适当的字体和文字方向
      const text = data.text
      onTranscription(text)
      return text
    } catch (error) {
      console.error('Error sending audio to server:', error)
      return null
    }
  }

  const processAIResponse = async (text: string) => {
    const maxRetries = 2
    let retryCount = 0

    const tryRequest = async (): Promise<void> => {
      try {
        setIsProcessing(true)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 9000) // 9 秒超时

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: text }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (response.status === 504 || response.status === 503) {
          if (retryCount < maxRetries) {
            retryCount++
            console.log(`Retrying request (${retryCount}/${maxRetries})...`)
            // 指数退避重试
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)))
            return tryRequest()
          }
          throw new Error('Service unavailable after retries')
        }

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(`API error: ${errorData.message || 'Unknown error'}`)
        }

        const data = await response.json()
        
        if (data.error) {
          throw new Error(data.error)
        }

        // 处理文本回复
        if (data.text) {
          onAIResponse(data.text)
        }

        // 处理音频数据
        if (data.audio) {
          const audioBlob = new Blob(
            [Buffer.from(data.audio, 'base64')],
            { type: 'audio/mpeg' }
          )
          const audioUrl = URL.createObjectURL(audioBlob)

          if (audioRef.current) {
            audioRef.current.src = audioUrl
            await audioRef.current.play()
          }
        }
      } catch (error) {
        console.error('Error processing AI response:', error)
        onAIResponse(`抱歉，处理您的请求时出现错误：${error instanceof Error ? error.message : '未知错误'}`)
      } finally {
        setIsProcessing(false)
      }
    }

    await tryRequest()
  }

  return (
    <div className="space-y-4">
      <audio ref={audioRef} className="hidden" />
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isTranscribing || isProcessing}
          className={`${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white px-6 py-3 rounded-full flex items-center space-x-2 transition-colors disabled:opacity-50`}
        >
          <div className={`w-3 h-3 rounded-full ${isRecording ? 'animate-pulse bg-white' : 'bg-red-500'}`} />
          <span>{isRecording ? '停止录音' : '开始录音'}</span>
        </button>
      </div>
      
      {(isTranscribing || isProcessing) && (
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-2"></div>
          <p className="text-gray-600">
            {isTranscribing ? '正在识别你的语音...' : '正在生成 AI 回复...'}
          </p>
        </div>
      )}
    </div>
  )
} 