"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Logo from "@/components/logo"
import { useAuth } from "@/lib/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Menu, X } from "lucide-react"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()

  useEffect(() => {
    // Close mobile menu when route changes
    setIsMenuOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  if (!isAuthenticated && pathname !== "/signup") return null

  return (
    <header className="border-b bg-white sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/welcome" className="flex items-center">
          <Logo className="h-8 w-auto" showImage={true} />
        </Link>

        {/* Mobile menu button */}
        <button
          className="md:hidden flex items-center text-gray-600"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/welcome"
            className={`text-gray-600 hover:text-slate-800 transition-colors ${
              pathname === "/welcome" ? "font-medium text-slate-800" : ""
            }`}
          >
            Home
          </Link>
          <Link
            href="/jobs"
            className={`text-gray-600 hover:text-slate-800 transition-colors ${
              pathname.startsWith("/jobs") ? "font-medium text-slate-800" : ""
            }`}
          >
            Jobs
          </Link>
          <Link
            href="/skills"
            className={`text-gray-600 hover:text-slate-800 transition-colors ${
              pathname === "/skills" ? "font-medium text-slate-800" : ""
            }`}
          >
            My Skills
          </Link>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 border-slate-200">
                  <User size={16} />
                  <span className="hidden sm:inline">{user.name || user.email?.split("@")[0]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>

        {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 top-[57px] bg-white z-50 p-4">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/welcome"
                className={`text-lg p-2 ${pathname === "/welcome" ? "font-medium text-slate-800" : "text-gray-600"}`}
              >
                Home
              </Link>
              <Link
                href="/jobs"
                className={`text-lg p-2 ${pathname.startsWith("/jobs") ? "font-medium text-slate-800" : "text-gray-600"}`}
              >
                Jobs
              </Link>
              <Link
                href="/skills"
                className={`text-lg p-2 ${pathname === "/skills" ? "font-medium text-slate-800" : "text-gray-600"}`}
              >
                My Skills
              </Link>
              <div className="border-t my-2"></div>
              {user && (
                <>
                  <div className="p-2">
                    <p className="text-sm text-gray-500">Signed in as</p>
                    <p className="font-medium">{user.name || user.email?.split("@")[0]}</p>
                  </div>
                  <Button variant="outline" className="justify-start" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </Button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
