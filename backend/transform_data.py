import pandas as pd

df = pd.read_csv("apy.csv")

# Years available
years = ["2021-22", "2022-23", "2023-24", "2024-25", "2025-26"]

final_data = []

for year in years:
    temp = pd.DataFrame({
        "Crop": df["Crop"],
        "Season": df["Season"],
        "Year": year,
        "Area": df[f"Area-{year}"],
        "Production": df[f"Production-{year}"],
        "Yield": df[f"Yield-{year}"]
    })
    
    final_data.append(temp)

clean_df = pd.concat(final_data, ignore_index=True)

# Remove rows with missing yield
clean_df = clean_df.dropna(subset=["Yield"])

print(clean_df.head())
print("\nNew Shape:", clean_df.shape)

# Save clean version
clean_df.to_csv("clean_apy.csv", index=False)