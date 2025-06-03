"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { User, Phone, DollarSign, Mail, Calendar, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface UserProfile {
  id: string
  email: string
  full_name: string
  phone: string
  venmo_username: string
  zelle_email: string
  created_at: string
}

interface UserListing {
  id: string
  title: string
  price: number
  category: string
  images: string[]
  created_at: string
  is_available: boolean
}

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [listings, setListings] = useState<UserListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchUserProfile = async () => {
      try {
        setLoading(true)
        setError(null)

        // Validate the user ID parameter
        if (!params.id || typeof params.id !== "string") {
          throw new Error("Invalid user ID")
        }

        // Fetch user profile with timeout
        const profilePromise = supabase.from("profiles").select("*").eq("id", params.id).single()

        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 10000))

        const { data: profileData, error: profileError } = await Promise.race([profilePromise, timeoutPromise])

        if (!isMounted) return

        if (profileError) {
          if (profileError.code === "PGRST116") {
            throw new Error("User not found")
          }
          throw profileError
        }

        setProfile(profileData)

        // Fetch user's active listings with timeout
        const listingsPromise = supabase
          .from("listings")
          .select("id, title, price, category, images, created_at, is_available")
          .eq("user_id", params.id)
          .eq("is_available", true)
          .eq("is_sold", false)
          .order("created_at", { ascending: false })
          .limit(6)

        const { data: listingsData, error: listingsError } = await Promise.race([listingsPromise, timeoutPromise])

        if (!isMounted) return

        if (listingsError) {
          console.error("Error fetching listings:", listingsError)
          // Don't throw here, just log the error and continue with empty listings
          setListings([])
        } else {
          setListings(listingsData || [])
        }
      } catch (error) {
        if (!isMounted) return

        console.error("Error fetching profile:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to load profile"
        setError(errorMessage)

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchUserProfile()

    return () => {
      isMounted = false
    }
  }, [params.id, toast])

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push("/messages")
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6 w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="lg:col-span-2 h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">{error || "User not found"}</h1>
        <Button onClick={handleGoBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={handleGoBack} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <Card>
            <CardHeader className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarFallback className="bg-purdue-gold text-black text-2xl font-bold">
                  {profile.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">{profile.full_name || "Unknown User"}</CardTitle>
              <p className="text-sm text-gray-500">
                Member since {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-sm">
                <Mail className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-gray-600">{profile.email}</span>
              </div>

              {profile.phone && (
                <div className="flex items-center text-sm">
                  <Phone className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-gray-600">{profile.phone}</span>
                </div>
              )}

              {profile.venmo_username && (
                <div className="flex items-center text-sm">
                  <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-gray-600">Venmo: @{profile.venmo_username}</span>
                </div>
              )}

              {profile.zelle_email && (
                <div className="flex items-center text-sm">
                  <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-gray-600">Zelle: {profile.zelle_email}</span>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User's Listings */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Active Listings ({listings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {listings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No active listings</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {listings.map((listing) => (
                      <Link key={listing.id} href={`/listings/${listing.id}`}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                          <div className="relative h-32">
                            <img
                              src={listing.images?.[0] || "/placeholder.svg?height=150&width=200"}
                              alt={listing.title}
                              className="w-full h-full object-cover rounded-t-lg"
                            />
                            <Badge className="absolute top-2 left-2 bg-purdue-gold text-black">
                              {listing.category}
                            </Badge>
                          </div>
                          <CardContent className="p-3">
                            <h3 className="font-semibold text-sm mb-1 line-clamp-1">{listing.title}</h3>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-purdue-gold">${listing.price}</span>
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}

                {listings.length > 0 && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" asChild>
                      <Link href={`/listings?user=${params.id}`}>View All Listings</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
