import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Globe, Mic, MicOff, Sparkles, Brain } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import OptimizedImage from './OptimizedImage';
import { apiRequest } from '@/lib/queryClient';
import { QuoteCard } from './QuoteCard';
import { getRandomFoodQuote } from '@/data/foodQuotes';

// Voice recognition types
interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface SearchResult {
  id: number;
  name: string;
  description: string | null;
  price: string;
  images: string[];
  categoryName: string;
  tags: string[];
  relevanceScore: number;
  matchType: 'exact' | 'translated' | 'semantic' | 'tag';
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
  timestamp: string;
  searchType?: 'instant' | 'ai';
  translation?: {
    originalQuery: string;
    translatedQuery: string;
    detectedLanguage: string;
    confidence: number;
  };
}

export default function AdvancedSearch() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAISearch, setShowAISearch] = useState(false);
  const queryClient = useQueryClient();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search results query
  const { data: searchData, isLoading: isSearching, error: searchError } = useQuery({
    queryKey: ['/api/search', debouncedQuery],
    enabled: debouncedQuery.length > 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  }) as { data: SearchResponse | undefined, isLoading: boolean, error: any };

  // Search suggestions query
  const { data: suggestionsData } = useQuery({
    queryKey: ['/api/search/suggestions', debouncedQuery],
    enabled: debouncedQuery.length > 1 && showSuggestions,
    staleTime: 10 * 60 * 1000, // 10 minutes
  }) as { data: { suggestions: string[] } | undefined };

  // AI search mutation
  const aiSearchMutation = useMutation({
    mutationFn: async (query: string) => {
      return await apiRequest('/api/search/ai', 'POST', { query });
    },
    onSuccess: (data) => {
      // Update the cache with AI search results
      queryClient.setQueryData(['/api/search', searchQuery], data);
      setShowAISearch(false);
    },
    onError: (error) => {
      console.error('AI search error:', error);
    }
  });

  // Voice search functionality
  const startVoiceSearch = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice search is not supported in this browser');
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'hi-IN'; // Hindi (India) - supports Hinglish

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.start();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    setLocation(`/products?search=${encodeURIComponent(suggestion)}`);
  };

  const selectProduct = (productId: number) => {
    setLocation(`/products/${productId}`);
  };

  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case 'exact': return 'bg-green-100 text-green-800';
      case 'translated': return 'bg-blue-100 text-blue-800';
      case 'semantic': return 'bg-purple-100 text-purple-800';
      case 'tag': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMatchTypeLabel = (matchType: string) => {
    switch (matchType) {
      case 'exact': return 'Exact Match';
      case 'translated': return 'Translated';
      case 'semantic': return 'AI Match';
      case 'tag': return 'Tag Match';
      default: return 'Match';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Search Input */}
      <form onSubmit={handleSearch} className="relative mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-amber-600" />
          <Input
            type="text"
            placeholder="Search products in any language... (e.g., 'meetha cake', 'chocolate wala biscuit')"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="pl-10 pr-20 py-3 text-lg border-2 border-amber-200 focus:border-amber-500 rounded-xl"
          />
          
          {/* Voice Search Button */}
          <Button
            type="button"
            onClick={startVoiceSearch}
            disabled={isListening}
            className={`absolute right-12 top-1/2 transform -translate-y-1/2 p-2 rounded-lg ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                : 'bg-amber-100 hover:bg-amber-200 text-amber-700'
            }`}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>

          {/* Search Button */}
          <Button
            type="submit"
            disabled={!searchQuery.trim() || isSearching}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg"
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {/* Language Indicator */}
        <div className="flex items-center gap-2 mt-2 text-sm text-amber-600">
          <Globe className="h-4 w-4" />
          <span>Supports Hindi, English, Hinglish • Voice search enabled</span>
        </div>

        {/* Search Suggestions */}
        {showSuggestions && suggestionsData?.suggestions && suggestionsData.suggestions.length > 0 && (
          <Card className="absolute top-full mt-1 w-full z-50 border-amber-200">
            <CardContent className="p-2">
              {suggestionsData.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => selectSuggestion(suggestion)}
                  className="w-full text-left p-2 hover:bg-amber-50 rounded-lg transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </form>

      {/* Search Results */}
      {searchError && (
        <Card className="border-red-200 bg-red-50 mb-4">
          <CardContent className="p-4">
            <p className="text-red-600">Search error: {searchError.message}</p>
          </CardContent>
        </Card>
      )}

      {searchData && (
        <div className="space-y-4">
          {/* Search Info */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Found {searchData.total} results for "{searchData.query}"</span>
            <span>Search powered by AI • Multi-language support</span>
          </div>

          {/* No Results - Show AI Search Option */}
          {searchData.total === 0 && searchData.searchType === 'instant' && (
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <CardContent className="p-6 text-center">
                <Brain className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  No instant results found
                </h3>
                <p className="text-gray-600 mb-4">
                  Don't worry! Our AI can understand Hindi, Hinglish, and translate your search to find exactly what you're looking for.
                </p>
                <div className="mb-4">
                  <QuoteCard 
                    text={getRandomFoodQuote('tea_time').text}
                    movie={getRandomFoodQuote('tea_time').movie}
                    className="text-left"
                  />
                </div>
                <Button
                  onClick={() => aiSearchMutation.mutate(searchQuery)}
                  disabled={aiSearchMutation.isPending}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium"
                >
                  {aiSearchMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      AI is thinking...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Should I try harder?
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Translation Info */}
          {searchData.translation && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <Globe className="h-4 w-4" />
                  <span className="font-medium">Translation:</span>
                  <span>"{searchData.translation.originalQuery}" → "{searchData.translation.translatedQuery}"</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {searchData.translation.detectedLanguage}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchData.results.map((product) => (
              <Card 
                key={product.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow border-amber-100 hover:border-amber-300"
                onClick={() => selectProduct(product.id)}
              >
                <CardContent className="p-4">
                  {/* Product Image */}
                  {product.images.length > 0 && (
                    <div className="relative mb-3">
                      <OptimizedImage
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      
                      {/* Match Type Badge */}
                      <Badge className={`absolute top-2 right-2 ${getMatchTypeColor(product.matchType)}`}>
                        {getMatchTypeLabel(product.matchType)}
                      </Badge>
                    </div>
                  )}

                  {/* Product Info */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-navy line-clamp-2">{product.name}</h3>
                      <span className="text-amber-600 font-bold">₹{product.price}</span>
                    </div>

                    <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>

                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{product.categoryName}</Badge>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-16 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-500 transition-all duration-300"
                            style={{ width: `${Math.min(product.relevanceScore, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{Math.round(product.relevanceScore)}%</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {product.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {product.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No Results for AI Search */}
          {searchData.results.length === 0 && searchData.searchType === 'ai' && (
            <Card className="border-amber-200">
              <CardContent className="p-8 text-center">
                <Search className="h-12 w-12 text-amber-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-navy mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  Even our AI couldn't find matching products. Try searching with different terms.
                </p>
                <div className="mb-4">
                  <QuoteCard 
                    text={getRandomFoodQuote().text}
                    movie={getRandomFoodQuote().movie}
                    className="text-left"
                  />
                </div>
                <div className="text-sm text-gray-500">
                  <p>You can search in:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Hindi: "मिठाई", "केक"</li>
                    <li>• English: "sweets", "cake"</li>
                    <li>• Hinglish: "meetha cake", "chocolate wala biscuit"</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}