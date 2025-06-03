"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { MapPin, Clock } from "lucide-react"

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
  user_id: string
}

export function FeaturedListings() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFeaturedListings() {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("is_available", true)
        .order("created_at", { ascending: false })
        .limit(6)

      if (error) {
        console.error("Error fetching listings:", error)
      } else {
        setListings(data || [])
      }
      setLoading(false)
    }

    fetchFeaturedListings()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-t-lg"></div>
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((listing) => (
        <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <div className="relative h-48">
            <Image
              src={listing.images?.[0] || "/placeholder.svg?height=200&width=300"}
              alt={listing.title}
              fill
              className="object-cover"
            />
            <Badge className="absolute top-2 left-2 bg-purdue-gold text-black">{listing.category}</Badge>
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-2 line-clamp-1">{listing.title}</h3>
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{listing.description}</p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-purdue-gold">${listing.price}</span>
              {listing.condition && <Badge variant="outline">{listing.condition}</Badge>}
            </div>
            {listing.pickup_location && (
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <MapPin className="w-4 h-4 mr-1" />
                {listing.pickup_location}
              </div>
            )}
            {listing.pickup_timeline && (
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                {listing.pickup_timeline}
              </div>
            )}
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Button asChild className="text-white w-full bg-purdue-black hover:bg-gray-800">
              <Link href={`/listings/${listing.id}`}>View Details</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
