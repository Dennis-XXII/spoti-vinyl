export default function InfoPlate({
  trackInfo,
  position,
  duration,
  progress,
  volume,
  onProgressClick,
  onVolumeChange,
  formatTime,
}) {
  return (
    <div className='flex flex-col items-center justify-self-center mt-4 sm:mt-6 md:mt-8 gap-2 sm:gap-2.5 md:gap-3 w-full max-w-[78vw] sm:max-w-sm'>
      {trackInfo && (
        <div className='flex flex-col items-center gap-1 sm:gap-1.5 text-center'>
          <span className='w-full text-[#2a2826] text-sm font-bold tracking-wide overflow-hidden text-ellipsis whitespace-nowrap max-w-[66vw] sm:max-w-[19rem] px-1'>
            {trackInfo.name}
          </span>
          <span className='w-full text-[#6a6866] text-[12px] sm:text-xs font-medium tracking-wide overflow-hidden text-ellipsis whitespace-nowrap max-w-[66vw] sm:max-w-[19rem] px-1'>
            {trackInfo.artist}
          </span>
          <span className='w-full text-[#8a8885] text-[10px] sm:text-[10px] font-medium tracking-wider uppercase overflow-hidden text-ellipsis whitespace-nowrap max-w-[66vw] sm:max-w-[19rem] px-1'>
            {trackInfo.album}
          </span>
        </div>
      )}

      <div className='w-full px-2 sm:px-3 md:px-4'>
        <div className='flex items-center gap-2 sm:gap-2.5 md:gap-3'>
          <span className='text-[#6a6866] text-[8px] sm:text-[9px] font-mono tabular-nums'>
            {formatTime(position)}
          </span>
          <div
            onClick={onProgressClick}
            className='flex-1 h-1.5 bg-[#3a3836] rounded-full overflow-hidden shadow-inner cursor-pointer hover:h-2 transition-all group'
          >
            <div
              className='h-full bg-gradient-to-r from-te-orange to-te-red rounded-full transition-all duration-300 shadow-[0_0_4px_rgba(255,68,56,0.5)] group-hover:shadow-[0_0_8px_rgba(255,68,56,0.8)]'
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className='text-[#6a6866] text-[8px] sm:text-[9px] font-mono tabular-nums'>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      <div className='w-full max-w-xs px-2 sm:px-3 md:px-4 mt-1 sm:mt-2'>
        <div className='flex items-center gap-2 sm:gap-2.5 md:gap-3'>
          <svg
            className='w-3 h-3 sm:w-3.5 sm:h-3.5 fill-[#6a6866]'
            viewBox='0 0 24 24'
          >
            <path d='M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z' />
          </svg>

          <input
            type='range'
            min='0'
            max='100'
            value={volume}
            onChange={onVolumeChange}
            className='flex-1 h-1.5 bg-[#3a3836] rounded-full justify-center appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-3
                  [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-gradient-to-r
                  [&::-webkit-slider-thumb]:from-te-orange
                  [&::-webkit-slider-thumb]:to-te-red
                  [&::-webkit-slider-thumb]:shadow-[0_0_4px_rgba(255,68,56,0.5)]
                  [&::-webkit-slider-thumb]:hover:shadow-[0_0_8px_rgba(255,68,56,0.8)]
                  [&::-webkit-slider-thumb]:transition-all
                  [&::-moz-range-thumb]:w-3
                  [&::-moz-range-thumb]:h-3
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-gradient-to-r
                  [&::-moz-range-thumb]:from-te-orange
                  [&::-moz-range-thumb]:to-te-red
                  [&::-moz-range-thumb]:border-0
                  [&::-moz-range-thumb]:shadow-[0_0_4px_rgba(255,68,56,0.5)]
                  [&::-moz-range-thumb]:hover:shadow-[0_0_8px_rgba(255,68,56,0.8)]
                  [&::-moz-range-thumb]:transition-all'
            style={{
              background: `linear-gradient(to right, #ff4438 0%, #ff4438 ${volume}%, #3a3836 ${volume}%, #3a3836 100%)`,
            }}
          />

          <svg
            className='w-3 h-3 sm:w-3.5 sm:h-3.5 fill-[#6a6866]'
            viewBox='0 0 24 24'
          >
            <path d='M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z' />
          </svg>
        </div>
      </div>
    </div>
  );
}
