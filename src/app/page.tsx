import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h2 className="text-xl font-bold">Dev by NekoFi</h2>
      <h1 className="text-4xl font-bold mb-8">NK Simple Image Annotator</h1>
      <Link href="/import">
        <Button>Start Labeling</Button>
      </Link>
    </main>
  )
}