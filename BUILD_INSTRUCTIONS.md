# Build Instructions

Before building, update `frontend/src/config.js` to point to your backend URLs:
- For local development: Set `SPRING_API_BASE` to `http://localhost:8080`

## Backend

```bash
cd backend
mvn spring-boot:run
```

The backend will run on `http://localhost:8080` by default.

## Frontend

```bash
cd frontend
npm install
npm start
```

The frontend will run on `http://localhost:3000` by default.

## Python Scanning API

```bash
cd scripts
pip install -r requirements.txt
python scanning_api.py
```
