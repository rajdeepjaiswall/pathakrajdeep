import OpenAI from 'openai';
import { Product } from '@shared/schema';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

interface TranslationResult {
  originalQuery: string;
  translatedQuery: string;
  detectedLanguage: string;
  confidence: number;
}

interface ExtendedProduct extends Product {
  categoryName?: string;
}

export class SearchService {
  
  // First tier: Instant name lookup
  static performInstantSearch(query: string, products: ExtendedProduct[]): SearchResult[] {
    const normalizedQuery = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    for (const product of products) {
      let relevanceScore = 0;
      let matchType: 'exact' | 'translated' | 'semantic' | 'tag' = 'exact';

      // Exact name match (highest priority)
      if (product.name.toLowerCase().includes(normalizedQuery)) {
        relevanceScore = 100;
      }
      // Description match
      else if (product.description?.toLowerCase().includes(normalizedQuery)) {
        relevanceScore = 80;
      }
      // Tags match
      else if (product.tags?.some(tag => tag.toLowerCase().includes(normalizedQuery))) {
        relevanceScore = 70;
        matchType = 'tag';
      }

      if (relevanceScore > 0) {
        results.push({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          images: product.images || [],
          categoryName: product.categoryName || 'Unknown',
          tags: product.tags || [],
          relevanceScore,
          matchType
        });
      }
    }

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // Second tier: AI-powered translation and semantic search
  static async performAISearch(query: string, products: ExtendedProduct[]): Promise<{
    results: SearchResult[];
    translation?: TranslationResult;
  }> {
    try {
      // Translate the query using OpenAI
      const translation = await this.translateQuery(query);
      
      // If translation found, search with translated terms
      if (translation) {
        const translatedResults = this.performInstantSearch(translation.translatedQuery, products);
        
        if (translatedResults.length > 0) {
          return {
            results: translatedResults.map(result => ({
              ...result,
              matchType: 'translated' as const,
              relevanceScore: result.relevanceScore * 0.9 // Slightly lower score for translated matches
            })),
            translation
          };
        }
      }

      // If no translation results, perform semantic search
      const semanticResults = await this.performSemanticSearch(query, products);
      
      return {
        results: semanticResults,
        translation: translation || undefined
      };

    } catch (error) {
      console.error('AI search error:', error);
      
      // Fallback to fuzzy search
      return {
        results: this.performFuzzySearch(query, products)
      };
    }
  }

  // Translate Hinglish/Hindi queries to English
  static async translateQuery(query: string): Promise<TranslationResult | null> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a translation expert specializing in Indian bakery and food items. 
            Translate the given query from Hindi/Hinglish to English, focusing on bakery items.
            
            Common translations:
            - biscuit/biskut → biscuit
            - cake/kek → cake
            - bread/roti → bread
            - cookies/kuki → cookies
            - namkeen → savory snacks
            - mithai → sweets
            - laddu → sweet ball
            - barfi → milk sweet
            - samosa → fried pastry
            - kachori → fried snack
            
            Respond with JSON in this exact format:
            {
              "translatedQuery": "english translation",
              "detectedLanguage": "hindi|hinglish|english",
              "confidence": 0.8,
              "isTranslationNeeded": true
            }
            
            If the query is already in English, set isTranslationNeeded to false.`
          },
          {
            role: "user",
            content: `Translate this bakery search query: "${query}"`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 200
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      if (result.isTranslationNeeded && result.translatedQuery) {
        return {
          originalQuery: query,
          translatedQuery: result.translatedQuery,
          detectedLanguage: result.detectedLanguage,
          confidence: result.confidence
        };
      }

      return null;
    } catch (error) {
      console.error('Translation error:', error);
      return null;
    }
  }

  // Semantic search using OpenAI embeddings
  static async performSemanticSearch(query: string, products: ExtendedProduct[]): Promise<SearchResult[]> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a bakery product search expert. Given a search query and a list of products, 
            find the most relevant products based on semantic similarity, ingredients, taste, or usage context.
            
            Consider:
            - Similar ingredients (chocolate, vanilla, nuts)
            - Occasions (birthday, festival, daily snack)
            - Taste profiles (sweet, savory, spicy)
            - Product categories (cookies, cakes, breads)
            
            Respond with JSON containing an array of product IDs with relevance scores (0-100):
            {
              "matches": [
                {"productId": 1, "score": 85, "reason": "contains chocolate"},
                {"productId": 3, "score": 70, "reason": "similar sweet category"}
              ]
            }`
          },
          {
            role: "user",
            content: `Query: "${query}"
            
            Products:
            ${products.map(p => `ID: ${p.id}, Name: ${p.name}, Description: ${p.description || 'N/A'}, Tags: ${p.tags?.join(', ') || 'N/A'}`).join('\n')}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      const matches = result.matches || [];

      return matches
        .filter((match: any) => match.score > 50)
        .map((match: any) => {
          const product = products.find(p => p.id === match.productId);
          if (!product) return null;

          return {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            images: product.images || [],
            categoryName: product.categoryName || 'Unknown',
            tags: product.tags || [],
            relevanceScore: match.score,
            matchType: 'semantic' as const
          };
        })
        .filter(Boolean)
        .slice(0, 10);

    } catch (error) {
      console.error('Semantic search error:', error);
      return [];
    }
  }

  // Fallback fuzzy search
  static performFuzzySearch(query: string, products: ExtendedProduct[]): SearchResult[] {
    const normalizedQuery = query.toLowerCase();
    const results: SearchResult[] = [];

    for (const product of products) {
      const productText = `${product.name} ${product.description || ''} ${product.tags?.join(' ') || ''}`.toLowerCase();
      
      // Simple fuzzy matching - count matching words
      const queryWords = normalizedQuery.split(/\s+/);
      const matchingWords = queryWords.filter(word => 
        word.length > 2 && productText.includes(word)
      );

      if (matchingWords.length > 0) {
        const relevanceScore = (matchingWords.length / queryWords.length) * 60;
        
        results.push({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          images: product.images || [],
          categoryName: product.categoryName || 'Unknown',
          tags: product.tags || [],
          relevanceScore,
          matchType: 'semantic'
        });
      }
    }

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 10);
  }
}