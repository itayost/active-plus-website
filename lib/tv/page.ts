/**
 * The TV page (peilimplus.co.il/tv): the workout on any smart TV with a
 * pairing code (owner, 2026-11-16). Plain HTML, CSS and an ES5 script
 * (public/tv/tv.js) instead of a React page, because TV browsers are years old
 * and slow: no framework bundle, no modern syntax, nothing to hydrate.
 *
 * Sized for reading from three meters: every size is in viewport units, so a
 * 1280 or 1920 wide TV browser shows the same picture.
 */

export type TvPageConfig = {
  supabaseUrl: string;
  anonKey: string;
};

const escapeForScript = (value: string): string =>
  JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");

export function renderTvPage(config: TvPageConfig): string {
  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>פעילים פלוס בטלוויזיה</title>
<style>
@font-face { font-family: "Heebo"; src: url("/tv/heebo-regular.ttf") format("truetype"); font-weight: 400; }
@font-face { font-family: "Heebo"; src: url("/tv/heebo-bold.ttf") format("truetype"); font-weight: 700; }
html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #0F1B2D; color: #FFFFFF; }
body { font-family: "Heebo", Arial, sans-serif; direction: rtl; text-align: center; }
.screen { display: none; position: absolute; top: 0; right: 0; bottom: 0; left: 0; }
.brand { position: absolute; top: 5vh; right: 5vw; font-size: 4.5vh; font-weight: 700; color: #7FB2F0; }
.center { position: absolute; top: 50%; right: 0; left: 0; -webkit-transform: translateY(-50%); transform: translateY(-50%); padding: 0 6vw; }
h1 { font-size: 7vh; font-weight: 700; margin: 0 0 3vh; line-height: 1.2; }
p { font-size: 4.6vh; line-height: 1.4; margin: 0 0 2vh; color: #DCE6F5; }
.steps { font-size: 4.2vh; color: #DCE6F5; margin-top: 5vh; line-height: 1.5; }
.steps b { color: #FFFFFF; }
#code-digits { direction: ltr; margin: 2vh 0; }
.digit { display: inline-block; width: 17vh; height: 23vh; line-height: 23vh; margin: 0 1.4vh; font-size: 19vh; font-weight: 700;
  background: #1E6FD9; color: #FFFFFF; border-radius: 3vh; }
.small { font-size: 3.4vh; color: #A9B8CC; }
#forget { margin-top: 6vh; font-family: inherit; font-size: 3.6vh; color: #FFFFFF; background: transparent;
  border: 0.4vh solid #7FB2F0; border-radius: 2vh; padding: 1.6vh 4vh; }
#forget:focus { background: #1E6FD9; border-color: #FFFFFF; outline: none; }
#screen-play { background: #000000; }
#video { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #000000; object-fit: contain; }
.play-top { position: absolute; top: 0; right: 0; left: 0; padding: 3vh 4vw 6vh;
  background: -webkit-linear-gradient(top, rgba(0,0,0,0.7), rgba(0,0,0,0)); background: linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0)); text-align: right; }
#play-title { font-size: 6vh; font-weight: 700; }
#play-count { font-size: 3.6vh; color: #DCE6F5; }
#paused-badge, #sound-hint { display: none; position: absolute; left: 50%; -webkit-transform: translateX(-50%); transform: translateX(-50%);
  background: rgba(15,27,45,0.92); border-radius: 2.5vh; padding: 2vh 5vh; font-size: 5vh; font-weight: 700; }
#paused-badge { top: 42vh; }
#sound-hint { bottom: 6vh; font-size: 4vh; font-weight: 400; }
</style>
</head>
<body>
<div class="brand">פעילים פלוס</div>

<div id="screen-code" class="screen">
  <div class="center">
    <h1>המספר לטלפון:</h1>
    <div id="code-digits"></div>
    <div class="steps">בטלפון, באימון: לחצו על <b>כפתור הטלוויזיה</b> והקלידו את המספר</div>
  </div>
</div>

<div id="screen-paired" class="screen">
  <div class="center">
    <h1 id="paired-name">שלום</h1>
    <p>הטלוויזיה מחוברת. באימון בטלפון לחצו על <b>כפתור הטלוויזיה</b>.</p>
    <button id="forget" type="button">לחבר טלפון אחר</button>
  </div>
</div>

<div id="screen-play" class="screen">
  <video id="video" playsinline webkit-playsinline preload="auto"></video>
  <div class="play-top"><div id="play-title"></div><div id="play-count"></div></div>
  <div id="paused-badge">בהפסקה</div>
  <div id="sound-hint">לחצו OK בשלט כדי לשמוע את הקול</div>
</div>

<div id="screen-done" class="screen">
  <div class="center">
    <h1>כל הכבוד!</h1>
    <p>סיימתם את האימון של היום.</p>
  </div>
</div>

<div id="screen-error" class="screen">
  <div class="center">
    <h1>אין חיבור כרגע</h1>
    <p>בודקים שוב בעוד רגע. אם זה נמשך, בדקו שהטלוויזיה מחוברת לאינטרנט.</p>
  </div>
</div>

<script>window.TV_CONFIG = { supabaseUrl: ${escapeForScript(config.supabaseUrl)}, anonKey: ${escapeForScript(config.anonKey)} };</script>
<script src="/tv/tv.js"></script>
</body>
</html>
`;
}

/**
 * The TV page's own Content-Security-Policy. The site-wide one has no
 * websocket and no outside media; this page needs Realtime (wss on the
 * Supabase host; ws only for a local stand-in) and the exercise videos, which
 * are on Supabase Storage.
 */
export function buildTvCsp(supabaseUrl: string | undefined): string {
  let origin: string | null = null;
  try {
    origin = supabaseUrl ? new URL(supabaseUrl).origin : null;
  } catch {
    origin = null;
  }
  const socket = origin ? origin.replace(/^http/, "ws") : null;
  const remote = origin ? [origin] : [];
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `media-src 'self' ${remote.join(" ")}`.trim(),
    `connect-src 'self' ${[...remote, ...(socket ? [socket] : [])].join(" ")}`.trim(),
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");
}
