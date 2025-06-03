"use client"

import type React from "react"

import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MessageCircle, User, Plus } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function Header() {
  const { user, loading, signOut } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // if (searchQuery.trim()) {
      router.push(`/listings?search=${encodeURIComponent(searchQuery)}`)
    // }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  return (
    <header className="bg-purdue-black text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative w-12 h-12 md:w-16 md:h-16">
              <Image
                src="/images/purdue-marketplace-logo.png"
                alt="Purdue Marketplace"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <div className="text-xl md:text-2xl font-bold">Purdue Marketplace</div>
              <div className="text-xs md:text-sm text-purdue-gold">By Boilermakers, For Boilermakers</div>
            </div>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4 md:mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search items, apartments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white text-black text-sm md:text-base"
              />
            </div>
          </form>

          {/* Navigation */}
          <nav className="flex items-center space-x-2 md:space-x-4">
            {loading ? (
              <div className="w-20 h-8 bg-gray-600 animate-pulse rounded"></div>
            ) : user ? (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-purdue-gold hover:text-black hidden sm:flex"
                >
                  <Link href="/sell">
                    <Plus className="w-4 h-4 mr-1 md:mr-2" />
                    <span className="text-lg hidden md:inline">Sell</span>
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="text-white hover:bg-purdue-gold hover:text-black">
                  <Link href="/messages">
                    <MessageCircle className="w-4 h-4 mr-1 md:mr-2" />
                    <span className="text-lg hidden md:inline">Messages</span>
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-white hover:bg-purdue-gold hover:text-black">
                      <User className="w-4 h-4 mr-1 md:mr-2" />
                      <span className="text-lg hidden md:inline">
                        {user.user_metadata?.full_name || user.email?.split("@")[0] || "Account"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/my-listings">My Listings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="sm:hidden">
                      <Link href="/sell">Create Listing</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="text-white hover:bg-purdue-gold hover:text-black">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild size="sm" className="bg-purdue-gold text-black hover:bg-yellow-400">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
