FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Railway assigns PORT dynamically
ENV PORT=8000
EXPOSE ${PORT}

CMD uvicorn scanning_api:app --host 0.0.0.0 --port ${PORT}


