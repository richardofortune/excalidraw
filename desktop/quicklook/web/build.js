// Bundles render.ts into one self-contained script for the preview
// extension. Fonts are inlined as data URLs so previews work offline.
const path = require("path");

const { build } = require("esbuild");

const pkg = (name) => path.resolve(__dirname, "../../../packages", name);

build({
  entryPoints: [path.join(__dirname, "render.ts")],
  outfile: process.argv[2],
  bundle: true,
  minify: true,
  format: "iife",
  target: "safari16",
  loader: { ".woff2": "dataurl", ".wasm": "binary" },
  alias: {
    "@excalidraw/common": pkg("common/src"),
    "@excalidraw/element": pkg("element/src"),
    "@excalidraw/excalidraw": pkg("excalidraw"),
    "@excalidraw/math": pkg("math/src"),
    "@excalidraw/fractional-indexing": pkg("fractional-indexing/src"),
    "@excalidraw/utils": pkg("utils/src"),
  },
  define: { "import.meta.env": JSON.stringify({ PROD: true }) },
  logLevel: "warning",
}).catch(() => process.exit(1));
