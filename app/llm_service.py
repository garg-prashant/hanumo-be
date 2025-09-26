import openai
import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")

class LLMService:
    def __init__(self):
        self.client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    async def enhance_property_description(
        self,
        title: str,
        description: str,
        keywords: str,
        number_of_rooms: int,
        has_kitchen: bool,
        has_bathroom: bool,
        number_of_bathrooms: int,
        rent_amount: float,
        payment_mode: str,
        address: str,
        city: str,
        state: str,
        country: str
    ) -> str:
        """
        Enhance property description using OpenAI GPT
        """
        
        property_features = []
        if has_kitchen:
            property_features.append("kitchen")
        if has_bathroom:
            property_features.append(f"{number_of_bathrooms} bathroom(s)")
        
        features_text = ", ".join(property_features) if property_features else "basic amenities"
        
        prompt = f"""
        You are a professional real estate content writer. Please create an enhanced, engaging property description based on the following details:

        Property Title: {title}
        Current Description: {description}
        Keywords to incorporate: {keywords}
        
        Property Details:
        - {number_of_rooms} rooms
        - Features: {features_text}
        - Rent: ${rent_amount} ({payment_mode})
        - Location: {address}, {city}, {state}, {country}
        
        Please create a compelling, professional property description that:
        1. Incorporates the provided keywords naturally
        2. Highlights the key features and benefits
        3. Appeals to potential tenants
        4. Maintains a professional tone
        5. Is between 150-300 words
        6. Includes information about the location's advantages
        
        The description should be engaging and help the property stand out to potential tenants.
        """
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a professional real estate content writer who creates compelling property descriptions."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=400,
                temperature=0.7
            )
            
            enhanced_description = response.choices[0].message.content.strip()
            return enhanced_description
            
        except Exception as e:
            # Fallback to original description if LLM service fails
            fallback_description = f"{description}\n\nKeywords: {keywords}"
            return fallback_description

# Create a global instance
llm_service = LLMService()
