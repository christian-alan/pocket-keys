/** Rubbery drum pad. */
export default function Pad({ label, down, onDown, onUp }) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      data-down={down}
      className="pad pk-focus h-[74px] w-[66px] rounded-[9px] transition-[transform,box-shadow,background] duration-[60ms]"
    />
  )
}
