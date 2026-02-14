import { useEffect, useState } from "react";
import { authUrl, getToken } from "./spotify";
import VinylPlayer from "./components/VinylPlayer";
import AlbumSelector from "./components/AlbumSelector";

export default function App() {
	const [token, setToken] = useState(localStorage.getItem("access_token"));
	const [player, setPlayer] = useState(null);
	const [state, setState] = useState(null);
	const [deviceId, setDeviceId] = useState(null);

	useEffect(() => {
		const code = new URLSearchParams(window.location.search).get("code");
		if (code && !token) {
			getToken(code).then((data) => {
				if (data.access_token) {
					setToken(data.access_token);
					localStorage.setItem("access_token", data.access_token);
					window.history.replaceState({}, document.title, "/");
				}
			});
		}
	}, [token]);

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
			p.addListener("authentication_error", ({ message }) =>
				console.error("❌ Auth Error:", message),
			);
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
			<div className="grid place-items-center bg-[#e8e6e3]">
				<button
					onClick={async () => (window.location.href = await authUrl())}
					className="px-8 py-3 bg-orange-500 text-black font-bold rounded-full hover:scale-110 transition-all duration-300">
					Login with Spotify
				</button>
			</div>
		);
	}

	return (
		<div className="flex bg-[#e8e6e3] gap-2 px-6 min-h-screen overflow-hidden">
			<VinylPlayer
				sdk={player}
				isPlaying={state ? !state.paused : false}
				albumArt={state?.track_window?.current_track?.album?.images[0]?.url}
			/>
			<AlbumSelector token={token} sdk={player} />

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
