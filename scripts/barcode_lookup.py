import uvicorn
from fastapi import FastAPI, Query, File, UploadFile, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
import base64
import json
from typing import List, Optional
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

class MaterialInfo(BaseModel):
    name: str = ""
    price: str = ""
    category: str = ""
    sku: str = ""
    supplier: str = "Home Depot"
    url: str = ""
    image_url: str = ""
    description: str = ""
    availability: str = ""

class ReceiptItem(BaseModel):
    name: str
    price: float
    quantity: float = 1.0
    total: float

class ReceiptData(BaseModel):
    vendor: str = ""
    date: str = ""
    total: float = 0.0
    subtotal: float = 0.0
    tax: float = 0.0
    items: List[ReceiptItem] = []
    receipt_number: str = ""
    currency: str = "USD"
    raw_veryfi_data: dict = {}  # Store the full Veryfi response

class ReceiptVerificationRequest(BaseModel):
    receipt_id: str
    items: List[dict]  # User-corrected items
    total: float
    notes: str = ""

# API configuration
VERYFI_CLIENT_ID = os.getenv("VERYFI_CLIENT_ID")
VERYFI_API_KEY = os.getenv("VERYFI_API_KEY")
VERYFI_BASE_URL = "https://api.veryfi.com/api/v8"

# SerpAPI configuration
SERPAPI_KEY = os.getenv("SERPAPI_KEY")
SERPAPI_BASE_URL = "https://serpapi.com/search"

# Validate API keys are loaded
if not VERYFI_CLIENT_ID or VERYFI_CLIENT_ID == "your_veryfi_client_id_here":
    print("⚠️ WARNING: VERYFI_CLIENT_ID not set in environment variables")
if not VERYFI_API_KEY or VERYFI_API_KEY == "your_veryfi_api_key_here":
    print("⚠️ WARNING: VERYFI_API_KEY not set in environment variables")
if not SERPAPI_KEY or SERPAPI_KEY == "your_serpapi_key_here":
    print("⚠️ WARNING: SERPAPI_KEY not set in environment variables")

@app.get("/api/materials/barcode-lookup")
def barcode_lookup(barcode: str):
    """
    Look up product information using UPC -> Product ID -> SerpAPI approach
    """
    print("=" * 50)
    print("🚀 BARCODE LOOKUP ENDPOINT CALLED")
    print(f"📥 Raw barcode input: '{barcode}'")
    print(f"📏 Barcode length: {len(str(barcode))}")
    print(f"🔤 Barcode type: {type(barcode)}")
    print(f"🔍 Looking up barcode: {barcode}")
    print("=" * 50)
    
    # Clean the barcode - remove any non-numeric characters
    cleaned_barcode = ''.join(filter(str.isdigit, str(barcode)))
    if not cleaned_barcode:
        print(f"❌ Invalid barcode format: {barcode}")
        return {
            "name": f"Invalid Barcode: {barcode}",
            "price": "",
            "category": "",
            "sku": barcode,
            "supplier": "Unknown",
            "url": "",
            "image_url": "",
            "description": "Invalid barcode format",
            "availability": ""
        }
    
    print(f"🧹 Cleaned barcode: {cleaned_barcode}")
    
    # Only use SerpAPI approach
    try:
        print("🔄 Using SerpAPI approach...")
        result = upc_to_product_id_then_serpapi(cleaned_barcode)
        
        if result and result.get("name") and result.get("name", "").strip():
            print(f"✅ SerpAPI succeeded: {result.get('name')}")
            return result
        else:
            print(f"❌ SerpAPI returned empty result")
            
    except Exception as e:
        print(f"❌ SerpAPI failed: {str(e)}")
    
    # If SerpAPI fails, return a basic result
    print(f"⚠️ SerpAPI failed for barcode: {cleaned_barcode}")
    return {
        "name": f"Product (UPC: {cleaned_barcode})",
        "price": "",
        "category": "",
        "sku": cleaned_barcode,
        "supplier": "Unknown",
        "url": "",
        "image_url": "",
        "description": "Product not found in database",
        "availability": ""
    }

def upc_to_product_id_then_serpapi(barcode: str):
    """
    Get product ID from Home Depot UPC redirect, then use SerpAPI
    """
    try:
        # Step 1: Get the product ID from Home Depot's UPC redirect
        product_id = get_product_id_from_upc(barcode)
        if not product_id:
            print(f"❌ Could not get product ID for UPC: {barcode}")
            return None
        
        print(f"✅ Found product ID: {product_id} for UPC: {barcode}")
        
        # Step 2: Use SerpAPI with the product ID
        return search_serpapi_by_product_id(product_id, barcode)
        
    except Exception as e:
        print(f"Error in UPC to Product ID approach: {str(e)}")
        return None

def get_product_id_from_upc(barcode: str):
    """
    Get product ID from Home Depot's UPC redirect URL
    """
    try:
        # Home Depot UPC search URL
        search_url = f"https://www.homedepot.com/s/{barcode}"
        print(f"🔗 Searching Home Depot URL: {search_url}")
        
        headers = {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1"
        }
        
        # Don't follow redirects automatically, we want to see the final URL
        response = requests.get(search_url, headers=headers, timeout=10, allow_redirects=True)
        
        print(f"🔗 Final URL after redirect: {response.url}")
        
        # Extract product ID from the final URL
        # Pattern: /p/Product-Name-12345/100568306
        import re
        product_id_match = re.search(r'/p/[^/]+/(\d+)$', response.url)
        
        if product_id_match:
            product_id = product_id_match.group(1)
            print(f"🎯 Extracted product ID: {product_id}")
            print(f"📦 UPC {barcode} → Product ID {product_id}")
            return product_id
        else:
            print(f"❌ No product ID found in URL: {response.url}")
            print(f"🔍 URL pattern search failed for UPC: {barcode}")
            return None
        
    except Exception as e:
        print(f"Error getting product ID from UPC: {str(e)}")
        return None

def search_serpapi_by_product_id(product_id: str, original_barcode: str):
    """
    Search using SerpAPI with the actual product ID
    """
    if SERPAPI_KEY == "YOUR_SERPAPI_KEY_HERE":
        print("⚠️ SerpAPI key not configured, skipping")
        return None
        
    try:
        # Use the product ID directly in the search
        params = {
            "api_key": SERPAPI_KEY,
            "engine": "home_depot",
            "q": product_id,  # Search by product ID instead of UPC
            "num": 1
        }
        
        print(f"🔍 Searching SerpAPI with product ID: {product_id}")
        print(f"🔗 SerpAPI URL: {SERPAPI_BASE_URL}")
        print(f"📦 UPC {original_barcode} → Product ID {product_id} → SerpAPI Search")
        response = requests.get(SERPAPI_BASE_URL, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"📊 SerpAPI response keys: {list(data.keys())}")
            
            if "products" in data and len(data["products"]) > 0:
                product = data["products"][0]
                print(f"✅ Found product: {product.get('title', 'No title')}")
                print(f"🎯 Product ID {product_id} → Found: {product.get('title', 'No title')}")
                
                # Handle price - convert to string and handle None values
                price = product.get("price")
                if price is not None:
                    price_str = str(price)
                else:
                    price_str = ""
                
                return {
                    "name": product.get("title", ""),
                    "price": price_str,
                    "category": product.get("category", ""),
                    "sku": original_barcode,  # Keep original UPC as SKU
                    "supplier": "Home Depot",
                    "url": product.get("link", ""),
                    "image_url": product.get("thumbnail", ""),
                    "description": product.get("description", ""),
                    "availability": product.get("availability", "")
                }
            else:
                print(f"❌ No products found in SerpAPI response")
                print(f"🔍 Product ID {product_id} → No products found")
                return None
        
        else:
            print(f"❌ SerpAPI error: {response.status_code}")
            print(f"🔍 Product ID {product_id} → SerpAPI error {response.status_code}")
            return None
        
    except Exception as e:
        print(f"Error in SerpAPI search: {str(e)}")
        print(f"🔍 Product ID {product_id} → SerpAPI error: {str(e)}")
        return None

def search_homedepot_by_upc(barcode: str):
    """
    Search Home Depot using their search API by UPC
    """
    try:
        # Home Depot search API endpoint
        search_url = f"https://www.homedepot.com/s/{barcode}"
        
        headers = {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1"
        }
        
        response = requests.get(search_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            # Check if we got redirected to a product page
            if "/p/" in response.url:
                # We got a product page, extract info
                return extract_product_from_page(response.text, barcode, response.url)
            else:
                # We got a search results page, try to find the first product
                return extract_product_from_search(response.text, barcode)
        
        return None
        
    except Exception as e:
        print(f"Error in Home Depot search: {str(e)}")
        return None

def search_serpapi_homedepot(barcode: str):
    """
    Search using SerpAPI Home Depot engine
    """
    if SERPAPI_KEY == "YOUR_SERPAPI_KEY_HERE":
        print("⚠️ SerpAPI key not configured, skipping")
        return None
        
    try:
        params = {
            "api_key": SERPAPI_KEY,
            "engine": "home_depot",
            "q": barcode,
            "num": 1
        }
        
        response = requests.get(SERPAPI_BASE_URL, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            if "products" in data and len(data["products"]) > 0:
                product = data["products"][0]
                
                return MaterialInfo(
                    name=product.get("title", ""),
                    price=product.get("price", ""),
                    category=product.get("category", ""),
                    sku=barcode,
                    supplier="Home Depot",
                    url=product.get("link", ""),
                    image_url=product.get("thumbnail", ""),
                    description=product.get("description", ""),
                    availability=product.get("availability", "")
                )
        
        return None
        
    except Exception as e:
        print(f"Error in SerpAPI search: {str(e)}")
        return None

def fallback_barcode_lookup(barcode: str):
    """
    Fallback to web scraping if other methods fail
    """
    print(f"Using fallback web scraping for UPC: {barcode}")
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        search_url = f"https://www.homedepot.com/s/{barcode}"
        r = requests.get(search_url, headers=headers, timeout=10)
        if r.status_code != 200:
            return MaterialInfo(
                name=f"Product (UPC: {barcode})",
                price="",
                category="",
                sku=barcode,
                supplier="Unknown",
                url=search_url,
                image_url="",
                description="Product not found",
                availability=""
            )
        soup = BeautifulSoup(r.text, "html.parser")
        # Find the first product link in the search results
        product_link = soup.find("a", {"data-pod-type": "pr"})
        if not product_link or not product_link.get("href"):
            return MaterialInfo(
                name=f"Product (UPC: {barcode})",
                price="",
                category="",
                sku=barcode,
                supplier="Unknown",
                url=search_url,
                image_url="",
                description="Product not found",
                availability=""
            )
        
        href = product_link.get("href")
        if not href:
            return MaterialInfo(
                name=f"Product (UPC: {barcode})",
                price="",
                category="",
                sku=barcode,
                supplier="Unknown",
                url=search_url,
                image_url="",
                description="Product not found",
                availability=""
            )
        
        product_url = "https://www.homedepot.com" + str(href)
        # Now fetch the product page
        r2 = requests.get(product_url, headers=headers, timeout=10)
        if r2.status_code != 200:
            return MaterialInfo(
                name=f"Product (UPC: {barcode})",
                price="",
                category="",
                sku=barcode,
                supplier="Unknown",
                url=product_url,
                image_url="",
                description="Product not found",
                availability=""
            )
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
            url=product_url,
            image_url="",
            description="",
            availability=""
        )
    except Exception as e:
        print(f"Error in fallback lookup: {str(e)}")
        return MaterialInfo(
            name=f"Product (UPC: {barcode})",
            price="",
            category="",
            sku=barcode,
            supplier="Unknown",
            url="",
            image_url="",
            description="Error occurred during lookup",
            availability=""
        )

def extract_product_from_page(html_content: str, barcode: str, url: str):
    """
    Extract product information from a Home Depot product page
    """
    try:
        soup = BeautifulSoup(html_content, "html.parser")
        
        # Extract product name
        name_elem = soup.find("h1", {"data-testid": "product-title"})
        name = name_elem.text.strip() if name_elem else ""
        
        # Extract price
        price_elem = soup.find("span", {"data-testid": "product-price"})
        price = price_elem.text.strip() if price_elem else ""
        
        # Extract category from breadcrumbs
        breadcrumb = soup.find("ol", {"data-testid": "breadcrumb-list"})
        category = ""
        if breadcrumb and hasattr(breadcrumb, 'find_all'):
            items = breadcrumb.find_all("li")
            if len(items) > 1:
                category = items[-2].text.strip()
        
        # Extract image
        image_elem = soup.find("img", {"data-testid": "product-image"})
        image_url = ""
        if image_elem and hasattr(image_elem, 'get'):
            image_url = image_elem.get("src", "")
        
        return MaterialInfo(
            name=name,
            price=price,
            category=category,
            sku=barcode,
            supplier="Home Depot",
            url=url,
            image_url=image_url,
            description="",
            availability=""
        )
        
    except Exception as e:
        print(f"Error extracting product from page: {str(e)}")
        return None

def extract_product_from_search(html_content: str, barcode: str):
    """
    Extract product information from Home Depot search results
    """
    try:
        soup = BeautifulSoup(html_content, "html.parser")
        
        # Find the first product link in search results
        product_link = soup.find("a", {"data-pod-type": "pr"})
        if not product_link or not hasattr(product_link, 'get'):
            return None
        
        href = product_link.get("href")
        if not href:
            return None
        
        product_url = "https://www.homedepot.com" + str(href)
        
        # Fetch the product page
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(product_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            return extract_product_from_page(response.text, barcode, product_url)
        
        return None
        
    except Exception as e:
        print(f"Error extracting product from search: {str(e)}")
        return None

@app.post("/api/receipts/process", response_model=ReceiptData)
async def process_receipt(file: UploadFile = File(...)):
    """
    Process a receipt image using Veryfi API to extract structured data
    """
    try:
        print(f"Processing receipt: {file.filename}, size: {file.size} bytes")
        
        # Read the uploaded file
        image_data = await file.read()
        print(f"Read {len(image_data)} bytes from file")
        
        # Encode image to base64
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        print(f"Encoded image to base64, length: {len(image_base64)}")
        
        # Prepare Veryfi API request
        headers = {
            "CLIENT-ID": VERYFI_CLIENT_ID,
            "Authorization": f"apikey {VERYFI_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "file_data": image_base64,
            "auto_delete": True  # Veryfi will delete the document after processing
        }
        
        print("Sending request to Veryfi API...")
        
        # Call Veryfi API
        response = requests.post(
            f"{VERYFI_BASE_URL}/partner/documents",
            headers=headers,
            json=payload
        )
        
        print(f"Veryfi API response status: {response.status_code}")
        print(f"Veryfi API response: {response.text[:500]}...")  # First 500 chars
        
        if response.status_code not in [200, 201]:
            print(f"Veryfi API error: {response.status_code} - {response.text}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Veryfi API error: {response.text}"
            )
        
        # Parse Veryfi response
        veryfi_data = response.json()
        print(f"Parsed Veryfi data, vendor: {veryfi_data.get('vendor', {}).get('name', 'N/A')}")
        
        # Extract receipt data
        receipt_data = ReceiptData(
            vendor=veryfi_data.get("vendor", {}).get("name", ""),
            date=veryfi_data.get("date", ""),
            total=abs(float(veryfi_data.get("total", 0))),  # Use abs() to handle negative zeros
            subtotal=abs(float(veryfi_data.get("subtotal", 0))),  # Use abs() to handle negative zeros
            tax=abs(float(veryfi_data.get("tax", 0))),  # Use abs() to handle negative zeros
            receipt_number=veryfi_data.get("receipt_number", ""),
            currency=veryfi_data.get("currency_code", "USD"),
            raw_veryfi_data=veryfi_data  # Store the full response
        )
        
        # Extract line items
        line_items = veryfi_data.get("line_items", [])
        print(f"Found {len(line_items)} line items")
        for item in line_items:
            # Handle null values from Veryfi
            price = item.get("price")
            quantity = item.get("quantity")
            total = item.get("total")
            
            # Convert to float, defaulting to 0 if None, and use abs() to handle negative zeros
            price_float = abs(float(price)) if price is not None else 0.0
            quantity_float = abs(float(quantity)) if quantity is not None else 1.0
            total_float = abs(float(total)) if total is not None else 0.0
            
            receipt_item = ReceiptItem(
                name=item.get("description", ""),
                price=price_float,
                quantity=quantity_float,
                total=total_float
            )
            receipt_data.items.append(receipt_item)
        
        print(f"Successfully processed receipt, total: ${receipt_data.total}")
        return receipt_data
        
    except Exception as e:
        print(f"Error processing receipt: {str(e)}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing receipt: {str(e)}"
        )

@app.post("/api/receipts/verify")
async def verify_receipt_data(request: ReceiptVerificationRequest):
    """
    Verify and correct receipt data after Veryfi processing
    """
    try:
        # Here you would typically save the verified data to your database
        # For now, we'll just return the verified data
        return {
            "status": "success",
            "message": "Receipt data verified successfully",
            "verified_data": {
                "receipt_id": request.receipt_id,
                "items": request.items,
                "total": request.total,
                "notes": request.notes
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error verifying receipt: {str(e)}"
        )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001) 
