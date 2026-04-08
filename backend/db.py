from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")

db = client["crop_prediction"]

users_col = db["users"]
predictions_col = db["predictions"]