# Crop Yield Prediction - Training & Setup Guide

## Overview
This guide will help you train the crop yield prediction model using Random Forest with Genetic Algorithm hyperparameter optimization.

## Prerequisites
Ensure you have the `crop_yield.csv` file in the `backend/` directory. If you have it in Downloads, copy it:

```bash
# On Windows (PowerShell):
Copy-Item "$env:USERPROFILE\Downloads\crop_yield.csv" -Destination ".\crop_yield.csv"

# On Mac/Linux:
cp ~/Downloads/crop_yield.csv ./crop_yield.csv
```

## Step 1: Data Preparation

This step loads the crop yield data and prepares it for training.

```bash
python prepare_yield_data.py
```

**What happens:**
- Loads `crop_yield.csv`
- Removes rows with missing values
- Removes invalid data (yield <= 0)
- Removes outliers using IQR method
- Encodes categorical features (Crop, Season, State)
- Normalizes numerical features
- Saves preprocessed data to `models/` folder

**Output Files:**
- `models/X_train_data.pkl` - Training features
- `models/y_train_data.pkl` - Training target (yield)
- `models/scaler.pkl` - Feature scaler
- `models/crop_encoder.pkl` - Crop name encoder
- `models/season_encoder.pkl` - Season encoder
- `models/state_encoder.pkl` - State encoder

## Step 2: Model Training with GA Optimization

This step trains a Random Forest model with Genetic Algorithm hyperparameter tuning.

```bash
python train_yield_ga.py
```

**What happens:**
- Loads preprocessed data
- Initializes Genetic Algorithm
- Optimizes hyperparameters for Random Forest:
  - `n_estimators`: 50-300
  - `max_depth`: 5-30
  - `min_samples_split`: 2-20
  - `min_samples_leaf`: 1-10
  - `max_features`: 'sqrt', 'log2', or None
- Runs for 10 generations with population size 20
- Trains final model with best hyperparameters
- Evaluates on test set

**Output Files:**
- `models/yield_model_ga.pkl` - Trained Random Forest model
- `models/hyperparameters.pkl` - Best hyperparameters found
- `models/feature_importance.csv` - Feature importance scores

**Expected Performance:**
- R² Score (Test): 0.85-0.95
- RMSE: Varies by crop
- MAE: Varies by crop

## Step 3: Verify Setup

Check that all model files are present:

```bash
ls models/
```

You should see:
- ✓ X_train_data.pkl
- ✓ y_train_data.pkl
- ✓ scaler.pkl
- ✓ crop_encoder.pkl
- ✓ season_encoder.pkl
- ✓ state_encoder.pkl
- ✓ yield_model_ga.pkl
- ✓ hyperparameters.pkl
- ✓ feature_importance.csv

## Step 4: Start Backend Server

```bash
python app.py
```

The backend will start on `http://localhost:5000`

## Step 5: Test the API

Test the yield prediction endpoint:

```bash
curl -X POST http://localhost:5000/predict-yield \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "crop": "Rice",
    "season": "Kharif",
    "state": "Assam",
    "rainfall": 200,
    "fertilizer": 50000,
    "pesticide": 500,
    "area": 1000,
    "year": 2024
  }'
```

## Supported Values

### Crops
Arecanut, Arhar/Tur, Banana, Castor seed, Coconut, Cotton(lint), Dry chillies, Garlic, Ginger, Gram, Groundnut, Jowar, Jute, Maize, Onion, Potato, Rapeseed &Mustard, Rice, Sugarcane, Turmeric, Wheat

### Seasons
Kharif, Rabi, Summer, Winter, Autumn, Whole Year

### States
Assam, Karnataka, Kerala, Meghalaya, West Bengal, Goa, Puducherry

## Troubleshooting

### Model Files Not Found
```
Error: Model files not found
```
- Run `python prepare_yield_data.py` first
- Then run `python train_yield_ga.py`

### CSV File Not Found
```
Error: No such file: crop_yield.csv
```
- Make sure `crop_yield.csv` is in the `backend/` directory
- Copy it from Downloads if needed

### GPU Out of Memory (optional)
If training fails with memory errors, reduce in `train_yield_ga.py`:
- Population size: 20 → 10
- Generations: 10 → 5
- CV folds: 5 → 3

## Model Architecture

**Random Forest Settings:**
- Algorithm: Random Forest Regressor
- Hyperparameter Tuning: Genetic Algorithm (DEAP library)
- Population Size: 20
- Generations: 10
- Features: Rainfall, Fertilizer, Pesticide, Area, Crop, Season, State, Year
- Target: Crop Yield

**Data Split:**
- Training: 80%
- Testing: 20%
- Cross-Validation: 5-fold

## Performance Metrics

The model evaluates using:
- **R² Score** - Coefficient of determination (closer to 1 is better)
- **RMSE** - Root Mean Squared Error
- **MAE** - Mean Absolute Error

## Feature Importance

The top features typically are:
1. Rainfall
2. Fertilizer
3. Area
4. Pesticide
5. Crop type

These can vary based on the specific training run and dataset.

## Next Steps

1. Frontend is already configured to call the `/predict-yield` endpoint
2. Once model training is complete, the web UI will automatically work
3. User can navigate to "Yield Prediction" tab in the web application
4. Enter crop parameters and get instant yield prediction with feature importance

## Advanced Options

### Improving Model Accuracy

1. **Increase GA generations** in `train_yield_ga.py`:
   ```python
   ngen=10  # Increase to 20-30
   ```

2. **Increase population size**:
   ```python
   pop = toolbox.population(n=20)  # Increase to 30-50
   ```

3. **Feature Engineering**:
   Edit `prepare_yield_data.py` to add derived features like:
   - Fertilizer per hectare
   - Rainfall efficiency ratio
   - Climate index

4. **Fine-tune hyperparameter ranges** in `train_yield_ga.py`:
   ```python
   toolbox.register("n_estimators", random.randint, 100, 500)  # Wider range
   ```

## Support

If you encounter issues:
1. Check logs in console output
2. Verify all CSV columns exist in your data
3. Ensure Python 3.8+ is installed
4. Check that all dependencies are installed: `pip install -r requirements.txt`
