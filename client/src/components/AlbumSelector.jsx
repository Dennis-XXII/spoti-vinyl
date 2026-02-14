import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AlbumSelector({ token, sdk }) {
	const [albums, setAlbums] = useState([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [currentPage, setCurrentPage] = useState(0);
	const ALBUMS_PER_PAGE = 6;

	useEffect(() => {
		// Stop if token is null or undefined
		if (!token) return;

		const fetchAlbums = async () => {
			try {
				const response = await fetch(
					"https://api.spotify.com/v1/me/albums?limit=50",
					{
						method: "GET",
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
					},
				);

				if (!response.ok) {
					const errorDetails = await response.json();
					console.error("❌ Spotify API Error Details:", errorDetails);
					return;
				}

				const data = await response.json();

				// Sort A-Z by album name
				const sortedAlbums = data.items
					.map((item) => item.album)
					.sort((a, b) => a.name.localeCompare(b.name));

				setAlbums(sortedAlbums);
			} catch (err) {
				console.error("❌ Network Error:", err);
			}
		};

		fetchAlbums();
	}, [token]);

	// Filtering logic for Search
	const filteredAlbums = albums.filter(
		(album) =>
			album.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			album.artists[0].name.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const pageCount = Math.ceil(filteredAlbums.length / ALBUMS_PER_PAGE);
	const displayedAlbums = filteredAlbums.slice(
		currentPage * ALBUMS_PER_PAGE,
		(currentPage + 1) * ALBUMS_PER_PAGE,
	);

	const playAlbum = async (uri) => {
		if (!sdk || !token) return;
		try {
			await fetch(`https://api.spotify.com/v1/me/player/play`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ context_uri: uri }),
			});
		} catch (err) {
			console.error("❌ Playback Error:", err);
		}
	};

	return (
		<div className="flex flex-col items-center justify-center gap-8 px-12 bg-[#e8e6e3] font-['Space_Grotesk']">
			{/* SEARCH PANEL */}
			<div className="w-full max-3xl bg--color-te-orange p-6 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.1),_inset_0_1px_0_white/40] border border-[#8a8885]">
				<input
					type="text"
					placeholder="SEARCH_YOUR_SPOTIFY_ALBUMS/ARTISTS..."
					value={searchQuery}
					onChange={(e) => {
						setSearchQuery(e.target.value);
						setCurrentPage(0);
					}}
					className="w-full bg-[#2a2826] text-[#ff4438] placeholder-[#ff4438]/40 px-6 py-4 rounded-[12px] font-mono text-sm tracking-widest outline-none border-b-4 border-[#1a1816] shadow-inner uppercase"
				/>
			</div>

			{/* ALBUM GRID */}
			<div className="grid grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-4xl max-h-[400px]">
				{displayedAlbums.length > 0 ? (
					displayedAlbums.map((album) => (
						<motion.button
							key={album.id}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							onClick={() => playAlbum(album.uri)}
							className="group relative flex flex-col items-center p-4 bg-[#d4d2cf] rounded-[24px] shadow-[0_2px_0_#8a8889,_0_8px_12px_rgba(0,0,0,0.2),_inset_0_1px_0_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_#8a8885,_0_4px_8px_rgba(0,0,0,0.2),_inset_0_1px_0_rgba(255,255,255,0.5)] active:translate-y-[2px] transition-all border border-white/20">
							<div className="w-full aspect-square mb-4 overflow-hidden rounded-[12px] bg-[#2a2826]">
								<img
									src={album.images[0].url}
									alt={album.name}
									className="w-full h-full rounded-[12px] object-cover"
								/>
							</div>
							<div className="w-full text-left">
								<div className="text-[#2a2826] text-[11px] font-bold uppercase truncate">
									{album.name}
								</div>
								<div className="text-[#ff4438] text-[9px] font-bold uppercase tracking-widest mt-1 truncate">
									{album.artists[0].name}
								</div>
							</div>
						</motion.button>
					))
				) : (
					<div className="col-span-full text-center text-[#8a8885] font-bold uppercase tracking-widest">
						No Albums Found / Check Scopes
					</div>
				)}
			</div>

			{/* PAGINATION */}
			<div className="flex items-center gap-6">
				<button
					disabled={currentPage === 0}
					onClick={() => setCurrentPage((p) => p - 1)}
					className="w-[56px] h-[56px] bg-[#d4d2cf] rounded-[12px] shadow-[0_2px_0_#8a8889,_0_8px_12px_rgba(0,0,0,0.2),_inset_0_1px_0_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_#8a8885,_0_4px_8px_rgba(0,0,0,0.2),_inset_0_1px_0_rgba(255,255,255,0.5)] active:translate-y-[2px] transition-all border border-white/20">
					<svg className="w-5 h-5 fill-[#2a2826]" viewBox="0 0 24 24">
						<path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
					</svg>
				</button>
				<button
					disabled={currentPage >= pageCount - 1}
					onClick={() => setCurrentPage((p) => p + 1)}
					className="w-[56px] h-[56px] bg-[#d4d2cf] rounded-[12px] shadow-[0_2px_0_#8a8889,_0_8px_12px_rgba(0,0,0,0.2),_inset_0_1px_0_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_#8a8885,_0_4px_8px_rgba(0,0,0,0.2),_inset_0_1px_0_rgba(255,255,255,0.5)] active:translate-y-[2px] transition-all border border-white/20">
					<svg className="w-5 h-5 fill-[#2a2826]" viewBox="0 0 24 24">
						<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
					</svg>
				</button>
			</div>
		</div>
	);
}
