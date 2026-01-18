import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <nav className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary-600">
            פעילים פלוס
          </Link>
          <div className="flex gap-6">
            <Link
              href="/"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              בית
            </Link>
            <Link
              href="/about"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              אודות
            </Link>
            <Link
              href="/privacy-policy"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              מדיניות פרטיות
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
