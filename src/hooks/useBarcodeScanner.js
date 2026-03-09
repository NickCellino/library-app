import { useState, useEffect, useRef, useCallback } from 'react'
import { readBarcodes } from 'zxing-wasm/reader'

export const DEFAULT_COOLDOWN_MS = 5000

export function useBarcodeScanner({
  cooldownMs = DEFAULT_COOLDOWN_MS,
  onScan,
  onError,
  isEnabled = true
}) {
  const [isScanning, setIsScanning] = useState(isEnabled)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingISBN, setLoadingISBN] = useState('')
  const [currentToast, setCurrentToast] = useState(null)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const animationFrameRef = useRef(null)
  const isProcessingRef = useRef(false)
  const recentISBNs = useRef(new Map())
  const toastTimeoutRef = useRef(null)
  const onScanRef = useRef(onScan)
  const onErrorRef = useRef(onError)

  // Keep callbacks fresh
  useEffect(() => {
    onScanRef.current = onScan
    onErrorRef.current = onError
  }, [onScan, onError])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current)
      }
    }
  }, [])

  const isOnCooldown = useCallback((isbn) => {
    const lastScan = recentISBNs.current.get(isbn)
    if (!lastScan) return false
    return Date.now() - lastScan < cooldownMs
  }, [cooldownMs])

  const addToCooldown = useCallback((isbn) => {
    recentISBNs.current.set(isbn, Date.now())
  }, [])

  const removeFromCooldown = useCallback((isbn) => {
    recentISBNs.current.delete(isbn)
  }, [])

  const showToast = useCallback((toast) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
    }
    setCurrentToast(toast)

    if (!toast.interactive) {
      toastTimeoutRef.current = setTimeout(() => {
        setCurrentToast(null)
      }, 2500)
    }
  }, [])

  const dismissToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
    }
    setCurrentToast(null)
  }, [])

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }, [])

  const startScanLoop = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const scan = async () => {
      if (!streamRef.current) return

      if (isProcessingRef.current) {
        animationFrameRef.current = requestAnimationFrame(scan)
        return
      }

      ctx.drawImage(video, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      try {
        const results = await readBarcodes(imageData, {
          formats: ['EAN-13', 'EAN-8', 'UPC-A', 'UPC-E']
        })

        if (results.length > 0) {
          const isbn = results[0].text
          if (!isOnCooldown(isbn)) {
            isProcessingRef.current = true
            addToCooldown(isbn)
            setIsLoading(true)
            setLoadingISBN(isbn)

            try {
              await onScanRef.current?.(isbn, {
                setIsLoading,
                addToCooldown,
                removeFromCooldown,
                showToast,
                dismissToast,
                resetProcessing: () => {
                  isProcessingRef.current = false
                }
              })
            } catch (error) {
              console.error('[useBarcodeScanner] Error processing ISBN:', error)
              onErrorRef.current?.(error, isbn)
            } finally {
              setIsLoading(false)
              setLoadingISBN('')
              isProcessingRef.current = false
            }
          } else {
            console.log('[useBarcodeScanner] on cooldown')
          }
        }
      } catch (err) {
        // Ignore decode errors
      }

      animationFrameRef.current = requestAnimationFrame(scan)
    }

    animationFrameRef.current = requestAnimationFrame(scan)
  }, [isOnCooldown, addToCooldown])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play()
          startScanLoop()
        }
      }
      setIsScanning(true)
    } catch (err) {
      console.error('[useBarcodeScanner] Error starting camera:', err)
      onErrorRef.current?.(err)
      setIsScanning(false)
    }
  }, [startScanLoop])

  // Auto-start camera when enabled
  useEffect(() => {
    if (isEnabled) {
      startCamera()
    } else {
      stopCamera()
    }
  }, [isEnabled, startCamera, stopCamera])

  return {
    // Refs to bind to video/canvas elements
    videoRef,
    canvasRef,
    // State
    isScanning,
    isLoading,
    loadingISBN,
    currentToast,
    // Actions
    startCamera,
    stopCamera,
    showToast,
    dismissToast,
    isOnCooldown,
    addToCooldown,
    removeFromCooldown
  }
}
