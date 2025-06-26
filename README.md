<h1 align="center">
  <a href="RewixxCloudApp"><img src="https://github.com/MikeJouni/Rewixxcloudapp/blob/zain/assets/images/rewixx.png" width="400" style="margin-bottom: 0.01em;> </a>
</h1>

<h4 align="center">Business management application with inventory tracking, job management, and barcode scanning capabilities.</h4>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#how-to-use">How To Use</a> •
  <a href="#download">Download</a> •
  <a href="#credits">Credits</a> 
</p>

## Key Features

* **Materials & Inventory Management** - Complete inventory tracking system
  - Track materials with barcode scanning for quick product lookup
  - Auto-fill product information from Home Depot using UPC codes
  - Monitor stock levels with visual status indicators
  - Set minimum and maximum stock thresholds
* **Job Management** - Comprehensive job tracking and management
  - Create and manage jobs with customer information
  - Attach receipt images to jobs (mobile only)
  - Track job status, priority, and time estimates
  - View job history and progress
* **Customer Management** - Centralized customer information
  - Store customer contact details and preferences
  - Link customers to jobs and projects
  - Track customer history and interactions
* **Reports Generation** - Business intelligence and analytics
  - Generate reports by customer or job
  - Export reports as text files
  - View summary statistics and metrics
* **Mobile-First Design** - Optimized for mobile devices
  - Responsive interface that works on all devices
  - Mobile-specific features like receipt attachment
  - Touch-friendly controls and navigation

## Project Structure

```
Rewixxcloudapp/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Materials.js    # Inventory management
│   │   │   ├── Jobs.js         # Job management
│   │   │   ├── Customers.js    # Customer management
│   │   │   ├── Reports.js      # Report generation
│   │   │   └── BarcodeScannerModal.js  # Barcode scanning
│   │   ├── App.js              # Main application
│   │   └── App.css             # Styling
│   └── package.json
├── backend/           # Java Spring Boot backend
│   ├── src/main/java/com/rewixxcloudapp/
│   │   └── entity/             # Database entities
│   └── pom.xml
├── scripts/           # Python scripts
│   └── barcode_lookup.py       # Barcode scanning and product lookup (not functional)
└── README.md          # Project documentation
```

## How To Use

### Frontend Application
The React frontend provides a modern, mobile-friendly interface for managing your business operations.

#### Main Navigation:
* **Materials**: Manage inventory with barcode scanning
* **Jobs**: Create and track jobs with receipt attachment
* **Customers**: Manage customer information
* **Reports**: Generate business reports

#### Mobile Features:
* **Receipt Attachment**: On mobile devices, attach receipt photos to jobs
* **Barcode Scanning**: Scan product barcodes to auto-fill information
* **Touch-Optimized**: All controls designed for touch interaction

### Backend API
The Java Spring Boot backend provides RESTful APIs for data management.

### Barcode Scanner
The Python script provides barcode scanning functionality for product lookup.

## Download

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Backend Setup
```bash
cd backend
# Use your preferred Java build tool (Maven/Gradle)
```

### Barcode Scanner Setup
```bash
cd scripts
python barcode_lookup.py
```

## License

MIT 
