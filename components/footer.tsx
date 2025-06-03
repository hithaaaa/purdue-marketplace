import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-purdue-black text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Purdue Marketplace</h3>
            <p className="text-gray-300 text-sm">
              The official marketplace for Purdue University students to buy, sell, and sublease.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Categories</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/listings?category=electronics" className="text-gray-300 hover:text-purdue-gold">
                  Electronics
                </Link>
              </li>
              <li>
                <Link href="/listings?category=furniture" className="text-gray-300 hover:text-purdue-gold">
                  Furniture
                </Link>
              </li>
              <li>
                <Link href="/listings?category=textbooks" className="text-gray-300 hover:text-purdue-gold">
                  Textbooks
                </Link>
              </li>
              <li>
                <Link href="/listings?category=sublease" className="text-gray-300 hover:text-purdue-gold">
                  Subleases
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help" className="text-gray-300 hover:text-purdue-gold">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/safety" className="text-gray-300 hover:text-purdue-gold">
                  Safety Tips
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-purdue-gold">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/feedback" className="text-gray-300 hover:text-yellow-400 font-medium">
                  Send Feedback
                </Link>
                <p className="text-gray-400 text-xs mt-1">Help us improve your experience!</p>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <p className="text-gray-300 text-sm">Made for Boilermakers, by Boilermakers</p>
            <p className="text-purdue-gold text-sm mt-2">Boiler Up! 🚂</p>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-300">
          <p>&copy; 2024 Purdue Marketplace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
