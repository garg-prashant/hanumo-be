import OpenAI from 'openai';
import { logger } from '@/utils/logger';

/**
 * LLM Service for AI-powered features
 */
class LLMService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Enhance property description using OpenAI GPT
   */
  async enhancePropertyDescription(params: {
    title: string;
    description: string;
    keywords: string;
    numberOfRooms: number;
    hasKitchen: boolean;
    hasBathroom: boolean;
    numberOfBathrooms: number;
    rentAmount: number;
    paymentMode: string;
    address: string;
    city: string;
    state: string;
    country: string;
  }): Promise<string> {
    const {
      title,
      description,
      keywords,
      numberOfRooms,
      hasKitchen,
      hasBathroom,
      numberOfBathrooms,
      rentAmount,
      paymentMode,
      address,
      city,
      state,
      country,
    } = params;

    const propertyFeatures = [];
    if (hasKitchen) {
      propertyFeatures.push('kitchen');
    }
    if (hasBathroom) {
      propertyFeatures.push(`${numberOfBathrooms} bathroom(s)`);
    }

    const featuresText = propertyFeatures.length > 0 ? propertyFeatures.join(', ') : 'basic amenities';

    const prompt = `
      You are a professional real estate content writer. Please create an enhanced, engaging property description based on the following details:

      Property Title: ${title}
      Current Description: ${description}
      Keywords to incorporate: ${keywords}
      
      Property Details:
      - ${numberOfRooms} rooms
      - Features: ${featuresText}
      - Rent: $${rentAmount} (${paymentMode})
      - Location: ${address}, ${city}, ${state}, ${country}
      
      Please create a compelling, professional property description that:
      1. Incorporates the provided keywords naturally
      2. Highlights the key features and benefits
      3. Appeals to potential tenants
      4. Maintains a professional tone
      5. Is between 150-300 words
      6. Includes information about the location's advantages
      
      The description should be engaging and help the property stand out to potential tenants.
    `;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional real estate content writer who creates compelling property descriptions.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 400,
        temperature: 0.7,
      });

      const enhancedDescription = response.choices[0]?.message?.content?.trim();
      return enhancedDescription || this.getFallbackDescription(description, keywords);
    } catch (error) {
      logger.error('LLM service error:', error);
      return this.getFallbackDescription(description, keywords);
    }
  }

  /**
   * Generate property search suggestions based on user input
   */
  async generateSearchSuggestions(userInput: string): Promise<string[]> {
    try {
      const prompt = `
        Based on the user's property search input: "${userInput}"
        
        Generate 5 relevant search suggestions that would help them find the right property.
        Focus on:
        - Location variations
        - Property type suggestions
        - Price range suggestions
        - Feature suggestions
        
        Return only the suggestions, one per line, without numbering.
      `;

      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful real estate search assistant.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.5,
      });

      const suggestions = response.choices[0]?.message?.content?.trim();
      return suggestions ? suggestions.split('\n').filter(s => s.trim()) : [];
    } catch (error) {
      logger.error('LLM search suggestions error:', error);
      return [];
    }
  }

  /**
   * Generate property recommendations based on user preferences
   */
  async generatePropertyRecommendations(preferences: {
    budget: number;
    location: string;
    propertyType: string;
    mustHaves: string[];
    dealBreakers: string[];
  }): Promise<string> {
    try {
      const prompt = `
        Based on the user's property preferences:
        - Budget: $${preferences.budget}
        - Location: ${preferences.location}
        - Property Type: ${preferences.propertyType}
        - Must Haves: ${preferences.mustHaves.join(', ')}
        - Deal Breakers: ${preferences.dealBreakers.join(', ')}
        
        Generate personalized property recommendations and search tips.
        Include:
        1. Budget-friendly areas to consider
        2. Property features to prioritize
        3. Red flags to watch out for
        4. Negotiation tips
        5. Additional considerations
        
        Keep it concise but helpful (200-300 words).
      `;

      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a knowledgeable real estate advisor providing personalized recommendations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 400,
        temperature: 0.6,
      });

      return response.choices[0]?.message?.content?.trim() || 'Unable to generate recommendations at this time.';
    } catch (error) {
      logger.error('LLM recommendations error:', error);
      return 'Unable to generate recommendations at this time.';
    }
  }

  /**
   * Analyze property description for completeness and quality
   */
  async analyzePropertyDescription(description: string): Promise<{
    score: number;
    suggestions: string[];
    missingElements: string[];
  }> {
    try {
      const prompt = `
        Analyze this property description for completeness and quality:
        
        "${description}"
        
        Rate it on a scale of 1-10 and provide:
        1. A quality score (1-10)
        2. 3-5 specific suggestions for improvement
        3. Missing elements that should be included
        
        Format your response as JSON:
        {
          "score": number,
          "suggestions": ["suggestion1", "suggestion2", ...],
          "missingElements": ["element1", "element2", ...]
        }
      `;

      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a real estate content quality analyst. Respond only with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 300,
        temperature: 0.3,
      });

      const analysis = response.choices[0]?.message?.content?.trim();
      if (analysis) {
        try {
          return JSON.parse(analysis);
        } catch {
          // Fallback if JSON parsing fails
          return {
            score: 5,
            suggestions: ['Improve description clarity', 'Add more specific details'],
            missingElements: ['Location benefits', 'Unique selling points'],
          };
        }
      }

      return {
        score: 5,
        suggestions: ['Improve description clarity', 'Add more specific details'],
        missingElements: ['Location benefits', 'Unique selling points'],
      };
    } catch (error) {
      logger.error('LLM analysis error:', error);
      return {
        score: 5,
        suggestions: ['Improve description clarity', 'Add more specific details'],
        missingElements: ['Location benefits', 'Unique selling points'],
      };
    }
  }

  /**
   * Get fallback description when LLM service fails
   */
  private getFallbackDescription(description: string, keywords: string): string {
    return `${description}\n\nKeywords: ${keywords}`;
  }
}

// Create singleton instance
export const llmService = new LLMService();
export default llmService;
