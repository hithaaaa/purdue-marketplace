"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { ProtectedRoute } from "@/components/protected-route"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Eye, EyeOff, MapPin, Clock, MessageCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"

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
  is_available: boolean
  is_sold: boolean
  sold_at: string
  created_at: string
  message_count?: number
}

export default function MyListingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchMyListings()
    }
  }, [user])

  const fetchMyListings = async () => {
    if (!user) return

    // Fetch listings with message counts
    const { data: listingsData, error: listingsError } = await supabase
      .from("listings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (listingsError) {
      console.error("Error fetching listings:", listingsError)
      toast({
        title: "Error",
        description: "Failed to load your listings",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    // Fetch message counts for each listing
    const listingsWithCounts = await Promise.all(
      (listingsData || []).map(async (listing) => {
        const { count } = await supabase
          .from("conversations")
          .select("*", { count: "exact", head: true })
          .eq("listing_id", listing.id)

        return {
          ...listing,
          message_count: count || 0,
        }
      }),
    )

    setListings(listingsWithCounts)
    setLoading(false)
  }

  const toggleAvailability = async (listingId: string, currentStatus: boolean) => {
    const { error } = await supabase.from("listings").update({ is_available: !currentStatus }).eq("id", listingId)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update listing status",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: `Listing ${!currentStatus ? "activated" : "deactivated"}`,
      })
      fetchMyListings()
    }
  }

  const markAsSold = async (listingId: string) => {
    const { error } = await supabase
      .from("listings")
      .update({
        is_sold: true,
        sold_at: new Date().toISOString(),
        is_available: false,
      })
      .eq("id", listingId)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to mark as sold",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Listing marked as sold! It will disappear in 7 days.",
      })
      fetchMyListings()
    }
  }

  const deleteListing = async (listingId: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return

    const { error } = await supabase.from("listings").delete().eq("id", listingId)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete listing",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Listing deleted successfully",
      })
      fetchMyListings()
    }
  }

  const getDaysUntilDeletion = (soldAt: string) => {
    const soldDate = new Date(soldAt)
    const deletionDate = new Date(soldDate.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days later
    const now = new Date()
    const daysLeft = Math.ceil((deletionDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
    return Math.max(0, daysLeft)
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">My Listings</h1>
          <Button asChild className="bg-purdue-gold text-black hover:bg-yellow-400">
            <Link href="/sell">
              <Plus className="w-4 h-4 mr-2" />
              Create New Listing
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
                <p className="text-gray-600 mb-4">Start selling by creating your first listing. It's quick and easy!</p>
                <Button asChild className="bg-purdue-gold text-black hover:bg-yellow-400">
                  <Link href="/sell">Create Your First Listing</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => {
              const isSold = listing.is_sold
              const daysLeft = isSold && listing.sold_at ? getDaysUntilDeletion(listing.sold_at) : null

              return (
                <Card key={listing.id} className={`overflow-hidden ${isSold ? "opacity-75" : ""}`}>
                  <div className="relative h-48">
                    <Image
                      src={listing.images?.[0] || "/placeholder.svg?height=200&width=300"}
                      alt={listing.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 left-2 flex gap-2 flex-wrap">
                      <Badge className="bg-purdue-gold text-black">{listing.category}</Badge>
                      {isSold ? (
                        <Badge variant="destructive">SOLD</Badge>
                      ) : (
                        <Badge variant={listing.is_available ? "default" : "secondary"}>
                          {listing.is_available ? "Active" : "Inactive"}
                        </Badge>
                      )}
                    </div>
                    {listing.message_count > 0 && (
                      <div className="absolute top-2 right-2 flex items-center bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        {listing.message_count}
                      </div>
                    )}
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
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <Clock className="w-4 h-4 mr-1" />
                        {listing.pickup_timeline}
                      </div>
                    )}

                    {isSold && daysLeft !== null && (
                      <div className="bg-red-50 p-2 rounded text-sm text-red-700 mb-2">
                        Will be deleted in {daysLeft} day{daysLeft !== 1 ? "s" : ""}
                      </div>
                    )}

                    <p className="text-xs text-gray-500">
                      Created {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
                    </p>
                  </CardContent>

                  <CardFooter className="p-4 pt-0 flex flex-col gap-2">
                    {!isSold && (
                      <>
                        <div className="flex gap-2 w-full">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleAvailability(listing.id, listing.is_available)}
                            className="flex-1"
                          >
                            {listing.is_available ? (
                              <>
                                <EyeOff className="w-4 h-4 mr-1" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4 mr-1" />
                                Activate
                              </>
                            )}
                          </Button>

                          <Button variant="outline" size="sm" asChild className="flex-1">
                            <Link href={`/listings/${listing.id}/edit`}>
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Link>
                          </Button>
                        </div>

                        <div className="flex gap-2 w-full">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsSold(listing.id)}
                            className="flex-1 text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Mark as Sold
                          </Button>

                          <Button variant="outline" size="sm" asChild className="flex-1">
                            <Link href={`/listings/${listing.id}`} className="">View Details</Link>
                          </Button>
                        </div>
                      </>
                    )}

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteListing(listing.id)}
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
