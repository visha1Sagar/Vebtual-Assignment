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

@app.get("/reply")
def reply():
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


if __name__ == "__main__":
        uvicorn.run("app:app", host="localhost", port=8000, reload=True)

