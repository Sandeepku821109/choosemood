import { useEffect, useRef, useCallback } from 'react'

export default function SignaturePad({ onChange }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const hasInk = useRef(false)
  const lastPoint = useRef({ x: 0, y: 0 })

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: ((e.clientX ?? e.touches?.[0]?.clientX) - rect.left) * (canvasRef.current.width / rect.width),
      y: ((e.clientY ?? e.touches?.[0]?.clientY) - rect.top) * (canvasRef.current.height / rect.height)
    }
  }

  const start = (e) => {
    e.preventDefault()
    drawing.current = true
    lastPoint.current = getPos(e)
  }

  const move = (e) => {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    const p = getPos(e)
    ctx.strokeStyle = '#111827'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    lastPoint.current = p
    if (!hasInk.current) {
      hasInk.current = true
      onChange && onChange(canvasRef.current.toDataURL('image/png'))
    } else {
      onChange && onChange(canvasRef.current.toDataURL('image/png'))
    }
  }

  const end = () => {
    drawing.current = false
  }

  const clear = useCallback(() => {
    const ctx = canvasRef.current.getContext('2d')
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    hasInk.current = false
    onChange && onChange(null)
  }, [onChange])

  // Expose clear via double-click on the label area is awkward; re-draw on resize not needed.
  useEffect(() => {
    const canvas = canvasRef.current
    canvas.width = canvas.offsetWidth * 2
    canvas.height = canvas.offsetHeight * 2
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  return (
    <div>
      <div className="relative rounded-xl border-2 border-dashed border-gray-300 bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-36 touch-none cursor-crosshair"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
        <span className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm text-gray-300 select-none">
          Sign here
        </span>
      </div>
      <button
        type="button"
        onClick={clear}
        className="mt-2 text-xs font-medium text-gray-500 hover:text-red-600 transition-colors"
      >
        Clear signature
      </button>
    </div>
  )
}
