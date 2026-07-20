# Payment Success Sheet — Post-Paddle Confirmation

**Date:** 2026-07-04  
**Status:** Approved  
**Related:** `2026-06-05-paddle-paywall-design.md`, `lib/billing/paddleCheckoutFlow.ts`, `lib/founder/finalizeFounderPurchase.ts`

---

## 1. Problem

After Paddle `checkout.completed`, the app closes the overlay and returns to Home or Settings **without in-app confirmation**. Users only saw Paddle’s own success screen; once dismissed, the app gives no feedback while webhook entitlement sync runs in the background.

### 1.1 Symptoms

| Path | Current behavior |
|------|------------------|
| **Export Paywall** ($49 season) | Paywall closes → user lands on underlying page → `pollEntitlementReady` runs silently → Settings `Paid ✓` appears later |
| **Founder Program** | Founder sheet closes → home screen → `finalizeFounderPurchase` runs silently → Widget hides when founder active |

### 1.2 User expectation

A **bottom sheet** in Snap1099 style confirming payment success, with a **two-phase** update when server entitlement is ready.

---

## 2. Decisions (approved)

| Topic | Choice |
|-------|--------|
| Scope | **Both** Export Paywall and Founder Program; copy differs by variant |
| UI | **Bottom sheet** (same family as Paywall / Founder sheets) |
| Timing | **Two-phase:** show immediately on Paddle close → update when entitlement ready |
| Export after ready | **Manual** — primary button `Download Tax Pack`; **no auto-share** |
| Founder after ready | Primary button **`Got it`** |
| Approach | **Orchestrator + presentational component** at `HomeScreen` level (not embedded in Paywall/Founder sheets) |

---

## 3. User flows

### 3.1 Export Paywall (`variant: export`)

```
checkout.completed
  → paddle.Checkout.close()
  → close PaywallSheet
  → remain on entry page (Home or Settings)
  → open PaymentSuccessSheet (phase: confirming)
       title: "Payment successful"
       hint:  "Confirming your {season} Tax Pack…"
       no enabled export CTA
       ✕ dismiss allowed (poll continues in background)
  → pollEntitlementReady(season, 30s) + refreshSeasonPaid
  → phase: ready
       title: "{season} Tax Pack unlocked"
       hint:  unlimited export this season
       primary:   "Download Tax Pack" → openExportAfterPrepare()
       secondary: "Not now"
  → on poll failure/timeout
  → phase: error + "Try again" / "Close"
```

**PRD note:** Original PRD step 5 was auto-share after payment. This design **supersedes** that step for MVP UX: user explicitly taps `Download Tax Pack` after confirmation. Rationale: success sheet must be visible before export; avoids share sheet stacking on Paddle close.

### 3.2 Founder Program (`variant: founder`)

```
checkout.completed
  → paddle.Checkout.close()
  → close FounderProgramSheet
  → home screen
  → open PaymentSuccessSheet (phase: confirming)
       title: "Payment successful"
       hint:  "Setting up your Founder benefits…"
  → finalizeFounderPurchase (poll + refreshSeasonPaid + waitForFounderActive)
  → fetch founder number if available
  → phase: ready
       title: "You're a Super Founder!"
       hint:  "{season} paid · Super Founder #{n}" (omit #n if unknown)
       primary: "Got it"
  → on failure → phase: error (Founder-specific hint)
```

---

## 4. Visual / interaction

- Overlay: `fixed inset-0 z-50 bg-black/70`, sheet slides from bottom
- Sheet: `rounded-t-3xl border-t-4 border-yellow-500 bg-zinc-900`
- Icon: green check (confirming + ready); error uses red text
- Confirming: small spinner + hint copy
- Touch targets ≥64px; buttons `active:scale-95`
- Colors: black / white / yellow (`#EAB308`) per product rules
- **Not** a core-receipt-flow modal — allowed in billing/settings context

---

## 5. Architecture

### 5.1 New files

| File | Responsibility |
|------|----------------|
| `lib/billing/paymentSuccessTypes.ts` | `PaymentSuccessVariant`, `PaymentSuccessPhase`, state types |
| `lib/billing/runPaymentSuccessFlow.ts` | Async orchestration: poll, phase transitions, founder number |
| `lib/billing/runPaymentSuccessFlow.test.ts` | State machine unit tests |
| `components/billing/PaymentSuccessSheet.tsx` | Presentational bottom sheet |

### 5.2 State model

```typescript
type PaymentSuccessVariant = "export" | "founder";

type PaymentSuccessPhase = "confirming" | "ready" | "error";

type PaymentSuccessState = {
  open: boolean;
  variant: PaymentSuccessVariant;
  phase: PaymentSuccessPhase;
  seasonLabel: string;
  founderNumber?: number | null;
};
```

### 5.3 Orchestrator

```typescript
runPaymentSuccessFlow({
  variant: "export" | "founder",
  season: string,
  onPhaseChange: (phase: PaymentSuccessPhase) => void,
  onFounderNumber?: (n: number | null) => void,
  pollEntitlementReady: (season: string, maxMs: number) => Promise<boolean>,
  refreshSeasonPaid: () => Promise<void>,
  waitForFounderActive?: () => Promise<boolean>,
  fetchFounderNumber?: () => Promise<number | null>,
  maxWaitMs?: number, // default 30_000
}): Promise<void>
```

**Transitions:**

1. Caller sets `{ open: true, phase: "confirming" }` synchronously when Paddle completes.
2. `export`: `pollEntitlementReady` → `refreshSeasonPaid` → `onPhaseChange("ready")`.
3. `founder`: `finalizeFounderPurchase` → optional `fetchFounderNumber` → `onPhaseChange("ready")`.
4. Any thrown error / false poll → `onPhaseChange("error")`.

### 5.4 Integration (modify existing)

| File | Change |
|------|--------|
| `components/settings/PaywallSheet.tsx` | Remove internal `confirming` phase UI; `onPaid` only signals parent |
| `components/home/sheets/FounderProgramSheet.tsx` | `onPaid` signals parent to open success sheet |
| `components/export/useTaxExportGate.tsx` | Replace inline poll+auto-export in `onPaid` with `onExportPaymentComplete` callback |
| `components/home/HomeScreen.tsx` | Own `paymentSuccess` state; render `PaymentSuccessSheet`; wire export CTA to `openExportAfterPrepare` |
| `lib/billing/paddleCheckoutFlow.ts` | **No change** — still close + returnToApp + async onPaid |

### 5.5 Dismiss / background behavior

| Action | Behavior |
|--------|----------|
| ✕ during `confirming` | Close sheet; **poll continues**; update `seasonPaid` / founder widget silently |
| Sheet already closed when poll completes | **Do not re-open** sheet |
| `Not now` / `Got it` | Close sheet |
| `Download Tax Pack` | Close sheet → `openExportAfterPrepare()` |
| `Try again` (error) | Re-run poll from `confirming` |

---

## 6. Copy (i18n)

Namespace: `copy.paymentSuccess` in `en-US`, `fr-FR`, `de-DE`.

### Export

| Key | en-US |
|-----|-------|
| `export.confirmingTitle` | Payment successful |
| `export.confirmingHint` | Confirming your {season} Tax Pack… |
| `export.readyTitle` | {season} Tax Pack unlocked |
| `export.readyHint` | You can export unlimited times this tax season. |
| `export.download` | Download Tax Pack |
| `export.notNow` | Not now |
| `export.errorTitle` | Still confirming payment |
| `export.errorHint` | Your payment may have gone through. Tap Try again or check Settings in a moment. |
| `export.retry` | Try again |
| `export.close` | Close |

### Founder

| Key | en-US |
|-----|-------|
| `founder.confirmingTitle` | Payment successful |
| `founder.confirmingHint` | Setting up your Founder benefits… |
| `founder.readyTitle` | You're a Super Founder! |
| `founder.readyHint` | {season} paid · Super Founder #{number} |
| `founder.readyHintNoNumber` | {season} paid |
| `founder.gotIt` | Got it |
| `founder.errorTitle` | Still confirming payment |
| `founder.errorHint` | Your Founder purchase may have gone through. Tap Try again or check Settings in a moment. |
| `founder.retry` | Try again |
| `founder.close` | Close |

---

## 7. Error & edge cases

| Scenario | Handling |
|----------|----------|
| Poll 30s timeout | `phase: error`; Retry re-enters confirming |
| User dismisses during confirming | Background poll continues; no re-open on success |
| Offline after payment | Poll fails → error; hint to reconnect |
| Duplicate `checkout.completed` | Ignore via existing `alreadyHandled` in paddle flow |
| Export with zero receipts | `Download Tax Pack` uses existing `exportEmptyTip` path |
| Already-paid season | Paywall gate prevents entry; no success sheet |

---

## 8. Testing

### Automated

- `runPaymentSuccessFlow.test.ts`: export confirming→ready, confirming→error, retry, founder with/without number

### Manual

1. Settings → Export → Paywall → Paddle test pay → success sheet confirming → ready → tap Download
2. Home → Founder → pay → success sheet → Got it → Widget hidden
3. Dismiss sheet during confirming → Settings eventually shows `Paid ✓`
4. Simulate slow webhook → error phase → Try again

---

## 9. Out of scope

- Paddle receipt email customization
- Confetti / animation beyond check icon
- Re-opening success sheet if user dismissed during confirming
- Subscription or refund UI
