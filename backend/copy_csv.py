import shutil
import os

src = r'c:\Users\fahem\Downloads\archive\Crop_recommendation.csv'
dst = r'Crop_recommendation.csv'

shutil.copy(src, dst)
print(f"File copied to {os.path.abspath(dst)}")
