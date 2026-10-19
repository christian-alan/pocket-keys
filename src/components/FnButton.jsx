/** Function-row tile: octave −/+, chord and hold. A corner light shows toggles that are on. */
export default function FnButton({ fn, active, down, lit, onDown, onUp }) {
  const toggle = fn.id === 'chord' || fn.id === 'hold'

  return (
    <button
      type="button"
      aria-label={fn.aria}
      aria-pressed={toggle ? active : undefined}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      className="fn-tile pk-focus relative flex h-[77px] w-[calc((100%-55px)/12)] shrink-0 flex-col items-center justify-between rounded-[7px] pt-2.5 pb-2"
    >
      <span aria-hidden="true" data-lit={lit} className="dot absolute top-1.5 right-1.5 size-[5px] rounded-full" />
      <span
        aria-hidden="true"
        data-down={down}
        className="fn-cap flex size-[34px] items-center justify-center rounded-full leading-none font-medium transition-[transform,box-shadow] duration-[60ms] ease-out"
        style={{ fontSize: fn.size }}
      >
        {fn.glyph}
      </span>
      <span aria-hidden="true" className="text-[11px] font-medium tracking-[0.03em] text-[var(--fn-label)]">
        {fn.label}
      </span>
    </button>
  )
}
