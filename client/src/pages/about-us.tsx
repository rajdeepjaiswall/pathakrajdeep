import { useQuery } from '@tanstack/react-query';
import { Store, Heart } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import type { PageContent } from '@shared/schema';

type Section = {
  id: string;
  type: 'heading' | 'subheading' | 'text' | 'image';
  content: string;
  order: number;
};

export default function AboutUs() {
  const { data: content, isLoading } = useQuery<PageContent>({
    queryKey: ['/api/page-content/about_us'],
  });

  const sections = (content?.sections as Section[]) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-1/2 mx-auto" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
            <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto" />
            <div className="h-64 bg-gray-200 rounded mt-8" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!content || sections.length === 0) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center py-16">
            <Store className="h-16 w-16 mx-auto text-champagne mb-4" />
            <h1 className="text-3xl font-bold text-navy mb-4">About Pathak Bhandar</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Welcome to Pathak Bhandar, your premier destination for authentic Indian sweets and bakery delights.
              With generations of expertise, we bring you the finest quality confections made with love and tradition.
            </p>
            <div className="mt-8 flex items-center justify-center gap-2 text-champagne">
              <Heart className="h-5 w-5 fill-current" />
              <span className="font-medium">Made with love since generations</span>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-12">
        {content.title && (
          <h1 className="text-4xl font-bold text-navy text-center mb-8" data-testid="text-page-title">
            {content.title}
          </h1>
        )}
        
        <div className="space-y-6">
          {sections.sort((a, b) => a.order - b.order).map((section) => {
            switch (section.type) {
              case 'heading':
                return (
                  <h2 key={section.id} className="text-2xl font-bold text-navy" data-testid={`text-heading-${section.id}`}>
                    {section.content}
                  </h2>
                );
              case 'subheading':
                return (
                  <h3 key={section.id} className="text-xl font-semibold text-navy/80" data-testid={`text-subheading-${section.id}`}>
                    {section.content}
                  </h3>
                );
              case 'text':
                return (
                  <p key={section.id} className="text-gray-700 leading-relaxed whitespace-pre-wrap" data-testid={`text-paragraph-${section.id}`}>
                    {section.content}
                  </p>
                );
              case 'image':
                return (
                  <div key={section.id} className="flex justify-center">
                    <img
                      src={section.content}
                      alt="About us"
                      className="max-w-full h-auto rounded-lg shadow-md"
                      data-testid={`img-section-${section.id}`}
                    />
                  </div>
                );
              default:
                return null;
            }
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
}
