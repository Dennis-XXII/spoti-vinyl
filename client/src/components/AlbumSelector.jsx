import { useState, useEffect } from "react";
import { motion } from "framer-motion";

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
    <div className="relative flex flex-col my-auto items-center justify-center gap-4 sm:gap-6 md:gap-6 p-4 sm:p-8 md:p-12 bg-gradient-to-b from-[#c4c2bf] to-[#a8a6a3] rounded-[20px] sm:rounded-[28px] md:rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.3),_inset_0_1px_0_rgba(255,255,255,0.3)] border border-[#8a8885] w-full max-w-lg lg:max-w-none mx-auto h-full max-h-[calc(100vh-3rem)] overflow-y-auto overflow-x-hidden">
      <div className='absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-t-[20px] sm:rounded-t-[28px] md:rounded-t-[32px]' />

      {/* SEARCH PANEL */}
      <div className='w-full max-w-3xl bg-te-gray p-3 sm:p-4 md:p-6 rounded-[16px] sm:rounded-[20px] md:rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.1),_inset_0_1px_0_white/40] border border-[#8a8885]'>
        <input
          type='text'
          placeholder='SEARCH_YOUR_ALBUMS/ARTISTS...'
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(0);
          }}
          className='w-full bg-[#2a2826] text-[#ff4438] placeholder-[#ff4438]/40 px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 rounded-[8px] sm:rounded-[10px] md:rounded-[12px] font-mono text-xs sm:text-sm tracking-widest outline-none border-b-2 sm:border-b-3 md:border-b-4 border-[#1a1816] shadow-inner uppercase'
        />
      </div>

      {/* ALBUM GRID */}
      <div className='grid grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 md:gap-6 w-full max-w-4xl'>
        {displayedAlbums.length > 0 ? (
          displayedAlbums.map((album, index) => (
            <motion.button
              key={album.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => playAlbum(album.uri)}
              className='group relative flex flex-col items-center transition-all'
            >
              {/* Vinyl Record */}
              <div className='relative w-full max-w-[120px] aspect-square mb-2 sm:mb-3 md:mb-4 md:hover:scale-[1.2] hover:rotate-360 active:scale-[0.97] transition-ease-in-out duration-600'>
                <div className='absolute inset-0 rounded-full bg-gradient-to-br from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] shadow-[0_0_0_3px_#0a0908,_inset_0_2px_8px_rgba(0,0,0,0.8)] group-active:shadow-[0_2px_8px_rgba(0,0,0,0.4)] group-active:translate-y-[2px] transition-all cursor-pointer'>
                  {/* Vinyl grooves effect - Subtle concentric circles */}
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className='absolute inset-0 rounded-full border border-white/[0.02]'
                      style={{
                        margin: `${(i + 1) * 4}%`,
                        boxShadow: "0 0 1px rgba(255,255,255,0.03)",
                      }}
                    />
                  ))}

                  {/* Center label with album art */}
                  <div className='absolute inset-[20%] rounded-full overflow-hidden shadow-[0_0_0_4px_#0a0908,_0_0_20px_rgba(0,0,0,0.6),_inset_0_2px_4px_rgba(255,255,255,0.1)] border-2 border-[#1a1816]'>
                    <img
                      src={album.images[0].url}
                      alt={album.name}
                      className='w-full h-full object-cover'
                    />
                    {/* Subtle overlay for depth */}
                    <div className='absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20 pointer-events-none' />
                  </div>
                </div>
              </div>

              {/* Album info */}
              <div className='w-full text-center'>
                <div className='text-[#2a2826] text-[9px] sm:text-[10px] md:text-[11px] font-bold uppercase truncate'>
                  {album.name}
                </div>
                <div className='text-[#ff4438] text-[8px] sm:text-[8.5px] md:text-[9px] font-bold uppercase tracking-widest mt-0.5 sm:mt-1 truncate'>
                  {album.artists[0].name}
                </div>
              </div>
            </motion.button>
          ))
        ) : (
          <div className='col-span-full text-center text-[#8a8885] font-bold uppercase tracking-widest text-xs sm:text-sm'>
            No Albums Found / Check Scopes
          </div>
        )}
      </div>

      {/* PAGINATION */}
      <div className='flex items-center gap-3 sm:gap-4 md:gap-6'>
        <div className='w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] md:w-[72px] md:h-[72px] bg-[#0a0a0a] rounded-[5px] flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.3)]'>
          {/* THE BUTTON */}
          <button
            disabled={currentPage === 0}
            onClick={() => setCurrentPage((p) => p - 1)}
            className='w-[52px] h-[52px] sm:w-[60px] sm:h-[60px] md:w-[67px] md:h-[67px] bg-te-gray rounded-[8px] sm:rounded-[9px] md:rounded-[10px] 
                   shadow-[inset_1.5px_1.5px_2px_rgba(255,255,255,0.2),3.2px_3.2px_8px_rgba(0,0,0,0.4)]
                   active:shadow-[inset_0.5px_0.5px_4px_#000000] 
                   active:translate-y-[1px] transition-all 
                   flex flex-col items-center justify-center
                   disabled:opacity-60 disabled:cursor-not-allowed group'
          >
            <span className='text-te-dark font-teenage text-[8px] sm:text-[8.5px] md:text-[9px] tracking-widest uppercase mb-0.5 sm:mb-1 opacity-80 group-active:scale-95'>
              Prev
            </span>
            <svg
              className='w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 fill-te-dark group-active:scale-90 transition-transform'
              viewBox='0 0 24 24'
            >
              <path d='M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z' />
            </svg>
          </button>
        </div>
        <div className='w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] md:w-[72px] md:h-[72px] bg-[#0a0a0a] rounded-[5px] flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.3)]'>
          <button
            disabled={currentPage >= pageCount - 1}
            onClick={() => setCurrentPage((p) => p + 1)}
            className='w-[52px] h-[52px] sm:w-[60px] sm:h-[60px] md:w-[67px] md:h-[67px] bg-te-gray rounded-[8px] sm:rounded-[9px] md:rounded-[10px] 
                   shadow-[inset_1.5px_1.5px_2px_rgba(255,255,255,0.2),3.2px_3.2px_8px_rgba(0,0,0,0.4)]
                   active:shadow-[inset_0.5px_0.5px_4px_#000000] 
                   active:translate-y-[1px] transition-all 
                   flex flex-col items-center justify-center
                   disabled:opacity-60 disabled:cursor-not-allowed group'
          >
            <span className='text-te-dark text-[8px] sm:text-[8.5px] md:text-[9px] tracking-widest uppercase mb-0.5 sm:mb-1 opacity-80 group-active:scale-95'>
              Next
            </span>
            <svg
              className='w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 fill-te-dark group-active:scale-90 transition-transform'
              viewBox='0 0 24 24'
            >
              <path d='M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z' />
            </svg>
          </button>
        </div>
      </div>
      <div className='absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-black/20 to-transparent rounded-b-[20px] sm:rounded-b-[28px] md:rounded-b-[32px]' />
    </div>
  );
}
