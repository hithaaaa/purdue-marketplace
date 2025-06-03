import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Laptop, Sofa, BookOpen, Shirt, Home, MoreHorizontal } from "lucide-react"

const categories = [
  {
    name: "Electronics",
    slug: "electronics",
    icon: Laptop,
    description: "Laptops, phones, gaming gear",
    color: "bg-blue-100 text-blue-600",
  },
  {
    name: "Furniture",
    slug: "furniture",
    icon: Sofa,
    description: "Desks, chairs, TV",
    color: "bg-green-100 text-green-600",
  },
  {
    name: "Textbooks",
    slug: "textbooks",
    icon: BookOpen,
    description: "Course materials, study guides",
    color: "bg-purple-100 text-purple-600",
  },
  {
    name: "Clothing",
    slug: "clothing",
    icon: Shirt,
    description: "Apparel, shoes, accessories",
    color: "bg-pink-100 text-pink-600",
  },
  {
    name: "Subleases",
    slug: "sublease",
    icon: Home,
    description: "Apartments, rooms, housing",
    color: "bg-orange-100 text-orange-600",
  },
  {
    name: "Other",
    slug: "other",
    icon: MoreHorizontal,
    description: "Everything else",
    color: "bg-gray-100 text-gray-600",
  },
]

export function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {categories.map((category) => {
        const IconComponent = category.icon
        return (
          <Link key={category.slug} href={`/listings?category=${category.slug}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div
                  className={`w-12 h-12 rounded-full ${category.color} flex items-center justify-center mx-auto mb-3`}
                >
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-1">{category.name}</h3>
                <p className="text-sm text-gray-600">{category.description}</p>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
