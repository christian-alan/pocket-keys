// Notes, controls and colour helpers for Pocket Keys.

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const STEPS = [0, 2, 4, 5, 7, 9, 11]
const QUALITY = ['', 'm', 'm', '', '', 'm', 'dim']

export const KEY_COUNT = 12
export const OCT_MIN = -2
export const OCT_MAX = 2

export const PADS = ['KICK', 'SNARE', 'HAT', 'CLAP']

export const KNOBS = [
  { id: 'vol', label: 'Volume', def: 70, x: 415 },
  { id: 'tone', label: 'Tone', def: 55, x: 513, accent: true },
  { id: 'space', label: 'Space', def: 30, x: 613 },
]

// Computer keyboard: one row for the 12 keys, digits for pads
export const KEY_MAP = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']']
export const PAD_MAP = ['1', '2', '3', '4']

/** Scale degree d (0 = C4) shifted by `oct` octaves → pitch info. */
export function degree(d, oct = 0) {
  const o = Math.floor(d / 7)
  const s = ((d % 7) + 7) % 7
  const midi = 60 + 12 * (o + oct) + STEPS[s]
  return {
    letter: LETTERS[s],
    octave: 4 + o + oct,
    freq: 440 * Math.pow(2, (midi - 69) / 12),
    quality: QUALITY[s],
  }
}

/** Single note, or a diatonic triad (root, third, fifth) in chord mode. */
export function freqsFor(i, oct, chord) {
  const degs = chord ? [i, i + 2, i + 4] : [i]
  return degs.map((d) => degree(d, oct).freq)
}

export function noteReadout(i, oct, chord) {
  const n = degree(i, oct)
  if (chord) {
    const third = degree(i + 2).letter
    const fifth = degree(i + 4).letter
    return { l1: 'Chord', l2: `${n.letter}${n.quality}  ${n.letter}-${third}-${fifth}` }
  }
  return { l1: 'Note', l2: `${n.letter}${n.octave}  ${Math.round(n.freq)} HZ` }
}

// Tonal ramp across the keyboard: warm charcoal → clay → sand → cream
const RAMP = ['#2B2825', '#4A403A', '#7A5A44', '#A9876A', '#CDBDA4', '#EAE0CA', '#F4EDD8']

const hex = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16))
export const rgb = (c) => `rgb(${c.map((v) => Math.round(v)).join(',')})`
export const shade = (c, amt) => c.map((v) => (amt > 0 ? v + (255 - v) * amt : v * (1 + amt)))
export const luminance = (c) => (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255

export function rampColor(p) {
  const x = p * (RAMP.length - 1)
  const i = Math.min(Math.floor(x), RAMP.length - 2)
  const f = x - i
  const a = hex(RAMP[i])
  const b = hex(RAMP[i + 1])
  return a.map((v, k) => v + (b[k] - v) * f)
}

/** Precomputed colours for each key tile. */
export const KEY_COLORS = Array.from({ length: KEY_COUNT }, (_, i) => {
  const base = rampColor(i / (KEY_COUNT - 1))
  const light = luminance(base) > 0.55
  return {
    light,
    tile: rgb(base),
    tileDown: rgb(shade(base, light ? -0.05 : 0.06)),
    cap: `radial-gradient(circle at 40% 30%, ${rgb(shade(base, 0.16))} 0%, ${rgb(base)} 62%, ${rgb(shade(base, -0.12))} 100%)`,
  }
})
