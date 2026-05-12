import Link from 'next/link'
import { getAllPages } from '@/lib/contentful/contentfulClient'

export default async function Home() {
  const pages = await getAllPages()

  return (
    <main className="max-w-2xl mx-auto py-16 px-6">
      <h1 className="text-2xl font-semibold mb-8">Pages</h1>
      {pages.length === 0 ? (
        <p className="text-zinc-500">No pages found.</p>
      ) : (
        <ul className="divide-y divide-zinc-200">
          {pages.map((page) => (
            <li key={page.slug}>
              <Link
                href={`/preview/${page.slug}`}
                className="flex items-center justify-between py-4 hover:text-blue-600 transition-colors"
              >
                <span>{page.title}</span>
                <span className="text-sm text-zinc-400">/preview/{page.slug}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
