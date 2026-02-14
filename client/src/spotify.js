// src/spotify.js

// Ensure these are defined; otherwise, the app will fail immediately
const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const redirectUri = window.location.origin + "/";

if (!clientId || !redirectUri) {
	console.error("Environment variables missing! Check your .env file.");
}

// src/spotify.js
const scope =
	"streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state user-library-read";

export const authUrl = async () => {
	const verifier = generateCodeVerifier(128);
	const challenge = await generateCodeChallenge(verifier);
	localStorage.setItem("verifier", verifier);

	const params = new URLSearchParams({
		client_id: clientId,
		response_type: "code",
		redirect_uri: redirectUri,
		scope: scope,
		code_challenge_method: "S256",
		code_challenge: challenge,
	});

	return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

export const getToken = async (code) => {
	const codeVerifier = localStorage.getItem("verifier");
	const response = await fetch("https://accounts.spotify.com/api/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			client_id: clientId,
			grant_type: "authorization_code",
			code,
			redirect_uri: redirectUri,
			code_verifier: codeVerifier,
		}),
	});
	return await response.json();
};

function generateCodeVerifier(length) {
	let text = "";
	let possible =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (let i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

async function generateCodeChallenge(codeVerifier) {
	const data = new TextEncoder().encode(codeVerifier);
	const digest = await window.crypto.subtle.digest("SHA-256", data);
	return btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}
