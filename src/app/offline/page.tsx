export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-3xl border border-border bg-card p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-3xl font-black">
          ل
        </div>
        <h1 className="text-2xl font-black mb-3 bengali-text">ইন্টারনেট সংযোগ নেই</h1>
        <p className="text-sm text-muted-foreground mb-6 bengali-text">
          আপনি অফলাইনে আছেন। সংযোগ ফিরে এলে আবার চেষ্টা করুন।
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
        >
          হোমে ফিরুন
        </a>
      </div>
    </main>
  )
}
