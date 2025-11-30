FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "scanning_api:app", "--host", "0.0.0.0", "--port", "8000"]


