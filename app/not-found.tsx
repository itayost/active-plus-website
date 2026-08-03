import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">הדף לא נמצא</h2>
      <p className="text-gray-600 mb-8">הדף שחיפשת אינו קיים או שהוסר.</p>
      <Link
        href="/"
        className="inline-block bg-primary-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
      >
        חזרה לדף הבית
      </Link>
    </div>
  );
}
