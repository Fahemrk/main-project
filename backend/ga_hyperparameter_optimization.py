import numpy as np
import pandas as pd
import joblib
import json
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from deap import base, creator, tools, algorithms
import random
import warnings

warnings.filterwarnings('ignore')

np.random.seed(42)
random.seed(42)

FEATURE_NAMES = ['N', 'P', 'K', 'Temperature', 'Humidity', 'pH', 'Rainfall']

def load_crop_data(csv_path="Crop_recommendation.csv"):
    df = pd.read_csv(csv_path)
    X = df.drop("label", axis=1).values
    y = df["label"].values
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    return X, y_encoded, le

def evaluate_hyperparameters(individual, X_train, y_train):
    """
    Evaluate RandomForest model with given hyperparameters using cross-validation.
    individual: [n_estimators, max_depth, min_samples_split, min_samples_leaf, max_features]
    Returns fitness (accuracy score)
    """
    n_estimators = max(10, int(individual[0]))
    max_depth = max(5, int(individual[1]))
    min_samples_split = max(2, int(individual[2]))
    min_samples_leaf = max(1, int(individual[3]))
    max_features = max(1, min(7, int(individual[4])))
    
    try:
        model = RandomForestClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            min_samples_split=min_samples_split,
            min_samples_leaf=min_samples_leaf,
            max_features=max_features,
            random_state=42,
            n_jobs=-1
        )
        
        scores = cross_val_score(model, X_train, y_train, cv=3, scoring='accuracy')
        mean_accuracy = scores.mean()
        
        return mean_accuracy,
    except Exception as e:
        return 0.5,

def run_ga_hyperparameter_optimization(X_train, y_train, generations=15, pop_size=15):
    """
    Run genetic algorithm to find optimal RandomForest hyperparameters.
    """
    if "FitnessMax" in dir(creator):
        del creator.FitnessMax
    if "Individual" in dir(creator):
        del creator.Individual
    
    creator.create("FitnessMax", base.Fitness, weights=(1.0,))
    creator.create("Individual", list, fitness=creator.FitnessMax)
    
    toolbox = base.Toolbox()
    
    def create_individual():
        return creator.Individual([
            random.randint(10, 500),
            random.randint(5, 50),
            random.randint(2, 20),
            random.randint(1, 10),
            random.randint(1, 7)
        ])
    
    def mutate_individual(individual, indpb=0.4):
        ranges = [(10, 500), (5, 50), (2, 20), (1, 10), (1, 7)]
        for i in range(len(individual)):
            if random.random() < indpb:
                individual[i] = random.randint(ranges[i][0], ranges[i][1])
        return individual,
    
    toolbox.register("individual", create_individual)
    toolbox.register("population", tools.initRepeat, list, toolbox.individual)
    toolbox.register("evaluate", evaluate_hyperparameters, X_train=X_train, y_train=y_train)
    toolbox.register("mate", tools.cxUniform, indpb=0.3)
    toolbox.register("mutate", mutate_individual, indpb=0.4)
    toolbox.register("select", tools.selTournament, tournsize=2)
    
    pop = toolbox.population(n=pop_size)
    hof = tools.HallOfFame(1)
    
    pop, logbook = algorithms.eaSimple(pop, toolbox, cxpb=0.5, mutpb=0.3,
                                       ngen=generations, halloffame=hof, verbose=False)
    
    best_individual = hof[0]
    
    return {
        'n_estimators': max(10, int(best_individual[0])),
        'max_depth': max(5, int(best_individual[1])),
        'min_samples_split': max(2, int(best_individual[2])),
        'min_samples_leaf': max(1, int(best_individual[3])),
        'max_features': max(1, min(7, int(best_individual[4]))),
        'best_cv_accuracy': float(hof.items[0].fitness.values[0])
    }

if __name__ == "__main__":
    print("Loading data...")
    X, y, le = load_crop_data("Crop_recommendation.csv")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print("=" * 70)
    print("GENETIC ALGORITHM - HYPERPARAMETER OPTIMIZATION FOR RANDOMFOREST")
    print("=" * 70)
    
    print("\nSearching for optimal hyperparameters (this may take a few minutes)...")
    print("[Ranges: n_estimators(10-500), max_depth(5-50), min_samples_split(2-20),")
    print(" min_samples_leaf(1-10), max_features(1-7)]")
    print()
    
    optimal_params = run_ga_hyperparameter_optimization(X_train, y_train, generations=15, pop_size=15)
    
    print("\n" + "=" * 70)
    print("OPTIMIZATION COMPLETE!")
    print("=" * 70)
    print("\nOptimal Hyperparameters Found:")
    print(f"  n_estimators: {optimal_params['n_estimators']}")
    print(f"  max_depth: {optimal_params['max_depth']}")
    print(f"  min_samples_split: {optimal_params['min_samples_split']}")
    print(f"  min_samples_leaf: {optimal_params['min_samples_leaf']}")
    print(f"  max_features: {optimal_params['max_features']}")
    print(f"  Cross-validation accuracy: {optimal_params['best_cv_accuracy']:.4f} ({optimal_params['best_cv_accuracy']*100:.2f}%)")
    
    print("\n" + "-" * 70)
    print("Training optimized model on full training set...")
    
    optimized_model = RandomForestClassifier(
        n_estimators=optimal_params['n_estimators'],
        max_depth=optimal_params['max_depth'],
        min_samples_split=optimal_params['min_samples_split'],
        min_samples_leaf=optimal_params['min_samples_leaf'],
        max_features=optimal_params['max_features'],
        random_state=42,
        n_jobs=-1
    )
    optimized_model.fit(X_train, y_train)
    
    optimized_accuracy = optimized_model.score(X_test, y_test)
    print(f"Test accuracy with optimized parameters: {optimized_accuracy:.4f} ({optimized_accuracy*100:.2f}%)")
    
    print("\n" + "-" * 70)
    print("Comparing with current model...")
    
    current_model = joblib.load("crop_model.joblib")
    current_accuracy = current_model.score(X_test, y_test)
    print(f"Current model test accuracy: {current_accuracy:.4f} ({current_accuracy*100:.2f}%)")
    
    improvement = optimized_accuracy - current_accuracy
    improvement_percent = (improvement / current_accuracy) * 100 if current_accuracy > 0 else 0
    
    print(f"\nImprovement: {improvement:+.4f} ({improvement_percent:+.2f}%)")
    
    if improvement > 0.001:
        print("\n[RECOMMENDATION] Optimized model shows meaningful improvement!")
        print("Saving optimized hyperparameters...")
        
        with open('optimal_hyperparameters.json', 'w') as f:
            json.dump(optimal_params, f, indent=2)
        
        joblib.dump(optimized_model, "crop_model_optimized.joblib")
        print("[OK] Saved optimal_hyperparameters.json and crop_model_optimized.joblib")
    else:
        print("\n[INFO] Current model is already well-optimized. No improvement found.")
    
    print("\n" + "=" * 70)
