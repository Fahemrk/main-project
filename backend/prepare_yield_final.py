import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
import os
import pickle

print("=" * 60)
print("STEP 1: DATA PREPARATION & EXPLORATION")
print("=" * 60)

# Try loading from nested location
nested_csv = os.path.join('crop_yield.csv', 'crop_yield.csv')
flat_csv = 'crop_yield.csv'

csv_path = None
if os.path.exists(nested_csv):
    print(f"Loading from nested: {nested_csv}")
    csv_path = nested_csv
elif os.path.exists(flat_csv) and os.path.isfile(flat_csv):
    print(f"Loading from flat: {flat_csv}")
    csv_path = flat_csv
else:
    raise FileNotFoundError("crop_yield.csv not found")

df = pd.read_csv(csv_path)

print(f"\n1. Dataset Shape: {df.shape}")
print(f"\n2. Columns: {df.columns.tolist()}")
print(f"\n3. Data Types:\n{df.dtypes}")
print(f"\n4. Missing Values:\n{df.isnull().sum()}")

# Check for outliers and extreme values
print(f"\n5. Yield Statistics:")
print(df['Yield'].describe())

print(f"\n6. Crops in dataset: {df['Crop'].nunique()}")
print(f"   Crops: {sorted(df['Crop'].unique())[:10]}... (showing first 10)")

print(f"\n7. Seasons: {df['Season'].unique()}")
print(f"\n8. States: {df['State'].unique()}")
print(f"\n9. Years range: {df['Crop_Year'].min()} - {df['Crop_Year'].max()}")

# Data Cleaning
print("\n" + "=" * 60)
print("STEP 2: DATA CLEANING")
print("=" * 60)

# Remove rows with missing values in critical columns
df_clean = df.dropna(subset=['Yield', 'Annual_Rainfall', 'Fertilizer', 'Pesticide', 'Area'])

print(f"Rows after removing NaN: {df_clean.shape[0]} (removed {df.shape[0] - df_clean.shape[0]})")

# Remove zero or negative yields (data errors)
initial_rows = df_clean.shape[0]
df_clean = df_clean[df_clean['Yield'] > 0]
print(f"Rows after removing Yield <= 0: {df_clean.shape[0]} (removed {initial_rows - df_clean.shape[0]})")

# Remove outliers using IQR method for Yield
Q1 = df_clean['Yield'].quantile(0.25)
Q3 = df_clean['Yield'].quantile(0.75)
IQR = Q3 - Q1
lower_bound = Q1 - 3 * IQR
upper_bound = Q3 + 3 * IQR

initial_rows = df_clean.shape[0]
df_clean = df_clean[(df_clean['Yield'] >= lower_bound) & (df_clean['Yield'] <= upper_bound)]
print(f"Rows after removing outliers (3*IQR): {df_clean.shape[0]} (removed {initial_rows - df_clean.shape[0]})")

print(f"\nCleaned Yield Statistics:")
print(df_clean['Yield'].describe())

# Feature Engineering
print("\n" + "=" * 60)
print("STEP 3: FEATURE ENGINEERING")
print("=" * 60)

X = pd.DataFrame()

# Numerical features (normalize later)
X['rainfall'] = df_clean['Annual_Rainfall']
X['fertilizer'] = df_clean['Fertilizer']
X['pesticide'] = df_clean['Pesticide']
X['area'] = df_clean['Area']

# Categorical features - Encode
crop_encoder = LabelEncoder()
season_encoder = LabelEncoder()
state_encoder = LabelEncoder()

X['crop'] = crop_encoder.fit_transform(df_clean['Crop'].str.strip())
X['season'] = season_encoder.fit_transform(df_clean['Season'].str.strip())
X['state'] = state_encoder.fit_transform(df_clean['State'].str.strip())

# Add temporal feature
X['year'] = df_clean['Crop_Year']

# Target variable
y = df_clean['Yield'].values

print(f"Features shape: {X.shape}")
print(f"Target shape: {y.shape}")
print(f"\nFeatures:\n{X.head()}")
print(f"\nFeature statistics:\n{X.describe()}")

# Standardize numerical features
scaler = StandardScaler()
numerical_features = ['rainfall', 'fertilizer', 'pesticide', 'area']
X_scaled = X.copy()
X_scaled[numerical_features] = scaler.fit_transform(X[numerical_features])

print(f"\nScaled features:\n{X_scaled.head()}")

# Save preprocessed data and encoders
os.makedirs('models', exist_ok=True)

with open('models/X_train_data.pkl', 'wb') as f:
    pickle.dump(X_scaled.values, f)

with open('models/y_train_data.pkl', 'wb') as f:
    pickle.dump(y, f)

with open('models/scaler.pkl', 'wb') as f:
    pickle.dump(scaler, f)

with open('models/crop_encoder.pkl', 'wb') as f:
    pickle.dump(crop_encoder, f)

with open('models/season_encoder.pkl', 'wb') as f:
    pickle.dump(season_encoder, f)

with open('models/state_encoder.pkl', 'wb') as f:
    pickle.dump(state_encoder, f)

print("\n✅ All preprocessed data and encoders saved to models/")
print(f"\n📊 Summary:")
print(f"   Total samples: {X.shape[0]}")
print(f"   Features: {X.shape[1]}")
print(f"   Crops: {len(crop_encoder.classes_)}")
print(f"   Seasons: {len(season_encoder.classes_)}")
print(f"   States: {len(state_encoder.classes_)}")
