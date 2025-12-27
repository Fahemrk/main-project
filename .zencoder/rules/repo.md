---
description: Repository Information Overview
alwaysApply: true
---

# Smart Crop Guidance System Information

## Repository Summary
The Smart Crop Guidance System is a full-stack AI application designed to provide smart crop recommendations based on soil and environmental parameters. It utilizes a trained RandomForest model for predictions and integrates Google Gemini API for personalized cultivation guidance. The system also includes XAI (Explainable AI) features using SHAP and LIME to explain model predictions.

## Repository Structure
- **Root**: Contains the React + TypeScript frontend application and project configuration files.
- **backend/**: Contains the Flask API server, machine learning models, and data processing scripts.
- **components/**: React components for the frontend (Input forms, charts, pages).
- **services/**: Frontend service layers for API communication (Auth, Gemini, Predictions).
- **scripts/**: Utility scripts for data generation and analysis.
- **utils/**: Shared utility functions for the frontend (caching, retries, sanitization).

### Main Repository Components
- **Frontend**: A Vite-powered React application with TypeScript, focusing on data visualization and user interaction.
- **Backend**: A Flask-based API serving machine learning predictions and managing user authentication.
- **ML Engine**: A suite of Python scripts for training, optimizing (using Genetic Algorithms), and exporting the RandomForest model.

## Projects

### Frontend (React Application)
**Configuration File**: `package.json`, `vite.config.ts`, `tsconfig.json`

#### Language & Runtime
**Language**: TypeScript  
**Version**: TypeScript ~5.8.2  
**Build System**: Vite ^6.2.0  
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- `@google/genai`: For Gemini API integration.
- `react`, `react-dom`: UI framework (v19).
- `lucide-react`: Icon library.
- `recharts`: For data visualization and XAI charts.
- `react-markdown`: For rendering AI-generated guides.

**Development Dependencies**:
- `@vitejs/plugin-react`: Vite plugin for React.
- `typescript`: For static typing.

#### Build & Installation
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Backend (Flask API)
**Configuration File**: `backend/requirements.txt`, `backend/app.py`

#### Language & Runtime
**Language**: Python  
**Version**: Python 3.8+  
**Build System**: Python Scripts  
**Package Manager**: pip

#### Dependencies
**Main Dependencies**:
- `flask`: Web framework.
- `flask-cors`, `flask-sqlalchemy`, `flask-jwt-extended`: Flask extensions for CORS, DB, and Auth.
- `scikit-learn`: For machine learning model serving.
- `shap`, `lime`: For Explainable AI (XAI).
- `numpy`, `pandas`: Data manipulation.
- `joblib`: For model serialization.

#### Build & Installation
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Export the trained model (requires Crop_recommendation.csv)
python export_model.py

# Run the Flask server
python app.py
```

#### Main Files & Resources
- `backend/app.py`: Main entry point for the Flask API.
- `backend/auth.py`: Authentication logic and routes.
- `backend/models.py`: Database models for SQLAlchemy.
- `backend/crop_model.joblib`: Trained RandomForest model.
- `backend/label_encoder.joblib`: Encoder for crop labels.
- `backend/ga_feature_selection.py`: Genetic Algorithm for feature selection.
- `backend/train_yield_xgboost_ga.py`: XGBoost training script with GA optimization.
