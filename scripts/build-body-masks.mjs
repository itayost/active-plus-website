// Solid body outlines for the body-areas screen (owner, 2026-11-15): the red
// marks are clipped to them so they never leave the body. The photos' own alpha
// has holes where background removal took white clothing, so the outline is the
// alpha, closed over small gaps, with everything not reachable from the edge
// filled in, and the torso rows filled edge to edge. Run after replacing a body photo:
//   node scripts/build-body-masks.mjs
import sharp from "sharp";

const DIR = "public/img/funnel/app";
const SOLID = 40; // alpha at or above this counts as body
const CLOSE = 6; // px: gaps narrower than about twice this are sealed
const TORSO = [0.13, 0.5]; // of the height: neck to hips
const SPAN_ROWS = 30; // rows above and below that lend a row their width

async function build(gender) {
  const { data, info } = await sharp(`${DIR}/body-${gender}.webp`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels } = info;
  let body = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) body[i] = data[i * channels + 3] >= SOLID ? 1 : 0;

  const morph = (src, grow) => {
    const out = new Uint8Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let hit = !grow;
        for (let dy = -CLOSE; dy <= CLOSE && hit !== grow; dy++)
          for (let dx = -CLOSE; dx <= CLOSE; dx++) {
            if (dx * dx + dy * dy > CLOSE * CLOSE) continue;
            const xx = x + dx, yy = y + dy;
            const v = xx >= 0 && yy >= 0 && xx < w && yy < h ? src[yy * w + xx] : 0;
            if (grow ? v === 1 : v === 0) { hit = grow; break; }
          }
        out[y * w + x] = hit ? 1 : 0;
      }
    return out;
  };
  const closed = morph(morph(body, true), false);

  // Outside = background reachable from the image's edge; everything else is body.
  const outside = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    const i = y * w + x;
    if (!outside[i] && !closed[i]) { outside[i] = 1; stack.push(i); }
  };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) {
    const i = stack.pop();
    const x = i % w, y = (i / w) | 0;
    if (x > 0) push(x - 1, y);
    if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < h - 1) push(x, y + 1);
  }

  // The torso rows (white shirts lost to background removal, holes open to the
  // edge): body from the first to the last body pixel of each row.
  const solid = Uint8Array.from(outside, (o) => (o ? 0 : 1));
  // A row with the shoulder missing takes its width from the rows around it.
  const span = (y) => {
    let first = -1, last = -1;
    for (let x = 0; x < w; x++) if (closed[y * w + x]) { if (first < 0) first = x; last = x; }
    return [first, last];
  };
  const top = Math.round(h * TORSO[0]), bottom = Math.round(h * TORSO[1]);
  for (let y = top; y < bottom; y++) {
    let first = w, last = -1;
    for (let yy = Math.max(top, y - SPAN_ROWS); yy <= Math.min(bottom - 1, y + SPAN_ROWS); yy++) {
      const [f, l] = span(yy);
      if (f >= 0) { first = Math.min(first, f); last = Math.max(last, l); }
    }
    for (let x = first; x <= last; x++) solid[y * w + x] = 1;
  }

  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) rgba[i * 4 + 3] = solid[i] ? 255 : 0;
  await sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).png({ compressionLevel: 9 }).toFile(`${DIR}/body-${gender}-mask.png`);
  console.log(`body-${gender}-mask.png ${w}x${h}`);
}

for (const g of ["male", "female"]) await build(g);
