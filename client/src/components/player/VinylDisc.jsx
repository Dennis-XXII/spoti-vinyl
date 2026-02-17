import { motion } from "framer-motion";

export default function VinylDisc({
  rotate,
  isPlaying,
  albumArt,
  isScratching,
  isScratchEnabled,
  onTogglePlay,
  onScratchStart,
  onScratchMove,
  onScratchEnd,
}) {
  return (
    <div className='relative'>
      <div className='absolute inset-0 bg-gradient-to-b from-[#1a1816] to-[#0d0b0a] rounded-full blur-xl opacity-50' />

      <div className='relative p-3 sm:p-4 md:p-5 bg-gradient-to-b from-[#3a3836] to-[#2a2826] rounded-full shadow-[inset_0_4px_12px_rgba(0,0,0,0.6),_0_4px_20px_rgba(0,0,0,0.4)]'>
        <div className='absolute inset-2 sm:inset-2.5 md:inset-3 rounded-full border-[1.5px] sm:border-2 border-[#1a1816]/40' />

        <motion.div
          style={{ rotate, touchAction: isScratchEnabled ? "none" : "auto" }}
          className={`w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full bg-gradient-to-br from-[#1a1816] to-[#0a0908] flex items-center justify-center relative overflow-hidden shadow-[0_0_0_3px_#0a0908,_inset_0_2px_8px_rgba(0,0,0,0.8)] ${
            isScratchEnabled
              ? isScratching
                ? "cursor-grabbing"
                : "cursor-grab"
              : "cursor-default"
          }`}
          onPointerDown={isScratchEnabled ? onScratchStart : undefined}
          onPointerMove={isScratchEnabled ? onScratchMove : undefined}
          onPointerUp={isScratchEnabled ? onScratchEnd : undefined}
          onPointerCancel={isScratchEnabled ? onScratchEnd : undefined}
        >
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className='absolute inset-0 rounded-full border border-white/[0.02]'
              style={{
                margin: `${(i + 1) * 10}px`,
                boxShadow: "0 0 1px rgba(255,255,255,0.03)",
              }}
            />
          ))}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}
            className='relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full overflow-hidden z-20 shadow-[0_0_0_4px_#0a0908,_0_0_20px_rgba(0,0,0,0.6),_inset_0_2px_4px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-[0.98] transition-transform group border-2 border-[#1a1816]'
          >
            {albumArt ? (
              <>
                <img src={albumArt} alt='Album Cover' className='w-full h-full object-cover' />
                <div className='absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20 pointer-events-none' />
                <div className='absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors'>
                  <div className='w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                    {isPlaying ? (
                      <svg
                        className='w-4 h-4 sm:w-[18px] sm:h-[18px] md:w-5 md:h-5 fill-white'
                        viewBox='0 0 24 24'
                      >
                        <path d='M6 4h4v16H6zm8 0h4v16h-4z' />
                      </svg>
                    ) : (
                      <svg
                        className='w-4 h-4 sm:w-[18px] sm:h-[18px] md:w-5 md:h-5 fill-white ml-0.5'
                        viewBox='0 0 24 24'
                      >
                        <path d='M8 5v14l11-7z' />
                      </svg>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className='w-full h-full bg-gradient-to-br from-[#ff4438] to-[#cc3326] flex items-center justify-center'>
                <span className='text-white text-[10px] sm:text-[11px] md:text-xs font-bold tracking-[0.2em] uppercase'>
                  No Track
                </span>
              </div>
            )}
          </button>

          <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
            <div className='w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#0a0908] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8),_0_0_0_1px_#1a1816]' />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
