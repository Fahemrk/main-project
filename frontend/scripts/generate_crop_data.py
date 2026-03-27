import csv
import json
from collections import defaultdict

csv_path = 'backend/Crop_recommendation.csv'
output_path = 'src/data/cropData.json'

crop_data = defaultdict(lambda: {
    'N': [],
    'P': [],
    'K': [],
    'temperature': [],
    'humidity': [],
    'ph': [],
    'rainfall': []
})

with open(csv_path, 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        crop = row['label'].lower().strip()
        crop_data[crop]['N'].append(float(row['N']))
        crop_data[crop]['P'].append(float(row['P']))
        crop_data[crop]['K'].append(float(row['K']))
        crop_data[crop]['temperature'].append(float(row['temperature']))
        crop_data[crop]['humidity'].append(float(row['humidity']))
        crop_data[crop]['ph'].append(float(row['ph']))
        crop_data[crop]['rainfall'].append(float(row['rainfall']))

result = {}
for crop, values in crop_data.items():
    result[crop] = {
        'N': sum(values['N']) / len(values['N']),
        'P': sum(values['P']) / len(values['P']),
        'K': sum(values['K']) / len(values['K']),
        'temperature': sum(values['temperature']) / len(values['temperature']),
        'humidity': sum(values['humidity']) / len(values['humidity']),
        'ph': sum(values['ph']) / len(values['ph']),
        'rainfall': sum(values['rainfall']) / len(values['rainfall'])
    }

with open(output_path, 'w') as f:
    json.dump(result, f, indent=2)

print(f"Generated {output_path} with {len(result)} crops")
print("Crops:", ', '.join(sorted(result.keys())))
