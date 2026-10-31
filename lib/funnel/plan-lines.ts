import { COPY } from "./copy";

const P = COPY.planBuilding;
const MAX_NAMED = 3;

/** "א", "א וב", "א, ב וג": the Hebrew list, with ו joined to the last item. */
function joinHebrew(items: readonly string[]): string {
  if (items.length < 2) return items.join("");
  return `${items.slice(0, -1).join(", ")} ו${items[items.length - 1]}`;
}

/**
 * The loader's checklist. When the visitor marked areas that hurt, the middle
 * line names them, so the plan is seen being built from their own answers;
 * otherwise it is the owner's copy unchanged.
 */
export function planChecklist(painAreas: readonly string[] | undefined): readonly { at: number; label: string }[] {
  const named = (painAreas ?? []).map((a) => P.painAreas[a]).filter((a): a is string => Boolean(a));
  if (named.length === 0) return P.checklist;
  const areas = named.length > MAX_NAMED ? P.painMany : joinHebrew(named);
  return P.checklist.map((l, i) => (i === 1 ? { ...l, label: P.painLine.replace("{areas}", areas) } : l));
}
