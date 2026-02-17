import { useState, useEffect, useRef } from "react";
import { useMotionValue } from "framer-motion";
import DeckButton from "./player/DeckButton";
import VinylDisc from "./player/VinylDisc";
import InfoPlate from "./player/InfoPlate";

const RED_BUTTON_CLASS =
  "group relative flex flex-col items-center justify-center w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] md:w-[72px] md:h-[72px] bg-te-red rounded-[10px] sm:rounded-[11px] md:rounded-[12px] shadow-[inset_1.5px_1.5px_2px_rgba(255,255,255,0.2),3.2px_3.2px_8px_rgba(0,0,0,0.4)] active:shadow-[inset_0.5px_0.5px_4px_#000000] active:translate-y-[1px] transition-all active:translate-y-[2px] transition-all";

const GRAY_BUTTON_CLASS =
  "group relative flex flex-col items-center justify-center w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] md:w-[72px] md:h-[72px] bg-gradient-to-b from-[#d4d2cf] to-[#b8b6b3] rounded-[10px] sm:rounded-[11px] md:rounded-[12px] shadow-[inset_1.5px_1.5px_2px_rgba(255,255,255,0.2),3.2px_3.2px_8px_rgba(0,0,0,0.4)] active:shadow-[inset_0.5px_0.5px_4px_#000000] active:translate-y-[1px] transition-all active:translate-y-[2px] transition-all";

const RED_LABEL_CLASS =
  "text-te-gray font-bold text-[7px] sm:text-[7.5px] md:text-[8px] tracking-[0.15em] mb-0.5 sm:mb-1 uppercase";

const GRAY_LABEL_CLASS =
  "text-te-dark font-bold text-[8px] sm:text-[8.5px] md:text-[9px] tracking-[0.15em] mb-1 sm:mb-1.5 uppercase";

const RED_ICON_CLASS =
  "w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 fill-te-gray group-active:scale-90 transition-transform";

const GRAY_ICON_CLASS =
  "w-4 h-4 sm:w-[18px] sm:h-[18px] md:w-5 md:h-5 fill-te-dark group-active:scale-90 transition-transform";

const TOGGLE_LABEL_CLASS =
  "text-te-dark font-bold text-[6.5px] sm:text-[7px] md:text-[7.5px] tracking-[0.12em] mb-1 uppercase text-center leading-tight px-1";

const CORNER_RED_LABEL_CLASS =
  "text-te-gray font-bold text-[6.5px] sm:text-[7px] md:text-[7.5px] tracking-[0.12em] mb-1 uppercase text-center leading-tight px-1";

const CORNER_RED_ICON_CLASS =
  "w-4 h-4 sm:w-[18px] sm:h-[18px] md:w-5 md:h-5 fill-te-gray group-active:scale-90 transition-transform";

const AUTO_SPIN_DEGREES_PER_SECOND = 120;
const SCRATCH_MS_PER_DEGREE = 24;
const SCRATCH_SEEK_THROTTLE_MS = 40;

export default function VinylPlayer({
  sdk,
  token,
  isPlaying,
  albumArt,
  isFullScreen = false,
  isAlbumPickerVisible = true,
  onToggleAlbumPicker,
}) {
  const rotate = useMotionValue(0);
  const [trackInfo, setTrackInfo] = useState(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50); // Volume state (0-100)
  const [isScratching, setIsScratching] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const seekInterval = useRef(null);
  const positionRef = useRef(0);
  const scratchRef = useRef({
    active: false,
    pointerId: null,
    lastAngle: 0,
    lastSeekAt: 0,
  });

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
      setDuration(state.duration);
      if (!scratchRef.current.active) {
        setPosition(state.position);
        positionRef.current = state.position;
      }
    };

    updateTrackInfo();
    const interval = setInterval(updateTrackInfo, 500);
    return () => clearInterval(interval);
  }, [sdk]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // Keep the platter spinning while playing, but let drag fully control rotation.
  useEffect(() => {
    if (!isPlaying || isScratching) return;

    let frameId;
    let lastTimestamp;

    const tick = (timestamp) => {
      if (lastTimestamp !== undefined) {
        const deltaSeconds = (timestamp - lastTimestamp) / 1000;
        rotate.set(rotate.get() + deltaSeconds * AUTO_SPIN_DEGREES_PER_SECOND);
      }
      lastTimestamp = timestamp;
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [isPlaying, isScratching, rotate]);

  // Scratch interaction is mobile-only.
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const update = (event) => {
      setIsMobileViewport(event.matches);
      if (!event.matches) {
        scratchRef.current.active = false;
        scratchRef.current.pointerId = null;
        setIsScratching(false);
      }
    };

    update(mediaQuery);
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (sdk) {
      sdk.setVolume(newVolume / 100); // Spotify SDK expects 0-1
    }
  };

  // Handle fast forward (hold button)
  const startFastForward = () => {
    if (!sdk || seekInterval.current) return;

    seekInterval.current = setInterval(async () => {
      const state = await sdk.getCurrentState();
      if (!state) return;

      const newPos = Math.min(state.duration, state.position + SEEK_STEP);
      sdk.seek(newPos);
      setPosition(newPos);
      positionRef.current = newPos;
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
      positionRef.current = newPos;
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
    const newPosition = Math.round(
      Math.max(0, Math.min(duration, percentage * duration)),
    );

    sdk.seek(newPosition);
    setPosition(newPosition);
    positionRef.current = newPosition;
  };

  const getPointerAngle = (event, element) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return (
      (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) /
      Math.PI
    );
  };

  const normalizeDeltaAngle = (deltaAngle) => {
    let normalized = deltaAngle;
    if (normalized > 180) normalized -= 360;
    if (normalized < -180) normalized += 360;
    return normalized;
  };

  const handleScratchStart = (e) => {
    if (!sdk || !isMobileViewport) return;

    e.preventDefault();
    const pointerAngle = getPointerAngle(e, e.currentTarget);

    scratchRef.current.active = true;
    scratchRef.current.pointerId = e.pointerId;
    scratchRef.current.lastAngle = pointerAngle;
    scratchRef.current.lastSeekAt = 0;
    setIsScratching(true);

    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handleScratchMove = (e) => {
    if (!isMobileViewport) return;
    const scratch = scratchRef.current;
    if (!scratch.active || scratch.pointerId !== e.pointerId) return;

    const pointerAngle = getPointerAngle(e, e.currentTarget);
    const deltaAngle = normalizeDeltaAngle(pointerAngle - scratch.lastAngle);
    scratch.lastAngle = pointerAngle;

    if (!deltaAngle) return;

    rotate.set(rotate.get() + deltaAngle);

    if (!duration) return;

    const nextPosition = Math.round(
      Math.max(
        0,
        Math.min(
          duration,
          positionRef.current + deltaAngle * SCRATCH_MS_PER_DEGREE,
        ),
      ),
    );
    positionRef.current = nextPosition;
    setPosition(nextPosition);

    const now = performance.now();
    if (now - scratch.lastSeekAt >= SCRATCH_SEEK_THROTTLE_MS) {
      scratch.lastSeekAt = now;
      sdk.seek(nextPosition);
    }
  };

  const handleScratchEnd = (e) => {
    if (!isMobileViewport) return;
    const scratch = scratchRef.current;
    if (!scratch.active) return;
    if (scratch.pointerId !== null && scratch.pointerId !== e.pointerId) return;

    const pointerId = scratch.pointerId;
    if (
      pointerId !== null &&
      e.currentTarget.hasPointerCapture &&
      e.currentTarget.hasPointerCapture(pointerId)
    ) {
      e.currentTarget.releasePointerCapture(pointerId);
    }

    scratch.active = false;
    scratch.pointerId = null;
    setIsScratching(false);
    sdk?.seek(Math.round(positionRef.current));
  };

  const handleShuffleLikedSongs = async () => {
    if (!token) return;

    try {
      const shuffleResponse = await fetch(
        "https://api.spotify.com/v1/me/player/shuffle?state=true",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!shuffleResponse.ok) {
        throw new Error(
          `Failed to enable shuffle mode (${shuffleResponse.status})`,
        );
      }

      const playResponse = await fetch(
        "https://api.spotify.com/v1/me/player/play",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ context_uri: "spotify:collection" }),
        },
      );

      if (!playResponse.ok) {
        throw new Error(
          `Failed to start shuffled liked songs playback (${playResponse.status})`,
        );
      }
    } catch (error) {
      console.error("❌ Shuffle liked songs failed:", error);
    }
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
    <div
      className={`flex flex-col items-center justify-center w-full bg-[#e8e6e3] ${
        isFullScreen ? "min-h-screen" : "min-h-full"
      }`}
    >
      {/* EP-133 Case - Textured Grey Metal */}
      <div className='flex flex-col items-center relative bg-gradient-to-b from-[#c4c2bf] to-[#a8a6a3] p-4 sm:p-8 md:p-17 rounded-[20px] sm:rounded-[28px] md:rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.3),_inset_0_1px_0_rgba(255,255,255,0.3)] border border-[#8a8885] w-full max-w-[95vw] sm:max-w-full'>
        {/* Top edge highlight */}
        <div className='absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-t-[20px] sm:rounded-t-[28px] md:rounded-t-[32px]' />
        <div className='absolute top-3 left-3 sm:top-4 sm:left-4 md:top-4 md:left-4 z-10'>
          <DeckButton
            label='Shuffle'
            iconPath='M4 4h5L7 6h6a4 4 0 0 1 4 4v1h-2v-1a2 2 0 0 0-2-2H7l2 2H4V4zm16 16h-5l2-2h-6a4 4 0 0 1-4-4v-1h2v1a2 2 0 0 0 2 2h6l-2-2h5v6z'
            buttonClassName={RED_BUTTON_CLASS}
            labelClassName={CORNER_RED_LABEL_CLASS}
            iconClassName={CORNER_RED_ICON_CLASS}
            ariaLabel='Shuffle liked songs'
            onClick={handleShuffleLikedSongs}
            disabled={!token}
          />
        </div>
        <div className='absolute top-3 right-3 sm:top-4 sm:right-4 md:top-4 md:right-4 z-10'>
          <DeckButton
            label={isAlbumPickerVisible ? "Hide Albums" : "Show Albums"}
            iconPath={
              isAlbumPickerVisible
                ? "M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"
                : "M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12z"
            }
            buttonClassName={GRAY_BUTTON_CLASS}
            labelClassName={TOGGLE_LABEL_CLASS}
            iconClassName={GRAY_ICON_CLASS}
            ariaLabel={
              isAlbumPickerVisible ? "Hide album picker" : "Show album picker"
            }
            ariaPressed={isAlbumPickerVisible}
            onClick={onToggleAlbumPicker}
          />
        </div>

        <div className='flex flex-col sm:flex-row items-center gap-4 sm:gap-6 md:gap-8'>
          {/* LEFT SIDE - PREV TRACK & REWIND */}
          <div className='hidden sm:flex items-center gap-2 sm:gap-3'>
            <DeckButton
              label='Prev'
              iconPath='M6 6h2v12H6zm3.5 6L18 18V6z'
              buttonClassName={RED_BUTTON_CLASS}
              labelClassName={RED_LABEL_CLASS}
              iconClassName={RED_ICON_CLASS}
              onClick={() => sdk?.previousTrack()}
            />

            <DeckButton
              label='Rewind'
              iconPath='M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z'
              buttonClassName={GRAY_BUTTON_CLASS}
              labelClassName={GRAY_LABEL_CLASS}
              iconClassName={GRAY_ICON_CLASS}
              onMouseDown={startRewind}
              onMouseUp={stopSeeking}
              onMouseLeave={stopSeeking}
              onTouchStart={startRewind}
              onTouchEnd={stopSeeking}
            />
          </div>

          {/* VINYL TURNTABLE */}
          <VinylDisc
            rotate={rotate}
            isPlaying={isPlaying}
            albumArt={albumArt}
            isScratching={isScratching}
            isScratchEnabled={isMobileViewport}
            onTogglePlay={() => sdk?.togglePlay()}
            onScratchStart={handleScratchStart}
            onScratchMove={handleScratchMove}
            onScratchEnd={handleScratchEnd}
          />

          {/* RIGHT SIDE - FAST FORWARD & NEXT TRACK */}
          <div className='hidden sm:flex items-center gap-2 sm:gap-3'>
            <DeckButton
              label='FF'
              iconPath='M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z'
              buttonClassName={GRAY_BUTTON_CLASS}
              labelClassName={GRAY_LABEL_CLASS}
              iconClassName={GRAY_ICON_CLASS}
              onMouseDown={startFastForward}
              onMouseUp={stopSeeking}
              onMouseLeave={stopSeeking}
              onTouchStart={startFastForward}
              onTouchEnd={stopSeeking}
            />
            <DeckButton
              label='Next'
              iconPath='M6 18l8.5-6L6 6zm9 0h2V6h-2z'
              buttonClassName={RED_BUTTON_CLASS}
              labelClassName={RED_LABEL_CLASS}
              iconClassName={RED_ICON_CLASS}
              onClick={() => sdk?.nextTrack()}
            />
          </div>

          <div className='sm:hidden flex items-center gap-2'>
            <DeckButton
              label='Prev'
              iconPath='M6 6h2v12H6zm3.5 6L18 18V6z'
              buttonClassName={RED_BUTTON_CLASS}
              labelClassName={RED_LABEL_CLASS}
              iconClassName={RED_ICON_CLASS}
              onClick={() => sdk?.previousTrack()}
            />
            <DeckButton
              label='Next'
              iconPath='M6 18l8.5-6L6 6zm9 0h2V6h-2z'
              buttonClassName={RED_BUTTON_CLASS}
              labelClassName={RED_LABEL_CLASS}
              iconClassName={RED_ICON_CLASS}
              onClick={() => sdk?.nextTrack()}
            />
          </div>
        </div>

        <InfoPlate
          trackInfo={trackInfo}
          position={position}
          duration={duration}
          progress={progress}
          volume={volume}
          onProgressClick={handleProgressClick}
          onVolumeChange={handleVolumeChange}
          formatTime={formatTime}
        />

        {/* Bottom edge shadow */}
        <div className='absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-black/20 to-transparent rounded-b-[20px] sm:rounded-b-[28px] md:rounded-b-[32px]' />
      </div>

      {/* Status Display - EP-133 Style */}
      <div className='mt-3 sm:mt-4 md:mt-5 flex flex-col items-center gap-1.5 sm:gap-2'>
        <div className='flex items-center gap-2 sm:gap-2.5 md:gap-3 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 bg-[#2a2826] rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] border border-[#1a1816]'>
          <div
            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isPlaying ? "bg-[#ff4438] animate-pulse" : "bg-te-red"} shadow-[0_0_8px_currentColor]`}
          />
          <span className='text-[#e8e6e3] text-[9px] sm:text-[10px] font-bold tracking-[0.25em] sm:tracking-[0.3em] uppercase'>
            {isPlaying ? "Recording" : "Standby"}
          </span>
        </div>
        <span className='text-[#8a8885] text-[7px] sm:text-[8px] font-medium tracking-[0.2em] sm:tracking-[0.25em] uppercase'>
          Teenage Engineering Vinyl Player
        </span>
      </div>
    </div>
  );
}
