"use client"

import Link from "next/link"

export default function SpeakingBottomNav() {
  return (
    <div className="sticky bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:px-6">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          href="/"
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-slate-900 text-base font-bold text-white shadow-sm"
        >
          TOPに戻る
        </Link>
      </div>
    </div>
  )
}
