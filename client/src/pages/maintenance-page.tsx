import { useState } from 'react';
import { Construction } from 'lucide-react';
import pathakLogo from '@assets/project_20250528_0859055-02.png';

export default function MaintenancePage() {
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5EFE6] flex flex-col items-center justify-center px-4 py-12 text-center">
      {/* Logo */}
      <div className="mb-6 w-32 h-32 rounded-full overflow-hidden border-4 border-[#6B3E2E] shadow-lg bg-white flex items-center justify-center">
        {!logoError ? (
          <img
            src={pathakLogo}
            alt="Pathak Bhandar"
            className="w-full h-full object-cover"
            onError={() => setLogoError(true)}
          />
        ) : (
          <span className="text-3xl font-bold text-[#6B3E2E]">PB</span>
        )}
      </div>

      {/* Main Heading */}
      <h1 className="text-3xl sm:text-4xl font-bold text-[#6B3E2E] mb-4">
        We Are Currently Under Maintenance
      </h1>

      {/* Subtitle */}
      <p className="text-lg text-[#6B3E2E]/80 mb-8 max-w-md">
        Our website is temporarily unavailable while we make improvements.
        Please check back soon.
      </p>

      {/* Construction Icon */}
      <div className="bg-[#6B3E2E]/10 rounded-full p-6 mb-8">
        <Construction className="h-16 w-16 text-[#6B3E2E]" />
      </div>

      {/* Status badge */}
      <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-100 border border-red-200 rounded-full text-red-700 text-sm font-medium">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
        Service Temporarily Unavailable
      </div>

      {/* Footer note */}
      <p className="mt-12 text-sm text-[#6B3E2E]/60">
        Thank you for your patience.
      </p>
    </div>
  );
}
