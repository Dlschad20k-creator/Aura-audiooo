# AURA TTS Studio v0.1

A mobile-first, installable PWA starter for managing local TTS model files and audio exports.

## What works in v0.1
- Premium dark-glass mobile UI.
- Studio / Models / Audio Library navigation.
- Import multiple files from the iOS Files picker.
- Store imported files in IndexedDB on-device.
- Delete imported model files.
- Generate and export a **test WAV tone** (not speech).
- Store and re-download generated audio blobs.
- PWA manifest and service worker shell cache.

## Not implemented yet
- No neural TTS inference engine is bundled.
- Imported ONNX files are stored, not executed.
- CoreML is not executable from a browser/PWA; it needs a native iOS app.
- ZIP folder extraction is not implemented in this version.
- MP3 encoding is not implemented.
- The Google Fonts import is optional and online; for strict offline/privacy, remove the `@import` line in `styles.css`. The system font fallback works without it.

## iPhone-only installation (no PC/Mac)
A PWA must be served from HTTPS (or localhost). iOS Safari cannot install a local `index.html` as a proper PWA directly from the Files app. Use an online code host once to publish the static files; after the first successful load, the app shell can be cached for offline use.

### Publish using GitHub from Safari
1. Create/sign in to a GitHub account in Safari.
2. Create a public repository named `aura-tts-studio`.
3. Upload all files and the `icons` folder from this project.
4. In repository Settings → Pages, choose **Deploy from a branch**, select `main` and `/ (root)`, then Save.
5. Wait for GitHub Pages to publish the site. The URL is `https://YOUR-USERNAME.github.io/aura-tts-studio/`.
6. Open that URL in Safari, wait for it to finish loading, then Share → Add to Home Screen.
7. Launch AURA from the Home Screen once while online. Then test Airplane Mode.

GitHub Pages hosting is free for public repositories. Publishing requires a one-time internet connection. A PWA is not a native App Store app.

## Importing model files on iPhone
1. Download/copy the model files into the iOS Files app while online.
2. Open AURA → Models → Choose Files.
3. Select one or more files. iOS may not expose directory selection consistently.
4. The files are copied into the browser's IndexedDB storage. Keep enough free device storage.
5. Do not delete Safari website data if you want to retain the imported files.

For a model bundle, select the ONNX weights plus all required config/tokenizer/vocabulary files. A raw `.onnx` file alone is often insufficient.

## Next engineering milestone: ONNX engine
Recommended next implementation:
- Vendor a pinned `onnxruntime-web` build and its WASM assets locally under `vendor/`.
- Add an architecture-specific adapter for a verified iOS-compatible TTS model.
- Validate the model's input/output names, tensor shapes, tokenizer, sample rate and vocoder.
- Add streaming/chunked synthesis to manage iPhone memory.
- Convert PCM output to WAV; add a local MP3 encoder (e.g. LAME/WASM) only after verifying iOS Safari compatibility.
- Keep all runtime files local and cache them in the service worker.

## Security / privacy
Imported model files remain in this browser's IndexedDB. This is local browser storage, not encrypted vault storage. Avoid importing untrusted model files. Storage may be evicted by iOS under device pressure; keep backups of original model files in Files/iCloud Drive or another location.

## File structure
- `index.html` — app shell
- `styles.css` — visual design
- `app.js` — IndexedDB, import, audio export
- `manifest.webmanifest` — PWA metadata
- `sw.js` — offline shell cache
- `icons/` — app icons
