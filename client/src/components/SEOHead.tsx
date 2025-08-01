import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
  schema?: any;
  language?: string;
}

export default function SEOHead({
  title = "Pathak Bhandar - Premium Indian Bakery & Confectionery",
  description = "Fresh bakery items, traditional Indian sweets, cakes & pastries. Premium quality baked goods with home delivery. Search in Hindi, English & Hinglish.",
  keywords = "bakery, Indian sweets, cake, biscuits, pastries, fresh bread, mithai, मिठाई, केक, बिस्कुट, home delivery, premium bakery",
  ogImage = "/api/logo",
  canonical,
  schema,
  language = "en-IN"
}: SEOHeadProps) {
  
  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Update meta tags
    const updateMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    const updateProperty = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Basic SEO meta tags
    updateMeta('description', description);
    updateMeta('keywords', keywords);
    updateMeta('robots', 'index, follow');
    updateMeta('viewport', 'width=device-width, initial-scale=1.0');
    updateMeta('language', language);
    
    // Google-specific meta tags
    updateMeta('googlebot', 'index, follow');
    updateMeta('google', 'notranslate');
    
    // Open Graph meta tags
    updateProperty('og:title', title);
    updateProperty('og:description', description);
    updateProperty('og:image', ogImage);
    updateProperty('og:type', 'website');
    updateProperty('og:locale', language);
    
    // Twitter Card meta tags
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', ogImage);

    // Update language attribute on html element
    document.documentElement.lang = language;

    // Add canonical link if provided
    if (canonical) {
      let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.href = canonical;
    }

    // Add structured data schema if provided
    if (schema) {
      let schemaScript = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.type = 'application/ld+json';
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(schema);
    }

  }, [title, description, keywords, ogImage, canonical, schema, language]);

  return null;
}

// Pre-defined SEO configurations for different pages
export const SEOConfigs = {
  home: {
    title: "Pathak Bhandar - Premium Indian Bakery & Fresh Sweets Online",
    description: "Order fresh bakery items, traditional Indian sweets, cakes & pastries online. Premium quality baked goods with home delivery. Search in Hindi, English & Hinglish.",
    keywords: "online bakery, Indian sweets delivery, fresh cakes, premium biscuits, mithai online, बेकरी, मिठाई ऑनलाइन, केक डिलीवरी"
  },
  products: {
    title: "Fresh Bakery Products - Cakes, Sweets & Biscuits | Pathak Bhandar",
    description: "Browse our complete collection of fresh bakery products including cakes, traditional sweets, biscuits and pastries. Quality guaranteed with fast delivery.",
    keywords: "bakery products, fresh cakes, Indian sweets, biscuits online, pastries, bread, मिठाई, केक, बिस्कुट"
  },
  search: {
    title: "Smart Search - Find Bakery Items in Any Language | Pathak Bhandar",
    description: "Search our bakery products in Hindi, English, or Hinglish. AI-powered search understands 'meetha cake', 'chocolate wala biscuit' and more. Voice search enabled.",
    keywords: "bakery search, Hindi search, Hinglish search, voice search, smart search, AI search, multilingual bakery search"
  },
  cart: {
    title: "Shopping Cart - Complete Your Bakery Order | Pathak Bhandar",
    description: "Review your bakery items and complete your order. Fresh products, secure checkout, and fast home delivery available.",
    keywords: "bakery cart, online order, checkout, home delivery, fresh bakery products"
  }
};

// Structured data schemas
export const StructuredDataSchemas = {
  bakery: {
    "@context": "https://schema.org",
    "@type": "Bakery",
    "name": "Pathak Bhandar",
    "description": "Premium Indian bakery specializing in fresh sweets, cakes, and traditional baked goods",
    "url": window.location.origin,
    "telephone": "+91-XXXXXXXXXX",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IN",
      "addressLocality": "Your City"
    },
    "openingHours": "Mo-Su 08:00-22:00",
    "priceRange": "₹₹",
    "servesCuisine": "Indian",
    "paymentAccepted": "Cash, UPI, Credit Card",
    "currenciesAccepted": "INR"
  },
  
  website: {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Pathak Bhandar",
    "url": window.location.origin,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${window.location.origin}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  }
};