import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createSynth } from '../lib/synth'
import {
  KEY_COUNT, KEY_MAP, KNOBS, OCT_MAX, OCT_MIN, PADS, PAD_MAP,
  degree, freqsFor, noteReadout,
} from '../lib/music'
import Lcd from './Lcd'
import Knob from './Knob'
import KeyTile from './KeyTile'
import FnButton from './FnButton'
import Pad from './Pad'

const LCD_HOLD_MS = 1500
const LED_FLASH_MS = 110

const FUNCTIONS = [
  { id: 'down', glyph: '−', size: 20, label: 'oct', aria: 'Octave down', key: 'z' },
  { id: 'up', glyph: '+', size: 20, label: 'oct', aria: 'Octave up', key: 'x' },
  { id: 'chord', glyph: '3', size: 15, label: 'chord', aria: 'Chord mode', key: 'c' },
  { id: 'hold', glyph: '∞', size: 18, label: 'hold', aria: 'Hold notes', key: 'v' },
]

export default function PocketKeys() {
  const synth = useRef(null)
  if (!synth.current) synth.current = createSynth()

  const [power, setPower] = useState(true)
  const [oct, setOct] = useState(0)
  const [chord, setChord] = useState(false)
  const [hold, setHold] = useState(false)
  const [vals, setVals] = useState({ vol: 70, tone: 55, space: 30 })
  const [keysDown, setKeysDown] = useState(() => new Set())
  const [latched, setLatched] = useState(() => new Set())
  const [padsDown, setPadsDown] = useState(() => new Set())
  const [fnDown, setFnDown] = useState(() => new Set())
  const [dragging, setDragging] = useState(null)
  const [lcd, setLcd] = useState(null)
  const [ledHot, setLedHot] = useState(false)

  // Mutable mirrors so pointer handlers always read the latest values
  const downRef = useRef(new Set())
  const latchRef = useRef(new Set())
  const glide = useRef(false)
  const knobDrag = useRef(null)
  const lcdTimer = useRef(0)
  const ledTimer = useRef(0)
  const live = useRef({ power, oct, chord, hold, vals })
  useLayoutEffect(() => {
    live.current = { power, oct, chord, hold, vals }
  })

  // ---------- feedback ----------
  const showLcd = useCallback((next, sticky = false) => {
    clearTimeout(lcdTimer.current)
    setLcd(next)
    if (!sticky) lcdTimer.current = setTimeout(() => setLcd(null), LCD_HOLD_MS)
  }, [])

  const flash = useCallback(() => {
    clearTimeout(ledTimer.current)
    setLedHot(true)
    ledTimer.current = setTimeout(() => setLedHot(false), LED_FLASH_MS)
  }, [])

  useEffect(() => () => {
    clearTimeout(lcdTimer.current)
    clearTimeout(ledTimer.current)
  }, [])

  // ---------- keys ----------
  const sound = useCallback((i) => {
    const { oct, chord } = live.current
    synth.current.voiceOn(i, freqsFor(i, oct, chord))
    flash()
    showLcd(noteReadout(i, oct, chord))
  }, [flash, showLcd])

  const pressKey = useCallback((i) => {
    if (downRef.current.has(i)) return
    downRef.current.add(i)
    setKeysDown(new Set(downRef.current))
    if (live.current.power) sound(i)
  }, [sound])

  const releaseKey = useCallback((i) => {
    if (!downRef.current.has(i)) return
    downRef.current.delete(i)
    setKeysDown(new Set(downRef.current))
    if (!latchRef.current.has(i)) synth.current.voiceOff(i)
  }, [])

  const toggleLatch = useCallback((i) => {
    downRef.current.add(i)
    setKeysDown(new Set(downRef.current))
    if (!live.current.power) return
    if (latchRef.current.has(i)) {
      latchRef.current.delete(i)
      synth.current.voiceOff(i)
    } else {
      latchRef.current.add(i)
      sound(i)
    }
    setLatched(new Set(latchRef.current))
  }, [sound])

  const keyDown = useCallback((i) => {
    if (live.current.hold) toggleLatch(i)
    else {
      glide.current = true
      pressKey(i)
    }
  }, [pressKey, toggleLatch])

  const keyUp = useCallback((i) => {
    if (live.current.hold) {
      downRef.current.delete(i)
      setKeysDown(new Set(downRef.current))
    } else releaseKey(i)
  }, [releaseKey])

  const keyEnter = useCallback((i) => {
    if (glide.current && !live.current.hold) pressKey(i)
  }, [pressKey])

  // ---------- pads ----------
  const hitPad = useCallback((i) => {
    setPadsDown((s) => new Set(s).add(i))
    if (!live.current.power) return
    synth.current.drum(i)
    flash()
    showLcd({ l1: `Pad ${i + 1}`, l2: PADS[i] })
  }, [flash, showLcd])

  const liftPad = useCallback((i) => {
    setPadsDown((s) => {
      if (!s.has(i)) return s
      const n = new Set(s)
      n.delete(i)
      return n
    })
  }, [])

  // ---------- function row ----------
  const runFn = useCallback((id) => {
    const s = live.current
    if (id === 'down' || id === 'up') {
      const next = Math.max(OCT_MIN, Math.min(OCT_MAX, s.oct + (id === 'up' ? 1 : -1)))
      setOct(next)
      if (s.power) {
        flash()
        showLcd({ l1: 'Octave', l2: `${next > 0 ? '+' : ''}${next}   C${4 + next} - G${5 + next}` })
      }
    } else if (id === 'chord') {
      setChord(!s.chord)
      if (s.power) showLcd({ l1: 'Chord', l2: s.chord ? 'SINGLE NOTES' : 'TRIADS ON' })
    } else if (id === 'hold') {
      if (s.hold) {
        for (const k of latchRef.current) synth.current.voiceOff(k)
      }
      latchRef.current.clear()
      setLatched(new Set(latchRef.current))
      setHold(!s.hold)
      if (s.power) showLcd({ l1: 'Hold', l2: s.hold ? 'LATCH OFF' : 'LATCH ON' })
    }
  }, [flash, showLcd])

  const fnPress = useCallback((id) => {
    setFnDown((s) => new Set(s).add(id))
    runFn(id)
  }, [runFn])

  const fnLift = useCallback((id) => {
    setFnDown((s) => {
      if (!s.has(id)) return s
      const n = new Set(s)
      n.delete(id)
      return n
    })
  }, [])

  // ---------- knobs ----------
  const knobReadout = useCallback((id, value, sticky) => {
    if (!live.current.power) return
    const meta = KNOBS.find((k) => k.id === id)
    showLcd({ l1: meta.label, bar: value }, sticky)
  }, [showLcd])

  const setKnob = useCallback((id, v) => {
    const value = Math.max(0, Math.min(100, Math.round(v)))
    const next = { ...live.current.vals, [id]: value }
    live.current.vals = next
    setVals(next)
    synth.current.setKnobs(next)
    knobReadout(id, value, !!knobDrag.current)
  }, [knobReadout])

  const knobStart = useCallback((id, e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    synth.current.ensure()
    knobDrag.current = { id, y: e.clientY, v: live.current.vals[id] }
    setDragging(id)
    knobReadout(id, live.current.vals[id], true)
  }, [knobReadout])

  const knobMove = useCallback((id, e) => {
    const d = knobDrag.current
    if (!d || d.id !== id) return
    setKnob(id, d.v + (d.y - e.clientY) * 0.55)
  }, [setKnob])

  const knobEnd = useCallback((id) => {
    if (!knobDrag.current) return
    knobDrag.current = null
    setDragging(null)
    knobReadout(id, live.current.vals[id], false)
  }, [knobReadout])

  // ---------- power ----------
  const togglePower = useCallback(() => {
    const next = !live.current.power
    if (!next) synth.current.allOff()
    latchRef.current.clear()
    setLatched(new Set(latchRef.current))
    setPower(next)
    setLcd(null)
    if (next) {
      synth.current.ensure()
      flash()
      showLcd({ l1: 'Hello', l2: 'READY' })
    }
  }, [flash, showLcd])

  // ---------- global release + computer keyboard ----------
  const endAll = useCallback(() => {
    glide.current = false
    for (const k of [...downRef.current]) keyUp(k)
    setPadsDown((s) => (s.size ? new Set() : s))
    setFnDown((s) => (s.size ? new Set() : s))
  }, [keyUp])

  useEffect(() => {
    const up = () => endAll()
    window.addEventListener('pointerup', up)
    window.addEventListener('blur', up)
    return () => {
      window.removeEventListener('pointerup', up)
      window.removeEventListener('blur', up)
    }
  }, [endAll])

  useEffect(() => {
    const target = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return null
      const k = e.key.toLowerCase()
      const key = KEY_MAP.indexOf(k)
      if (key >= 0) return { kind: 'key', i: key }
      const pad = PAD_MAP.indexOf(k)
      if (pad >= 0) return { kind: 'pad', i: pad }
      const fn = FUNCTIONS.find((f) => f.key === k)
      if (fn) return { kind: 'fn', id: fn.id }
      return null
    }
    const down = (e) => {
      const t = target(e)
      if (!t) return
      e.preventDefault()
      if (e.repeat) return
      if (t.kind === 'key') {
        if (live.current.hold) toggleLatch(t.i)
        else pressKey(t.i)
      } else if (t.kind === 'pad') hitPad(t.i)
      else fnPress(t.id)
    }
    const up = (e) => {
      const t = target(e)
      if (!t) return
      if (t.kind === 'key') keyUp(t.i)
      else if (t.kind === 'pad') liftPad(t.i)
      else fnLift(t.id)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [pressKey, toggleLatch, keyUp, hitPad, liftPad, fnPress, fnLift])

  // ---------- render ----------
  const tags = [chord && 'CHD', hold && 'HLD', oct && `O${oct > 0 ? '+' : ''}${oct}`].filter(Boolean).join(' ')
  const readout = !power ? null : lcd ?? { l1: 'Now playing', l2: 'POCKET - KEYS.MP3' }
  const ledState = !power ? 'off' : ledHot ? 'hot' : 'on'
  const fnActive = { chord, hold }

  return (
    <div
      className="chassis relative h-[400px] w-[880px] touch-none select-none overflow-hidden rounded-[46px]"
      onPointerLeave={endAll}
    >
      <svg aria-hidden="true" width="880" height="400" className="grain pointer-events-none absolute inset-0">
        <filter id="pk-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="880" height="400" filter="url(#pk-grain)" />
      </svg>

      {/* Drum pads */}
      <div className="tray absolute top-[30px] left-[36px] flex h-[342px] w-[86px] flex-col justify-between rounded-2xl p-2.5">
        {PADS.map((name, i) => (
          <Pad
            key={name}
            label={`Pad ${i + 1}, ${name.toLowerCase()}`}
            down={padsDown.has(i)}
            onDown={() => hitPad(i)}
            onUp={() => liftPad(i)}
          />
        ))}
      </div>

      <Lcd readout={readout} tags={power ? tags : ''} />

      {KNOBS.map((k) => (
        <Knob
          key={k.id}
          meta={k}
          value={vals[k.id]}
          dragging={dragging === k.id}
          onStart={(e) => knobStart(k.id, e)}
          onMove={(e) => knobMove(k.id, e)}
          onEnd={() => knobEnd(k.id)}
          onReset={() => setKnob(k.id, k.def)}
          onStep={(d) => setKnob(k.id, vals[k.id] + d)}
        />
      ))}

      <span aria-hidden="true" data-state={ledState} className="led absolute top-[78px] left-[718px] size-2.5 rounded-full" />

      <button
        type="button"
        aria-label="Power"
        aria-pressed={power}
        onClick={togglePower}
        data-on={power}
        className="power pk-focus absolute top-[67px] left-[737px] h-8 w-[70px] rounded-[7px]"
      />

      {/* Keyboard bay */}
      <div className="bay absolute top-[156px] left-[136px] flex h-[216px] w-[671px] flex-col gap-[5px] overflow-hidden rounded-[14px] py-1.5">
        <div className="flex h-[122px] gap-[5px]">
          {Array.from({ length: KEY_COUNT }, (_, i) => {
            const n = degree(i, oct)
            return (
              <KeyTile
                key={i}
                index={i}
                name={n.letter}
                label={`${n.letter}${n.octave}`}
                down={keysDown.has(i)}
                lit={power && (keysDown.has(i) || latched.has(i))}
                onDown={(e) => {
                  e.currentTarget.releasePointerCapture?.(e.pointerId)
                  keyDown(i)
                }}
                onEnter={() => keyEnter(i)}
                onUp={() => keyUp(i)}
              />
            )
          })}
        </div>

        <div className="flex h-[77px] gap-[5px]">
          {FUNCTIONS.map((f) => (
            <FnButton
              key={f.id}
              fn={f}
              active={!!fnActive[f.id]}
              down={fnDown.has(f.id)}
              lit={power && (!!fnActive[f.id] || fnDown.has(f.id))}
              onDown={() => fnPress(f.id)}
              onUp={() => fnLift(f.id)}
            />
          ))}

          <div aria-hidden="true" className="grille relative h-[77px] flex-1 rounded-[7px]">
            <div className="fn-tile absolute top-[21px] right-2.5 flex h-[34px] items-center gap-[7px] rounded-full px-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
              <span className="mr-[3px] text-[11px] font-medium tracking-[0.03em] text-[var(--fn-label)]">oct</span>
              {[-2, -1, 0, 1, 2].map((o) => (
                <span key={o} data-lit={power && o === oct} className="dot size-1.5 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
