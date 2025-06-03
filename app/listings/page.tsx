"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { ListingsGrid } from "@/components/listings-grid"
import { ListingsFilter } from "@/components/listings-filter"

interface Listing {
  id: string
  title: string
  description: string
  price: number
  category: string
  condition: string
  images: string[]
  pickup_location: string
  pickup_timeline: string
  created_at: string
  profiles: {
    full_name: string
  }
}

interface FilterState {
  category: string
  condition: string
  minPrice: string
  maxPrice: string
  location: string
}

export default function ListingsPage() {
  const [allListings, setAllListings] = useState<Listing[]>([])
  const [filteredListings, setFilteredListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [currentFilters, setCurrentFilters] = useState<FilterState>({
    category: "all",
    condition: "all",
    minPrice: "",
    maxPrice: "",
    location: "",
  })
  const searchParams = useSearchParams()

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true)

      let query = supabase
        .from("listings")
        .select(`
          id,
          title,
          description,
          price,
          category,
          condition,
          images,
          pickup_location,
          pickup_timeline,
          created_at,
          profiles!inner (
            full_name
          )
        `)
        .eq("is_available", true)
        .order("created_at", { ascending: false })

      // Apply search filter from URL
      const search = searchParams.get("search")
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
      }

      // Apply category filter from URL
      const category = searchParams.get("category")
      if (category && category !== "all") {
        query = query.eq("category", category)
        setCurrentFilters((prev) => ({ ...prev, category }))
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      const listings = data || []
      setAllListings(listings)
      setFilteredListings(listings)
    } catch (error) {
      console.error("Error fetching listings:", error)
      setAllListings([])
      setFilteredListings([])
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  const applyFilters = useCallback(
    (filters: FilterState) => {
      let filtered = [...allListings]

      // Category filter
      if (filters.category && filters.category !== "all") {
        filtered = filtered.filter((listing) => listing.category === filters.category)
      }

      // Condition filter
      if (filters.condition && filters.condition !== "all") {
        filtered = filtered.filter((listing) => listing.condition === filters.condition)
      }

      // Price range filters
      if (filters.minPrice) {
        const minPrice = Number.parseFloat(filters.minPrice)
        if (!Number.isNaN(minPrice)) {
          filtered = filtered.filter((listing) => listing.price >= minPrice)
        }
      }

      if (filters.maxPrice) {
        const maxPrice = Number.parseFloat(filters.maxPrice)
        if (!Number.isNaN(maxPrice)) {
          filtered = filtered.filter((listing) => listing.price <= maxPrice)
        }
      }

      // Location filter
      if (filters.location) {
        filtered = filtered.filter((listing) =>
          listing.pickup_location?.toLowerCase().includes(filters.location.toLowerCase()),
        )
      }

      setFilteredListings(filtered)
      setCurrentFilters(filters)
    },
    [allListings],
  )

  const handleFilterChange = useCallback(
    (filters: FilterState) => {
      applyFilters(filters)
    },
    [applyFilters],
  )

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  // Apply filters when allListings changes
  useEffect(() => {
    if (allListings.length > 0) {
      applyFilters(currentFilters)
    }
  }, [allListings, currentFilters, applyFilters])

  const searchQuery = searchParams.get("search")
  const categoryQuery = searchParams.get("category")

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64">
          <ListingsFilter onFilterChange={handleFilterChange} initialFilters={currentFilters} />
        </aside>
        <main className="flex-1">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">
              {searchQuery
                ? `Search results for "${searchQuery}"`
                : categoryQuery
                  ? `${categoryQuery.charAt(0).toUpperCase() + categoryQuery.slice(1)} Listings`
                  : "All Listings"}
            </h1>
            <p className="text-gray-600">
              {filteredListings.length} {filteredListings.length === 1 ? "item" : "items"} found
            </p>
          </div>
          <ListingsGrid listings={filteredListings} loading={loading} />
        </main>
      </div>
    </div>
  )
}
