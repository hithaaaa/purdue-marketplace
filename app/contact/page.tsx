export default function ContactUsPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-r from-purdue-black to-gray-800 text-white py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto">
            Have questions or feedback? We’re here to help.
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-2xl">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Please reach out at ...@gmail.com</label>
            </div>
            
        </div>
      </section>
    </div>
  );
}
