// A tiny Web Audio synth: triangle + sine voices, four synthesised drums,
// a low-pass "tone" filter and a generated reverb "space". No samples.

export function createSynth() {
  let ac = null
  let master, filter, wet, noise
  const voices = new Map()
  let knobs = { vol: 70, tone: 55, space: 30 }

  function ensure() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return null
      ac = new AC()
      master = ac.createGain()
      filter = ac.createBiquadFilter()
      filter.type = 'lowpass'
      filter.Q.value = 0.7
      wet = ac.createGain()

      const verb = ac.createConvolver()
      const len = Math.floor(ac.sampleRate * 2.2)
      const ir = ac.createBuffer(2, len, ac.sampleRate)
      for (let c = 0; c < 2; c++) {
        const d = ir.getChannelData(c)
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)
      }
      verb.buffer = ir

      noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate)
      const nd = noise.getChannelData(0)
      for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1

      filter.connect(master)
      filter.connect(verb)
      verb.connect(wet)
      wet.connect(master)
      master.connect(ac.destination)
      apply()
    }
    if (ac.state === 'suspended') ac.resume()
    return ac
  }

  function apply() {
    if (!ac) return
    const t = ac.currentTime
    master.gain.setTargetAtTime(Math.pow(knobs.vol / 100, 2) * 0.9, t, 0.02)
    filter.frequency.setTargetAtTime(260 * Math.pow(2, (knobs.tone / 100) * 6.2), t, 0.02)
    wet.gain.setTargetAtTime((knobs.space / 100) * 0.85, t, 0.03)
  }

  function setKnobs(next) {
    knobs = next
    apply()
  }

  function voiceOn(id, freqs) {
    if (!ensure()) return
    voiceOff(id, true)
    const t = ac.currentTime
    const g = ac.createGain()
    const peak = 0.45 / Math.sqrt(freqs.length)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(peak, t + 0.006)
    g.gain.exponentialRampToValueAtTime(peak * 0.4, t + 0.45)
    g.connect(filter)
    const oscs = []
    for (const f of freqs) {
      const o1 = ac.createOscillator()
      o1.type = 'triangle'
      o1.frequency.value = f
      const o2 = ac.createOscillator()
      o2.type = 'sine'
      o2.frequency.value = f * 2
      const g2 = ac.createGain()
      g2.gain.value = 0.22
      o1.connect(g)
      o2.connect(g2)
      g2.connect(g)
      o1.start(t)
      o2.start(t)
      oscs.push(o1, o2)
    }
    voices.set(id, { g, oscs })
  }

  function voiceOff(id, fast = false) {
    const v = voices.get(id)
    if (!v || !ac) return
    const t = ac.currentTime
    const r = fast ? 0.03 : 0.38
    v.g.gain.cancelScheduledValues(t)
    v.g.gain.setValueAtTime(Math.max(v.g.gain.value, 0.0001), t)
    v.g.gain.exponentialRampToValueAtTime(0.0001, t + r)
    v.oscs.forEach((o) => o.stop(t + r + 0.02))
    voices.delete(id)
  }

  function allOff() {
    for (const id of [...voices.keys()]) voiceOff(id)
  }

  function noiseHit(t, type, freq, level, dur) {
    const s = ac.createBufferSource()
    s.buffer = noise
    const f = ac.createBiquadFilter()
    f.type = type
    f.frequency.value = freq
    const g = ac.createGain()
    g.gain.setValueAtTime(level, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    s.connect(f)
    f.connect(g)
    g.connect(filter)
    s.start(t)
    s.stop(t + dur + 0.02)
  }

  function tone(t, type, from, to, level, dur) {
    const o = ac.createOscillator()
    const g = ac.createGain()
    o.type = type
    o.frequency.setValueAtTime(from, t)
    if (to !== from) o.frequency.exponentialRampToValueAtTime(to, t + dur * 0.33)
    g.gain.setValueAtTime(level, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g)
    g.connect(filter)
    o.start(t)
    o.stop(t + dur + 0.03)
  }

  function drum(i) {
    if (!ensure()) return
    const t = ac.currentTime
    if (i === 0) {
      tone(t, 'sine', 150, 42, 1, 0.42) // kick
    } else if (i === 1) {
      noiseHit(t, 'highpass', 1400, 0.6, 0.2) // snare
      tone(t, 'triangle', 190, 190, 0.5, 0.1)
    } else if (i === 2) {
      noiseHit(t, 'highpass', 7500, 0.32, 0.06) // hat
    } else {
      for (let k = 0; k < 3; k++) noiseHit(t + k * 0.011, 'bandpass', 1500, 0.55, 0.03) // clap
      noiseHit(t + 0.033, 'bandpass', 1300, 0.5, 0.18)
    }
  }

  return { ensure, setKnobs, voiceOn, voiceOff, allOff, drum }
}
