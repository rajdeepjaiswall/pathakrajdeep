import { Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface QuoteCardProps {
  text: string;
  movie: string;
  className?: string;
}

export function QuoteCard({ text, movie, className = "" }: QuoteCardProps) {
  return (
    <Card className={`border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Quote className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-gray-700 italic text-sm leading-relaxed">
              "{text}"
            </p>
            <p className="text-amber-700 font-medium text-xs mt-2">
              - {movie}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}