import os

import joblib
import pandas as pd
import requests
from bson import ObjectId
from flask import Flask, jsonify, request
from flask_cors import CORS
from sklearn.preprocessing import LabelEncoder
from werkzeug.security import check_password_hash, generate_password_hash

from db import predictions_col, users_col

app = Flask(__name__)
CORS(app)

model_path = os.path.join(os.path.dirname(__file__), "yield_model.pkl")
dataset_path = os.path.join(os.path.dirname(__file__), "final_dataset.csv")

model = joblib.load(model_path)
df = pd.read_csv(dataset_path)
WEATHER_API_KEY = "553d815e410bbf510017194f5971a407"

le_crop = LabelEncoder()
le_season = LabelEncoder()
le_irrigation = LabelEncoder()
le_crop.fit(df["Crop"])
le_season.fit(df["Season"])
le_irrigation.fit(df["Irrigation_Type"])

PULSE_CROPS = {"Gram", "Lentil", "Moong", "Other Pulses", "Total Pulses", "Tur", "Urad"}
OILSEED_CROPS = {"Castorseed", "Groundnut", "Nigerseed", "Rapeseed & Mustard", "Safflower", "Sesamum", "Soybean", "Sunflower", "Total Oil Seeds"}
CEREAL_CROPS = {
    "Bajra",
    "Barley",
    "Cereals",
    "Jowar",
    "Maize",
    "Nutri/Coarse Cereals",
    "Ragi",
    "Rice",
    "Shree Anna /Nutri Cereals",
    "Small Millets",
    "Total Food Grains",
    "Wheat",
}
FIBER_CROPS = {"Cotton", "Jute", "Jute & Mesta", "Mesta", "Sannhemp"}
COMMERCIAL_CROPS = {"Sugarcane", "Tobacco"}


def to_float(value):
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def get_fertilizer_suggestion_keys(crop, season, temperature, humidity):
    suggestions = []

    if crop in CEREAL_CROPS:
        suggestions.extend(
            [
                "fertilizer.cereal_npk_split",
                "fertilizer.compost_before_sowing",
            ]
        )
    elif crop in PULSE_CROPS:
        suggestions.extend(
            [
                "fertilizer.pulses_low_nitrogen",
                "fertilizer.pulses_rhizobium",
            ]
        )
    elif crop in OILSEED_CROPS:
        suggestions.extend(
            [
                "fertilizer.oilseed_sulfur",
                "fertilizer.organic_manure_quality",
            ]
        )
    elif crop in FIBER_CROPS:
        suggestions.extend(
            [
                "fertilizer.fiber_split_nitrogen",
                "fertilizer.fiber_potash",
            ]
        )
    elif crop in COMMERCIAL_CROPS:
        suggestions.extend(
            [
                "fertilizer.commercial_small_doses",
                "fertilizer.commercial_organic_mix",
            ]
        )
    else:
        suggestions.extend(
            [
                "fertilizer.general_soil_test",
                "fertilizer.general_compost",
            ]
        )

    if season == "Kharif":
        suggestions.append("fertilizer.kharif_rain_timing")
    elif season == "Rabi":
        suggestions.append("fertilizer.rabi_root_zone")
    elif season == "Summer":
        suggestions.append("fertilizer.summer_small_splits")

    if humidity and humidity > 80:
        suggestions.append("fertilizer.high_humidity")
    if temperature and temperature > 35:
        suggestions.append("fertilizer.high_temperature")

    return suggestions[:4]


def build_prediction_payload(data, year, area, temperature, humidity, weather_desc, prediction):
    recommendation = []
    recommendation_keys = []
    if humidity and humidity > 80:
        recommendation.append("High humidity detected. Monitor fungal diseases.")
        recommendation_keys.append("water.high_humidity")
    if temperature and temperature > 35:
        recommendation.append("High temperature detected. Increase irrigation frequency slightly and avoid moisture stress.")
        recommendation_keys.append("water.high_temperature")

    default_stages = {"initial": 0.7, "development": 0.85, "mid": 1.0, "late": 0.8}
    area_m2 = area * 10000
    et0 = 0.0023 * (temperature + 17.8) * (temperature - 0.5) if temperature is not None else 5
    if et0 <= 0:
        et0 = 5

    stage_water = {}
    total_water = 0
    for stage, kc in default_stages.items():
        water_value = et0 * kc * area_m2 / 1000
        stage_water[stage] = round(water_value, 2)
        total_water += water_value

    irrigation_efficiency = {"drip": 0.9, "sprinkler": 0.75, "canal": 0.65, "rainfed": 0.55, "flood": 0.5}
    efficiency = irrigation_efficiency.get(data["Irrigation_Type"].lower(), 0.75)
    effective_total = round(total_water / efficiency, 2)

    recommendation.append(f"Total water needed (adjusted): {effective_total} m3")
    recommendation_keys.append("water.total_needed")

    fertilizer_suggestion_keys = get_fertilizer_suggestion_keys(
        data["Crop"],
        data["Season"],
        temperature,
        humidity,
    )

    return {
        "crop": data["Crop"],
        "season": data["Season"],
        "year": year,
        "area": area,
        "irrigation_type": data["Irrigation_Type"],
        "city": data["City"],
        "predicted_yield": round(prediction, 2),
        "temperature": temperature,
        "humidity": humidity,
        "weather": weather_desc,
        "soil_moisture": 25.0,
        "soil_temperature": 22.0,
        "recommendation": "\n".join(recommendation),
        "recommendation_keys": recommendation_keys,
        "fertilizer_suggestion_keys": fertilizer_suggestion_keys,
        "stage_water": stage_water,
        "total_water_m3": effective_total,
    }


def resolve_weather(data):
    city = data.get("City")
    manual_temperature = to_float(data.get("Temperature"))
    manual_humidity = to_float(data.get("Humidity"))

    if city:
        try:
            geo_resp = requests.get(
                f"http://api.openweathermap.org/geo/1.0/direct?q={city}&limit=1&appid={WEATHER_API_KEY}",
                timeout=6,
            ).json()
            if geo_resp:
                lat, lon = geo_resp[0]["lat"], geo_resp[0]["lon"]
                weather_resp = requests.get(
                    f"https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&exclude=minutely,hourly,daily,alerts&units=metric&appid={WEATHER_API_KEY}",
                    timeout=6,
                ).json()
                current = weather_resp.get("current")

                if not current:
                    current_resp = requests.get(
                        f"https://api.openweathermap.org/data/2.5/weather?q={city}&units=metric&appid={WEATHER_API_KEY}",
                        timeout=6,
                    ).json()
                    current = {
                        "temp": current_resp.get("main", {}).get("temp"),
                        "humidity": current_resp.get("main", {}).get("humidity"),
                        "weather": current_resp.get("weather", [{"description": "N/A"}]),
                    }

                if current and current.get("temp") is not None and current.get("humidity") is not None:
                    return (
                        current.get("temp"),
                        current.get("humidity"),
                        current.get("weather")[0]["description"] if current.get("weather") else "Live weather",
                    )
        except requests.RequestException:
            pass
        except (KeyError, ValueError, TypeError):
            pass

    if manual_temperature is not None and manual_humidity is not None:
        return manual_temperature, manual_humidity, "Manual weather input"

    if manual_temperature is not None:
        return manual_temperature, 60.0, "Manual temperature with default humidity"

    if manual_humidity is not None:
        return 28.0, manual_humidity, "Manual humidity with default temperature"

    return 28.0, 60.0, "Offline estimated weather"


def serialize_prediction(prediction_doc):
    return {
        "_id": str(prediction_doc["_id"]),
        "crop": prediction_doc["crop"],
        "season": prediction_doc["season"],
        "year": prediction_doc["year"],
        "area": prediction_doc["area"],
        "irrigation_type": prediction_doc.get("irrigation_type"),
        "city": prediction_doc.get("city"),
        "predicted_yield": prediction_doc["predicted_yield"],
        "temperature": prediction_doc.get("temperature"),
        "humidity": prediction_doc.get("humidity"),
        "weather": prediction_doc.get("weather"),
        "soil_moisture": prediction_doc.get("soil_moisture"),
        "soil_temperature": prediction_doc.get("soil_temperature"),
        "recommendation": prediction_doc.get("recommendation"),
        "recommendation_keys": prediction_doc.get("recommendation_keys", []),
        "fertilizer_suggestion_keys": prediction_doc.get("fertilizer_suggestion_keys", []),
        "stage_water": prediction_doc.get("stage_water"),
        "total_water_m3": prediction_doc.get("total_water_m3"),
    }


@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    if users_col.find_one({"email": data["email"]}):
        return jsonify({"error": "Email exists"}), 400

    users_col.insert_one(
        {
            "username": data["username"],
            "email": data["email"],
            "password": generate_password_hash(data["password"]),
        }
    )
    return jsonify({"message": "User created"})


@app.route("/login", methods=["POST"])
def login():
    data = request.json
    user = users_col.find_one({"email": data["email"]})
    if not user or not check_password_hash(user["password"], data["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    return jsonify({"message": "Login successful", "user_id": str(user["_id"])})


@app.route("/options", methods=["GET"])
def get_options():
    return jsonify(
        {
            "crops": sorted(df["Crop"].unique().tolist()),
            "seasons": sorted(df["Season"].unique().tolist()),
            "irrigation": sorted(df["Irrigation_Type"].unique().tolist()),
        }
    )


@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"error": "User ID required"}), 400

    try:
        crop_enc = le_crop.transform([data["Crop"]])[0]
        season_enc = le_season.transform([data["Season"]])[0]
        irrigation_enc = le_irrigation.transform([data["Irrigation_Type"]])[0]
        year = int(data.get("Year", 0))
        area = float(data.get("Area", 0))
    except Exception as exc:
        return jsonify({"error": f"Input error: {str(exc)}"}), 400

    temperature, humidity, weather_desc = resolve_weather(data)

    input_df = pd.DataFrame(
        [[crop_enc, season_enc, year, area, irrigation_enc]],
        columns=["Crop", "Season", "Year", "Area", "Irrigation_Type"],
    )
    prediction = model.predict(input_df)[0]

    prediction_payload = build_prediction_payload(
        data,
        year,
        area,
        temperature,
        humidity,
        weather_desc,
        prediction,
    )

    predictions_col.insert_one({"user_id": user_id, **prediction_payload})

    return jsonify(
        {
            "crop": prediction_payload["crop"],
            "predicted_yield": prediction_payload["predicted_yield"],
            "temperature": prediction_payload["temperature"],
            "humidity": prediction_payload["humidity"],
            "weather": prediction_payload["weather"],
            "soil_moisture": prediction_payload["soil_moisture"],
            "soil_temperature": prediction_payload["soil_temperature"],
            "suggestion": prediction_payload["recommendation"],
            "recommendation_keys": prediction_payload["recommendation_keys"],
            "fertilizer_suggestion_keys": prediction_payload["fertilizer_suggestion_keys"],
            "water_supply": prediction_payload["stage_water"],
            "total_water_m3": prediction_payload["total_water_m3"],
        }
    )


@app.route("/predictions/<user_id>", methods=["GET"])
def past_predictions(user_id):
    preds = list(predictions_col.find({"user_id": user_id}))
    return jsonify([serialize_prediction(pred) for pred in preds])


@app.route("/predictions/<user_id>/<pred_id>", methods=["PUT"])
def edit_prediction(user_id, pred_id):
    data = request.json
    try:
        crop_enc = le_crop.transform([data["Crop"]])[0]
        season_enc = le_season.transform([data["Season"]])[0]
        irrigation_enc = le_irrigation.transform([data["Irrigation_Type"]])[0]
        year = int(data.get("Year", 0))
        area = float(data.get("Area", 0))
    except Exception as exc:
        return jsonify({"error": f"Input error: {str(exc)}"}), 400

    temperature = data.get("Temperature")
    humidity = data.get("Humidity")
    weather_desc = data.get("Weather")

    input_df = pd.DataFrame(
        [[crop_enc, season_enc, year, area, irrigation_enc]],
        columns=["Crop", "Season", "Year", "Area", "Irrigation_Type"],
    )
    prediction = model.predict(input_df)[0]

    prediction_payload = build_prediction_payload(
        data,
        year,
        area,
        temperature,
        humidity,
        weather_desc,
        prediction,
    )

    predictions_col.update_one(
        {"user_id": user_id, "_id": ObjectId(pred_id)},
        {"$set": prediction_payload},
    )

    preds = list(predictions_col.find({"user_id": user_id}))
    return jsonify([serialize_prediction(pred) for pred in preds])


@app.route("/predictions/<user_id>/<pred_id>", methods=["DELETE"])
def delete_prediction(user_id, pred_id):
    result = predictions_col.delete_one({"user_id": user_id, "_id": ObjectId(pred_id)})
    if result.deleted_count == 0:
        return jsonify({"error": "Prediction not found"}), 404

    preds = list(predictions_col.find({"user_id": user_id}))
    return jsonify([serialize_prediction(pred) for pred in preds])


if __name__ == "__main__":
    app.run(debug=True)
