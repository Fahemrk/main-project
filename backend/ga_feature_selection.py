import numpy as np
import pandas as pd
import joblib
import json
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from deap import base, creator, tools, algorithms
import random

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

def evaluate_features(individual, X_train, X_test, y_train, y_test):
    """
    Evaluate accuracy using only selected features.
    Trains a binary classifier with selected features.
    individual: list of 0s and 1s (0=exclude feature, 1=include feature)
    """
    selected_features = [i for i, val in enumerate(individual) if val == 1]
    
    if len(selected_features) == 0:
        return 0,
    
    X_train_subset = X_train[:, selected_features]
    X_test_subset = X_test[:, selected_features]
    
    binary_model = RandomForestClassifier(n_estimators=50, random_state=42, n_jobs=-1)
    binary_model.fit(X_train_subset, y_train)
    y_pred = binary_model.predict(X_test_subset)
    accuracy = accuracy_score(y_test, y_pred)
    
    return accuracy,

def run_ga_feature_selection(X_train, X_test, y_train, y_test, crop_name, generations=20, pop_size=15):
    """
    Run genetic algorithm to find best feature subset for a crop (binary classification).
    """
    if "FitnessMax" in dir(creator):
        del creator.FitnessMax
    if "Individual" in dir(creator):
        del creator.Individual
    
    creator.create("FitnessMax", base.Fitness, weights=(1.0,))
    creator.create("Individual", list, fitness=creator.FitnessMax)
    
    toolbox = base.Toolbox()
    toolbox.register("attr_bool", random.randint, 0, 1)
    toolbox.register("individual", tools.initRepeat, creator.Individual, toolbox.attr_bool, n=len(FEATURE_NAMES))
    toolbox.register("population", tools.initRepeat, list, toolbox.individual)
    toolbox.register("evaluate", evaluate_features, X_train=X_train, X_test=X_test, y_train=y_train, y_test=y_test)
    toolbox.register("mate", tools.cxUniform, indpb=0.5)
    toolbox.register("mutate", tools.mutFlipBit, indpb=0.2)
    toolbox.register("select", tools.selTournament, tournsize=2)
    
    pop = toolbox.population(n=pop_size)
    hof = tools.HallOfFame(1)
    
    pop, logbook = algorithms.eaSimple(pop, toolbox, cxpb=0.5, mutpb=0.3, ngen=generations, halloffame=hof, verbose=False)
    
    best_individual = hof[0]
    selected_indices = [i for i, val in enumerate(best_individual) if val == 1]
    selected_names = [FEATURE_NAMES[i] for i in selected_indices]
    
    return {
        'crop': crop_name,
        'selected_features': selected_names,
        'num_features': len(selected_names),
        'accuracy': float(hof.items[0].fitness.values[0])
    }

if __name__ == "__main__":
    print("Loading data...")
    X, y, le = load_crop_data("Crop_recommendation.csv")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print("=" * 70)
    print("GENETIC ALGORITHM - FEATURE SELECTION FOR EACH CROP")
    print("=" * 70)
    
    results = []
    
    for crop_idx, crop_name in enumerate(le.classes_):
        print(f"\n[{crop_idx + 1}/{len(le.classes_)}] Running GA for {crop_name}...", end=" ", flush=True)
        
        y_train_binary = (y_train == crop_idx).astype(int)
        y_test_binary = (y_test == crop_idx).astype(int)
        
        result = run_ga_feature_selection(X_train, X_test, y_train_binary, y_test_binary, crop_name, generations=20, pop_size=15)
        results.append(result)
        
        print(f"[OK]")
        print(f"  Features: {', '.join(result['selected_features'])} | Accuracy: {result['accuracy']:.2%}")
    
    print("\n" + "=" * 70)
    print("GA feature selection complete!")
    print("=" * 70)
    
    with open('ga_features.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print("\n[OK] Results saved to ga_features.json")
    
    print("\nCRITICAL FEATURES BY CROP:")
    for result in results:
        features = ', '.join(result['selected_features']) if result['selected_features'] else '(all features)'
        print(f"  {result['crop']:15} -> {features}")
