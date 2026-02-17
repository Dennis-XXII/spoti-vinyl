import { useEffect, useState } from "react";
import { authUrl, getToken, getValidToken } from "./spotify";
import VinylPlayer from "./components/VinylPlayer";
import AlbumSelector from "./components/AlbumSelector";
import { AnimatePresence, motion } from "framer-motion";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("access_token"));
  const [player, setPlayer] = useState(null);
  const [state, setState] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isAlbumPickerVisible, setIsAlbumPickerVisible] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setIsAlbumPickerVisible(false);
    }
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (code && !token) {
      getToken(code).then((data) => {
        if (data.access_token) {
          setToken(data.access_token);
          window.history.replaceState({}, document.title, "/");
        }
      });
    }
  }, [token]);

  // Check and refresh token periodically
  useEffect(() => {
    const checkAndRefreshToken = async () => {
      const validToken = await getValidToken();
      if (validToken && validToken !== token) {
        setToken(validToken);

        // Update player with new token if it exists
        if (player) {
          player._options.getOAuthToken = (cb) => cb(validToken);
        }
      } else if (!validToken) {
        // Token refresh failed, redirect to login
        window.location.href = await authUrl();
      }
    };

    if (token) {
      checkAndRefreshToken();

      // Check token validity every 10 minutes
      const interval = setInterval(checkAndRefreshToken, 10 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [token, player]);

  useEffect(() => {
    if (!token) return;

    // 1. Define the callback before the script loads
    window.onSpotifyWebPlaybackSDKReady = () => {
      const p = new window.Spotify.Player({
        name: "Vinyl Web Player",
        getOAuthToken: (cb) => {
          cb(token);
        },
        volume: 0.5,
      });

      // 2. Add full error listeners to catch connection blocks
      p.addListener("initialization_error", ({ message }) =>
        console.error("❌ Init Error:", message),
      );
      p.addListener("authentication_error", ({ message }) => {
        console.error("❌ Auth Error:", message);
        // Try to refresh token on auth error
        getValidToken().then((validToken) => {
          if (validToken) {
            setToken(validToken);
          }
        });
      });
      p.addListener("account_error", ({ message }) =>
        console.error("❌ Account Error:", message),
      );

      p.addListener("ready", ({ device_id }) => {
        console.log("✅ Device Ready:", device_id);
        setDeviceId(device_id);

        // 3. Auto-transfer playback
        fetch("https://api.spotify.com/v1/me/player", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ device_ids: [device_id], play: true }),
        });
      });

      p.addListener("player_state_changed", (s) => {
        if (!s) return;
        setState(s);
      });

      p.connect().then((success) => {
        if (success) console.log("✅ SDK successfully connected!");
      });

      setPlayer(p);
    };

    // 4. Load the script
    if (!document.getElementById("spotify-player")) {
      const script = document.createElement("script");
      script.id = "spotify-player";
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [token]);

  if (!token) {
    return (
      <div className='flex min-h-screen place-items-center bg-[#e8e6e3]'>
        <div className='max-w-xl my-auto text-center flex flex-col mx-auto gap-4 place-items-center'>
          <h1 className='text-2xl font-bold font-teenage'>
            {" "}
            Teenage Engineering IE133
            <br /> Vinyl Player
          </h1>
          <button
            onClick={async () => (window.location.href = await authUrl())}
            className='max-w-[300px] px-8 py-3 bg-[#2a2826] text-te-red px-6 py-4 rounded-[12px] font-mono text-sm tracking-widest outline-none border-b-4 border-[#1a1816] shadow-inner uppercase'
          >
            Login_with_Spotify...
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='relative min-h-screen bg-[#e8e6e3] overflow-hidden'>
      <motion.div
        className={`grid min-h-screen w-full ${
          isAlbumPickerVisible
            ? "gap-4 p-2 sm:p-4 md:p-6 grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(320px,1fr)]"
            : "gap-0 px-2 sm:px-4 md:px-6 grid-cols-1"
        }`}
      >
        <section
          className={`flex items-center justify-center ${
            isAlbumPickerVisible
              ? "min-h-[75vh] lg:min-h-[calc(100vh-3rem)]"
              : "min-h-screen"
          }`}
        >
          <VinylPlayer
            sdk={player}
            token={token}
            isPlaying={state ? !state.paused : false}
            albumArt={state?.track_window?.current_track?.album?.images[0]?.url}
            isFullScreen={!isAlbumPickerVisible}
            isAlbumPickerVisible={isAlbumPickerVisible}
            onToggleAlbumPicker={() => setIsAlbumPickerVisible((prev) => !prev)}
          />
        </section>

        <AnimatePresence initial={false}>
          {isAlbumPickerVisible && (
            <motion.aside
              key='album-picker'
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className='flex min-h-[25vh] lg:min-h-[calc(100vh-3rem)] items-center justify-center'
            >
              <AlbumSelector token={token} sdk={player} />
            </motion.aside>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Visual Debug Footer 
			<div className="fixed bottom-6 w-full text-center flex flex-col gap-2 pointer-events-none">
				<div className="flex justify-center gap-4">
					<span
						className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${deviceId ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
						{deviceId ? "Device Active" : "Searching for Device..."}
					</span>
				</div>
				{state && (
					<div className="animate-in fade-in slide-in-from-bottom-2">
						<h2 className="text-white font-medium">
							{state.track_window.current_track.name}
						</h2>
						<p className="text-zinc-500 text-xs">
							{state.track_window.current_track.artists[0].name}
						</p>
					</div>
				)}
			</div>*/}
    </div>
  );
}
