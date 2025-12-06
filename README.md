# Rewixx Cloud App

Web application for Imad's Electrical Services LLC with customer management, job handling, inventory tracking, and report generating.

## Key Features

* **Customer Management** - Store customer contact details and track history
* **Job Handling** - Create and manage jobs with materials and receipt attachments
* **Inventory Tracking** - Track materials for jobs with barcode scanning support
* **Report Generating** - Generate and export reports by customer or job

## Getting Started

### Prerequisites
- Node.js and npm
- Java 11+ and Maven
- PostgreSQL database

### Frontend Development
```bash
cd frontend
npm install
npm start
```

### Backend Development
```bash
cd backend
mvn spring-boot:run
```

### Barcode/Receipt Scanner API
```bash
cd scripts
pip install -r requirements.txt
python scanning_api.py
```

## Project Structure

```
Rewixxcloudapp/
├── frontend/          # React frontend
├── backend/           # Java Spring Boot backend
└── scripts/           # Python FastAPI backend (barcode/receipt scanning)
```

## License

MIT
