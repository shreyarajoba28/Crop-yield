import pandas as pd

df = pd.read_csv("apy.csv")
print(df["Crop"].unique())

print("\n===== COLUMN NAMES =====")
print(df.columns)

print("\n===== FIRST 5 ROWS =====")
print(df.head())

print("\n===== DATA SHAPE =====")
print(df.shape)