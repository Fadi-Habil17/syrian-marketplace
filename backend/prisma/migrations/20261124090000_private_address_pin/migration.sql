ALTER TABLE "Address"
  ADD COLUMN "latitude" DOUBLE PRECISION,
  ADD COLUMN "longitude" DOUBLE PRECISION,
  ADD CONSTRAINT "Address_pin_valid" CHECK (
    ("latitude" IS NULL AND "longitude" IS NULL) OR
    ("latitude" IS NOT NULL AND "longitude" IS NOT NULL AND
     "latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180)
  );
