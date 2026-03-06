import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score
import joblib

df = pd.read_csv("final_dataset.csv")

le_crop = LabelEncoder()
le_season = LabelEncoder()
le_irrigation = LabelEncoder()

df["Crop"] = le_crop.fit_transform(df["Crop"])
df["Season"] = le_season.fit_transform(df["Season"])
df["Irrigation_Type"] = le_irrigation.fit_transform(df["Irrigation_Type"])

df["Year"] = df["Year"].str.replace("-", "").astype(int)

# ❗ Production removed
X = df[["Crop", "Season", "Year", "Area", "Irrigation_Type"]]
y = df["Yield"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)

score = r2_score(y_test, y_pred)
print("Model R2 Score:", score)

joblib.dump(model, "yield_model.pkl")
print("Model saved as yield_model.pkl")