"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Upload, X, Save } from "lucide-react"

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
}

export default function EditListingPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    condition: "",
    pickup_location: "",
    pickup_timeline: "",
  })
  const [images, setImages] = useState<string[]>([])

  useEffect(() => {
    if (user) {
      fetchListing()
    }
  }, [user, params.id])

  const fetchListing = async () => {
    const { data, error } = await supabase.from("listings").select("*").eq("id", params.id).single()

    if (error || !data) {
      toast({
        title: "Error",
        description: "Listing not found",
        variant: "destructive",
      })
      router.push("/my-listings")
      return
    }

    if (data.user_id !== user?.id) {
      toast({
        title: "Unauthorized",
        description: "You can only edit your own listings",
        variant: "destructive",
      })
      router.push("/my-listings")
      return
    }

    setListing(data)
    setFormData({
      title: data.title,
      description: data.description || "",
      price: data.price.toString(),
      category: data.category,
      condition: data.condition || "",
      pickup_location: data.pickup_location || "",
      pickup_timeline: data.pickup_timeline || "",
    })
    setImages(data.images || [])
    setLoading(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageAdd = () => {
    const newImage = `/placeholder.svg?height=200&width=200&text=Image${images.length + 1}`
    setImages((prev) => [...prev, newImage])
  }

  const handleImageRemove = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!listing) return

    setSaving(true)

    try {
      const { error } = await supabase
        .from("listings")
        .update({
          title: formData.title,
          description: formData.description,
          price: Number.parseFloat(formData.price),
          category: formData.category,
          condition: formData.condition,
          pickup_location: formData.pickup_location,
          pickup_timeline: formData.pickup_timeline,
          images: images,
          updated_at: new Date().toISOString(),
        })
        .eq("id", listing.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Listing updated successfully!",
      })

      router.push("/my-listings")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update listing. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6 w-1/3"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!listing) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to My Listings
      </Button>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Edit Listing</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="What are you selling?"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe your item..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="textbooks">Textbooks</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="sublease">Sublease</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="condition">Condition</Label>
              <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="like-new">Like New</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pickup_location">Pickup Location</Label>
              <Input
                id="pickup_location"
                value={formData.pickup_location}
                onChange={(e) => handleInputChange("pickup_location", e.target.value)}
                placeholder="e.g., Cary Quad, Village, etc."
              />
            </div>

            <div>
              <Label htmlFor="pickup_timeline">Pickup Timeline</Label>
              <Input
                id="pickup_timeline"
                value={formData.pickup_timeline}
                onChange={(e) => handleInputChange("pickup_timeline", e.target.value)}
                placeholder="e.g., Weekdays after 5pm, Weekends"
              />
            </div>

            <div>
              <Label>Images</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => handleImageRemove(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {images.length < 5 && (
                  <Button type="button" variant="outline" className="h-24 border-dashed" onClick={handleImageAdd}>
                    <Upload className="h-6 w-6" />
                  </Button>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">Add up to 5 images</p>
            </div>

            <Button type="submit" className="w-full bg-purdue-gold text-black hover:bg-yellow-400" disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving changes..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
