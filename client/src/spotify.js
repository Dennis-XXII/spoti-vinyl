// src/spotify.js

// Ensure these are defined; otherwise, the app will fail immediately
const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;

if (!clientId || !redirectUri) {
  console.error("Environment variables missing! Check your .env file.");
}

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

  const data = await response.json();

  // Store the refresh token and expiry time
  if (data.access_token) {
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    // Store when the token expires (current time + expires_in seconds)
    const expiresAt = Date.now() + data.expires_in * 1000;
    localStorage.setItem("token_expires_at", expiresAt);
  }

  return data;
};

// Refresh the access token using the refresh token
export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refresh_token");

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();

  if (data.access_token) {
    localStorage.setItem("access_token", data.access_token);
    // Update refresh token if a new one is provided
    if (data.refresh_token) {
      localStorage.setItem("refresh_token", data.refresh_token);
    }
    const expiresAt = Date.now() + data.expires_in * 1000;
    localStorage.setItem("token_expires_at", expiresAt);
  }

  return data;
};

// Check if token is expired or will expire soon (within 5 minutes)
export const isTokenExpired = () => {
  const expiresAt = localStorage.getItem("token_expires_at");
  if (!expiresAt) return true;

  // Check if token expires in less than 5 minutes
  return Date.now() >= parseInt(expiresAt) - 5 * 60 * 1000;
};

// Get a valid access token (refresh if needed)
export const getValidToken = async () => {
  const accessToken = localStorage.getItem("access_token");

  if (!accessToken || isTokenExpired()) {
    try {
      const data = await refreshAccessToken();
      return data.access_token;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      // Clear all tokens and force re-login
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("token_expires_at");
      return null;
    }
  }

  return accessToken;
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
