import { FeaturedListings } from "@/components/featured-listings"
import { CategoryGrid } from "@/components/category-grid"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Search, ShoppingBag, Home, MessageCircle } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purdue-black to-gray-800 text-white py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6">Purdue Marketplace</h1>
          <p className="text-lg md:text-xl mb-6 md:mb-8 max-w-2xl mx-auto">
            The official marketplace for Boilermakers to buy, sell items, and find subleases. Safe, secure, and built
            for our community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-purdue-gold text-black hover:bg-yellow-400">
              <Link href="/listings">
                <Search className="w-5 h-5 mr-2" />
                Browse Items
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-black border-white hover:bg-yellow-100 hover:text-black"
            >
              <Link href="/sell">
                <ShoppingBag className="w-5 h-5 mr-2" />
                Start Selling
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">Why Choose Purdue Marketplace?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purdue-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">Student-Only Community</h3>
              <p className="text-gray-600 text-sm md:text-base">
                Exclusively for Purdue students, ensuring a trusted and safe environment.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purdue-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">Built-in Messaging</h3>
              <p className="text-gray-600 text-sm md:text-base">
                Communicate directly with buyers and sellers through our secure messaging system.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purdue-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <Home className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">Sublease Apartments</h3>
              <p className="text-gray-600 text-sm md:text-base">
                Find or offer apartment subleases with detailed information and photos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">Shop by Category</h2>
          <CategoryGrid />
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">Featured Listings</h2>
          <FeaturedListings />
        </div>
      </section>
    </div>
  )
}
