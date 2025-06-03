"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, MapPin, Clock, User, MessageCircle, Phone, DollarSign } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface Listing {
  id: string
  user_id: string
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
    phone: string
    venmo_username: string
    zelle_email: string
  }
}

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [startingConversation, setStartingConversation] = useState(false)

  useEffect(() => {
    fetchListing()
  }, [params.id])

  const fetchListing = async () => {
    const { data, error } = await supabase
      .from("listings")
      .select(`
        *,
        profiles (full_name, phone, venmo_username, zelle_email)
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Error fetching listing:", error)
      router.push("/listings")
    } else {
      setListing(data)
    }
    setLoading(false)
  }

  const startConversation = async () => {
    if (!user || !listing) {
      router.push("/login")
      return
    }

    if (user.id === listing.user_id) {
      toast({
        title: "Cannot message yourself",
        description: "You cannot start a conversation with your own listing",
        variant: "destructive",
      })
      return
    }

    setStartingConversation(true)

    // Check if conversation already exists
    const { data: existingConversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listing.id)
      .eq("buyer_id", user.id)
      .eq("seller_id", listing.user_id)
      .single()

    if (existingConversation) {
      router.push("/messages")
      return
    }

    // Create new conversation
    const { error } = await supabase.from("conversations").insert({
      listing_id: listing.id,
      buyer_id: user.id,
      seller_id: listing.user_id,
    })

    if (error) {
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Conversation started! Check your messages.",
      })
      router.push("/messages")
    }

    setStartingConversation(false)
  }

  if (loading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Listing not found</h1>
        <Button asChild>
          <Link href="/listings">Back to Listings</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-4">
          <div className="relative h-96 rounded-lg overflow-hidden">
            <Image
              src={listing.images?.[selectedImageIndex] || "/placeholder.svg?height=400&width=600"}
              alt={listing.title}
              fill
              className="object-cover"
            />
            <Badge className="absolute top-4 left-4 bg-purdue-gold text-black">{listing.category}</Badge>
          </div>

          {listing.images && listing.images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {listing.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImageIndex === index ? "border-purdue-gold" : "border-gray-200"
                  }`}
                >
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`${listing.title} ${index + 1}`}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
            <div className="flex items-center space-x-4 mb-4">
              <span className="text-3xl font-bold text-purdue-gold">${listing.price}</span>
              {listing.condition && <Badge variant="outline">{listing.condition}</Badge>}
            </div>
          </div>

          {listing.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
            </div>
          )}

          <div className="space-y-3">
            {listing.pickup_location && (
              <div className="flex items-center text-gray-600">
                <MapPin className="w-5 h-5 mr-2" />
                <span>Pickup: {listing.pickup_location}</span>
              </div>
            )}

            {listing.pickup_timeline && (
              <div className="flex items-center text-gray-600">
                <Clock className="w-5 h-5 mr-2" />
                <span>Available: {listing.pickup_timeline}</span>
              </div>
            )}

            <div className="flex items-center text-gray-600">
              <User className="w-5 h-5 mr-2" />
              <span>Seller: {listing.profiles.full_name}</span>
            </div>
          </div>

          {/* Contact Information */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Contact Seller</h3>
              <div className="space-y-3">
                {listing.profiles.phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="w-4 h-4 mr-2" />
                    <span>{listing.profiles.phone}</span>
                  </div>
                )}

                {listing.profiles.venmo_username && (
                  <div className="flex items-center text-sm">
                    <DollarSign className="w-4 h-4 mr-2" />
                    <span>Venmo: @{listing.profiles.venmo_username}</span>
                  </div>
                )}

                {listing.profiles.zelle_email && (
                  <div className="flex items-center text-sm">
                    <DollarSign className="w-4 h-4 mr-2" />
                    <span>Zelle: {listing.profiles.zelle_email}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            {user && user.id !== listing.user_id ? (
              <Button
                onClick={startConversation}
                disabled={startingConversation}
                className="w-full bg-purdue-gold text-black hover:bg-yellow-400"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {startingConversation ? "Starting conversation..." : "Message Seller"}
              </Button>
            ) : !user ? (
              <Button asChild className="w-full bg-purdue-gold text-black hover:bg-yellow-400">
                <Link href="/login">Login to Contact Seller</Link>
              </Button>
            ) : (
              <div className="text-center text-gray-500 py-4">This is your listing</div>
            )}
          </div>

          <div className="text-sm text-gray-500">
            Posted {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
          </div>
        </div>
      </div>
    </div>
  )
}
