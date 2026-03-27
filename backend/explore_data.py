import pandas as pd
import json

out = {}
try:
    df_price = pd.read_csv('data/price_data.csv')
    out['price_data'] = {
        'columns': df_price.columns.tolist(),
        'shape': df_price.shape,
        'head': df_price.head(2).to_dict('records')
    }
    
    df_wm = pd.read_excel('data/watermelon_dataset.xlsx')
    out['watermelon'] = {
        'columns': df_wm.columns.tolist(),
        'shape': df_wm.shape,
        'head': df_wm.head(2).astype(str).to_dict('records')
    }
    
    df_coco = pd.read_excel('data/kerala_coconut_dataset.xlsx')
    out['coconut'] = {
        'columns': df_coco.columns.tolist(),
        'shape': df_coco.shape,
        'head': df_coco.head(2).astype(str).to_dict('records')
    }
    
    with open('explore_output.json', 'w') as f:
        json.dump(out, f, indent=2)
except Exception as e:
    with open('explore_output.json', 'w') as f:
        f.write(str(e))
