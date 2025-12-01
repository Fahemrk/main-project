# Smart Crop Guidance System - Backend API

This is the Flask-based backend server that runs the trained RandomForest model for crop predictions.

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Export the Model

First, place your `Crop_recommendation.csv` file in the `backend/` directory, then run:

```bash
python export_model.py
```

This will create:
- `crop_model.joblib` - The trained RandomForest model
- `label_encoder.joblib` - The label encoder for crop names

### 3. Run the Server

```bash
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### POST `/predict`

**Request Body:**
```json
{
  "N": 80,
  "P": 40,
  "K": 40,
  "temperature": 22,
  "humidity": 80,
  "ph": 6,
  "rainfall": 200
}
```

**Response:**
```json
{
  "crop": "rice",
  "confidence": 0.95,
  "probabilities": [
    {"name": "rice", "value": 0.95},
    {"name": "wheat", "value": 0.04},
    {"name": "maize", "value": 0.01}
  ]
}
```

### GET `/health`

**Response:**
```json
{
  "status": "ok",
  "model_loaded": true
}
```

## Integration with Frontend

The frontend expects the API to be available at `http://localhost:5000`. You can override this by setting the `VITE_API_URL` environment variable.

## Dataset

Place the `Crop_recommendation.csv` file with the following columns:
- N, P, K (soil nutrients)
- temperature
- humidity
- ph
- rainfall
- label (crop name)
