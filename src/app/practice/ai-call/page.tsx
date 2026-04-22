'use client'

import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { AIAudioCall } from '@/components/lisan/ai-audio-call'

export default function AICallPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-4 pt-6 md:pt-10 pb-4 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/practice')}
            className="h-10 w-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black bengali-text">AI অডিও কল</h1>
            <p className="text-sm text-muted-foreground bengali-text">আরবিতে কথা বলুন, AI সংশোধন করবে</p>
          </div>
        </div>
      </div>

      {/* AI Call Component */}
      <div className="px-4 max-w-4xl mx-auto w-full pb-8">
        <AIAudioCall />
      </div>
    </div>
  )
}
