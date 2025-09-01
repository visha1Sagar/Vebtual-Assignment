from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
import uvicorn
import openai

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
        # If no API key is provided, return a guided message based on the step
        if not request.apiKey or request.apiKey.strip() == "":
            if request.step == "greeting":
                return {
                    "message": "Thank you for sharing that! Now, what tone would you prefer for your email template?",
                    "html": "",
                    "show_tone_options": True
                }
            elif request.step == "tone":
                return {
                    "message": f"Perfect! I'll use a {request.message} tone for your email. Now, please enter the product URL that you'd like to feature in your email template:",
                    "html": "",
                    "show_tone_options": False
                }
            elif request.step == "product_url":
                return {
                    "message": "Excellent! I have all the information needed to create your email template. To generate the actual template, please enter your OpenAI API key and then I can create your professional email template.",
                    "html": "",
                    "show_tone_options": False
                }
            else:
                return {
                    "message": "I can help guide you through creating an email template. What details would you like to include?",
                    "html": "",
                    "show_tone_options": False
                }
        
        openai.api_key = request.apiKey
        
        # Create the email template based on the message
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert email template designer. Create HTML email templates that are responsive and well-designed based on the user's request."},
                {"role": "user", "content": request.message}
            ],
            temperature=0.7,
        )
        
        # Extract content from the response
        email_template = response.choices[0].message.content
        
        # Attempt to extract HTML code from the response
        html_content = ""
        if "```html" in email_template and "```" in email_template:
            start = email_template.find("```html") + 7
            end = email_template.find("```", start)
            html_content = email_template[start:end].strip()
        elif "```" in email_template:
            start = email_template.find("```") + 3
            end = email_template.find("```", start)
            html_content = email_template[start:end].strip()
        
        return {
            "message": email_template.replace(f"```html{html_content}```", "").replace(f"```{html_content}```", "").strip(),
            "html": html_content or "",
            "show_tone_options": False
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
        uvicorn.run("app:app", host="localhost", port=8000, reload=True)

