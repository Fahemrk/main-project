---
description: Repository Information Overview
alwaysApply: true
---

# Smart Crop Guidance System Information

## Summary
This is an AI-powered web application that provides intelligent crop guidance based on soil and environmental data. Built with React and TypeScript, it leverages Google's Gemini API for AI-driven recommendations and explainable AI (XAI) features like SHAP values and LIME explanations for crop predictions.

## Structure
```
├── components/           # React UI components
│   ├── CultivationGuide.tsx    # Displays crop cultivation guidance
│   ├── InputForm.tsx           # Soil data input form
│   ├── LandingPage.tsx         # Landing/home page
│   ├── LoginPage.tsx           # User authentication
│   ├── RegisterPage.tsx        # User registration
│   └── XAICharts.tsx           # Explainable AI visualization
├── services/            # Business logic services
│   ├── geminiService.ts        # Google Gemini API integration
│   └── predictionService.ts    # Crop prediction engine
├── App.tsx              # Main application component
├── index.tsx            # React entry point
├── types.ts             # TypeScript type definitions
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Dependencies and scripts
└── .env.local           # Environment variables (API keys)
```

## Language & Runtime
**Language**: TypeScript  
**Target**: ES2022  
**Runtime**: Node.js (via npm)  
**Package Manager**: npm  
**Build System**: Vite 6.2.0

## Dependencies

**Main Dependencies**:
- **react**: ^19.2.0 — UI framework
- **react-dom**: ^19.2.0 — React DOM rendering
- **@google/genai**: ^1.30.0 — Google Gemini API client
- **lucide-react**: ^0.555.0 — Icon library
- **recharts**: ^3.5.1 — Charting library for XAI visualizations
- **react-markdown**: ^10.1.0 — Markdown rendering

**Development Dependencies**:
- **typescript**: ~5.8.2 — TypeScript compiler
- **vite**: ^6.2.0 — Build tool and dev server
- **@vitejs/plugin-react**: ^5.0.0 — React plugin for Vite
- **@types/node**: ^22.14.0 — Node.js type definitions

## Build & Installation

**Install dependencies**:
```bash
npm install
```

**Development server** (runs on port 3000):
```bash
npm run dev
```

**Production build**:
```bash
npm run build
```

**Preview production build**:
```bash
npm run preview
```

## Configuration

**Environment Variables** (.env.local):
- `GEMINI_API_KEY` — API key for Google Gemini (required for AI features)

**Vite Configuration** (vite.config.ts):
- Dev server: `http://0.0.0.0:3000`
- Aliases: `@` resolves to project root
- Loads and exposes `GEMINI_API_KEY` from .env files

**TypeScript Configuration** (tsconfig.json):
- Module system: ESNext
- Module resolution: bundler
- JSX: react-jsx

## Main Entry Points
- **index.tsx**: React application bootstrap
- **App.tsx**: Main application component managing navigation and state
- **components/**: UI components for different application screens
- **services/**: Core business logic (crop prediction, Gemini API integration)

## Application State
The app manages multiple views via `AppState` enum:
- Landing page for onboarding
- Login/Registration for authentication
- InputForm for soil data entry
- Prediction results with XAI visualizations
- CultivationGuide with AI-generated recommendations

## Data Models

**SoilData Interface** (types.ts):
- Location coordinates (latitude, longitude)
- Soil nutrients: N, P, K values
- Environmental data: temperature, humidity, pH, rainfall

**CropPrediction Interface**:
- Predicted crop and confidence score
- Probability distribution across crop varieties
- SHAP values for feature importance
- LIME explanations for model interpretability
