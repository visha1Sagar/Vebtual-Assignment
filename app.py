from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
import uvicorn
from openai import OpenAI

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TemplateRequest(BaseModel):
    prompt: str
    apiKey: str

class ChatRequest(BaseModel):
    message: str
    apiKey: str = ""
    step: str = ""  # Track which step of the flow we're in
    conversation_context: dict = {}  # Store conversation context

@app.get("/status")
def status():
    return {"message": "This is a reply from the FastAPI server."}

@app.get("/fetch_info")
def proxy(url: str):
    res = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    soup = BeautifulSoup(res.text, "html.parser")

    # Try to extract Open Graph tags
    title = soup.find("meta", property="og:title")
    image = soup.find("meta", property="og:image")
    price = soup.find("meta", property="product:price:amount")


    # Fallback parsing
    if not title:
        title = soup.find("title") or soup.find("h1")
    if not image:
        img_tag = soup.find("img", {"class": lambda x: x and "product" in x.lower()}) \
                  or soup.find("img")
        image = img_tag["src"] if img_tag and img_tag.has_attr("src") else None
    if not price:
        price_tag = soup.find(lambda tag: tag.name in ["span","div"] and "price" in tag.get("class", []))
        price = price_tag.text.strip() if price_tag else None

    return {
        "title": title["content"] if title and title.has_attr("content") else title.text if title else "Unknown Product",
        "image": image["content"] if hasattr(image, "get") else image if image else "placeholder.jpg",
        "price": price["content"] if price and hasattr(price, "get") else price if price else "N/A"
    }

@app.post("/chat")
def chat(request: ChatRequest):
    try:
        # Validate API key
        if not request.apiKey or not request.apiKey.strip():
            raise HTTPException(status_code=400, detail="OpenAI API key is required")
        
        # Create OpenAI client with API key
        client = OpenAI(api_key=request.apiKey)
        
        # Handle different conversation steps
        if request.step == "collect_details":
            # Step 1: Collect template details (tone, audience, etc.)
            return {
                "message": "Great! Tell me in more details to create the perfect email template for you. You can answer such questions:",
                "questions": [
                    "What tone would you like for your email? (e.g., professional, friendly, persuasive, urgent)",
                    "Who is your target audience? (e.g., existing customers, new prospects, VIP clients)",
                    "What's the main purpose of this email? (e.g., product promotion, newsletter, announcement)",
                    "Any specific style preferences or branding guidelines?"
                ],
                "next_step": "collect_urls",
                "show_tone_options": True
            }
        
        elif request.step == "collect_urls":
            # Step 2: Ask for product URLs
            return {
                "message": "Perfect! Now please provide the product URLs you'd like to feature in your email template (one URL per line):",
                "next_step": "generate_template"
            }
        
        elif request.step == "generate_template":
            # Step 3: Fetch product info and generate template
            try:
                # Extract URLs from the message
                urls = [url.strip() for url in request.message.strip().split('\n') if url.strip()]
                
                if not urls:
                    return {
                        "message": "Please provide at least one valid product URL.",
                        "next_step": "generate_template"
                    }
                
                # Fetch product information for each URL
                products = []
                for url in urls:
                    try:
                        import requests
                        from bs4 import BeautifulSoup
                        
                        res = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
                        soup = BeautifulSoup(res.text, "html.parser")

                        # Try to extract Open Graph tags
                        title = soup.find("meta", property="og:title")
                        image = soup.find("meta", property="og:image")
                        price = soup.find("meta", property="product:price:amount")

                        # Fallback parsing
                        if not title:
                            title = soup.find("title") or soup.find("h1")
                        if not image:
                            img_tag = soup.find("img", {"class": lambda x: x and "product" in x.lower()}) \
                                      or soup.find("img")
                            image = img_tag["src"] if img_tag and img_tag.has_attr("src") else None
                        if not price:
                            price_tag = soup.find(lambda tag: tag.name in ["span","div"] and "price" in tag.get("class", []))
                            price = price_tag.text.strip() if price_tag else None

                        product_info = {
                            "url": url,
                            "title": title["content"] if title and title.has_attr("content") else title.text if title else "Unknown Product",
                            "image": image["content"] if hasattr(image, "get") else image if image else "placeholder.jpg",
                            "price": price["content"] if price and hasattr(price, "get") else price if price else "N/A"
                        }
                        products.append(product_info)
                        
                    except Exception as e:
                        # Add placeholder data for failed fetches
                        products.append({
                            "url": url,
                            "title": "Product Title",
                            "image": "placeholder.jpg",
                            "price": "N/A"
                        })
                
                # Generate email template using OpenAI with product data and conversation context
                context = request.conversation_context
                print(f"DEBUG: Received conversation context: {context}")  # Debug log
                
                # Build the prompt with all collected information
                prompt = f"""
Create a professional HTML email template with the following requirements:

**Template Details:**
- Tone: {context.get('tone', 'professional')}
- Target Audience: {context.get('audience', 'customers')}
- Purpose: {context.get('purpose', 'product promotion')}
- Style Preferences: {context.get('style', 'clean and modern')}

**Products to Feature:**
"""
                
                for i, product in enumerate(products, 1):
                    prompt += f"""
Product {i}:
- Title: {product['title']}
- Price: {product['price']}
- URL: {product['url']}
- Image: {product['image']}
"""
                
                prompt += """

Please create a complete, responsive HTML email template that:
1. Incorporates all the products with their details
2. Matches the specified tone and audience
3. Includes proper email-safe CSS styling
4. Has a professional layout with product images, titles, prices, and call-to-action buttons
5. Is mobile-responsive and works across email clients

Return ONLY the HTML code, no explanations or markdown formatting.
"""
                
                # Create the email template using OpenAI
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are an expert email template designer. Create responsive, professional HTML email templates that work across all email clients."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                )
                
                # Extract content from the response
                html_template = response.choices[0].message.content
                
                # Clean up HTML template by removing markdown code block markers
                if html_template:
                    # Remove ```html at the beginning
                    if html_template.strip().startswith('```html'):
                        html_template = html_template.strip()[7:]  # Remove ```html
                    elif html_template.strip().startswith('```'):
                        html_template = html_template.strip()[3:]   # Remove ```
                    
                    # Remove ``` at the end
                    if html_template.strip().endswith('```'):
                        html_template = html_template.strip()[:-3]  # Remove trailing ```
                    
                    # Clean up any extra whitespace
                    html_template = html_template.strip()
                
                return {
                    "message": f"Perfect! I've generated your email template featuring {len(products)} product(s) with a {context.get('tone', 'professional')} tone. The template is ready to use!",
                    "html": html_template,
                    "products": products,
                    "next_step": "complete"
                }
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error generating template: {str(e)}")
        
        else:
            # Default: Initial message or general chat
            return {
                "message": "Hi! I'm ready to help you create an amazing email template. Let's start by gathering some details about what you need.",
                "next_step": "collect_details"
            }
    
    except Exception as e:
        # Handle specific OpenAI errors
        error_message = str(e)
        if "api key" in error_message.lower() or "unauthorized" in error_message.lower():
            raise HTTPException(status_code=401, detail="Invalid OpenAI API key")
        elif "quota" in error_message.lower() or "billing" in error_message.lower():
            raise HTTPException(status_code=402, detail="OpenAI API quota exceeded or billing issue")
        else:
            raise HTTPException(status_code=500, detail=f"Error: {error_message}")

if __name__ == "__main__":
        uvicorn.run("app:app", host="localhost", port=8000, reload=True)

