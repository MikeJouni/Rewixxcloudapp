<h1 align="center">
  <a href="RewixxCloudApp"><img src="https://github.com/MikeJouni/Rewixxcloudapp/blob/zain/assets/images/rewixx_logo.png" width="400" > </a>
</h1>
<h4 align="center">Web application for Imad's Electrical Services LLC with customer management, job handling, inventory tracking, and report generating.</h4>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#project-structure">Directory Structure</a> •
  <a href="#how-to-use">How To Use</a>
</p>

## Key Features

* **Customer Management**
  - Store customer contact details
  - Link customers to jobs and projects
  - Track customer history

* **Job Handling**
  - Create and manage jobs with given customer
  - Attach receipts to jobs (mobile)
  - Manage materials within jobs

* **Inventory Tracking** 
  - Track materials for a given job and total inventory
  - Auto-fill information about material with barcode scanning from Home Depot
  
* **Report Generating** 
  - Generate reports by customer or job
  - Export reports as pdfs

## Directory Structure

```
Rewixxcloudapp/
├── frontend/          # React frontend 
│   ├── src/
│   │   ├── components/
│   │   │   ├── Jobs.js                    # Job management with materials
│   │   │   ├── Customers.js               # Customer management
│   │   │   ├── Reports.js                 # Report generation
│   │   │   ├── JobDetailModal.js          # Job details and materials
│   │   │   ├── BarcodeScannerModal.js     # Barcode scanning
│   │   │   └── ReceiptVerificationModal.js # Receipt processing
│   │   ├── config.js                      # API configuration
│   │   ├── App.js                         # Main application
│   │   └── index.css                      # Tailwind CSS styling
│   └── package.json
├── backend/           # Java Spring Boot backend (not functional)
│   ├── src/main/java/com/rewixxcloudapp/
│   │   └── entity/                        # Database entities
│   └── pom.xml
├── scripts/           # Python FastAPI backend
│   ├── api.py                             # Main API (receipts + barcode)
│   ├── requirements.txt                   # Python dependencies
│   └── .env.example                       # Environment variables template
└── README.md          
```

## How To Use

### Developer

#### Getting Project into Environment
```bash
git clone https://github.com/MikeJouni/Rewixxcloudapp.git
cd Rewixxcloudapp
```

#### Frontend Development
```bash
cd frontend
npm install # Only first time
npm start
# View at http://localhost:3000
```

#### Backend Development
```bash
cd backend
# Whatever else goes here
```

### Barcode/Receipt Scanner Development

#### 1. Setup ngrok(needed for https to access camera on Safari/Chrome on mobile)

- Download ngrok and get auth token from website

- Update ngrok.yml with your auth token(https://dashboard.ngrok.com/get-started/your-authtoken):

#### 2. Environment Variables(API Keys)

```bash
cd scripts
cp .env.example .env
```

- Update VERYFI_CLIENT_ID, VERYFI_API_KEY, and SERPAPI_KEY with your respective IDs and keys


#### 3. Start the Frontend
```bash
cd frontend
npm install # Only first time
npm start
# Frontend runs on http://localhost:3000
```

#### 4. Start the API 
```bash
cd scripts
pip install -r requirements.txt # Only first time
python scanning_api.py
# Backend runs on http://localhost:8000
```

#### 5. Start ngrok Tunnels
```bash
# Start both frontend and backend
ngrok start --all
```
#### 6. Update Backend ngrok link

- Edit API_BASE_URL in `frontend/src/config.js`


#### 7. Access the Application

- Open your frontend(3000 port) ngrok URL in a browser:


### User

#### Main Navigation:
* **Customers**: Manage customer information
* **Jobs**: Create and track jobs with materials and receipt attachment
* **Reports**: Generate reports

#### Features:
* **Job Management**: Create jobs, add materials, track progress
* **Barcode Scanning**: Scan product barcodes to auto-fill material information
* **Receipt Processing**: Upload receipt photos to extract items and add to jobs
* **Material Tracking**: View and manage materials within each job

## License

MIT 
