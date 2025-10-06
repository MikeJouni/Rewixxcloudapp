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
        # Check if SerpAPI key is available
        if not SERPAPI_KEY:
            raise Exception("SerpAPI key not configured")
        
        # Try multiple search approaches with SerpAPI
        search_attempts = [
            {"q": barcode, "description": f"barcode {barcode}"},
            {"q": f"UPC {barcode}", "description": f"UPC {barcode}"}
        ]
        
        for attempt in search_attempts:
            params = {
                "api_key": SERPAPI_KEY,
                "engine": "home_depot",
                "q": attempt["q"],
                "num": 1
            }
            
            response = requests.get(SERPAPI_BASE_URL, params=params, timeout=10)
            
            if response.status_code != 200:
                continue
            
            data = response.json()
            
            if "products" not in data or not data["products"]:
                continue
            
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
        
        # If all attempts failed, raise an exception
        raise Exception("Product not found")
        
    except Exception as e:
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
