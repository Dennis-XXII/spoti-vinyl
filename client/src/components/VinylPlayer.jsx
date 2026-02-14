import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue } from "framer-motion";

export default function VinylPlayer({ sdk, isPlaying, albumArt }) {
	const rotate = useMotionValue(0);
	const [trackInfo, setTrackInfo] = useState(null);
	const [position, setPosition] = useState(0);
	const [duration, setDuration] = useState(0);
	const isDragging = useRef(false);
	const seekInterval = useRef(null);

	// Seek amount per interval (in ms)
	const SEEK_STEP = 1000; // 1 second per 100ms interval
	const SEEK_INTERVAL_MS = 100;

	// Fetch track info and update position
	useEffect(() => {
		if (!sdk) return;

		const updateTrackInfo = async () => {
			const state = await sdk.getCurrentState();
			if (!state || !state.track_window?.current_track) return;

			const track = state.track_window.current_track;
			setTrackInfo({
				name: track.name,
				artist: track.artists.map((a) => a.name).join(", "),
				album: track.album.name,
			});
			setPosition(state.position);
			setDuration(state.duration);
		};

		updateTrackInfo();
		const interval = setInterval(updateTrackInfo, 500);
		return () => clearInterval(interval);
	}, [sdk]);

	// Handle fast forward (hold button)
	const startFastForward = () => {
		if (!sdk || seekInterval.current) return;

		seekInterval.current = setInterval(async () => {
			const state = await sdk.getCurrentState();
			if (!state) return;

			const newPos = Math.min(state.duration, state.position + SEEK_STEP);
			sdk.seek(newPos);
			setPosition(newPos);
		}, SEEK_INTERVAL_MS);
	};

	// Handle rewind (hold button)
	const startRewind = () => {
		if (!sdk || seekInterval.current) return;

		seekInterval.current = setInterval(async () => {
			const state = await sdk.getCurrentState();
			if (!state) return;

			const newPos = Math.max(0, state.position - SEEK_STEP);
			sdk.seek(newPos);
			setPosition(newPos);
		}, SEEK_INTERVAL_MS);
	};

	// Stop seeking when button is released
	const stopSeeking = () => {
		if (seekInterval.current) {
			clearInterval(seekInterval.current);
			seekInterval.current = null;
		}
	};

	// Cleanup on unmount
	useEffect(() => {
		return () => stopSeeking();
	}, []);

	// Handle progress bar click to seek
	const handleProgressClick = (e) => {
		if (!sdk || !duration) return;

		const rect = e.currentTarget.getBoundingClientRect();
		const clickX = e.clientX - rect.left;
		const percentage = clickX / rect.width;
		const newPosition = Math.max(0, Math.min(duration, percentage * duration));

		sdk.seek(newPosition);
		setPosition(newPosition);
	};

	// Format time helper
	const formatTime = (ms) => {
		const seconds = Math.floor(ms / 1000);
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const progress = duration > 0 ? (position / duration) * 100 : 0;

	return (
		<div className="flex flex-col items-center justify-center bg-[#e8e6e3] font-['Space_Grotesk',_'Helvetica_Neue',_sans-serif]">
			{/* EP-133 Case - Textured Grey Metal */}
			<div className="relative bg-gradient-to-b from-[#c4c2bf] to-[#a8a6a3] p-12 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.3),_inset_0_1px_0_rgba(255,255,255,0.3)] border border-[#8a8885]">
				{/* Top edge highlight */}
				<div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-t-[32px]" />

				<div className="flex items-center gap-8">
					{/* LEFT SIDE - PREV TRACK & REWIND */}
					<div className="flex items-center gap-3">
						{/* PREV TRACK BUTTON */}
						<button
							onClick={() => sdk?.previousTrack()}
							className="group relative flex flex-col items-center justify-center w-[72px] h-[72px] bg-gradient-to-bl from-[#ff4438] to-[#ff6b5e] rounded-[12px] shadow-[0_3px_0_#8a8885,_0_8px_12px_rgba(0,0,0,0.2),_inset_0_1px_0_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_#8a8885,_0_4px_8px_rgba(0,0,0,0.2),_inset_0_1px_0_rgba(255,255,255,0.5)] active:translate-y-[2px] transition-all border-t border-white/30">
							<span className="text-[#2a2826] font-bold text-[8px] tracking-[0.15em] mb-1 uppercase">
								Prev
							</span>
							<svg
								className="w-4 h-4 fill-[#2a2826] group-active:scale-90 transition-transform"
								viewBox="0 0 24 24">
								<path d="M6 6h2v12H6zm3.5 6L18 18V6z" />
							</svg>
						</button>

						{/* REWIND BUTTON (Hold to seek backward) */}
						<button
							onMouseDown={startRewind}
							onMouseUp={stopSeeking}
							onMouseLeave={stopSeeking}
							onTouchStart={startRewind}
							onTouchEnd={stopSeeking}
							className="group relative flex flex-col items-center justify-center w-[72px] h-[72px] bg-gradient-to-b from-[#d4d2cf] to-[#b8b6b3] rounded-[12px] shadow-[0_3px_0_#8a8885,_0_8px_12px_rgba(0,0,0,0.2),_inset_0_1px_0_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_#8a8885,_0_4px_8px_rgba(0,0,0,0.2),_inset_0_1px_0_rgba(255,255,255,0.5)] active:translate-y-[2px] transition-all border-t border-white/30">
							<span className="text-[#2a2826] font-bold text-[9px] tracking-[0.15em] mb-1.5 uppercase">
								Rewind
							</span>
							<svg
								className="w-5 h-5 fill-[#2a2826] group-active:scale-90 transition-transform"
								viewBox="0 0 24 24">
								<path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
							</svg>
						</button>
					</div>

					{/* VINYL TURNTABLE */}
					<div className="relative">
						{/* Turntable Base */}
						<div className="absolute inset-0 bg-gradient-to-b from-[#1a1816] to-[#0d0b0a] rounded-full blur-xl opacity-50" />

						<div className="relative p-5 bg-gradient-to-b from-[#3a3836] to-[#2a2826] rounded-full shadow-[inset_0_4px_12px_rgba(0,0,0,0.6),_0_4px_20px_rgba(0,0,0,0.4)]">
							{/* Platter Ring */}
							<div className="absolute inset-3 rounded-full border-2 border-[#1a1816]/40" />

							<motion.div
								style={{ rotate }}
								className="w-80 h-80 rounded-full bg-gradient-to-br from-[#1a1816] to-[#0a0908] flex items-center justify-center relative overflow-hidden shadow-[0_0_0_3px_#0a0908,_inset_0_2px_8px_rgba(0,0,0,0.8)]"
								animate={
									isPlaying
										? { rotate: rotate.get() + 360 }
										: { rotate: rotate.get() } // Stay at current position when paused
								}
								transition={
									isPlaying
										? { repeat: Infinity, duration: 3, ease: "linear" }
										: { duration: 0 } // No transition when paused, stay exactly where it is
								}>
								{/* Vinyl Grooves - Subtle concentric circles */}
								{[...Array(12)].map((_, i) => (
									<div
										key={i}
										className="absolute inset-0 rounded-full border border-white/[0.02]"
										style={{
											margin: `${(i + 1) * 10}px`,
											boxShadow: "0 0 1px rgba(255,255,255,0.03)",
										}}
									/>
								))}

								{/* CENTER LABEL - Natural Album Art */}
								<button
									onClick={(e) => {
										e.stopPropagation();
										sdk?.togglePlay();
									}}
									className="relative w-36 h-36 rounded-full overflow-hidden z-20 shadow-[0_0_0_4px_#0a0908,_0_0_20px_rgba(0,0,0,0.6),_inset_0_2px_4px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-[0.98] transition-transform group border-2 border-[#1a1816]">
									{albumArt ? (
										<>
											{/* Album Art - Full Color */}
											<img
												src={albumArt}
												alt="Album Cover"
												className="w-full h-full object-cover"
											/>
											{/* Subtle overlay for depth */}
											<div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20 pointer-events-none" />
											{/* Play/Pause Indicator */}
											<div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
												<div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
													{isPlaying ? (
														<svg
															className="w-5 h-5 fill-white"
															viewBox="0 0 24 24">
															<path d="M6 4h4v16H6zm8 0h4v16h-4z" />
														</svg>
													) : (
														<svg
															className="w-5 h-5 fill-white ml-0.5"
															viewBox="0 0 24 24">
															<path d="M8 5v14l11-7z" />
														</svg>
													)}
												</div>
											</div>
										</>
									) : (
										<div className="w-full h-full bg-gradient-to-br from-[#ff4438] to-[#cc3326] flex items-center justify-center">
											<span className="text-white text-xs font-bold tracking-[0.2em] uppercase">
												No Track
											</span>
										</div>
									)}
								</button>

								{/* Spindle Hole */}
								<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
									<div className="w-3 h-3 rounded-full bg-[#0a0908] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8),_0_0_0_1px_#1a1816]" />
								</div>
							</motion.div>
						</div>
					</div>

					{/* RIGHT SIDE - FAST FORWARD & NEXT TRACK */}
					<div className="flex items-center gap-3">
						{/* FAST FORWARD BUTTON (Hold to seek forward) */}
						<button
							onMouseDown={startFastForward}
							onMouseUp={stopSeeking}
							onMouseLeave={stopSeeking}
							onTouchStart={startFastForward}
							onTouchEnd={stopSeeking}
							className="group relative flex flex-col items-center justify-center w-[72px] h-[72px] bg-gradient-to-b from-70% from-[#d4d2cf] to-[#b8b6b3] rounded-[12px] shadow-[0_3px_0_#8a8885,_0_8px_12px_rgba(0,0,0,0.2),_inset_0_1px_0_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_#8a8885,_0_4px_8px_rgba(0,0,0,0.2),_inset_0_1px_0_rgba(255,255,255,0.5)] active:translate-y-[2px] transition-all border-t border-white/30">
							<span className="text-[#2a2826] font-bold text-[9px] tracking-[0.15em] mb-1.5 uppercase">
								FF
							</span>
							<svg
								className="w-5 h-5 fill-[#2a2826] group-active:scale-90 transition-transform"
								viewBox="0 0 24 24">
								<path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
							</svg>
						</button>

						{/* NEXT TRACK BUTTON */}
						<button
							onClick={() => sdk?.nextTrack()}
							className="group relative flex flex-col items-center justify-center w-[72px] h-[72px] bg-gradient-to-br from-[#ff4438] to-[#ff6b5e] rounded-[12px] shadow-[0_3px_0_#8a8885,_0_8px_12px_rgba(0,0,0,0.2),_inset_0_1px_0_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_#8a8885,_0_4px_8px_rgba(0,0,0,0.2),_inset_0_1px_0_rgba(255,255,255,0.5)] active:translate-y-[2px] transition-all border-t border-white/30">
							<span className="text-[#2a2826] font-bold text-[8px] tracking-[0.15em] mb-1 uppercase">
								Next
							</span>
							<svg
								className="w-4 h-4 fill-[#2a2826] group-active:scale-90 transition-transform"
								viewBox="0 0 24 24">
								<path d="M6 18l8.5-6L6 6zm9 0h2V6h-2z" />
							</svg>
						</button>
					</div>
				</div>

				{/* TRACK INFORMATION & PROGRESS */}
				<div className="flex flex-col items-center justify-self-center mt-8 gap-3 w-full max-w-md">
					{/* Track Info */}
					{trackInfo && (
						<div className="flex flex-col items-center gap-1.5 text-center">
							<span className="text-[#2a2826] text-sm font-bold tracking-wide truncate max-w-md">
								{trackInfo.name}
							</span>
							<span className="text-[#6a6866] text-xs font-medium tracking-wide truncate max-w-md">
								{trackInfo.artist}
							</span>
							<span className="text-[#8a8885] text-[10px] font-medium tracking-wider uppercase truncate max-w-md">
								{trackInfo.album}
							</span>
						</div>
					)}

					{/* Progress Bar - Clickable */}
					<div className="w-full px-4">
						<div className="flex items-center gap-3">
							<span className="text-[#6a6866] text-[9px] font-mono tabular-nums">
								{formatTime(position)}
							</span>
							<div
								onClick={handleProgressClick}
								className="flex-1 h-1.5 bg-[#3a3836] rounded-full overflow-hidden shadow-inner cursor-pointer hover:h-2 transition-all group">
								<div
									className="h-full bg-gradient-to-r from-[#ff4438] to-[#ff6b5e] rounded-full transition-all duration-300 shadow-[0_0_4px_rgba(255,68,56,0.5)] group-hover:shadow-[0_0_8px_rgba(255,68,56,0.8)]"
									style={{ width: `${progress}%` }}
								/>
							</div>
							<span className="text-[#6a6866] text-[9px] font-mono tabular-nums">
								{formatTime(duration)}
							</span>
						</div>
					</div>
				</div>

				{/* Bottom edge shadow */}
				<div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-black/20 to-transparent rounded-b-[32px]" />
			</div>

			{/* Status Display - EP-133 Style */}
			<div className="mt-5 flex flex-col items-center gap-2">
				<div className="flex items-center gap-3 px-6 py-2.5 bg-[#2a2826] rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] border border-[#1a1816]">
					<div
						className={`w-2 h-2 rounded-full ${isPlaying ? "bg-[#ff4438] animate-pulse" : "bg-[#6a6866]"} shadow-[0_0_8px_currentColor]`}
					/>
					<span className="text-[#e8e6e3] text-[10px] font-bold tracking-[0.3em] uppercase">
						{isPlaying ? "Recording" : "Standby"}
					</span>
				</div>
				<span className="text-[#8a8885] text-[8px] font-medium tracking-[0.25em] uppercase">
					Teenage Engineering Vinyl Player
				</span>
			</div>

			{/* Add Space Grotesk font */}
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
			`}</style>
		</div>
	);
}
