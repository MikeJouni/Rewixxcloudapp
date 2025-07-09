import uvicorn
from fastapi import FastAPI, UploadFile, Request, HTTPException
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
def barcode_lookup(barcode: str, request: Request):
    print(f"[DEBUG] Received barcode lookup request: {barcode}")
    serpapi_key = os.getenv("SERPAPI_KEY")
    print(f"[DEBUG] Using SerpAPI key: {serpapi_key}")
    if not serpapi_key:
        print("[ERROR] SERPAPI_KEY not set in environment variables!")
        raise HTTPException(status_code=500, detail="SerpAPI key not configured.")
    try:
        serpapi_url = f"https://serpapi.com/search.json?engine=google_products&barcode={barcode}&api_key={serpapi_key}"
        print(f"[DEBUG] SerpAPI request URL: {serpapi_url}")
        response = requests.get(serpapi_url)
        print(f"[DEBUG] SerpAPI response status: {response.status_code}")
        print(f"[DEBUG] SerpAPI response text: {response.text}")
        response.raise_for_status()
        data = response.json()
        print(f"[DEBUG] Parsed SerpAPI response: {data}")
        return data
    except Exception as e:
        print(f"[ERROR] Exception during barcode lookup: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
