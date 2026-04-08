def irrigation_recommendation(soil_moisture, temperature, humidity):

    if soil_moisture < 30:
        return "High irrigation required"

    elif soil_moisture < 60:
        return "Moderate irrigation recommended"

    else:
        return "No irrigation needed"