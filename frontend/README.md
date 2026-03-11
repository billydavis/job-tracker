
Run locally (from repo root):

```bash
cd frontend
bun install
bun run dev
```

Notes:
The frontend expects the backend to be reachable at `/api/*`. To change this, set `VITE_API_BASE` in `.env`.
ShadeCDN: the app will load Shade only when `VITE_SHADECDN_URL` is set. To enable ShadeCDN in development, create a `.env` in `frontend/` with for example:

```bash
VITE_SHADECDN_URL="https://cdn.shade.dev/shade.min.js"
```

If you do not set `VITE_SHADECDN_URL`, ShadeCDN will not be requested and the UI will use native fallbacks. The React wrappers in `src/shade` use Shade web components when available and fall back to native elements when not.
# bun-react-tailwind-shadcn-template

To install dependencies:

```bash
bun install
```

To start a development server:

```bash
bun dev
```

To run for production:

```bash
bun start
```

This project was created using `bun init` in bun v1.3.10. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
