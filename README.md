# Rosen Chat AI

Rosen Chat AI is a conversational marketplace demo that connects businesses with service providers through task matching, proof review, PayPal sandbox checkout, and interactive business dashboards.

**Public repository:** [github.com/naij/chat-ai-paypal](https://github.com/naij/chat-ai-paypal)
**Source-code license:** [MIT](LICENSE), an [OSI-approved license](https://opensource.org/license/mit).

## What you can try

- **Profile:** view a sample member profile and open Chat using the pink frog. The top **Dashboard** button opens analytics.
- **Boss — “I want to hire someone”:** send a prefilled marketing request, select a promoter, pay through PayPal Sandbox or a simulated PYUSD flow, review submitted proof, and approve or reject it.
- **Helper — “I want to earn money”:** select a task, submit text and/or images as proof, and simulate receiving a payment. PayPal receipt offers **View in PayPal** and **View dashboard**.
- **Dashboard:** explore 72 mock orders through KPI widgets, revenue charts, country/channel/service breakdowns, a transaction grid, and status filters. Toggle **Edit dashboard** to use AG Studio's report editor.

This is a prototype: the assistant is scripted, most marketplace operations are simulated, and no live-money payments are supported. See the integration details below for the exact boundaries.

## Setup

### Requirements

- Node.js **20.19+**; Node.js **22** recommended.
- npm, included with Node.js.
- Optional: Docker with Docker Compose for container deployment.
- Internet access for dependency installation, remote profile images, and the external Rosen sandbox backend.

```sh
git clone https://github.com/naij/chat-ai-paypal.git
cd chat-ai-paypal
npm ci
cp .env.example .env.local
npm run dev
```

If you already have a local `.env.local`, keep it instead of overwriting it. Open [http://localhost:8080](http://localhost:8080). `npm start` runs the same development server. Use `npm run dev -- --port 8090` for another port.

### Environment variables

Set these optional, **build-time** Vite variables in `.env.local`:

| Variable | Default / purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Defaults to `https://beta.gorosen.xyz`; base URL for Rosen authentication and PayPal backend endpoints. |
| `VITE_AG_STUDIO_LICENSE_KEY` | Optional local evaluation key, passed to `AgStudioProvider`. Supply your own valid AG Studio license. |

Restart Vite after changing variables. Vite variables are included in browser code: do not place PayPal client secrets, AI provider secrets, or private server credentials here. `.env.local` is ignored by Git; no trial key is included in the example file.

The Profile page automatically signs in using the demo account currently configured in `src/api/auth.js`. The backend must permit this account and allow the frontend origin, `X-Token`, and `Content-Type` through CORS. That backend is an external service and is **not included in this repository**. Dashboard mock data does not require it; successful sandbox checkout does.

### Build and preview

```sh
npm run build
npm run preview
```

The build is written to `dist/`. Stop the development server before previewing on the same port. Serve the output over HTTP; do not open `index.html` using `file://`.

### Docker

```sh
docker compose up -d --build
# Optional alternative host port:
# PORT=8090 docker compose up -d --build
```

Open [http://localhost:8080](http://localhost:8080). The multi-stage image builds with Node.js 22 and serves static files with Nginx. `/health` is a health-check endpoint. No database is required by this frontend.

```sh
docker compose ps
docker compose logs -f
docker compose down
```

**Current Docker configuration uses the default API URL and does not copy `.env.local` or forward Vite build variables.** For a customized API URL or an AG Studio license, add the required build-time configuration before building the image, or build `dist/` with the desired variables and serve that output. Runtime Nginx environment variables do not modify an already-built Vite application. Obtain an appropriate AG Studio license before deploying the dashboard.

## How we use PayPal

### Implemented: Boss sandbox checkout

The frontend integrates with PayPal **through the Rosen backend**, using Axios. It does not call PayPal's privileged APIs directly and does not embed a PayPal client secret or the PayPal JavaScript SDK.

1. The Boss selects a promoter and confirms the quoted amount.
2. The frontend calls `POST /api/paypal/order/create` with `{ "amount": 350 }` (amount varies by candidate).
3. The backend response supplies `data.payUrl`. The frontend extracts the PayPal order ID from its `token` query parameter, falling back to `data.orderId`, then opens the sandbox approval URL in a new tab.
4. The original Chat shows **I’ve completed payment** / **I haven’t paid**. A pending order and chat snapshot are stored in `sessionStorage` so checkout can resume after a refresh without creating another order.
5. PayPal redirects to the configured success or cancellation callback. The success page reads the URL's `token` and requests `GET /api/open/paypal/order/check/:orderId?token=:orderId` to verify the order with the backend.

The API response envelope is `{ code, msg, data }`. The frontend treats numeric `code === 20000` as success; for the check endpoint, that code must mean payment has been confirmed. Other codes display an error. `PayerID` is displayed when present but is **not** used as the order ID.

**Demo shortcut:** clicking **I’ve completed payment** in the original Chat advances the scripted flow without querying or validating payment. Only the success callback performs the server check. This shortcut must not be used to authorize fulfillment or release funds in a production application.

### Callback configuration

Configure these URLs on the backend when it creates the PayPal order:

| Callback | Deployed example | Local route |
| --- | --- | --- |
| `return_url` | `https://chatai.gorosen.xyz/paypal/success` | `/paypal/success?token=PAYPAL_ORDER_ID&PayerID=PAYER_ID` |
| `cancel_url` | `https://chatai.gorosen.xyz/paypal/cancel` | `/paypal/cancel` |

The frontend create-order request sends only `amount`; callback URLs are not added to that request. Nginx includes explicit routes for both callback pages. The success page shows verified, pending, or missing-order feedback. The cancellation page shows cancellation feedback and does not refund or query the order.

### Simulated payment-related features

- Helper PayPal receipt uses a **local confirmation dialog**. There is no PayPal Payouts integration or actual disbursement. **View in PayPal** opens the [sandbox homepage](https://www.sandbox.paypal.com/).
- PYUSD payments and Rosen wallet balances are **mock state**, with no token transfer, blockchain transaction, or wallet integration.
- Boss rejection displays a refund message but does not call a refund API.
- Approval/release, credit-score increases, and Mastercard eligibility are simulated.
- The “smart invoice” is an SVG generated locally by `invoiceImage`; it is not an API-generated or tax invoice.

Integration code: `src/api/paypal.js`, `src/api/request.js`, `src/pages/PayPalCallback.jsx`, and `src/App.jsx`.

## How we use AI

### Planned model integration: GPT-5.4 mini

**Status: planned, not yet implemented.** GPT-5.4 mini is the proposed model for Rosen's conversational assistant. The following describes the intended integration, not a completed or tested capability.

- Understand a Boss's request, extract the target market, budget, and requirements, and ask follow-up questions.
- Recommend Helpers from backend-provided candidate records and explain the match without inventing people or prices.
- Match Helpers to existing tasks based on their skills and preferences.
- Summarize submitted text and images to assist the Boss with proof review; the Boss retains final approval.
- Explain Dashboard metrics using supplied transaction aggregates.

The proposed architecture is **React frontend → Rosen backend → OpenAI Responses API (`gpt-5.4-mini`)**. The backend would keep the API key, supply task and candidate data, and validate structured model responses for the existing chat cards. Payment amounts, payment verification, refunds, and fund release would remain controlled by backend rules and explicit user actions.

This integration has not been built or evaluated and should not be counted as a completed AI or sponsor integration in a submission.

### AI-style experience in the application

The product demonstrates a conversational assistant that guides users through matching, task selection, proof review, and payment. **The current runtime uses deterministic scripts and predefined candidates, not a connected AI model.**

- `src/chat.js` defines the assistant's responses for each workflow stage.
- `src/hireTasks.js` and `src/bossCandidates.js` contain the mock tasks, recommendations, and proof descriptions.
- `src/hooks/useChat.js` manages state transitions, history, and cancellable typewriter output.
- User messages are entered manually. Matching and approval are not generated from semantic analysis, and uploaded proof is not evaluated by AI.

There are no runtime OpenAI, Anthropic, Gemini, or other LLM API calls; no embeddings, RAG, or model training; and AG Studio's AI agent/chat features are not configured. A future model integration would require a backend model endpoint and explicit handling of user data; it is not part of this implementation.

### AI used during development

OpenAI Codex assisted with implementation, iteration, and testing. The sample Aria Chen profile background was generated with an AI image-generation tool during development. These development-time uses are separate from the scripted assistant shipped in the app.

## Technologies and sponsor integrations

| Technology / service | Actual use in this repository |
| --- | --- |
| React 19 + React DOM | Profile, chat, dialogs, callback pages, and application state. |
| Vite 7 | Development server, production bundling, and lazy loading of the Dashboard. |
| JavaScript / JSX / CSS / HTML5 | Application logic, mobile layouts, animation, native dialogs, and file selection. |
| PayPal Sandbox | Boss checkout through the Rosen backend; callback verification. Helper payouts are simulated. |
| AG Studio 3 (`ag-studio-react`, `ag-studio`) | Embedded analytics with charts, KPI widgets, grids, filters, and a report editor. Uses a separate commercial/evaluation license. |
| Axios | HTTP client, response handling, and the `X-Token` authentication interceptor. |
| `md5` | Password hashing required by the existing demo login API contract. |
| Rosen beta backend | Authentication, sandbox order creation, and order-status checks; separately hosted, not part of this repo. |
| Docker + Nginx | Container build and static hosting, including callback routes and health checks. |
| Playwright + Node.js test runner | Browser workflow checks and unit tests. |
| OpenAI Codex / image generation | Development assistance and a generated demo profile image; no runtime model integration. |
| GPT-5.4 mini | Planned runtime assistant model; not yet integrated. See the AI section above. |

**APIMatic, Postman, Astro, and Render are not integrated in this repository.** They are not claimed as sponsor integrations. AG Grid/AG Charts capabilities used inside the dashboard are provided through AG Studio rather than separate standalone integrations.

## Dashboard and mock data

Open `/#/dashboard` directly, the **Dashboard** button at the top of Profile, **Business dashboard** below the profile cover, or **View dashboard** in Chat.

`src/dashboard/data.js` defines 72 reproducible mock orders dated 1–26 October 2026 across five countries. Received revenue excludes refunded and in-progress orders; amounts are USD equivalents. The dataset is independent of sandbox transactions and the Profile's simulated wallet balance.

- **Overview:** revenue, order count, countries, users acquired, and daily/country/channel/service charts.
- **Transactions:** status filter and order details.
- **Edit dashboard / Done editing:** switch AG Studio editing mode. Layout edits reset on refresh.
- On narrow screens, horizontally scroll the report canvas.
- AG Studio is lazy-loaded. Its large bundle produces a Vite chunk-size warning without being part of the initial Profile/Chat bundle.

AG Studio is proprietary commercial software. The local evaluation license expires **11 December 2026** and is evaluation-only, not for production. Repository users must obtain their own appropriate license. Without a key, local evaluation may display vendor notices and a watermark. See [AG Studio licensing](https://www.ag-grid.com/studio/react/enterprise-licence/) and [installation](https://www.ag-grid.com/studio/react/licence-install/).

## State, privacy, and prototype limitations

- Proof submission accepts text and up to five images (JPG, PNG, WebP, or GIF; 5 MB each). Files remain in browser memory and are not uploaded to a server or sent to an AI provider.
- Task conversations are local; messages are not delivered to real providers.
- Authentication stores `data.token` as `localStorage.xtoken`; subsequent Axios requests carry `X-Token`. Login itself skips authentication. Code `50018` clears the expired token. Payment creation is not automatically replayed.
- The default demo credentials are currently embedded in `src/api/auth.js` and are visible in client code. Replace this with user authentication and rotate any non-disposable credentials before broader release. MD5 matches the legacy API contract; it does not conceal a client-side password.
- **Restart demo** resets Chat, draft text, pending checkout, and task conversations, then opens role selection. Session wallet/credit totals remain until page refresh. Most chat state resets on refresh, except a pending PayPal snapshot.
- User messages are rendered as React text. Scripted rich text only supports bold and line breaks.

## Tests

```sh
npm run check  # JavaScript syntax check and production build
npm test      # Node.js unit tests
```

With the dev server running in another terminal:

```sh
npx playwright install chromium
npm run test:profile
npm run test:hire
npm run test:boss
npm run test:paypal
node tests/paypal-callback.mjs
node tests/auth.mjs
```

These payment tests mock network responses and do not create real PayPal orders. Most browser scripts accept `BASE_URL` (default `http://localhost:8080`) and `CHROME_PATH`. Dashboard tests use localhost:8080 and default to installed macOS Chrome; specify `CHROME_PATH` on other platforms:

```sh
CHROME_PATH='/path/to/chrome' node tests/dashboard.mjs
```

Additional scripts include `test:browser` and `test:mobile`; some older broad regression scripts may need updates as demo flows evolve. Screenshots are saved under ignored `test-results/`.

## Project structure

```text
src/
  Router.jsx                 Hash navigation and callback routing
  App.jsx                    Chat workflow and payment coordination
  chat.js                    Scripted assistant messages
  hireTasks.js               Helper task fixtures
  bossCandidates.js          Promoter fixtures, proofs, demo invoices
  api/                       Authentication, Axios, PayPal endpoints
  components/                Composer, messages, profile/payment/proof dialogs
  hooks/                     Chat state and mobile keyboard handling
  pages/                     Profile, Dashboard, PayPal callback pages
  dashboard/data.js          Mock analytics data and initial report layout
public/assets/               Images, icons, and proof fixtures
tests/                      Unit and browser tests
Dockerfile / compose.yaml   Container build and startup
nginx.conf                  Static hosting and callback routing
```

## Open source and third-party licensing

Project source code and documentation are licensed under the **MIT License**; see [LICENSE](LICENSE). The repository must remain publicly accessible for submission review. The GitHub URL above was verified as publicly readable on 30 October 2026. Local changes must still be committed and pushed to appear there.

The MIT license does not relicense third-party dependencies, AG Studio, PayPal branding, third-party photos, or reference/proof assets. Those retain their respective rights and license terms. Do not assume the bundled demo images are cleared for unrelated redistribution. AG Studio's evaluation key is not committed to the public repository; its trial terms remain independent of the project's MIT license.
