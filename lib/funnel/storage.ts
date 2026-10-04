import { SESSION_TTL_DAYS } from "./constants";
import { FUNNEL_STEPS } from "./contract.generated";
import type { Answers, Step } from "./types";

const ID = "ap.funnel.session_id";
const ANSWERS = "ap.funnel.answers";
export const STAMP = "ap.funnel.updated_at";
export const STEP = "ap.funnel.step";
export const TTL = SESSION_TTL_DAYS * 86_400_000;

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    // Private mode or blocked storage: behave as if nothing is stored.
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage: the funnel keeps working in memory.
  }
}

export function resetSession(): void {
  for (const key of [ID, ANSWERS, STAMP, STEP]) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Private mode or blocked storage: there is nothing persisted to clear.
    }
  }
}

function parseAnswers(raw: string | null): Answers {
  try {
    const parsed: unknown = JSON.parse(raw ?? "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Answers) : {};
  } catch {
    return {};
  }
}

/** Clears the stored session once it is older than the TTL. */
function expireIfStale(now: number): void {
  const stamp = Number(safeGet(STAMP) ?? 0);
  if (stamp && now - stamp > TTL) resetSession();
}

export function loadSession(now = Date.now()): { id: string; answers: Answers } {
  expireIfStale(now);
  let id = safeGet(ID);
  if (!id) {
    id = crypto.randomUUID().toLowerCase();
    safeSet(ID, id);
    safeSet(STAMP, String(now));
  }
  return { id, answers: parseAnswers(safeGet(ANSWERS)) };
}

export function saveAnswers(answers: Answers): void {
  safeSet(ANSWERS, JSON.stringify(answers));
  safeSet(STAMP, String(Date.now()));
}

/** The loader is a transition, not a place: a visitor who left during it resumes on the next step. */
const RESTORE_AS: Partial<Record<Step, Step>> = { planBuilding: "time" };

const isStep = (value: string | null): value is Step =>
  value !== null && (FUNNEL_STEPS as readonly string[]).includes(value);

export function saveStep(step: Step): void {
  safeSet(STEP, step);
  safeSet(STAMP, String(Date.now()));
}

export function loadStep(now = Date.now()): Step | null {
  expireIfStale(now);
  const raw = safeGet(STEP);
  if (!isStep(raw)) return null;
  return RESTORE_AS[raw] ?? raw;
}
