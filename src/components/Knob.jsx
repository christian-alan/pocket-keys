/** Drag up/down to turn across a 270° sweep; double-click resets. */
export default function Knob({ meta, value, dragging, onStart, onMove, onEnd, onReset, onStep }) {
  const deg = -135 + value * 2.7

  const onKeyDown = (e) => {
    const step = e.shiftKey ? 10 : 2
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') onStep(step)
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') onStep(-step)
    else if (e.key === 'Home') onStep(-100)
    else if (e.key === 'End') onStep(100)
    else return
    e.preventDefault()
  }

  return (
    <button
      type="button"
      role="slider"
      aria-label={meta.label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      onPointerDown={onStart}
      onPointerMove={onMove}
      onPointerUp={onEnd}
      onPointerCancel={onEnd}
      onDoubleClick={onReset}
      onKeyDown={onKeyDown}
      className="knob-well pk-focus absolute top-[47px] size-[72px] cursor-ns-resize touch-none rounded-full"
      style={{ left: meta.x }}
    >
      <span
        className="knob-cap absolute top-1.5 left-1.5 block size-[60px] rounded-full"
        data-accent={!!meta.accent}
        style={{
          transform: `rotate(${deg}deg)`,
          transition: dragging ? 'none' : 'transform 260ms var(--ease-pop)',
        }}
      >
        <span className="knob-dot absolute top-1.5 left-[27px] block size-1.5 rounded-full" />
      </span>
    </button>
  )
}
