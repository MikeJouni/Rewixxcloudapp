import uvicorn
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MaterialInfo(BaseModel):
    name: str = ""
    price: str = ""
    category: str = ""
    sku: str = ""
    supplier: str = "Home Depot"
    url: str = ""

@app.get("/api/materials/barcode-lookup", response_model=MaterialInfo)
def barcode_lookup(barcode: str = Query(..., min_length=1)):
    headers = {"User-Agent": "Mozilla/5.0"}
    search_url = f"https://www.homedepot.com/s/{barcode}"
    r = requests.get(search_url, headers=headers)
    if r.status_code != 200:
        return MaterialInfo(sku=barcode, url=search_url)
    soup = BeautifulSoup(r.text, "html.parser")
    # Find the first product link in the search results
    product_link = soup.find("a", {"data-pod-type": "pr"})
    if not product_link or not product_link.get("href"):
        return MaterialInfo(sku=barcode, url=search_url)
    product_url = "https://www.homedepot.com" + product_link.get("href")
    # Now fetch the product page
    r2 = requests.get(product_url, headers=headers)
    if r2.status_code != 200:
        return MaterialInfo(sku=barcode, url=product_url)
    soup2 = BeautifulSoup(r2.text, "html.parser")
    name = soup2.find("h1", {"data-testid": "product-title"})
    name = name.text.strip() if name else ""
    price = soup2.find("span", {"data-testid": "product-price"})
    price = price.text.strip() if price else ""
    breadcrumb = soup2.find("ol", {"data-testid": "breadcrumb-list"})
    category = ""
    if breadcrumb:
        items = breadcrumb.find_all("li")
        if len(items) > 1:
            category = items[-2].text.strip()
    return MaterialInfo(
        name=name,
        price=price,
        category=category,
        sku=barcode,
        supplier="Home Depot",
        url=product_url
    )


uvicorn.run(app, host="0.0.0.0", port=8001) 
