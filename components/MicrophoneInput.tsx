"use client"

import { useState, useRef } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

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
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recordingStartTimeRef = useRef<number>(0)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 16000
      })
      
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      recordingStartTimeRef.current = Date.now()

      mediaRecorder.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
          
          const currentTime = Date.now()
          if (currentTime - recordingStartTimeRef.current > 10000) {
            stopRecording()
          }
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

      mediaRecorder.start(500)
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
    const startTime = Date.now()
    const timings: Record<string, number> = {}

    try {
      console.log('[Client] Starting audio processing')
      console.log('[Client] Audio blob size:', audioBlob.size)

      const formData = new FormData()
      formData.append('file', audioBlob, 'audio.webm')
      timings.formDataPreparation = Date.now() - startTime

      const fetchStart = Date.now()
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })
      timings.serverRequestTime = Date.now() - fetchStart

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`语音识别失败: ${errorData.message} (${errorData.error})`)
      }

      const jsonStart = Date.now()
      const data: TranscriptionResult & { timings?: Record<string, number> } = await response.json()
      timings.jsonParsing = Date.now() - jsonStart

      const totalTime = Date.now() - startTime
      console.log('[Client] Performance metrics:', {
        totalTime,
        clientTimings: timings,
        serverTimings: data.timings,
        percentage: {
          formDataPrep: ((timings.formDataPreparation / totalTime) * 100).toFixed(2) + '%',
          serverRequest: ((timings.serverRequestTime / totalTime) * 100).toFixed(2) + '%',
          jsonParsing: ((timings.jsonParsing / totalTime) * 100).toFixed(2) + '%'
        }
      })

      onTranscription(data.text)
      return data.text
    } catch (error) {
      console.error('[Client] Audio processing error:', error)
      onTranscription(`语音识别出错: ${error instanceof Error ? error.message : '未知错误'}`)
      return null
    }
  }

  const processAIResponse = async (text: string) => {
    let controller: AbortController | null = null
    let timeoutId: NodeJS.Timeout | null = null

    try {
      setIsProcessing(true)
      controller = new AbortController()
      
      timeoutId = setTimeout(() => {
        if (controller) {
          controller.abort('请求超时')
        }
      }, 110000)

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: text,
          enableVoice: voiceEnabled
        }),
        signal: controller.signal
      })

      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`AI 响应失败: ${errorData.message} (${errorData.error})`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(`AI 错误: ${data.message} (${data.error})`)
      }

      if (data.text) {
        onAIResponse(data.text)
      }

      if (voiceEnabled && data.audio) {
        try {
          const audioBlob = new Blob(
            [Buffer.from(data.audio, 'base64')],
            { type: 'audio/mpeg' }
          )
          const audioUrl = URL.createObjectURL(audioBlob)

          if (audioRef.current) {
            audioRef.current.src = audioUrl
            await audioRef.current.play()
          }
        } catch (audioError) {
          console.error('音频播放错误:', audioError)
          onAIResponse('AI 回复已生成，但语音播放失败')
        }
      } else if (data.speechError) {
        onAIResponse('AI 已回复，但语音生成失败')
      }
    } catch (error) {
      console.error('AI 处理错误:', error)
      if (error instanceof Error && error.name === 'AbortError') {
        onAIResponse('请求超时，请稍后重试')
      } else {
        onAIResponse(`处理失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (controller) {
        controller.abort()
      }
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      <audio ref={audioRef} className="hidden" />
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={`p-2 rounded-full transition-colors ${
            voiceEnabled 
              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title={voiceEnabled ? '语音回复已开启' : '语音回复已关闭'}
        >
          {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>

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
          <span>{isRecording ? '停止录音 (最长10秒)' : '开始录音'}</span>
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