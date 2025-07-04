import uvicorn
from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import requests
import base64
import os
from dotenv import load_dotenv
import re

load_dotenv()

VERYFI_CLIENT_ID = os.getenv("VERYFI_CLIENT_ID")
VERYFI_API_KEY = os.getenv("VERYFI_API_KEY")
VERYFI_BASE_URL = "https://api.veryfi.com/api/v8/partner/documents"

SERPAPI_KEY = os.getenv("SERPAPI_KEY")
SERPAPI_BASE_URL = "https://serpapi.com/search"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

@app.get("/api/materials/barcode-lookup")
def barcode_lookup(barcode):
    try:
        search_url = f"https://www.homedepot.com/s/{barcode}"
        headers = {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1"
        }
        response = requests.get(search_url, headers=headers, timeout=10, allow_redirects=True)
        product_id_match = re.search(r'/p/[^/]+/(\d+)$', response.url)
        
        if not product_id_match:
            raise Exception("Product ID not found")
        
        product_id = product_id_match.group(1)
        
        params = {
            "api_key": SERPAPI_KEY,
            "engine": "home_depot",
            "q": product_id,
            "num": 1
        }
        response = requests.get(SERPAPI_BASE_URL, params=params, timeout=10)
        
        if response.status_code != 200:
            raise Exception("SerpAPI request failed")
        
        data = response.json()
        if "products" not in data:
            raise Exception("No product found")
        
        product = data["products"][0]
        price = product.get("price")
        if price:
            price_str = str(price)
        else:
            price_str = ""
        return {
            "name": product.get("title", ""),
            "price": price_str,
            "category": product.get("category", ""),
            "sku": barcode,
            "supplier": "Home Depot",
            "url": product.get("link", ""),
            "image_url": product.get("thumbnail", ""),
            "description": product.get("description", ""),
            "availability": product.get("availability", "")
        }
        
    except Exception:
        return {
            "name": f"Product (UPC: {barcode})",
            "price": "",
            "category": "",
            "sku": barcode,
            "supplier": "Unknown",
            "url": "",
            "image_url": "",
            "description": "Product not found on Home Depot",
            "availability": ""
        }

@app.post("/api/receipts/process")
async def process_receipt(file: UploadFile):
    try:
        image_data = await file.read()
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        headers = {
            'Content-Type': "application/json",
            'Accept': 'application/json',
            'CLIENT-ID': VERYFI_CLIENT_ID,
            'AUTHORIZATION': f"apikey {VERYFI_API_KEY}",
        }
        payload = {
            "file_data": image_base64,
            "auto_delete": True
        }
        response = requests.post(
            VERYFI_BASE_URL,
            headers=headers,
            json=payload
        )
        if response.status_code != 201:
            raise Exception("Veryfi API request failed")
        
        veryfi_data = response.json()
        
        items = []
        line_items = veryfi_data.get("line_items", [])
        for item in line_items:
            name = item.get("description", "")
            price = item.get("price")
            quantity = item.get("quantity")
            total = item.get("total")
            if price:
                price_float = abs(float(price))
            else:
                price_float = 0.0
            if quantity:
                quantity_float = abs(float(quantity))
            else:
                quantity_float = 1.0
            if total:
                total_float = abs(float(total))
            else:
                total_float = 0.0
            
            items.append({
                "name": name,
                "price": price_float,
                "quantity": quantity_float,
                "total": total_float
            })
        
        vendor = veryfi_data.get("vendor", {})
        if vendor:
            vendor_name = vendor.get("name", "")
        else:
            vendor_name = ""
        return {
            "vendor": vendor_name,
            "date": veryfi_data.get("date", ""),
            "total": abs(float(veryfi_data.get("total", 0))),
            "subtotal": abs(float(veryfi_data.get("subtotal", 0))),
            "tax": abs(float(veryfi_data.get("tax", 0))),
            "receipt_number": veryfi_data.get("receipt_number", ""),
            "currency": veryfi_data.get("currency_code", "USD"),
            "items": items,
            "raw_veryfi_data": veryfi_data
        }
        
    except Exception:
        return {
            "vendor": "",
            "date": "",
            "total": 0.0,
            "subtotal": 0.0,
            "tax": 0.0,
            "receipt_number": "",
            "currency": "USD",
            "items": [],
            "raw_veryfi_data": {}
        }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 
