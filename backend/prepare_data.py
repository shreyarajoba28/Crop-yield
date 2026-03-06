import pandas as pd
import numpy as np

# Load cleaned dataset (inside same folder)
df = pd.read_csv("clean_apy.csv")

irrigation_types = ["Drip", "Sprinkler", "Canal", "Rainfed"]

np.random.seed(42)
df["Irrigation_Type"] = np.random.choice(irrigation_types, size=len(df))

# Save in backend folder
df.to_csv("final_dataset.csv", index=False)

print("Irrigation feature added successfully!")
print(df.head())