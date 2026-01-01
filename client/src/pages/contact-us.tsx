import { useQuery } from '@tanstack/react-query';
import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react';
import { SiWhatsapp } from 'react-icons/si';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import type { PageContent } from '@shared/schema';

type Section = {
  id: string;
  type: 'heading' | 'subheading' | 'text' | 'image';
  content: string;
  order: number;
};

type ContactInfo = {
  phone?: string;
  email?: string;
  address?: string;
  mapUrl?: string;
  whatsapp?: string;
  businessHours?: string;
  socialLinks?: { platform: string; url: string }[];
};

export default function ContactUs() {
  const { data: content, isLoading } = useQuery<PageContent>({
    queryKey: ['/api/page-content/contact_us'],
  });

  const sections = (content?.sections as Section[]) || [];
  const contactInfo = (content?.contactInfo as ContactInfo) || {};

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-1/2 mx-auto" />
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="h-32 bg-gray-200 rounded" />
              <div className="h-32 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const hasContactInfo = contactInfo.phone || contactInfo.email || contactInfo.address || contactInfo.whatsapp;

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-navy text-center mb-8" data-testid="text-contact-title">
          {content?.title || 'Contact Us'}
        </h1>

        {hasContactInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {contactInfo.phone && (
              <Card>
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-champagne/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6 text-champagne" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy mb-1">Phone</h3>
                    <a 
                      href={`tel:${contactInfo.phone}`} 
                      className="text-gray-600 hover:text-champagne"
                      data-testid="link-phone"
                    >
                      {contactInfo.phone}
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}

            {contactInfo.email && (
              <Card>
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-champagne/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-6 w-6 text-champagne" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy mb-1">Email</h3>
                    <a 
                      href={`mailto:${contactInfo.email}`} 
                      className="text-gray-600 hover:text-champagne"
                      data-testid="link-email"
                    >
                      {contactInfo.email}
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}

            {contactInfo.whatsapp && (
              <Card>
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <SiWhatsapp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy mb-1">WhatsApp</h3>
                    <a 
                      href={`https://wa.me/${contactInfo.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-green-600"
                      data-testid="link-whatsapp"
                    >
                      {contactInfo.whatsapp}
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}

            {contactInfo.businessHours && (
              <Card>
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-champagne/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-6 w-6 text-champagne" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy mb-1">Business Hours</h3>
                    <p className="text-gray-600" data-testid="text-hours">{contactInfo.businessHours}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {contactInfo.address && (
          <Card className="mb-8">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-champagne/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-6 w-6 text-champagne" />
              </div>
              <div>
                <h3 className="font-semibold text-navy mb-1">Address</h3>
                <p className="text-gray-600 whitespace-pre-wrap" data-testid="text-address">{contactInfo.address}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {contactInfo.mapUrl && (
          <Card className="mb-8 overflow-hidden">
            <iframe
              src={contactInfo.mapUrl}
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Store Location"
              data-testid="iframe-map"
            />
          </Card>
        )}

        {sections.length > 0 && (
          <div className="space-y-6 mt-8">
            {sections.sort((a, b) => a.order - b.order).map((section) => {
              switch (section.type) {
                case 'heading':
                  return (
                    <h2 key={section.id} className="text-2xl font-bold text-navy">
                      {section.content}
                    </h2>
                  );
                case 'subheading':
                  return (
                    <h3 key={section.id} className="text-xl font-semibold text-navy/80">
                      {section.content}
                    </h3>
                  );
                case 'text':
                  return (
                    <p key={section.id} className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {section.content}
                    </p>
                  );
                case 'image':
                  return (
                    <div key={section.id} className="flex justify-center">
                      <img
                        src={section.content}
                        alt="Contact us"
                        className="max-w-full h-auto rounded-lg shadow-md"
                      />
                    </div>
                  );
                default:
                  return null;
              }
            })}
          </div>
        )}

        {contactInfo.whatsapp && (
          <div className="text-center mt-8">
            <Button
              size="lg"
              className="gap-2 bg-green-600 hover:bg-green-700"
              onClick={() => window.open(`https://wa.me/${contactInfo.whatsapp?.replace(/[^0-9]/g, '')}`, '_blank')}
              data-testid="button-whatsapp-chat"
            >
              <MessageCircle className="h-5 w-5" />
              Chat with us on WhatsApp
            </Button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
