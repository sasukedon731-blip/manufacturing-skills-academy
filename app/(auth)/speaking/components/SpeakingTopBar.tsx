"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

export default function SpeakingTopBar() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  return (
    <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between px-4 sm:px-6">
        <div>
          <div className="text-[11px] font-semibold tracking-wide text-emerald-700">AI日本語トレーニング</div>
          <div className="text-base font-bold text-slate-900">日本語スピーキング</div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm"
            aria-label="メニューを開く"
          >
            <span className="text-xl leading-none">☰</span>
          </button>

          {open ? (
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
              <Link href="/" className="block px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50" onClick={() => setOpen(false)}>
                TOPに戻る
              </Link>
              <Link href="/select-mode" className="block px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50" onClick={() => setOpen(false)}>
                学習を始める
              </Link>
              <Link href="/game?mode=normal" className="block px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50" onClick={() => setOpen(false)}>
                日本語バトル
              </Link>
              <Link href="/mypage" className="block px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50" onClick={() => setOpen(false)}>
                マイページ
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
