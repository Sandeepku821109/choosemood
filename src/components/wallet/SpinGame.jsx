import React, { useState, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Gift,
  Loader2,
  Trophy,
  Truck,
  RotateCcw,
  Copy,
  Check,
  Clock,
  Sparkles,
  Info
} from 'lucide-react'
import { fetchSpinStatus, playSpinGame, clearSpinResult } from '../../store/slices/walletSlice'

const SEGMENTS = [
  { id: 'CASH_4', label: '₹4', type: 'CASH' },
  { id: 'FREE_DELIVERY', label: 'FREE', sub: 'DELIVERY', type: 'FREE_DELIVERY' },
  { id: 'CASH_8', label: '₹8', type: 'CASH' },
  { id: 'TRY_AGAIN', label: 'TRY', sub: 'AGAIN', type: 'TRY_AGAIN' },
  { id: 'CASH_6', label: '₹6', type: 'CASH' },
  { id: 'CASH_9', label: '₹9', type: 'CASH' }
]

const SEG_ANGLE = 360 / SEGMENTS.length

// Wheel segment palette (ink + gold luxury theme)
const SEGMENT_COLORS = ['#14110f', '#a67a36', '#211d1a', '#3b342e', '#cdab60', '#5a4027']
const SEGMENT_TEXT = ['#eaddb8', '#faf8f4', '#eaddb8', '#cfcac1', '#14110f', '#f5efdc']

const polar = (cx, cy, r, angleDeg) => {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

const wedgePath = (cx, cy, r, a1, a2) => {
  const [x1, y1] = polar(cx, cy, r, a1)
  const [x2, y2] = polar(cx, cy, r, a2)
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`
}

const formatExpiry = (dateString) =>
  new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

const SpinGame = ({ onError }) => {
  const dispatch = useDispatch()
  const spinState = useSelector(state => state.wallet?.spin || {})
  const balance = useSelector(state => state.wallet?.balance ?? 0)
  const { canPlay, activeRewards = [], spinning, result } = spinState

  const [rotation, setRotation] = useState(0)
  const [phase, setPhase] = useState('idle') // idle | animating | revealing
  const [countdown, setCountdown] = useState(null)
  const [copiedCode, setCopiedCode] = useState(null)

  // Fetch status on mount and whenever a result is cleared
  useEffect(() => {
    dispatch(fetchSpinStatus())
    return () => dispatch(clearSpinResult())
  }, [dispatch])

  // Ticking countdown to midnight when today's spin is used up
  useEffect(() => {
    if (canPlay || phase !== 'idle') {
      setCountdown(null)
      return
    }
    const tick = () => {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)
      setCountdown(midnight.getTime() - now.getTime())
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [canPlay, phase])

  // Auto-refresh status when the countdown hits zero
  useEffect(() => {
    if (countdown !== null && countdown <= 0 && phase === 'idle') {
      dispatch(fetchSpinStatus())
    }
  }, [countdown, phase, dispatch])

  const prizeIndex = useMemo(() => {
    if (!result?.prize?.id) return -1
    return SEGMENTS.findIndex(s => s.id === result.prize.id)
  }, [result])

  const animateWheelToPrize = () =>
    new Promise((resolve) => {
      if (prizeIndex < 0) return resolve()
      const jitter = (Math.random() - 0.5) * (SEG_ANGLE * 0.5)
      const targetCenter = prizeIndex * SEG_ANGLE + SEG_ANGLE / 2
      const targetMod = (360 - targetCenter - jitter + 720) % 360
      const currentMod = ((rotation % 360) + 360) % 360
      let delta = targetMod - currentMod
      if (delta <= 0) delta += 360

      setRotation(r => r + 5 * 360 + delta)
      setTimeout(resolve, 4300)
    })

  const handleSpin = async () => {
    if (!canPlay || spinning || phase !== 'idle') return
    setPhase('animating')

    try {
      // Server decides the prize first; the wheel animation follows it
      await dispatch(playSpinGame()).unwrap()
      await animateWheelToPrize()
      setPhase('revealing')
      // Refresh wallet balance + coupons behind the modal
      dispatch(fetchSpinStatus())
    } catch (err) {
      setPhase('idle')
      onError?.(typeof err === 'string' ? err : err?.message || 'Spin failed. Please try again.')
    }
  }

  const closeResult = () => {
    setPhase('idle')
    dispatch(clearSpinResult())
  }

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch {
      onError?.('Could not copy the code. Please copy it manually.')
    }
  }

  const hours = countdown !== null ? Math.floor(countdown / 3600000) : 0
  const minutes = countdown !== null ? Math.floor((countdown % 3600000) / 60000) : 0
  const seconds = countdown !== null ? Math.floor((countdown % 60000) / 1000) : 0

  const cx = 110
  const cy = 110
  const R = 104

  const busy = spinning || phase === 'animating'
  const disabled = !canPlay || busy || phase === 'revealing'

  return (
    <div className="bg-ink-950 rounded-2xl shadow-xl overflow-hidden relative">
      {/* Ambient glow */}
      <div className="absolute -top-24 right-0 w-72 h-72 rounded-full bg-gold-500/10 blur-3xl pointer-events-none"></div>

      <div className="relative p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles size={16} className="text-gold-400" />
              <h3 className="text-xs font-bold uppercase tracking-[0.28em] text-gold-300">
                Daily Spin & Win
              </h3>
            </div>
            <p className="text-ink-300 text-sm font-light leading-relaxed max-w-xs">
              One free spin every day. Win wallet cash or free delivery — winnings are valid for 7 days.
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-ink-400 text-[11px] uppercase tracking-widest">Wallet</p>
            <p className="font-serif text-xl text-gold-300 font-semibold">₹{Number(balance || 0).toFixed(2)}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-[auto_1fr] gap-8 items-center justify-center">
          {/* Wheel */}
          <div className="mx-auto relative w-[240px] h-[240px] sm:w-[260px] sm:h-[260px] select-none">
            {/* Pointer */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-1 z-20" style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.45))' }}>
              <div className="w-0 h-0 border-l-[11px] border-r-[11px] border-t-[18px] border-l-transparent border-r-transparent border-t-gold-300"></div>
            </div>

            {/* Rotating wheel */}
            <svg
              viewBox="0 0 220 220"
              className={`w-full h-full drop-shadow-2xl ${busy ? '' : ''}`}
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: busy ? 'transform 4.2s cubic-bezier(0.12, 0.75, 0.18, 1)' : 'none'
              }}
            >
              <circle cx={cx} cy={cy} r={R + 6} fill="#0a0808" />
              <circle cx={cx} cy={cy} r={R + 3} fill="none" stroke="#cdab60" strokeWidth="1.5" opacity="0.7" />

              {SEGMENTS.map((seg, i) => {
                const a1 = i * SEG_ANGLE
                const a2 = a1 + SEG_ANGLE
                const mid = a1 + SEG_ANGLE / 2
                const [lx, ly] = polar(cx, cy, R * 0.63, mid)
                return (
                  <g key={seg.id}>
                    <path d={wedgePath(cx, cy, R, a1, a2)} fill={SEGMENT_COLORS[i]} stroke="#0a0808" strokeWidth="1" />
                    <g transform={`rotate(${mid}, ${lx}, ${ly})`}>
                      <text
                        x={lx}
                        y={ly}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={SEGMENT_TEXT[i]}
                        fontSize={seg.type === 'CASH' ? '22' : '12'}
                        fontWeight="800"
                        fontFamily="Georgia, serif"
                        letterSpacing="1"
                      >
                        {seg.label}
                        {seg.sub && (
                          <tspan x={lx} dy="13" fontSize="9.5" letterSpacing="1.5">{seg.sub}</tspan>
                        )}
                      </text>
                    </g>
                  </g>
                )
              })}

              {/* Hub */}
              <circle cx={cx} cy={cy} r="26" fill="#0a0808" stroke="#cdab60" strokeWidth="1.5" />
              <circle cx={cx} cy={cy} r="19" fill="none" stroke="#a67a36" strokeWidth="0.75" opacity="0.6" />
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="#eaddb8" fontSize="9" fontWeight="700" letterSpacing="2" style={{ textTransform: 'uppercase' }}>
                SPIN
              </text>
            </svg>
          </div>

          {/* Action panel */}
          <div className="flex flex-col items-center sm:items-start gap-4">
            <button
              onClick={handleSpin}
              disabled={disabled}
              className={`btn-luxury relative inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-full text-sm font-bold uppercase tracking-[0.18em] transition-all duration-500 ${
                canPlay && !busy
                  ? 'bg-gradient-to-r from-gold-300 via-gold-500 to-gold-700 text-ink-950 shadow-xl shadow-gold-600/25 hover:shadow-gold-500/40 hover:scale-[1.03]'
                  : 'bg-white/5 text-ink-400 ring-1 ring-white/10 cursor-not-allowed'
              }`}
            >
              {busy ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Spinning...
                </>
              ) : canPlay ? (
                <>
                  <Gift size={17} />
                  Spin Now
                </>
              ) : (
                <>
                  <Clock size={16} />
                  Next Spin In
                </>
              )}
            </button>

            {!canPlay && countdown !== null && countdown > 0 && (
              <div className="flex items-center gap-2 text-ink-200 font-mono text-lg tabular-nums">
                {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                <span className="font-sans text-xs text-ink-400 tracking-wide">until your next spin</span>
              </div>
            )}

            <div className="flex items-start gap-2 text-ink-500 text-xs leading-relaxed max-w-xs">
              <Info size={13} className="mt-0.5 shrink-0" />
              <span>One spin per day per account. Cash prizes are added to this wallet and expire 7 days after winning if unused.</span>
            </div>
          </div>
        </div>

        {/* Active free delivery coupons */}
        {activeRewards.length > 0 && (
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold uppercase tracking-[0.28em] text-gold-300 flex items-center gap-2">
                <Truck size={14} />
                Your Coupons
              </h4>
              <span className="text-[11px] text-ink-500">Apply at checkout</span>
            </div>
            <ul className="space-y-2.5">
              {activeRewards.map(reward => (
                <li key={reward.code} className="flex flex-wrap items-center justify-between gap-3 bg-white/5 ring-1 ring-white/10 hover:ring-gold-500/30 rounded-xl px-4 py-3 transition-all duration-300">
                  <div className="min-w-0">
                    <p className="font-mono font-bold text-sm text-gold-200 tracking-wider">{reward.code}</p>
                    <p className="text-[11px] text-ink-400 mt-0.5 flex items-center gap-1.5">
                      <Truck size={11} className="text-[#E72744]" />
                      Free delivery • expires {formatExpiry(reward.expiresAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => copyCode(reward.code)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-widest text-ink-900 bg-gold-300 hover:bg-gold-200 transition-colors duration-300"
                  >
                    {copiedCode === reward.code ? <Check size={13} /> : <Copy size={13} />}
                    {copiedCode === reward.code ? 'Copied' : 'Copy'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Result Modal */}
      {phase === 'revealing' && result?.prize && (
        <div className="fixed inset-0 z-[60] bg-ink-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={closeResult}>
          <div
            className="bg-cream rounded-3xl max-w-sm w-full p-8 text-center relative overflow-hidden animate-slide-up shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-gold-700 via-gold-300 to-gold-700"></div>

            {result.prize.type === 'CASH' && (
              <>
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gradient-to-br from-gold-300 to-gold-700 flex items-center justify-center shadow-lg">
                  <Trophy size={28} className="text-ink-950" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-700 mb-2">You Won</p>
                <p className="font-serif text-6xl font-bold text-ink-950 mb-2">₹{result.prize.value}</p>
                <p className="text-sm text-ink-400 font-light mb-1">credited to your wallet</p>
                <p className="text-xs text-red-700/80 bg-red-50 inline-block px-3 py-1 rounded-full mt-2">
                  Expires in 7 days if unused
                </p>
              </>
            )}

            {result.prize.type === 'FREE_DELIVERY' && (
              <>
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gradient-to-br from-[#FF9DAC] to-[#C81E38] flex items-center justify-center shadow-lg">
                  <Truck size={28} className="text-white" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#AE1830] mb-2">Free Delivery Unlocked</p>
                <p className="font-mono text-2xl font-bold text-ink-950 tracking-widest bg-ink-50 ring-1 ring-ink-200 rounded-xl px-4 py-3 my-4">
                  {result.prize.couponCode}
                </p>
                <p className="text-sm text-ink-400 font-light">Use this code at checkout — valid for 7 days</p>
                <button
                  onClick={() => copyCode(result.prize.couponCode)}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest bg-ink-950 text-cream hover:bg-ink-800 transition-colors duration-300"
                >
                  {copiedCode === result.prize.couponCode ? <Check size={14} /> : <Copy size={14} />}
                  {copiedCode === result.prize.couponCode ? 'Copied!' : 'Copy Code'}
                </button>
              </>
            )}

            {result.prize.type === 'TRY_AGAIN' && (
              <>
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-ink-100 flex items-center justify-center">
                  <RotateCcw size={28} className="text-ink-400" />
                </div>
                <p className="font-serif text-3xl font-semibold text-ink-900 mb-2">So close!</p>
                <p className="text-sm text-ink-400 font-light">
                  No win this time — come back tomorrow for another free spin.
                </p>
              </>
            )}

            <button
              onClick={closeResult}
              className="mt-7 w-full py-3 rounded-full text-xs font-bold uppercase tracking-[0.2em] bg-ink-950 text-cream hover:bg-ink-800 transition-colors duration-300"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SpinGame
