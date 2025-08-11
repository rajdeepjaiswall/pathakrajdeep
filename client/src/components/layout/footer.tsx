import { Facebook, Instagram } from 'lucide-react';
import { COMPANY_INFO } from '@/lib/constants';

export default function Footer() {
  const quickLinks = [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '/products' },
    { name: 'Categories', href: '/products?category=all' },
    { name: 'About Us', href: '/#about' },
    { name: 'Contact', href: '/#contact' },
  ];

  const policies = [
    { name: 'Privacy Policy', href: '/privacy-policy' },
    { name: 'Terms of Service', href: '/terms-of-service' },
  ];

  return (
    <footer className="bg-navy text-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-champagne rounded-lg flex items-center justify-center">
                <span className="text-navy font-bold text-xl">PB</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">{COMPANY_INFO.name}</h3>
                <p className="text-sm text-cream/70">{COMPANY_INFO.tagline}</p>
              </div>
            </div>
            <p className="text-cream/80 mb-4 max-w-md">
              Premium bakery and confectionery store in Prayagraj, specializing in authentic local biscuits and cookies. 
              Experience the taste of tradition with every bite.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="w-10 h-10 bg-champagne/20 rounded-lg flex items-center justify-center hover:bg-champagne/30 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5 text-champagne" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-champagne/20 rounded-lg flex items-center justify-center hover:bg-champagne/30 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5 text-champagne" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-champagne/20 rounded-lg flex items-center justify-center hover:bg-champagne/30 transition-colors"
                aria-label="WhatsApp"
              >
                <svg className="h-5 w-5 text-champagne" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-cream/80">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href} 
                    className="hover:text-champagne transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <div className="space-y-3 text-cream/80">
              <div className="flex items-start space-x-3">
                <svg className="h-5 w-5 text-champagne mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm">{COMPANY_INFO.address.line1}</p>
                  <p className="text-sm">{COMPANY_INFO.address.line2}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <svg className="h-5 w-5 text-champagne flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <span className="text-sm">{COMPANY_INFO.phone}</span>
              </div>
              <div className="flex items-center space-x-3">
                <svg className="h-5 w-5 text-champagne flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <a href="mailto:rajdeep.jaiswal7@gmail.com" className="text-sm hover:text-champagne transition-colors">
                  rajdeep.jaiswal7@gmail.com
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <svg className="h-5 w-5 text-champagne flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{COMPANY_INFO.hours}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-cream/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <p className="text-cream/60 text-sm">© 2025 {COMPANY_INFO.name}. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              {policies.map((policy) => (
                <a 
                  key={policy.name}
                  href={policy.href} 
                  className="text-cream/60 text-sm hover:text-champagne transition-colors"
                >
                  {policy.name}
                </a>
              ))}
            </div>
          </div>
          <div className="text-center">
            <p className="text-cream/50 text-xs">
              Managed and created by <strong className="text-champagne">Getdown Foundations</strong>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
