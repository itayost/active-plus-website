import { SESSION_TTL_DAYS } from "./constants";
import type { Answers } from "./types";

const ID = "ap.funnel.session_id";
const ANSWERS = "ap.funnel.answers";
const STAMP = "ap.funnel.updated_at";
const TTL = SESSION_TTL_DAYS * 86_400_000;

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
  for (const key of [ID, ANSWERS, STAMP]) {
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

export function loadSession(now = Date.now()): { id: string; answers: Answers } {
  const stamp = Number(safeGet(STAMP) ?? 0);
  if (stamp && now - stamp > TTL) resetSession();
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
