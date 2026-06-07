"use client";

export type ReceiptDetailStepperPhase = "processing" | "blurry" | "done";

interface ReceiptDetailStepperProps {
  phase: ReceiptDetailStepperPhase;
}

type StepState = "done" | "active" | "pending" | "failed";

function StepIcon({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <span
        className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-sm font-black text-black"
        aria-hidden
      >
        ✓
      </span>
    );
  }
  if (state === "active") {
    return (
      <span
        className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-yellow-500 bg-zinc-900"
        aria-hidden
      >
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-yellow-500 border-t-transparent" />
      </span>
    );
  }
  if (state === "failed") {
    return (
      <span
        className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/20 text-sm font-black text-red-400"
        aria-hidden
      >
        ✕
      </span>
    );
  }
  return (
    <span
      className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-zinc-700 bg-zinc-950"
      aria-hidden
    />
  );
}

function stepStates(phase: ReceiptDetailStepperPhase): [StepState, StepState, StepState] {
  if (phase === "done") return ["done", "done", "done"];
  if (phase === "blurry") return ["done", "failed", "pending"];
  return ["done", "active", "pending"];
}

const LABELS = ["Photo", "Analyzing", "Calculating"] as const;

export function ReceiptDetailStepper({ phase }: ReceiptDetailStepperProps) {
  const states = stepStates(phase);

  return (
    <div
      className="mx-auto mt-6 flex w-full max-w-sm items-start justify-between gap-2"
      aria-label="Processing progress"
    >
      {LABELS.map((label, index) => {
        const state = states[index]!;
        const labelColor =
          state === "active"
            ? "text-yellow-400"
            : state === "done"
              ? "text-green-400"
              : state === "failed"
                ? "text-red-400"
                : "text-zinc-600";

        return (
          <div key={label} className="flex flex-1 flex-col items-center gap-2">
            <StepIcon state={state} />
            <span className={`text-[10px] font-bold uppercase tracking-wide ${labelColor}`}>
              {label}
            </span>
            {index < LABELS.length - 1 && (
              <span
                className="pointer-events-none absolute hidden"
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
