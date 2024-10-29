"use client"

import { useState, useEffect } from 'react'

interface MicrophonePermissionProps {
  onPermissionGranted?: () => void
}

export default function MicrophonePermission({ onPermissionGranted }: MicrophonePermissionProps) {
  const [permission, setPermission] = useState<PermissionState>('prompt')
  const [stream, setStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    checkMicrophonePermission()
  }, [])

  async function checkMicrophonePermission() {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      setPermission(result.state)
      
      result.addEventListener('change', () => {
        setPermission(result.state)
      })
    } catch (error) {
      console.error('Error checking microphone permission:', error)
    }
  }

  async function requestMicrophoneAccess() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setStream(mediaStream)
      setPermission('granted')
      onPermissionGranted?.()
    } catch (error) {
      console.error('Error accessing microphone:', error)
      setPermission('denied')
    }
  }

  function stopMicrophone() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">麦克风权限</h2>
      
      {permission === 'prompt' && (
        <div>
          <p className="mb-4 text-gray-600">
            为了使用语音功能，我们需要访问您的麦克风。请点击下面的按钮授权使用麦克风。
          </p>
          <button
            onClick={requestMicrophoneAccess}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            授权麦克风
          </button>
        </div>
      )}

      {permission === 'granted' && (
        <div>
          <p className="text-green-600 mb-4">
            ✓ 麦克风已授权
          </p>
          {stream ? (
            <button
              onClick={stopMicrophone}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              停止麦克风
            </button>
          ) : (
            <button
              onClick={requestMicrophoneAccess}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              开启麦克风
            </button>
          )}
        </div>
      )}

      {permission === 'denied' && (
        <div>
          <p className="text-red-600 mb-4">
            ✗ 麦克风权限被拒绝
          </p>
          <p className="text-gray-600">
            请在浏览器设置中允许访问麦克风，然后刷新页面重试。
          </p>
        </div>
      )}
    </div>
  )
} 