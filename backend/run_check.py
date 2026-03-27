#!/usr/bin/env python
import os
import subprocess
import sys

os.chdir('backend')

print("=" * 70)
print("Checking setup...")
print("=" * 70)

# Check files
files_to_check = [
    ('CSV Data', 'crop_yield.csv'),
    ('Training Data X', 'models/X_train_data.pkl'),
    ('Training Data y', 'models/y_train_data.pkl'),
    ('Trained Model', 'models/yield_model_ga.pkl'),
]

for name, path in files_to_check:
    exists = os.path.exists(path)
    print(f"\n{name}:")
    print(f"  Path: {os.path.abspath(path)}")
    print(f"  Exists: {'YES' if exists else 'NO'}")
    if exists:
        size = os.path.getsize(path) / (1024*1024)
        print(f"  Size: {size:.2f} MB")

print("\n" + "=" * 70)

# If CSV exists, run preparation
csv_exists = os.path.exists('crop_yield.csv')
if csv_exists:
    print("\n✅ CSV found. Running data preparation...")
    result = subprocess.run([sys.executable, 'prepare_yield_final.py'], 
                          capture_output=True, text=True)
    if "✅ All preprocessed" in result.stdout or result.returncode == 0:
        print("✅ Data preparation succeeded")
    else:
        print("❌ Data preparation may have failed")
        if result.stdout:
            print("\nOutput:\n" + result.stdout[:500])
        if result.stderr:
            print("\nError:\n" + result.stderr[:500])
            
    # Now run training
    if os.path.exists('models/X_train_data.pkl'):
        print("\n📚 Training data found. Running GA training...")
        result = subprocess.run([sys.executable, 'train_yield_xgboost_ga.py'],
                              capture_output=True, text=True, timeout=1200)
        if result.returncode == 0:
            print("✅ Training succeeded")
        else:
            print("❌ Training failed")
            if result.stderr:
                print("\nError:\n" + result.stderr[:500])
else:
    print("\n❌ CSV not found in backend directory")
    print("   Please ensure crop_yield.csv is in the backend folder")

print("\n" + "=" * 70)
