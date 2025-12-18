import numpy as np
import pandas as pd
import pickle
import xgboost as xgb
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import os

from deap import base, creator, tools
import random

print("=" * 70)
print("GENETIC ALGORITHM: XGBoost HYPERPARAMETER TUNING")
print("=" * 70)

# Load preprocessed data
with open('models/X_train_data.pkl', 'rb') as f:
    X = pickle.load(f)

with open('models/y_train_data.pkl', 'rb') as f:
    y = pickle.load(f)

print(f"\nData loaded:")
print(f"  X shape: {X.shape}")
print(f"  y shape: {y.shape}")

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print(f"Train size: {len(X_train)}, Test size: {len(X_test)}")

# ============= DEFINE GA PROBLEM =============

# Hyperparameters to optimize:
# 1. learning_rate (0.01-0.3)
# 2. max_depth (3-15)
# 3. subsample (0.5-1.0)
# 4. colsample_bytree (0.5-1.0)
# 5. n_estimators (50-500)

try:
    creator.create("FitnessMax", base.Fitness, weights=(1.0,))
    creator.create("Individual", list, fitness=creator.FitnessMax)
except:
    del creator.FitnessMax
    del creator.Individual
    creator.create("FitnessMax", base.Fitness, weights=(1.0,))
    creator.create("Individual", list, fitness=creator.FitnessMax)

toolbox = base.Toolbox()

# Attribute generators
toolbox.register("learning_rate", random.uniform, 0.01, 0.3)
toolbox.register("max_depth", random.randint, 3, 15)
toolbox.register("subsample", random.uniform, 0.5, 1.0)
toolbox.register("colsample_bytree", random.uniform, 0.5, 1.0)
toolbox.register("n_estimators", random.randint, 50, 500)

# Individual and population
toolbox.register("individual", tools.initCycle, creator.Individual,
                 (toolbox.learning_rate, toolbox.max_depth, toolbox.subsample,
                  toolbox.colsample_bytree, toolbox.n_estimators), n=1)
toolbox.register("population", tools.initRepeat, list, toolbox.individual)

# Genetic operators
toolbox.register("mate", tools.cxBlend, alpha=0.5)
toolbox.register("mutate", tools.mutGaussian, mu=0, sigma=0.2, indpb=0.3)
toolbox.register("select", tools.selTournament, tournsize=3)

# Bounds for hyperparameters
def check_bounds(min_vals, max_vals):
    def decorator(func):
        def wrapper(*args, **kwargs):
            offspring = func(*args, **kwargs)
            for child in offspring:
                child[0] = max(min(child[0], max_vals[0]), min_vals[0])  # learning_rate
                child[1] = max(min(int(child[1]), max_vals[1]), min_vals[1])  # max_depth
                child[2] = max(min(child[2], max_vals[2]), min_vals[2])  # subsample
                child[3] = max(min(child[3], max_vals[3]), min_vals[3])  # colsample_bytree
                child[4] = max(min(int(child[4]), max_vals[4]), min_vals[4])  # n_estimators
            return offspring
        return wrapper
    return decorator

min_bounds = [0.01, 3, 0.5, 0.5, 50]
max_bounds = [0.3, 15, 1.0, 1.0, 500]

toolbox.decorate("mate", check_bounds(min_bounds, max_bounds))
toolbox.decorate("mutate", check_bounds(min_bounds, max_bounds))

# Evaluation function
def evaluate_hyperparameters(individual):
    """Evaluate hyperparameter combination using cross-validation"""
    try:
        lr = float(individual[0])
        max_d = int(individual[1])
        subsample = float(individual[2])
        colsample = float(individual[3])
        n_est = int(individual[4])
        
        # Create model with these hyperparameters
        xgb_model = xgb.XGBRegressor(
            learning_rate=lr,
            max_depth=max_d,
            subsample=subsample,
            colsample_bytree=colsample,
            n_estimators=n_est,
            random_state=42,
            n_jobs=-1,
            verbosity=0
        )
        
        # 5-fold cross-validation
        cv_scores = cross_val_score(xgb_model, X_train, y_train, cv=5, scoring='r2', n_jobs=-1)
        mean_r2 = cv_scores.mean()
        
        print(f"  R²={mean_r2:.4f} | lr={lr:.3f}, depth={max_d}, subsample={subsample:.2f}, colsample={colsample:.2f}, n_est={n_est}")
        
        return (mean_r2,)
    except Exception as e:
        print(f"  Error: {e}")
        return (-1,)

toolbox.register("evaluate", evaluate_hyperparameters)

# ============= RUN GENETIC ALGORITHM =============

print("\n" + "=" * 70)
print("STARTING GENETIC ALGORITHM OPTIMIZATION")
print("=" * 70)

# Create initial population
pop = toolbox.population(n=20)

# Evaluate initial population
fitnesses = list(map(toolbox.evaluate, pop))
for ind, fit in zip(pop, fitnesses):
    ind.fitness.values = fit

# Run GA
print("\nGenerations:")
for gen in range(10):  # 10 generations
    print(f"\nGeneration {gen + 1}/10:")
    
    # Select best
    pop = toolbox.select(pop, len(pop))
    
    # Create offspring
    offspring = [toolbox.clone(ind) for ind in pop]
    
    # Crossover
    for child1, child2 in zip(offspring[::2], offspring[1::2]):
        if random.random() < 0.7:
            toolbox.mate(child1, child2)
            del child1.fitness.values
            del child2.fitness.values
    
    # Mutation
    for mutant in offspring:
        if random.random() < 0.3:
            toolbox.mutate(mutant)
            del mutant.fitness.values
    
    # Evaluate individuals with invalid fitness
    for ind in offspring:
        if not ind.fitness.valid:
            fit = toolbox.evaluate(ind)
            ind.fitness.values = fit
    
    # Replace population
    pop[:] = offspring

# Get best individual
best_ind = max(pop, key=lambda x: x.fitness.values[0])
best_r2 = best_ind.fitness.values[0]

print("\n" + "=" * 70)
print("OPTIMAL HYPERPARAMETERS FOUND")
print("=" * 70)

best_params = {
    'learning_rate': float(best_ind[0]),
    'max_depth': int(best_ind[1]),
    'subsample': float(best_ind[2]),
    'colsample_bytree': float(best_ind[3]),
    'n_estimators': int(best_ind[4])
}

print(f"\nOptimal Hyperparameters:")
for key, val in best_params.items():
    print(f"  {key}: {val}")
print(f"\nCross-validation R² Score: {best_r2:.4f}")

# ============= TRAIN FINAL MODEL =============

print("\n" + "=" * 70)
print("TRAINING FINAL XGBOOST MODEL WITH OPTIMAL HYPERPARAMETERS")
print("=" * 70)

final_model = xgb.XGBRegressor(
    learning_rate=best_params['learning_rate'],
    max_depth=best_params['max_depth'],
    subsample=best_params['subsample'],
    colsample_bytree=best_params['colsample_bytree'],
    n_estimators=best_params['n_estimators'],
    random_state=42,
    n_jobs=-1,
    verbosity=0
)

print("\nTraining on full training set...")
final_model.fit(X_train, y_train)

# Evaluate on test set
y_pred = final_model.predict(X_test)
test_r2 = r2_score(y_test, y_pred)
test_rmse = np.sqrt(mean_squared_error(y_test, y_pred))
test_mae = mean_absolute_error(y_test, y_pred)

print(f"\nTest Set Performance:")
print(f"  R² Score: {test_r2:.4f}")
print(f"  RMSE: {test_rmse:.2f}")
print(f"  MAE: {test_mae:.2f}")

# ============= SAVE MODEL =============

print("\n" + "=" * 70)
print("SAVING XGBOOST MODEL")
print("=" * 70)

# Save with joblib for consistency with Flask app
import joblib
joblib.dump(final_model, 'models/yield_model_xgboost.pkl')

# Save best hyperparameters
with open('models/best_hyperparameters_xgboost.json', 'w') as f:
    import json
    json.dump(best_params, f, indent=2)

# Save metrics
metrics = {
    'algorithm': 'XGBoost',
    'cv_r2_score': float(best_r2),
    'test_r2_score': float(test_r2),
    'test_rmse': float(test_rmse),
    'test_mae': float(test_mae)
}

with open('models/training_metrics_xgboost.json', 'w') as f:
    import json
    json.dump(metrics, f, indent=2)

print(f"\nXGBoost Model saved: models/yield_model_xgboost.pkl")
print(f"Hyperparameters saved: models/best_hyperparameters_xgboost.json")
print(f"Metrics saved: models/training_metrics_xgboost.json")

# Compare with Random Forest
print("\n" + "=" * 70)
print("COMPARISON: XGBOOST vs RANDOM FOREST")
print("=" * 70)

try:
    with open('models/training_metrics.json', 'r') as f:
        import json
        rf_metrics = json.load(f)
    
    rf_r2 = rf_metrics['test_r2_score']
    improvement = (test_r2 - rf_r2) / rf_r2 * 100
    
    print(f"\nRandom Forest Test R²:  {rf_r2:.4f} (85.54%)")
    print(f"XGBoost Test R²:        {test_r2:.4f} ({test_r2*100:.2f}%)")
    print(f"Improvement:            {improvement:+.2f}%")
    
    if test_r2 > rf_r2:
        print(f"\nXGBoost is better! Improvement: {improvement:.2f}%")
    else:
        print(f"\nRandom Forest is still better by {abs(improvement):.2f}%")
except Exception as e:
    print(f"Could not compare: {e}")

print("\n" + "=" * 70)
print("XGBOOST TRAINING COMPLETE!")
print("=" * 70)
