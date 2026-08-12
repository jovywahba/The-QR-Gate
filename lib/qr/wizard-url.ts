import type { WizardStep } from "./types";

/**
 * Resolve the wizard step from a URL `?step=` value.
 *
 * Rules (shared by the server route `/create` and the client Back/Forward
 * handler, so a deep link and a popstate always agree):
 *  - An explicit, valid step (2, 3 or 4) always wins.
 *  - A chosen type with no/invalid step opens **Step 2 (Add Content)** —
 *    deep-linking to a type (`/create?type=wifi`) should land on its form,
 *    not bounce back to the Step-1 type grid.
 *  - No type → **Step 1** (the type picker); this is also the safe fallback
 *    for an unknown/invalid `?type=`.
 */
export function resolveWizardStep(
  rawStep: string | number | null | undefined,
  hasType: boolean,
): WizardStep {
  // Without a chosen type there is nothing to add/design/download, so the
  // only meaningful step is the Step-1 type picker.
  if (!hasType) return 1;
  const n = typeof rawStep === "number" ? rawStep : Number(rawStep);
  if (n === 2 || n === 3 || n === 4) return n as WizardStep;
  return 2;
}
