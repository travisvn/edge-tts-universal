/** Base URL for Microsoft Edge TTS service endpoints */
export const BASE_URL = "speech.platform.bing.com/consumer/speech/synthesize/readaloud";

/** Trusted client token used for authentication with the TTS service */
export const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";

/** WebSocket URL for TTS streaming synthesis */
export const WSS_URL = `wss://${BASE_URL}/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}`;

/** HTTP URL for fetching available voices list */
export const VOICE_LIST_URL = `https://${BASE_URL}/voices/list?trustedclienttoken=${TRUSTED_CLIENT_TOKEN}`;

/** Default voice to use when none is specified */
export const DEFAULT_VOICE = "en-US-EmmaMultilingualNeural";

/** Version string for Chromium browser emulation */
export const CHROMIUM_FULL_VERSION = "130.0.2849.68";

/** Major version number extracted from the full Chromium version */
export const CHROMIUM_MAJOR_VERSION = CHROMIUM_FULL_VERSION.split(".")[0];

/** Security token version for API authentication */
export const SEC_MS_GEC_VERSION = `1-${CHROMIUM_FULL_VERSION}`;

/** Base HTTP headers for API requests, mimicking a real browser */
export const BASE_HEADERS = {
  "User-Agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_MAJOR_VERSION}.0.0.0 Safari/537.36 Edg/${CHROMIUM_MAJOR_VERSION}.0.0.0`,
  "Accept-Encoding": "gzip, deflate, br",
  "Accept-Language": "en-US,en;q=0.9",
};

/** HTTP headers specific to WebSocket connection requests */
export const WSS_HEADERS = {
  ...BASE_HEADERS,
  "Pragma": "no-cache",
  "Cache-Control": "no-cache",
  "Origin": "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
};

/** HTTP headers specific to voice list API requests */
export const VOICE_HEADERS = {
  ...BASE_HEADERS,
  "Authority": "speech.platform.bing.com",
  "Sec-CH-UA": `" Not;A Brand";v="99", "Microsoft Edge";v="${CHROMIUM_MAJOR_VERSION}", "Chromium";v="${CHROMIUM_MAJOR_VERSION}"`,
  "Sec-CH-UA-Mobile": "?0",
  "Accept": "*/*",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Dest": "empty",
}; 