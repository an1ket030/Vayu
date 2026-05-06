import pandas as pd
import numpy as np

def pm25_to_aqi(pm25):
    breakpoints = [
        (0.0, 12.0, 0, 50),
        (12.1, 35.4, 51, 100),
        (35.5, 55.4, 101, 150),
        (55.5, 150.4, 151, 200),
        (150.5, 250.4, 201, 300),
        (250.5, 350.4, 301, 400),
        (350.5, 500.4, 401, 500)
    ]
    for c_low, c_high, i_low, i_high in breakpoints:
        if c_low <= pm25 <= c_high:
            return ((i_high - i_low) / (c_high - c_low)) * (pm25 - c_low) + i_low
    if pm25 > 500.4:
        return 500
    return 0

def create_features(df):
    df = df.copy()
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df = df.sort_values('timestamp')
    
    # Time features
    df['hour'] = df['timestamp'].dt.hour
    df['day_of_week'] = df['timestamp'].dt.dayofweek
    df['month'] = df['timestamp'].dt.month
    
    # Cyclical encoding
    df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
    df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
    
    # Lags (assuming hourly data)
    df['pm25_lag_3h'] = df['pm2_5'].shift(3)
    df['pm25_lag_6h'] = df['pm2_5'].shift(6)
    df['pm25_lag_12h'] = df['pm2_5'].shift(12)
    df['pm25_lag_24h'] = df['pm2_5'].shift(24)
    
    # Rolling means
    df['pm25_rolling_6h'] = df['pm2_5'].rolling(window=6).mean()
    df['pm25_rolling_12h'] = df['pm2_5'].rolling(window=12).mean()
    df['pm25_rolling_24h'] = df['pm2_5'].rolling(window=24).mean()
    
    # Target: AQI 24h ahead
    df['target_pm25_24h'] = df['pm2_5'].shift(-24)
    df['target_aqi_24h'] = df['target_pm25_24h'].apply(pm25_to_aqi)
    
    return df.dropna()
