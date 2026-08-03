"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">אירעה שגיאה</h1>
      <p className="text-gray-600 mb-8">משהו השתבש. נא לנסות שוב.</p>
      <button
        onClick={() => reset()}
        className="inline-block bg-primary-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
      >
        נסו שוב
      </button>
    </div>
  );
}
