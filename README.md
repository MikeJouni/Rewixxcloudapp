<h1 align="center">
  <a href="RewixxCloudApp"><img src="https://github.com/MikeJouni/Rewixxcloudapp/blob/zain/assets/images/rewixx_logo.png" width="400" > </a>
</h1>
<h4 align="center">Web application for Imad's Electrical Services LLC with customer management, job handling, inventory tracking, and report generating.</h4>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#project-structure">Directory Structure</a> •
  <a href="#how-to-use">How To Use</a> •
  <a href="#download">Download</a>
</p>

## Key Features

* **Customer Management**
  - Store customer contact details
  - Link customers to jobs and projects
  - Track customer history

* **Job Handling**
  - Create and manage jobs with given customer
  - Attach receipts to jobs (mobile)

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
│   │   │   ├── Materials.js    # Inventory management
│   │   │   ├── Jobs.js         # Job management
│   │   │   ├── Customers.js    # Customer management
│   │   │   ├── Reports.js      # Report generation
│   │   │   └── BarcodeScannerModal.js  # Barcode scanning(not functional)
│   │   ├── App.js              # Main application
│   │   └── App.css             # Styling
│   └── package.json
├── backend/           # Java Spring Boot backend(not functional)
│   ├── src/main/java/com/rewixxcloudapp/
│   │   └── entity/             # Database entities
│   └── pom.xml
├── scripts/           # Python scripts
│   └── barcode_lookup.py       # Barcode scanning and product lookup (not functional)
└── README.md          
```

## How To Use


#### Main Navigation:
* **Customers**: Manage customer information
* * **Jobs**: Create and track jobs with receipt attachment
* **Materials**: Manage inventory with barcode scanning
* **Reports**: Generate reports

#### Mobile Features:
* **Receipt Attachment**: On mobile devices, attach receipt photos to jobs
* **Barcode Scanning**: Scan product barcodes to auto-fill information

## Download

### Entire Web Application
```bash
git clone https://github.com/MikeJouni/Rewixxcloudapp.git
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Backend Setup
```bash
cd backend
# Whatever else goes here
```

### Barcode Scanner Setup
```bash
cd scripts
python barcode_lookup.py
```

## License

MIT 
