const MOBILE = /^05\d{8}$/;

function toLocal(raw: string): string {
  const digits = raw.trim().replace(/[\s-]/g, "");
  if (digits.startsWith("+972")) return `0${digits.slice(4)}`;
  if (digits.startsWith("972")) return `0${digits.slice(3)}`;
  return digits;
}

export const isIsraeliMobile = (raw: string) => MOBILE.test(toLocal(raw));

export function toE164(raw: string): string {
  const local = toLocal(raw);
  if (!MOBILE.test(local)) throw new Error("Not an Israeli mobile number");
  return `+972${local.slice(1)}`;
}

export function formatLocal(e164: string): string {
  const local = toLocal(e164);
  return `${local.slice(0, 3)}-${local.slice(3)}`;
}
