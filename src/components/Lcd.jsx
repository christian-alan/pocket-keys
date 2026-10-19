const SEGMENTS = 12

/** Two-line LCD. `readout` is { l1, l2 } for text or { l1, bar } for a 0–100 meter; null when powered off. */
export default function Lcd({ readout, tags }) {
  const on = !!readout
  const filled = on && readout.bar != null ? Math.round((readout.bar / 100) * SEGMENTS) : 0

  return (
    <div className="lcd-frame absolute top-[30px] left-[136px] h-[106px] w-[232px] rounded-2xl p-2">
      <div
        role="status"
        aria-live="polite"
        className="lcd flex size-full flex-col justify-between rounded-[10px] px-3.5 pt-2.5 pb-3 font-lcd transition-opacity duration-[260ms]"
        style={{ opacity: on ? 1 : 0 }}
      >
        <div className="flex justify-between text-[17px] leading-none tracking-[0.02em]">
          <span>{readout?.l1}</span>
          <span>{tags}</span>
        </div>
        {on && readout.bar != null ? (
          <div className="flex items-center gap-2.5">
            <div className="flex gap-[3px]">
              {Array.from({ length: SEGMENTS }, (_, i) => (
                <span
                  key={i}
                  className="h-[18px] w-2 rounded-[1px] bg-[var(--lcd-ink)]"
                  style={{ opacity: i < filled ? 1 : 0.16 }}
                />
              ))}
            </div>
            <span className="text-[27px] leading-none">{readout.bar}</span>
          </div>
        ) : (
          <div className="overflow-hidden text-[27px] leading-none tracking-[0.04em] whitespace-nowrap">
            {readout?.l2}
          </div>
        )}
      </div>
    </div>
  )
}
