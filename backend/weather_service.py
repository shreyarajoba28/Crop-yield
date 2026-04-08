import requests

API_KEY = "553d815e410bbf510017194f5971a407"

def get_weather(city):

    url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric"

    response = requests.get(url)
    data = response.json()

    weather_data = {
        "temperature": data["main"]["temp"],
        "humidity": data["main"]["humidity"],
        "rain": data.get("rain", {}).get("1h", 0),
        "description": data["weather"][0]["description"]
    }

    return weather_data