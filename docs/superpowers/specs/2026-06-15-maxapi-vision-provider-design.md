# Max API Pro Vision Provider — Design

**Date:** 2026-06-15  
**Status:** Approved  
**Scope:** Route receipt Vision calls through [Max API Pro](https://maxapi.pro) OpenAI-compatible gateway; default model GPT-5.4 Mini.

## Background

Snap1099 uses a single server path: `processReceiptTax` → `processReceiptVision` (`lib/openai/receiptVision.ts`) with the official `openai` SDK, `chat.completions.create`, base64 vision, and `response_format: json_object`. Max API Pro exposes `/v1/chat/completions` — replace Base URL + API key + model slug only; prompts, Zod, and tax math unchanged.

## Decision

| Item | Choice |
|------|--------|
| Integration | **Env-only** (`OPENAI_BASE_URL` + existing key/model vars) |
| Production model | **GPT-5.4 Mini** (slug from Max API Pro console, e.g. `gpt-5.4-mini`) |
| Fallback Gemini | **Out of scope** (Phase 2 if failure rate warrants) |
| EU/US | Same model; existing region prompts |

## Environment

```bash
OPENAI_API_KEY=<maxapi-key>
OPENAI_BASE_URL=https://maxapi.pro/v1
OPENAI_MODEL=gpt-5.4-mini
OPENAI_TIMEOUT_MS=120000
OPENAI_MAX_RETRIES=2
```

- Empty `OPENAI_BASE_URL` → default OpenAI endpoint (backward compatible).
- Keys server-only; never `NEXT_PUBLIC_*`.

## Code changes

| File | Change |
|------|--------|
| `lib/server/env.ts` | `getOpenAiBaseUrl()` — trim, strip trailing slash |
| `lib/openai/receiptVision.ts` | Pass `baseURL` to `OpenAI` constructor |
| `lib/server/env.test.ts` | Unit test base URL normalization |
| `docs/tech/06-receipt-ai-pipeline.md` | Document gateway vars |

## Errors & logging

Unchanged: gateway 429/5xx/timeout → `processing` + client `/process` retry; `biz.openai` logs `openaiModel` from `aiRaw.model`; verify `canMockAi` skips gateway.

## Acceptance

1. With Max API env set, upload/process returns `done` or `blurry` (not stuck `processing` from misconfigured URL).
2. Without `OPENAI_BASE_URL`, behavior matches pre-change (direct OpenAI).
3. `npm run test:unit` + `npm run build` pass.

## Verification (manual)

1. Set `.env.local` with Max API key, base URL, `gpt-5.4-mini`.
2. Gallery-upload a clear receipt → `done` + `tax_amount`.
3. Check server log `module=biz.openai` includes model slug.
