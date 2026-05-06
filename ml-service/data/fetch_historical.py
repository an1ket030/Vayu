import requests
import os
import time
import pandas as pd
from datetime import datetime, timedelta

OWM_API_KEY = os.getenv("OWM_API_KEY")
BASE_URL = "http://api.openweathermap.org/data/2.5/air_pollution/history"

def fetch_historical_data(lat, lon, days=90):
    end = int(time.time())
    start = int((datetime.now() - timedelta(days=days)).timestamp())
    
    params = {
        "lat": lat,
        "lon": lon,
        "start": start,
        "end": end,
        "appid": OWM_API_KEY
    }
    
    response = requests.get(BASE_URL, params=params)
    if response.status_code == 200:
        data = response.json()
        list_data = data.get("list", [])
        
        records = []
        for item in list_data:
            records.append({
                "timestamp": datetime.fromtimestamp(item["dt"]),
                "aqi": item["main"]["aqi"],
                **item["components"]
            })
        
        df = pd.DataFrame(records)
        return df
    else:
        raise Exception(f"Failed to fetch data: {response.text}")

if __name__ == "__main__":
    # Test fetch for Delhi
    df = fetch_historical_data(28.6139, 77.2090)
    df.to_csv("historical_aqi.csv", index=False)
    print("Saved historical data to historical_aqi.csv")
