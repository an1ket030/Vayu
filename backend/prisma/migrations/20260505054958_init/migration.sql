-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AQIReading" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "stationName" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "aqi" INTEGER NOT NULL,
    "pm25" DOUBLE PRECISION,
    "pm10" DOUBLE PRECISION,
    "no2" DOUBLE PRECISION,
    "o3" DOUBLE PRECISION,
    "co" DOUBLE PRECISION,
    "so2" DOUBLE PRECISION,
    "wind" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "temperature" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AQIReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExposureLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "aqi" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "durationSec" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExposureLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastReading" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "predictedAQI" DOUBLE PRECISION NOT NULL,
    "confidenceLow" DOUBLE PRECISION NOT NULL,
    "confidenceHigh" DOUBLE PRECISION NOT NULL,
    "forecastFor" TIMESTAMP(3) NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForecastReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedRoute" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originName" TEXT NOT NULL,
    "destName" TEXT NOT NULL,
    "routeGeoJSON" JSONB NOT NULL,
    "avgAQI" DOUBLE PRECISION NOT NULL,
    "exposureDose" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedRoute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "AQIReading_stationId_recordedAt_idx" ON "AQIReading"("stationId", "recordedAt");

-- CreateIndex
CREATE INDEX "AQIReading_lat_lon_idx" ON "AQIReading"("lat", "lon");

-- CreateIndex
CREATE INDEX "ExposureLog_userId_recordedAt_idx" ON "ExposureLog"("userId", "recordedAt");

-- CreateIndex
CREATE INDEX "ForecastReading_stationId_forecastFor_idx" ON "ForecastReading"("stationId", "forecastFor");

-- AddForeignKey
ALTER TABLE "ExposureLog" ADD CONSTRAINT "ExposureLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedRoute" ADD CONSTRAINT "SavedRoute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
