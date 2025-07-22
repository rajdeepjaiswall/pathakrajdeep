import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-600">Last updated: July 22, 2025</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using Pathak Bhandar's website and services, you accept and agree to be bound by the terms and provision of this agreement. These Terms of Service constitute a legally binding agreement between you and Pathak Bhandar.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Use License</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Permission is granted to temporarily access and use our website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Modify or copy the materials</li>
                <li>Use the materials for commercial purposes or public display</li>
                <li>Attempt to reverse engineer any software contained on our website</li>
                <li>Remove any copyright or proprietary notations from the materials</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                This license shall automatically terminate if you violate any of these restrictions and may be terminated by us at any time.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Account Registration</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>You must provide accurate and complete information when creating an account</li>
                <li>You are responsible for maintaining the security of your account credentials</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
                <li>One person may not maintain multiple accounts</li>
              </ul>
              
              <h3 className="text-lg font-medium text-gray-800">Account Termination</h3>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to terminate accounts that violate these terms, engage in fraudulent activities, or pose a security risk to our platform or other users.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Products and Services</h2>
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Product Information</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>We strive to provide accurate product descriptions, images, and pricing</li>
                <li>Colors and appearance may vary slightly from images displayed</li>
                <li>We reserve the right to modify product offerings and prices without notice</li>
                <li>All products are subject to availability</li>
              </ul>
              
              <h3 className="text-lg font-medium text-gray-800">Food Safety and Quality</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>All products are prepared following food safety standards</li>
                <li>Freshness and quality are guaranteed at the time of preparation</li>
                <li>Customers with allergies should inform us before placing orders</li>
                <li>We are not responsible for products once they leave our premises</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Orders and Payment</h2>
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Order Process</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>All orders are subject to acceptance and availability</li>
                <li>We reserve the right to refuse or cancel orders for any reason</li>
                <li>Order confirmations will be sent via email</li>
                <li>Custom orders may require additional time and deposit</li>
              </ul>
              
              <h3 className="text-lg font-medium text-gray-800">Payment Terms</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Payment is required at the time of order placement</li>
                <li>We accept various payment methods as displayed on our website</li>
                <li>All prices include applicable taxes unless otherwise stated</li>
                <li>Payment processing is handled by secure third-party providers</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Delivery and Pickup</h2>
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Delivery Services</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Delivery times are estimates and may vary due to traffic or weather</li>
                <li>Delivery charges apply as per our current rate schedule</li>
                <li>Customers must be available to receive orders at the specified time</li>
                <li>Delivery areas are limited to our service zones</li>
              </ul>
              
              <h3 className="text-lg font-medium text-gray-800">Pickup Orders</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Orders must be collected within the specified timeframe</li>
                <li>Valid ID and order confirmation may be required for pickup</li>
                <li>Uncollected orders may be subject to disposal after 24 hours</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Returns and Refunds</h2>
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Return Policy</h3>
              <p className="text-gray-700 leading-relaxed">
                Due to the perishable nature of our products, returns are generally not accepted. However, we will address quality concerns on a case-by-case basis.
              </p>
              
              <h3 className="text-lg font-medium text-gray-800">Refund Conditions</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Refunds may be provided for cancelled orders before preparation begins</li>
                <li>Quality issues must be reported within 2 hours of delivery/pickup</li>
                <li>Photographic evidence may be required for quality claims</li>
                <li>Refunds will be processed using the original payment method</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. User Conduct</h2>
            <p className="text-gray-700 leading-relaxed mb-4">You agree not to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Use our service for any unlawful purpose or to solicit unlawful acts</li>
              <li>Violate any international, federal, provincial, or local laws or regulations</li>
              <li>Transmit or procure sending of advertising or promotional material without consent</li>
              <li>Impersonate or attempt to impersonate the company, employees, or other users</li>
              <li>Use our service in any manner that could damage or overburden our servers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Privacy and Data Protection</h2>
            <p className="text-gray-700 leading-relaxed">
              Your privacy is important to us. Please review our Privacy Policy, which governs your visit to our website and explains how we collect, safeguard, and disclose information that results from your use of our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Disclaimer</h2>
            <p className="text-gray-700 leading-relaxed">
              The materials on Pathak Bhandar's website are provided on an 'as is' basis. Pathak Bhandar makes no warranties, expressed or implied, and hereby disclaims all other warranties including, without limitation, implied warranties of merchantability, fitness for a particular purpose, or non-infringement of intellectual property.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Limitations of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              In no event shall Pathak Bhandar or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit) arising out of the use or inability to use our materials, even if we or our authorized representative has been notified of the possibility of such damage.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in Prayagraj, Uttar Pradesh.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to revise these terms of service at any time without notice. By using this website, you are agreeing to be bound by the current version of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact Information</h2>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-gray-700 leading-relaxed mb-2">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="space-y-1 text-gray-700">
                <p><strong>Support Email:</strong> <a href="mailto:contact@getdownaf.info" className="text-orange-600 hover:text-orange-700">contact@getdownaf.info</a></p>
                <p><strong>General Contact:</strong> <a href="mailto:getdownaf@gmail.com" className="text-orange-600 hover:text-orange-700">getdownaf@gmail.com</a></p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Managed and created by <strong>Getdown Foundations</strong></p>
        </div>
      </div>
    </div>
  );
}