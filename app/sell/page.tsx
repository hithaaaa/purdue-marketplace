"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { ProtectedRoute } from "@/components/protected-route"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Camera, X, MapPin, Clock, DollarSign, Tag, Home, Bed } from "lucide-react"
import Image from "next/image"

export default function SellPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    priceMax: "",
    isPriceRange: false,
    category: "",
    condition: "",
    pickup_location: "",
    pickup_timeline: "",
    // Sublease specific fields
    priceType: "month", // month, semester
    leaseLength: "",
    bedrooms: "",
    bathrooms: "",
  })
  const [images, setImages] = useState<string[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    if (images.length + files.length > 5) {
      toast({
        title: "Too many images",
        description: "You can only upload up to 5 images",
        variant: "destructive",
      })
      return
    }

    setUploadingImages(true)

    try {
      const newImageUrls: string[] = []
      const newImageFiles: File[] = []

      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Invalid file type",
            description: "Please upload only image files",
            variant: "destructive",
          })
          continue
        }

        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: "Please upload images smaller than 5MB",
            variant: "destructive",
          })
          continue
        }

        const previewUrl = URL.createObjectURL(file)
        newImageUrls.push(previewUrl)
        newImageFiles.push(file)
      }

      setImages((prev) => [...prev, ...newImageUrls])
      setImageFiles((prev) => [...prev, ...newImageFiles])
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to process images",
        variant: "destructive",
      })
    } finally {
      setUploadingImages(false)
    }
  }

  const handleImageRemove = (index: number) => {
    URL.revokeObjectURL(images[index])
    setImages((prev) => prev.filter((_, i) => i !== index))
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadImagesToStorage = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return []

    const uploadedUrls: string[] = []

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i]
      const fileExt = file.name.split(".").pop()
      const fileName = `${user?.id}/${Date.now()}-${i}.${fileExt}`

      try {
        const { data, error } = await supabase.storage.from("listing-images").upload(fileName, file)

        if (error) {
          console.error("Storage upload error:", error)
          uploadedUrls.push(`/placeholder.svg?height=300&width=400&text=Image${i + 1}`)
        } else {
          const {
            data: { publicUrl },
          } = supabase.storage.from("listing-images").getPublicUrl(fileName)
          uploadedUrls.push(publicUrl)
        }
      } catch (error) {
        console.error("Upload error:", error)
        uploadedUrls.push(`/placeholder.svg?height=300&width=400&text=Image${i + 1}`)
      }
    }

    return uploadedUrls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a listing",
        variant: "destructive",
      })
      return
    }

    if (!formData.title.trim() || !formData.category || !formData.price) {
      toast({
        title: "Missing required fields",
        description: "Please fill in title, category, and price",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const uploadedImageUrls = await uploadImagesToStorage()

      // Prepare price display for sublease
      let priceDisplay = formData.price
      if (formData.isPriceRange && formData.priceMax) {
        priceDisplay = `${formData.price}-${formData.priceMax}`
      }
      if (formData.category === "sublease") {
        priceDisplay += `/${formData.priceType}`
      }

      // Prepare description with sublease details
      let fullDescription = formData.description
      if (formData.category === "sublease") {
        const subleaseDetails = []
        if (formData.bedrooms) subleaseDetails.push(`${formData.bedrooms} bedroom(s)`)
        if (formData.bathrooms) subleaseDetails.push(`${formData.bathrooms} bathroom(s)`)
        if (formData.leaseLength) subleaseDetails.push(`Lease length: ${formData.leaseLength}`)

        if (subleaseDetails.length > 0) {
          fullDescription = `${fullDescription}\n\n${subleaseDetails.join(" • ")}`
        }
      }

      const listingData = {
        user_id: user.id,
        title: formData.title.trim(),
        description: fullDescription,
        price: Number.parseFloat(formData.price),
        category: formData.category,
        pickup_location: formData.pickup_location,
        pickup_timeline: formData.pickup_timeline,
        images: uploadedImageUrls,
        is_available: true,
      }

      // Only add condition for non-sublease items
      if (formData.category !== "sublease" && formData.condition) {
        listingData.condition = formData.condition
      }

      const { error } = await supabase.from("listings").insert(listingData)

      if (error) {
        console.error("Database error:", error)
        throw error
      }

      toast({
        title: "Success",
        description: "Your listing has been created!",
      })

      // Clean up object URLs
      images.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url)
        }
      })

      router.push("/my-listings")
    } catch (error) {
      console.error("Error creating listing:", error)
      toast({
        title: "Error",
        description: "Failed to create listing. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const isSubleaseCategory = formData.category === "sublease"

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-purdue-gold text-black font-semibold">
                  {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-gray-900">
                  {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}
                </p>
                <p className="text-sm text-gray-500">Creating a new listing</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Selection - Top Priority */}
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <Tag className="w-4 h-4 text-gray-500" />
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger className="border-0 bg-transparent p-0 focus:ring-0">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">💻 Electronics</SelectItem>
                    <SelectItem value="furniture">🛋️ Furniture</SelectItem>
                    <SelectItem value="textbooks">📚 Textbooks</SelectItem>
                    <SelectItem value="clothing">👕 Clothing</SelectItem>
                    <SelectItem value="sublease">🏠 Sublease</SelectItem>
                    <SelectItem value="other">🗂️ Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Title Input */}
              <div>
                <Textarea
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder={
                    isSubleaseCategory
                      ? "Describe your apartment/room (e.g., 2BR apartment near campus)"
                      : "What are you selling?"
                  }
                  className="border-0 text-xl font-medium resize-none focus:ring-0 focus:outline-none p-3 min-h-[60px]"
                  required
                />
              </div>


              {/* Description */}
              <div>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder={
                    isSubleaseCategory
                      ? "Describe the apartment, amenities, location, etc..."
                      : "Add more details about your item..."
                  }
                  className="border-0 resize-none focus:ring-0 focus:outline-none p-3 min-h-[80px]"
                  rows={3}
                />
              </div>

              {/* Image Upload Section */}
              <div className="space-y-3">
                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="relative h-32 rounded-lg overflow-hidden">
                          <Image
                            src={image || "/placeholder.svg"}
                            alt={`Upload ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleImageRemove(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {images.length < 5 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-20 border-dashed border-2 hover:bg-gray-50"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImages}
                  >
                    <div className="flex flex-col items-center">
                      <Camera className="h-6 w-6 mb-1 text-gray-400" />
                      <span className="text-sm text-gray-600">{uploadingImages ? "Uploading..." : "Add Photos"}</span>
                    </div>
                  </Button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Details Section */}
              <div className="space-y-3 pt-4 border-t">
                {/* Price Section */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <Input
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                      placeholder={isSubleaseCategory ? "Monthly rent" : "Price"}
                      className="border-0 bg-transparent p-0 focus:ring-0"
                      required
                    />
                    {isSubleaseCategory && (
                      <Select
                        value={formData.priceType}
                        onValueChange={(value) => handleInputChange("priceType", value)}
                      >
                        <SelectTrigger className="border-0 bg-transparent p-0 focus:ring-0 w-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="month">/ month</SelectItem>
                          <SelectItem value="semester">/ semester</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Price Range Option for non-sublease */}
                  {!isSubleaseCategory && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="priceRange"
                          checked={formData.isPriceRange}
                          onCheckedChange={(checked) => handleInputChange("isPriceRange", checked)}
                        />
                        <Label htmlFor="priceRange" className="text-sm text-gray-600">
                          Price range (negotiable)
                        </Label>
                      </div>

                      {formData.isPriceRange && (
                        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-500">Max price:</span>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.priceMax}
                            onChange={(e) => handleInputChange("priceMax", e.target.value)}
                            placeholder="Maximum price"
                            className="border-0 bg-transparent p-0 focus:ring-0"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sublease-specific fields */}
                {isSubleaseCategory && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                        <Bed className="w-4 h-4 text-gray-500" />
                        <Input
                          type="number"
                          value={formData.bedrooms}
                          onChange={(e) => handleInputChange("bedrooms", e.target.value)}
                          placeholder="Bedrooms"
                          className="border-0 bg-transparent p-0 focus:ring-0"
                        />
                      </div>

                      <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                        <Home className="w-4 h-4 text-gray-500" />
                        <Input
                          type="number"
                          step="0.5"
                          value={formData.bathrooms}
                          onChange={(e) => handleInputChange("bathrooms", e.target.value)}
                          placeholder="Bathrooms"
                          className="border-0 bg-transparent p-0 focus:ring-0"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <Input
                        value={formData.leaseLength}
                        onChange={(e) => handleInputChange("leaseLength", e.target.value)}
                        placeholder="Lease length (e.g., Spring 2024, 6 months)"
                        className="border-0 bg-transparent p-0 focus:ring-0"
                      />
                    </div>
                  </div>
                )}

                {/* Condition - Only for non-sublease items */}
                {!isSubleaseCategory && (
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <Label className="text-gray-500 text-sm">Condition:</Label>
                    <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                      <SelectTrigger className="border-0 bg-transparent p-0 focus:ring-0">
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
                )}

                {/* Location */}
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <Input
                    value={formData.pickup_location}
                    onChange={(e) => handleInputChange("pickup_location", e.target.value)}
                    placeholder={
                      isSubleaseCategory
                        ? "Location (e.g., Chauncey Village, Stadium Ave)"
                        : "Pickup location (e.g., Cary Quad, Village)"
                    }
                    className="border-0 bg-transparent p-0 focus:ring-0"
                  />
                </div>

                {/* Timeline */}
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <Input
                    value={formData.pickup_timeline}
                    onChange={(e) => handleInputChange("pickup_timeline", e.target.value)}
                    placeholder={
                      isSubleaseCategory
                        ? "Available from (e.g., January 1st, 2024)"
                        : "When are you available? (e.g., Weekdays after 5pm)"
                    }
                    className="border-0 bg-transparent p-0 focus:ring-0"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t">
                <Button
                  type="submit"
                  className="w-full bg-purdue-gold text-black hover:bg-yellow-400 font-semibold py-3"
                  disabled={loading}
                >
                  {loading ? "Creating listing..." : "Post Listing"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
