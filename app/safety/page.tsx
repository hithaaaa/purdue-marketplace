export default function SafetyTipsPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-r from-purdue-black to-gray-800 text-white py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Safety Tips</h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto">
            Stay safe while buying, selling, or subleasing through Purdue Marketplace.
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <ul className="space-y-6 text-gray-700 text-base md:text-lg">
            <li>
              <strong>1. Meet in Public:</strong> Always meet buyers/sellers in well-lit, public places—preferably on campus.
            </li>
            <li>
              <strong>2. Bring a Friend:</strong> If possible, bring someone with you when meeting a stranger for a transaction.
            </li>
            <li>
              <strong>3. Avoid Cash:</strong> Use secure payment methods (Venmo, PayPal) instead of carrying cash.
            </li>
            <li>
              <strong>4. Verify Subleases:</strong> Confirm apartment listings with the leasing office before sending any payments.
            </li>
            <li>
              <strong>5. Trust Your Instincts:</strong> If something feels off, don’t proceed. Report suspicious activity.
            </li>
            <li>
              <strong>6. Keep It on Platform:</strong> Use Purdue Marketplace’s messaging system for communication to reduce scams.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
