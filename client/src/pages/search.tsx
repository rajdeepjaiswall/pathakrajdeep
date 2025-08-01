import { useLocation } from 'wouter';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/header';
import MobileNav from '@/components/layout/mobile-nav';
import AdvancedSearch from '@/components/advanced-search';
import SEOHead, { SEOConfigs, StructuredDataSchemas } from '@/components/SEOHead';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SearchPage() {
  const [, setLocation] = useLocation();
  const [searchParams, setSearchParams] = useState<URLSearchParams>();

  useEffect(() => {
    setSearchParams(new URLSearchParams(window.location.search));
  }, []);

  const initialQuery = searchParams?.get('q') || '';

  return (
    <div className="min-h-screen bg-cream">
      <SEOHead 
        {...SEOConfigs.search}
        canonical={`${window.location.origin}/search`}
        schema={StructuredDataSchemas.website}
      />
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="text-amber-700 hover:text-amber-800 hover:bg-amber-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-navy mb-2">Smart Search</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find your favorite bakery items in any language. Our AI-powered search understands Hindi, English, and Hinglish!
          </p>
        </div>

        {/* Advanced Search Component */}
        <AdvancedSearch />

        {/* SEO Information */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Search our premium bakery collection • Fresh daily • Free delivery • Hindi • English • Hinglish support
          </p>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}