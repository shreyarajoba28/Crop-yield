from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import joblib, pandas as pd, requests
from sklearn.preprocessing import LabelEncoder
from db import users_col, predictions_col

app = Flask(__name__)
CORS(app)

# Load trained model
model = joblib.load("yield_model.pkl")

# Load dataset
df = pd.read_csv("final_dataset.csv")
WEATHER_API_KEY = "553d815e410bbf510017194f5971a407"

# Label encoders
le_crop = LabelEncoder()
le_season = LabelEncoder()
le_irrigation = LabelEncoder()
le_crop.fit(df["Crop"])
le_season.fit(df["Season"])
le_irrigation.fit(df["Irrigation_Type"])

# -------------------- USER --------------------
@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    if users_col.find_one({"email": data["email"]}):
        return jsonify({"error": "Email exists"}), 400
    users_col.insert_one({
        "username": data["username"],
        "email": data["email"],
        "password": generate_password_hash(data["password"])
    })
    return jsonify({"message": "User created"})


@app.route("/login", methods=["POST"])
def login():
    data = request.json
    user = users_col.find_one({"email": data["email"]})
    if not user or not check_password_hash(user["password"], data["password"]):
        return jsonify({"error": "Invalid credentials"}), 401
    return jsonify({"message": "Login successful", "user_id": str(user["_id"])})


# -------------------- OPTIONS --------------------
@app.route("/options", methods=["GET"])
def get_options():
    return jsonify({
        "crops": sorted(df["Crop"].unique().tolist()),
        "seasons": sorted(df["Season"].unique().tolist()),
        "irrigation": sorted(df["Irrigation_Type"].unique().tolist())
    })


# -------------------- PREDICT --------------------
@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"error": "User ID required"}), 400

    city = data.get("City")
    if not city:
        return jsonify({"error": "City required"}), 400

    try:
        crop_enc = le_crop.transform([data["Crop"]])[0]
        season_enc = le_season.transform([data["Season"]])[0]
        irrigation_enc = le_irrigation.transform([data["Irrigation_Type"]])[0]
        year = int(data.get("Year", 0))
        area = float(data.get("Area", 0))
    except Exception as e:
        return jsonify({"error": f"Input error: {str(e)}"}), 400

    # Get weather
    geo_resp = requests.get(f"http://api.openweathermap.org/geo/1.0/direct?q={city}&limit=1&appid={WEATHER_API_KEY}").json()
    if not geo_resp:
        return jsonify({"error": "City not found"}), 404

    lat, lon = geo_resp[0]["lat"], geo_resp[0]["lon"]
    weather_resp = requests.get(f"https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&exclude=minutely,hourly,daily,alerts&units=metric&appid={WEATHER_API_KEY}").json()
    current = weather_resp.get("current")
    if not current:
        current_resp = requests.get(f"https://api.openweathermap.org/data/2.5/weather?q={city}&units=metric&appid={WEATHER_API_KEY}").json()
        current = {
            "temp": current_resp["main"]["temp"],
            "humidity": current_resp["main"]["humidity"],
            "weather": current_resp.get("weather", [{"description": "N/A"}])
        }

    temperature = current.get("temp")
    humidity = current.get("humidity")
    weather_desc = current.get("weather")[0]["description"] if current.get("weather") else "N/A"

    # Model prediction
    input_df = pd.DataFrame([[crop_enc, season_enc, year, area, irrigation_enc]], columns=["Crop","Season","Year","Area","Irrigation_Type"])
    prediction = model.predict(input_df)[0]

    # Base recommendation
    recommendation = ""
    if humidity and humidity > 80:
        recommendation += "High humidity detected. Monitor fungal diseases. "
    if temperature and temperature > 35:
        recommendation += "High temperature. Increase irrigation. "

    # -------------------- Dynamic Stage-wise Water Calculation --------------------
    # Default stage coefficients for any crop
    default_stages = {"initial": 0.7, "development": 0.85, "mid": 1.0, "late": 0.8}

    # Convert area to m²
    area_m2 = area * 10000

    # ET0 (reference evapotranspiration) in mm/day
    ET0 = 0.0023 * (temperature + 17.8) * (temperature - 0.5)
    if ET0 <= 0:  # fallback
        ET0 = 5

    # Calculate water for each stage dynamically
    stage_water = {}
    total_water = 0
    for stage, kc in default_stages.items():
        w = ET0 * kc * area_m2 / 1000  # mm -> m³
        stage_water[stage] = round(w, 2)
        total_water += w

    # Adjust for irrigation efficiency
    ir_eff = {"drip": 0.9, "sprinkler": 0.75, "flood": 0.5}
    eff = ir_eff.get(data["Irrigation_Type"].lower(), 0.75)
    effective_total = round(total_water / eff, 2)

    # Add to recommendation
    irrigation_msg = f"Total water needed (adjusted): {effective_total} m³"
    recommendation += f"\n{irrigation_msg}"

    # Soil placeholders
    soil_moisture = 25.0  # %
    soil_temp = 22.0  # °C

    # Save to DB
    predictions_col.insert_one({
        "user_id": user_id,
        "crop": data["Crop"],
        "season": data["Season"],
        "year": year,
        "area": area,
        "irrigation_type": data["Irrigation_Type"],
        "city": city,
        "predicted_yield": round(prediction,2)
    })

    return jsonify({
        "Predicted_Yield": round(prediction,2),
        "Temperature": temperature,
        "Humidity": humidity,
        "Weather": weather_desc,
        "Soil_Moisture": soil_moisture,
        "Soil_Temperature": soil_temp,
        "Recommendation": recommendation,
        "Stage_Water": stage_water,
        "Total_Water_m3": effective_total
    })


# -------------------- GET PAST PREDICTIONS --------------------
@app.route("/predictions/<user_id>", methods=["GET"])
def past_predictions(user_id):
    preds = list(predictions_col.find({"user_id": user_id}))
    result = [{"crop": p["crop"], "season": p["season"], "year": p["year"], "area": p["area"], "predicted_yield": p["predicted_yield"]} for p in preds]
    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True)