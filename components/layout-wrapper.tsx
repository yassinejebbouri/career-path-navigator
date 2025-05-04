"use client"

import { usePathname } from "next/navigation"
import Header from "@/components/header"

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname === "/login" || pathname === "/signup"

  return (
    <>
      {!isAuthPage && <Header />}
      <main className="min-h-screen bg-gray-50">{children}</main>
    </>
  )
}