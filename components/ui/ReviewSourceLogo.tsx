/**
 * The review source as its own mark (Google's "G", Facebook's "f"), in the
 * brands' colours. The text label stays for screen readers.
 */
type Source = "google" | "facebook";

const LABEL: Record<Source, string> = {
  google: "ביקורת בגוגל",
  facebook: "ביקורת בפייסבוק",
};

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="h-full w-full">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-full w-full">
      <path fill="#1877F2" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.026 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.93-1.956 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
      <path fill="#fff" d="M16.671 15.563l.532-3.49h-3.328V9.808c0-.956.465-1.886 1.956-1.886h1.513V4.95s-1.374-.236-2.686-.236c-2.741 0-4.533 1.671-4.533 4.697v2.66H7.078v3.49h3.047V24a12.1 12.1 0 0 0 3.75 0v-8.437z" />
    </svg>
  );
}

export default function ReviewSourceLogo({ source }: { source: Source }) {
  return (
    <span role="img" aria-label={LABEL[source]} className="block h-8 w-8 shrink-0">
      {source === "google" ? <GoogleMark /> : <FacebookMark />}
    </span>
  );
}
