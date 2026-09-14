// C9 — capacité de décodage d'un PNG de N mégapixels dans le processus de l'application.
// POST ?mpx=N : génère un PNG uni de ≈ N Mpx (sharp), puis le décode en pixels bruts ; relève durée et pic RSS.
import sharp from "sharp";
import { denied, json } from "../../../../lib/probe.js";

export const maxDuration = 300;

export async function POST(request) {
  const refused = denied(request);
  if (refused) return refused;
  const mpx = Number(new URL(request.url).searchParams.get("mpx"));
  if (!(mpx > 0 && mpx <= 400)) return json({ error: "mpx invalide (0 < mpx ≤ 400)" }, { status: 400 });
  const side = Math.round(Math.sqrt(mpx * 1e6));
  let peakRss = process.memoryUsage().rss;
  const rssBefore = peakRss;
  const timer = setInterval(() => {
    peakRss = Math.max(peakRss, process.memoryUsage().rss);
  }, 10);
  const phases = {};
  try {
    let t = performance.now();
    const png = await sharp({ create: { width: side, height: side, channels: 3, background: { r: 200, g: 120, b: 40 } }, limitInputPixels: false })
      .png({ compressionLevel: 6 })
      .toBuffer();
    phases.encodeMs = performance.now() - t;
    const rssAfterEncode = process.memoryUsage().rss;
    t = performance.now();
    const { data, info } = await sharp(png, { limitInputPixels: false }).raw().toBuffer({ resolveWithObject: true });
    phases.decodeMs = performance.now() - t;
    peakRss = Math.max(peakRss, process.memoryUsage().rss);
    return json({
      ok: true,
      requestedMpx: mpx,
      width: info.width,
      height: info.height,
      pixels: info.width * info.height,
      channels: info.channels,
      pngBytes: png.length,
      decodedBytes: data.length,
      ...phases,
      rssBefore,
      rssAfterEncode,
      peakRss,
      sharp: sharp.versions,
    });
  } catch (e) {
    return json({ ok: false, requestedMpx: mpx, side, error: String(e?.message ?? e).slice(0, 300), ...phases, rssBefore, peakRss }, { status: 500 });
  } finally {
    clearInterval(timer);
  }
}
