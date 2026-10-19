import { KEY_COLORS } from '../lib/music'

/** One note: a square tile with a domed cap that sinks and lights amber while it sounds. */
export default function KeyTile({ index, name, label, down, lit, onDown, onEnter, onUp }) {
  const c = KEY_COLORS[index]

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={lit}
      onPointerDown={onDown}
      onPointerEnter={onEnter}
      onPointerLeave={onUp}
      onPointerUp={onUp}
      data-light={c.light}
      className="key-tile pk-focus relative flex h-[122px] min-w-0 flex-1 flex-col items-center justify-between rounded-[7px] pt-4 pb-2.5 transition-[background] duration-150"
      style={{ background: down ? c.tileDown : c.tile }}
    >
      <span
        aria-hidden="true"
        data-down={down}
        className="key-cap relative block size-10 rounded-full transition-[transform,box-shadow] duration-[60ms] ease-out"
        style={{ background: c.cap }}
      >
        <span data-lit={lit} className="key-led absolute top-1.5 left-[17px] block size-1.5 rounded-full" />
      </span>
      <span aria-hidden="true" className="key-name text-xs font-medium tracking-[0.02em]">
        {name}
      </span>
    </button>
  )
}
