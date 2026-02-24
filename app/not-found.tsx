import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <h1 className="text-4xl font-medium text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-600 mb-6">
          The page you’re looking for doesn’t exist. It may have been moved, deleted, or the URL might have a typo.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-block bg-success-500 text-white px-6 py-3 rounded-full font-medium hover:bg-success-600 transition-colors"
          >
            Home
          </Link>
          <Link
            href="/campaigns"
            className="inline-block border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-full font-medium hover:bg-gray-50 transition-colors"
          >
            Browse campaigns
          </Link>
          <Link
            href="/contact"
            className="inline-block border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-full font-medium hover:bg-gray-50 transition-colors"
          >
            Contact us
          </Link>
        </div>
      </div>
    </div>
  );
}
