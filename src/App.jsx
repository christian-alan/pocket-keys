import PocketKeys from './components/PocketKeys'

export default function App() {
  return (
    <main className="stage grid min-h-full place-items-center overflow-hidden px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] font-sans">
      <div className="flex flex-col items-center gap-11">
        <div className="device-scale">
          <PocketKeys />
        </div>
        <p className="max-w-[640px] text-center text-sm tracking-[0.01em] text-balance text-[var(--hint)]">
          Play or glide across the keys · shift octaves, play chords, hold notes · drag a knob, double-click to reset · tap the pads
          <span className="mt-1.5 hidden text-xs opacity-80 md:block">
            Keyboard: Q–] keys · 1–4 pads · Z / X octave · C chord · V hold
          </span>
        </p>
      </div>
    </main>
  )
}
