import { Star, Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Priya Sharma',
    location: 'Civil Lines, Prayagraj',
    rating: 5,
    text: 'The pineapple cake from Pathak Bhandar is absolutely divine! We order for every family celebration. The freshness and quality is unmatched in the city.',
    avatar: 'PS',
    product: 'Pineapple Cream Cake',
  },
  {
    id: 2,
    name: 'Rajesh Verma',
    location: 'George Town, Prayagraj',
    rating: 5,
    text: 'Been their customer for 15 years. The bread is always fresh, and the delivery is prompt. Pathak Bhandar is our family\'s trusted bakery!',
    avatar: 'RV',
    product: 'Multigrain Bread Loaf',
  },
  {
    id: 3,
    name: 'Meena Gupta',
    location: 'Naini, Prayagraj',
    rating: 5,
    text: 'Ordered a custom birthday cake and they exceeded all expectations. The design was perfect and the taste was phenomenal. Highly recommend!',
    avatar: 'MG',
    product: 'Custom Birthday Cake',
  },
  {
    id: 4,
    name: 'Amit Tiwari',
    location: 'Lukerganj, Prayagraj',
    rating: 5,
    text: 'The croissants and pastries are so authentic — reminds me of my travels abroad! These folks really know their craft. Keep it up!',
    avatar: 'AT',
    product: 'Butter Croissants',
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="py-12 bg-gradient-to-b from-amber-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-navy mb-2">What Our Customers Say</h2>
          <p className="text-gray-500 text-sm md:text-base">Trusted by thousands of families in Prayagraj</p>
          <div className="flex justify-center items-center gap-2 mt-3">
            <div className="flex">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="h-5 w-5 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <span className="text-gray-600 text-sm font-medium">4.9 out of 5 · 2,000+ reviews</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TESTIMONIALS.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-amber-800 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-navy text-sm">{testimonial.name}</p>
                  <p className="text-xs text-gray-400">{testimonial.location}</p>
                </div>
              </div>
              <StarRating rating={testimonial.rating} />
              <div className="mt-3 relative">
                <Quote className="h-5 w-5 text-amber-200 absolute -top-1 -left-1" />
                <p className="text-gray-600 text-sm leading-relaxed pl-4 italic">
                  {testimonial.text}
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-amber-50">
                <p className="text-xs text-amber-700 font-medium">Purchased: {testimonial.product}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
