# AuthentiMark GUI — Claude Code Build Instructions

## Project Overview
Build a demo web application for **AuthentiMark** that lets a user upload an image, watermark
it using either the trained AE or VAE, and run it through the trained Transformer detector to
check whether a watermark is present. This is the GUI deliverable from the project instructions
("build a basic GUI/interface to demo your project"), built on top of the already-trained models
from the training notebook.

This is a **separate implementation task from the notebook** — the notebook was for training and
producing checkpoints; this GUI is for demoing those already-trained checkpoints. Do not retrain
anything here. Only load existing `.pt` checkpoint files and run inference.

## Prerequisite — Models Must Already Be Exported
Before backend work starts, the three trained checkpoint files must be copied out of Google Drive
into this project's `models/` folder:
- `ae_latest.pt` (contains `encoder` and `decoder` state dicts, from AEEncoder/AEDecoder)
- `vae_latest.pt` (contains `encoder` and `decoder` state dicts, from VAEEncoder/VAEDecoder)
- `detector_latest.pt` (contains `model` state dict, from WatermarkDetector, a fine-tuned
  `google/vit-base-patch16-224`)

If these files are not present in `models/` when the backend starts, fail clearly with a message
telling the user to copy them from Drive rather than silently using randomly initialized weights.

## Architecture Choice
- **Backend:** FastAPI (Python) — serves model inference behind a small REST API. Chosen over
  Flask for built-in request/response validation and automatic docs, useful for a demo.
- **Frontend:** React + Vite + Tailwind CSS. Vite for a fast, modern dev/build setup without the
  overhead of a full framework like Next.js, which this project's scope doesn't need. No routing
  library, no state management library (Redux/Zustand) — plain `useState`/`useEffect` is enough
  for two actions (watermark, detect). Tailwind for styling instead of hand-written CSS.
- **Model code:** the exact same `AEEncoder`, `AEDecoder`, `VAEEncoder`, `VAEDecoder`, and
  `WatermarkDetector` class definitions from the training notebook, copied verbatim into a shared
  `backend/models.py` file so architecture always matches the saved checkpoints exactly. Do not
  redesign or "clean up" these classes — any mismatch between this file and the notebook's
  architecture will break checkpoint loading.

## Project Structure

```
authentimark-gui/
├── models/
│   ├── ae_latest.pt
│   ├── vae_latest.pt
│   └── detector_latest.pt
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── inference.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── WatermarkPanel.jsx
│   │   │   ├── DetectPanel.jsx
│   │   │   ├── ImageUploader.jsx
│   │   │   └── VerdictBadge.jsx
│   │   ├── api.js
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

## Code Style Rules
- No comments in code files. Explanation belongs in this file and in commit messages, not
  inline `#`/`//` comments. Code should be self-explanatory through clear naming.
- Follow the same variable naming used in the training notebook (`ae_encoder`, `ae_decoder`,
  `vae_encoder`, `vae_decoder`, `detector`) so the connection between notebook and backend code
  is obvious to anyone comparing the two.

## Backend — `backend/models.py`
Copy these class definitions exactly as they appear in the training notebook, unchanged:
- `AEEncoder`, `AEDecoder` (residual_scale=0.3, standard CNN encoder-decoder)
- `VAEEncoder` (latent_channels=64, small-variance init on logvar_head, reparameterization
  trick), `VAEDecoder`
- `WatermarkDetector` (ViT backbone from `google/vit-base-patch16-224`, custom 2-class head
  using the CLS token, not the pooler)
- `prepare_for_vit` helper function (resizes to 224x224 before feeding the detector)

## Backend — `backend/inference.py`
Implements three functions, each loading its checkpoint once at startup (not per-request):

`load_ae()` — instantiates `AEEncoder`/`AEDecoder`, loads `models/ae_latest.pt`, sets `.eval()`,
returns both.

`load_vae()` — same pattern for `VAEEncoder`/`VAEDecoder` and `models/vae_latest.pt`.

`load_detector()` — instantiates `WatermarkDetector`, loads `models/detector_latest.pt`, sets
`.eval()`, returns it.

`watermark_image(image, method)` — takes a PIL image and `method` ("ae" or "vae"), preprocesses
to 128x128 matching the notebook's `WatermarkImageDataset` transform, generates a random 32-bit
message the same way the notebook did (`np.random.randint(0, 2, size=32)`), runs the appropriate
encoder, returns the watermarked image as PIL plus the message used (needed later if a "verify
exact message" feature is ever added, not required for this basic demo).

`detect_watermark(image)` — takes a PIL image, resizes via `prepare_for_vit`, runs the detector,
applies softmax, returns `(prediction, confidence)`.

`verdict_from_confidence(prediction, confidence, threshold=0.75)` — copied from the notebook's
Section 6e ethics-aware evaluation: returns `"Likely watermarked"`, `"Likely not watermarked"`,
or `"Uncertain -- do not treat as definitive proof"` if confidence is below threshold. This
ethical safeguard must carry over into the GUI, not just exist in the notebook.

## Backend — `backend/main.py`
FastAPI app with these endpoints:

`POST /watermark` — accepts an uploaded image file and a `method` field (`"ae"` or `"vae"`).
Returns the watermarked image (as base64 or a served file) plus a `psnr` and `ssim` value
comparing it to the original, using the same `skimage.metrics` functions from the notebook's
final performance summary cell.

`POST /detect` — accepts an uploaded image file. Returns `{prediction, confidence, verdict}`
using `detect_watermark` and `verdict_from_confidence`.

`GET /health` — returns whether all three models loaded successfully at startup, for basic
sanity checking when the server starts.

Load all three models once at startup (module-level, not inside request handlers) so each
request only does inference, not model loading — loading a ViT per-request would make the demo
unusably slow.

Enable CORS for local development so `frontend/app.js` can call this API from a different port.

## Frontend — React Components

**`src/api.js`** — a small wrapper around `fetch`, with two functions: `watermarkImage(file,
method)` (POSTs to `/watermark`, returns `{watermarkedImageUrl, psnr, ssim}`) and
`detectWatermark(file)` (POSTs to `/detect`, returns `{prediction, confidence, verdict}`). All
API calls live here, not scattered across components.

**`src/components/ImageUploader.jsx`** — a reusable drag-and-drop / click-to-upload component,
takes an `onFileSelected` callback prop. Used by both panels below so upload behavior is
consistent and not duplicated.

**`src/components/WatermarkPanel.jsx`** — lets the user pick AE or VAE (a simple toggle/radio
group), upload an image via `ImageUploader`, and click "Watermark Image". Calls
`watermarkImage` from `api.js`, then displays the original and watermarked image side by side
using Tailwind's grid utilities, with PSNR and SSIM values shown underneath as labeled stats.

**`src/components/DetectPanel.jsx`** — lets the user upload an image via `ImageUploader` and
click "Check for Watermark". Calls `detectWatermark`, then renders a `VerdictBadge` with the
result and a confidence percentage.

**`src/components/VerdictBadge.jsx`** — takes `verdict` and `confidence` props, renders a
color-coded badge: green background for "Likely watermarked", gray for "Likely not
watermarked", amber/yellow for "Uncertain -- do not treat as definitive proof". This directly
surfaces the ethics-aware confidence threshold from the notebook's Section 6e; do not simplify
this down to a plain yes/no badge.

**`src/App.jsx`** — renders both `WatermarkPanel` and `DetectPanel`, either side by side or as
two tabs, with a page header naming the project ("AuthentiMark"). Keep this component thin —
it should mostly just compose the two panels, not hold business logic itself.

Use Tailwind utility classes throughout; no custom CSS files beyond `index.css` for Tailwind's
base imports. Keep the design clean and functional — this is a working demo, not a polished
product, so prioritize clarity over visual complexity.

## `backend/requirements.txt`
List exact packages needed: fastapi, uvicorn, python-multipart, torch, torchvision, transformers,
pillow, numpy, scikit-image.

## Frontend Dependencies
`package.json` should include: react, react-dom, vite, @vitejs/plugin-react, tailwindcss,
postcss, autoprefixer. Set up Tailwind via its standard Vite integration (`tailwind.config.js`
content paths pointing at `./index.html` and `./src/**/*.{js,jsx}`).

Vite's dev server runs on a different port than FastAPI (typically 5173 vs 8000), so backend
CORS must explicitly allow the Vite dev origin — do not set CORS to allow-all in a way that's
left in place carelessly; scope it to `http://localhost:5173` for local development.

## `README.md`
Brief instructions covering: how to copy checkpoints into `models/`, how to install and run the
backend (`pip install -r backend/requirements.txt`, `uvicorn backend.main:app --reload`), and
how to install and run the frontend (`cd frontend && npm install && npm run dev`), plus a note
that both must be running simultaneously for the demo to work.

## Rules
- Do not retrain or fine-tune any model in this GUI codebase — inference only.
- Do not modify the model architecture classes from what's in the training notebook; any
  mismatch will break `load_state_dict`.
- Keep the confidence-threshold verdict system from Section 6e intact in the backend — this is
  a required ethical safeguard, not optional demo polish.
- Load each model once at backend startup, never per-request.
- No comments in code, per the code style rule above.
