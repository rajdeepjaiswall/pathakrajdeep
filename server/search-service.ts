import OpenAI from "openai";
import { db } from "./db";
import { products, categories } from "@shared/schema";
import { like, or, sql } from "drizzle-orm";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface SearchResult {
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

export interface EnhancedSearchQuery {
  originalQuery: string;
  translatedQuery: string;
  searchTerms: string[];
  detectedLanguage: string;
  intent: string;
}

export class SearchService {
  // Enhanced AI-powered search query understanding
  async enhanceSearchQuery(query: string): Promise<EnhancedSearchQuery> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a multilingual search assistant for a premium Indian bakery. Your job is to understand search queries in any language including Hinglish (Hindi-English mix) and provide enhanced search terms.

EXAMPLES:
- "meetha cake" → translate to "sweet cake", extract terms: ["sweet", "cake", "meetha"]
- "chocolate wala biscuit" → translate to "chocolate biscuit", extract terms: ["chocolate", "biscuit", "cookies"]
- "birthday ke liye cake" → translate to "birthday cake", extract terms: ["birthday", "cake", "celebration"]
- "खुशी वाला मिठाई" → translate to "happy sweets", extract terms: ["sweet", "happy", "mithai", "dessert"]
- "fresh bread" → already English, extract terms: ["fresh", "bread"]

Respond with JSON in this exact format:
{
  "translatedQuery": "English translation",
  "searchTerms": ["term1", "term2", "term3"],
  "detectedLanguage": "hindi/english/hinglish/other",
  "intent": "what user is looking for"
}`
          },
          {
            role: "user",
            content: `Enhance this search query: "${query}"`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        originalQuery: query,
        translatedQuery: result.translatedQuery || query,
        searchTerms: result.searchTerms || [query],
        detectedLanguage: result.detectedLanguage || 'unknown',
        intent: result.intent || 'general search'
      };
    } catch (error) {
      console.error('Search enhancement error:', error);
      // Fallback to basic search
      return {
        originalQuery: query,
        translatedQuery: query,
        searchTerms: [query],
        detectedLanguage: 'unknown',
        intent: 'general search'
      };
    }
  }

  // Advanced product search with multiple matching strategies
  async searchProducts(query: string, limit: number = 20): Promise<SearchResult[]> {
    const enhancedQuery = await this.enhanceSearchQuery(query);
    const searchResults: SearchResult[] = [];
    const seenIds = new Set<number>();

    // Strategy 1: Exact name matches (highest priority)
    const exactMatches = await this.findExactMatches(enhancedQuery, limit);
    exactMatches.forEach(result => {
      if (!seenIds.has(result.id)) {
        seenIds.add(result.id);
        searchResults.push({ ...result, matchType: 'exact' });
      }
    });

    // Strategy 2: Translated term matches
    const translatedMatches = await this.findTranslatedMatches(enhancedQuery, limit);
    translatedMatches.forEach(result => {
      if (!seenIds.has(result.id)) {
        seenIds.add(result.id);
        searchResults.push({ ...result, matchType: 'translated' });
      }
    });

    // Strategy 3: Tag and description matches
    const tagMatches = await this.findTagMatches(enhancedQuery, limit);
    tagMatches.forEach(result => {
      if (!seenIds.has(result.id)) {
        seenIds.add(result.id);
        searchResults.push({ ...result, matchType: 'tag' });
      }
    });

    // Strategy 4: Semantic search using AI (if we have fewer results)
    if (searchResults.length < 5) {
      const semanticMatches = await this.findSemanticMatches(enhancedQuery, limit);
      semanticMatches.forEach(result => {
        if (!seenIds.has(result.id)) {
          seenIds.add(result.id);
          searchResults.push({ ...result, matchType: 'semantic' });
        }
      });
    }

    // Sort by relevance score and match type priority
    return searchResults
      .sort((a, b) => {
        const typeOrder = { exact: 4, translated: 3, tag: 2, semantic: 1 };
        const typeScore = typeOrder[b.matchType] - typeOrder[a.matchType];
        if (typeScore !== 0) return typeScore;
        return b.relevanceScore - a.relevanceScore;
      })
      .slice(0, limit);
  }

  // Find exact matches in product names and categories
  private async findExactMatches(enhancedQuery: EnhancedSearchQuery, limit: number): Promise<SearchResult[]> {
    const allTerms = [enhancedQuery.originalQuery, enhancedQuery.translatedQuery, ...enhancedQuery.searchTerms];
    
    const results = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        images: products.images,
        categoryName: categories.name,
        tags: products.tags
      })
      .from(products)
      .leftJoin(categories, sql`${products.category_id} = ${categories.id}`)
      .where(
        or(
          ...allTerms.map(term => 
            or(
              like(products.name, `%${term}%`),
              like(categories.name, `%${term}%`)
            )
          )
        )
      )
      .limit(limit);

    return results.map(result => ({
      ...result,
      categoryName: result.categoryName || 'Uncategorized',
      images: (result.images as string[]) || [],
      tags: (result.tags as string[]) || [],
      relevanceScore: this.calculateRelevanceScore(result.name, allTerms),
      matchType: 'exact' as const
    }));
  }

  // Find matches using translated terms
  private async findTranslatedMatches(enhancedQuery: EnhancedSearchQuery, limit: number): Promise<SearchResult[]> {
    if (enhancedQuery.translatedQuery === enhancedQuery.originalQuery) {
      return []; // No translation needed
    }

    const results = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        images: products.images,
        categoryName: categories.name,
        tags: products.tags
      })
      .from(products)
      .leftJoin(categories, sql`${products.category_id} = ${categories.id}`)
      .where(
        or(
          like(products.name, `%${enhancedQuery.translatedQuery}%`),
          like(products.description, `%${enhancedQuery.translatedQuery}%`),
          like(categories.name, `%${enhancedQuery.translatedQuery}%`)
        )
      )
      .limit(limit);

    return results.map(result => ({
      ...result,
      categoryName: result.categoryName || 'Uncategorized',
      images: (result.images as string[]) || [],
      tags: (result.tags as string[]) || [],
      relevanceScore: this.calculateRelevanceScore(result.name, [enhancedQuery.translatedQuery]),
      matchType: 'translated' as const
    }));
  }

  // Find matches in tags and detailed descriptions
  private async findTagMatches(enhancedQuery: EnhancedSearchQuery, limit: number): Promise<SearchResult[]> {
    const searchTerms = enhancedQuery.searchTerms;
    
    const results = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        images: products.images,
        categoryName: categories.name,
        tags: products.tags
      })
      .from(products)
      .leftJoin(categories, sql`${products.category_id} = ${categories.id}`)
      .where(
        or(
          ...searchTerms.map(term => 
            like(products.description, `%${term}%`)
          )
        )
      )
      .limit(limit);

    return results.map(result => ({
      ...result,
      categoryName: result.categoryName || 'Uncategorized',
      images: (result.images as string[]) || [],
      tags: (result.tags as string[]) || [],
      relevanceScore: this.calculateRelevanceScore(
        `${result.name} ${result.description} ${(result.tags as string[])?.join(' ')}`, 
        searchTerms
      ),
      matchType: 'tag' as const
    }));
  }

  // AI-powered semantic search for complex queries
  private async findSemanticMatches(enhancedQuery: EnhancedSearchQuery, limit: number): Promise<SearchResult[]> {
    try {
      // Get all products for semantic analysis
      const allProducts = await db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          images: products.images,
          categoryName: categories.name,
          tags: products.tags
        })
        .from(products)
        .leftJoin(categories, sql`${products.category_id} = ${categories.id}`)
        .limit(50); // Limit for performance

      // Use AI to find semantic matches
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are helping find relevant bakery products based on user intent. 
            Rate each product's relevance to the search query on a scale of 0-100.
            Consider: product type, occasion, taste, texture, cultural context.
            
            Return JSON in this format:
            {"results": [{"id": 1, "score": 85}, {"id": 2, "score": 70}]}
            
            Only include products with score >= 60.`
          },
          {
            role: "user",
            content: `Search query: "${enhancedQuery.originalQuery}"
            Intent: ${enhancedQuery.intent}
            Language: ${enhancedQuery.detectedLanguage}
            
            Products to evaluate:
            ${allProducts.map(p => 
              `ID: ${p.id}, Name: ${p.name}, Category: ${p.categoryName}, Description: ${p.description}, Tags: ${(p.tags as string[])?.join(', ')}`
            ).join('\n')}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      });

      const aiResults = JSON.parse(response.choices[0].message.content || '{"results": []}');
      const relevantIds = aiResults.results || [];

      return allProducts
        .filter(product => 
          relevantIds.some((ai: any) => ai.id === product.id && ai.score >= 60)
        )
        .map(product => {
          const aiScore = relevantIds.find((ai: any) => ai.id === product.id)?.score || 0;
          return {
            ...product,
            categoryName: product.categoryName || 'Uncategorized',
            images: (product.images as string[]) || [],
            tags: (product.tags as string[]) || [],
            relevanceScore: aiScore,
            matchType: 'semantic' as const
          };
        });

    } catch (error) {
      console.error('Semantic search error:', error);
      return [];
    }
  }

  // Calculate relevance score based on term matches
  private calculateRelevanceScore(text: string, searchTerms: string[]): number {
    const lowerText = text.toLowerCase();
    let score = 0;
    
    searchTerms.forEach(term => {
      const lowerTerm = term.toLowerCase();
      if (lowerText.includes(lowerTerm)) {
        // Exact match gets higher score
        if (lowerText === lowerTerm) score += 100;
        // Word boundary match
        else if (lowerText.includes(` ${lowerTerm} `) || 
                 lowerText.startsWith(`${lowerTerm} `) || 
                 lowerText.endsWith(` ${lowerTerm}`)) {
          score += 80;
        }
        // Partial match
        else score += 40;
      }
    });
    
    return Math.min(score, 100);
  }

  // Generate SEO-friendly search suggestions
  async getSearchSuggestions(query: string): Promise<string[]> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Generate 5 search suggestions for a bakery website that would help users find products.
            Include variations in English and Hinglish. Focus on popular bakery items.
            Return as JSON array: ["suggestion1", "suggestion2", ...]`
          },
          {
            role: "user",
            content: `Current search: "${query}"`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      });

      const result = JSON.parse(response.choices[0].message.content || '{"suggestions": []}');
      return result.suggestions || [];
    } catch (error) {
      console.error('Search suggestions error:', error);
      return [];
    }
  }
}

export const searchService = new SearchService();