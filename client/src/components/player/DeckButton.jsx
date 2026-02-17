export default function DeckButton({
  label,
  iconPath,
  buttonClassName,
  labelClassName,
  iconClassName,
  ariaLabel,
  ariaPressed,
  onClick,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  onTouchStart,
  onTouchEnd,
  disabled = false,
}) {
  return (
    <div className='p-[2px] sm:p-[2.5px] bg-[#0a0a0a] rounded-[5px] flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.3)]'>
      <button
        disabled={disabled}
        aria-label={ariaLabel}
        aria-pressed={ariaPressed}
        onClick={onClick}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className={buttonClassName}
      >
        <span className={labelClassName}>{label}</span>
        <svg className={iconClassName} viewBox='0 0 24 24'>
          <path d={iconPath} />
        </svg>
      </button>
    </div>
  );
}
