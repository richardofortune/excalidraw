#!/usr/bin/env node
// Finds A -> B -> A flashes in a film: a short run of frames that differs from
// both neighbours while the neighbours match each other. Prints the time and
// length of each flash, and drops the frames around it into a folder to look at.
//
//   node demo/flashcheck.mjs demo/out/excalidraw-fork-full.mp4 [fps] [outDir]
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const [file, fpsArg = "25", outDir = "demo/out/flashes"] =
  process.argv.slice(2);
if (!file) {
  console.error("usage: flashcheck <video> [fps] [outDir]");
  process.exit(2);
}
const fps = Number(fpsArg);
const W = 160;
const H = 100;

const raw = spawnSync(
  "ffmpeg",
  [
    "-loglevel",
    "error",
    "-i",
    file,
    "-vf",
    `fps=${fps},scale=${W}:${H}`,
    "-f",
    "rawvideo",
    "-pix_fmt",
    "gray",
    "-",
  ],
  { maxBuffer: 1 << 30 },
).stdout;
const n = Math.floor(raw.length / (W * H));
const frame = (i) => raw.subarray(i * W * H, (i + 1) * W * H);

// mean absolute pixel difference, 0..255
const diff = (a, b) => {
  let s = 0;
  for (let k = 0; k < a.length; k++) {
    s += Math.abs(a[k] - b[k]);
  }
  return s / a.length;
};

const CHANGE = 6; // a cut or a real change in the picture
const SAME = 1.5; // close enough to be "the same picture"
const MAX_RUN = Math.round(fps * 0.6); // flashes longer than this are a scene

const flashes = [];
let i = 1;
while (i < n - 1) {
  if (diff(frame(i - 1), frame(i)) < CHANGE) {
    i++;
    continue;
  }
  // frame i starts something new. does the picture return within MAX_RUN frames?
  let found = null;
  for (let w = 1; w <= MAX_RUN && i + w < n; w++) {
    if (diff(frame(i - 1), frame(i + w)) < SAME) {
      found = w;
      break;
    }
  }
  if (found) {
    flashes.push({
      at: i / fps,
      frames: found,
      before: i - 1,
      after: i + found,
    });
    i += found + 1;
  } else {
    i++;
  }
}

console.log(`${file}: ${n} frames at ${fps}fps, ${flashes.length} flash(es)`);
if (!flashes.length) {
  process.exit(0);
}
mkdirSync(outDir, { recursive: true });
for (const f of flashes) {
  const ms = Math.round((f.frames / fps) * 1000);
  console.log(`  ${f.at.toFixed(2)}s  ${f.frames} frame(s) / ${ms}ms`);
  for (const [tag, idx] of [
    ["before", f.before],
    ["flash", f.before + 1],
    ["after", f.after],
  ]) {
    execFileSync("ffmpeg", [
      "-loglevel",
      "error",
      "-y",
      "-ss",
      String(idx / fps),
      "-i",
      file,
      "-frames:v",
      "1",
      "-vf",
      "scale=600:-1",
      `${outDir}/${f.at.toFixed(2)}s-${tag}.png`,
    ]);
  }
}
process.exit(1);
