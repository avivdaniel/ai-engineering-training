import Link from "next/link";


export default function Home() {
  return (
      <div className="flex flex-col items-center min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <div className="flex-grow flex flex-col items-center justify-center">
          <h1 className="text-5xl mb-1"><span className='font-bold'>AI Engineering</span> Training :: <span className="text-orange-400">Starter</span></h1>
          <h3 className="mb-8">Built LLM driven application with JavaScript</h3>

          <Link href="/chat" className="mt-4">
            {'>'} Start here
          </Link>
        </div>

        <h4 className="text-sm mt-auto text-gray-500">Nir Kaufman | 2025</h4>
      </div>
  );
}
