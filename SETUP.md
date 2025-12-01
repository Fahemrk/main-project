# Smart Crop Guidance System - Complete Setup Guide

## Overview

This project is a full-stack AI application for smart crop recommendations. It consists of:
- **Frontend**: React + TypeScript (Vite)
- **Backend**: Flask API (Python) with trained RandomForest model
- **AI Integration**: Google Gemini API for cultivation guidance

## Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Crop_recommendation.csv dataset file
- GEMINI_API_KEY from https://ai.studio/apikey

## Project Structure

```
├── frontend files (components/, services/, App.tsx, etc.)
├── backend/
│   ├── app.py              # Flask API server
│   ├── export_model.py     # Script to export trained model
│   ├── requirements.txt    # Python dependencies
│   └── README.md           # Backend setup guide
├── .env.local              # Environment variables
├── package.json            # Frontend dependencies
└── SETUP.md               # This file
```

## Step 1: Set Up the Backend

### 1.1 Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 1.2 Place Dataset

Copy your `Crop_recommendation.csv` to the `backend/` directory.

### 1.3 Export the Model

```bash
python export_model.py
```

This creates:
- `crop_model.joblib` - Trained model (99.55% accuracy)
- `label_encoder.joblib` - Label encoder for crop names

### 1.4 Start the Backend Server

```bash
python app.py
```

The server will run on `http://localhost:5000`

## Step 2: Set Up the Frontend

### 2.1 Install Dependencies

From the project root:

```bash
npm install
```

### 2.2 Configure Environment Variables

Update `.env.local`:

```
GEMINI_API_KEY=your_actual_gemini_api_key_here
VITE_API_URL=http://localhost:5000
```

### 2.3 Start Development Server

```bash
npm run dev
```

The app will run on `http://localhost:3000`

## Step 3: Verify Integration

1. Open `http://localhost:3000` in your browser
2. Fill in soil parameters (N, P, K, temperature, humidity, pH, rainfall)
3. The frontend will call the backend API for predictions
4. Results will include:
   - Predicted crop
   - Confidence score
   - Top 5 crop probabilities
   - XAI explanations (SHAP values, LIME)
   - AI-generated cultivation guide (from Gemini)

## Running Both Services

### Option 1: Separate Terminals

**Terminal 1 - Backend:**
```bash
cd backend
python app.py
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Option 2: Production Build

```bash
npm run build
python backend/app.py
```

Then open your browser to `http://localhost:5000` (after configuring frontend build serving).

## Troubleshooting

### "Failed to get crop prediction from server"
- Ensure backend is running on `http://localhost:5000`
- Check `VITE_API_URL` in `.env.local`
- Verify model files (`crop_model.joblib`, `label_encoder.joblib`) exist in `backend/`

### "Error connecting to AI consultant"
- Verify `GEMINI_API_KEY` is set correctly in `.env.local`
- Check API key is valid at https://ai.studio/apikey
- Restart the frontend dev server after updating `.env.local`

### Python dependencies errors
- Ensure Python 3.8+ is installed
- Try: `pip install --upgrade -r backend/requirements.txt`

## API Documentation

### Prediction Endpoint

**URL:** `http://localhost:5000/predict`  
**Method:** POST  
**Content-Type:** application/json

**Request:**
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
    {"name": "maize", "value": 0.04},
    {"name": "wheat", "value": 0.01}
  ]
}
```

### Health Check

**URL:** `http://localhost:5000/health`  
**Method:** GET

**Response:**
```json
{
  "status": "ok",
  "model_loaded": true
}
```

## Model Details

- **Algorithm**: Random Forest Classifier
- **Optimization**: Genetic Algorithm (GA) hyperparameter tuning
- **Accuracy**: 99.55% on test set
- **Features**: N, P, K, temperature, humidity, pH, rainfall (7 features)
- **Output**: 22 crop types

## Next Steps

1. Deploy backend to cloud (Heroku, AWS, etc.)
2. Update `VITE_API_URL` to production backend URL
3. Build and deploy frontend
4. Monitor API performance and model predictions
