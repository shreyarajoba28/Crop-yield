from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")  # MongoDB Compass default
db = client["crop_yield_db"]

users_col = db["users"]
predictions_col = db["predictions"]