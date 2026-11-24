ALTER TABLE "City"
  ADD COLUMN "centerLatitude" DOUBLE PRECISION,
  ADD COLUMN "centerLongitude" DOUBLE PRECISION,
  ADD CONSTRAINT "City_center_valid" CHECK (
    ("centerLatitude" IS NULL AND "centerLongitude" IS NULL) OR
    ("centerLatitude" IS NOT NULL AND "centerLongitude" IS NOT NULL AND
     "centerLatitude" BETWEEN -90 AND 90 AND "centerLongitude" BETWEEN -180 AND 180)
  );

ALTER TABLE "Area"
  ADD COLUMN "centerLatitude" DOUBLE PRECISION,
  ADD COLUMN "centerLongitude" DOUBLE PRECISION,
  ADD CONSTRAINT "Area_center_valid" CHECK (
    ("centerLatitude" IS NULL AND "centerLongitude" IS NULL) OR
    ("centerLatitude" IS NOT NULL AND "centerLongitude" IS NOT NULL AND
     "centerLatitude" BETWEEN -90 AND 90 AND "centerLongitude" BETWEEN -180 AND 180)
  );

ALTER TABLE "BusinessProfile"
  ADD COLUMN "venueLatitude" DOUBLE PRECISION,
  ADD COLUMN "venueLongitude" DOUBLE PRECISION,
  ADD COLUMN "venuePublished" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD CONSTRAINT "BusinessProfile_venue_valid" CHECK (
    ("venueLatitude" IS NULL AND "venueLongitude" IS NULL AND NOT "venuePublished") OR
    ("venueLatitude" IS NOT NULL AND "venueLongitude" IS NOT NULL AND
     "venueLatitude" BETWEEN -90 AND 90 AND "venueLongitude" BETWEEN -180 AND 180 AND "venuePublished")
  );

ALTER TABLE "Storefront"
  ADD COLUMN "venueLatitude" DOUBLE PRECISION,
  ADD COLUMN "venueLongitude" DOUBLE PRECISION,
  ADD COLUMN "venuePublished" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD CONSTRAINT "Storefront_venue_valid" CHECK (
    ("venueLatitude" IS NULL AND "venueLongitude" IS NULL AND NOT "venuePublished") OR
    ("venueLatitude" IS NOT NULL AND "venueLongitude" IS NOT NULL AND
     "venueLatitude" BETWEEN -90 AND 90 AND "venueLongitude" BETWEEN -180 AND 180 AND "venuePublished")
  );
-- GeoNames 164947, CC BY 4.0. Only the matched populated place in Hama.
UPDATE "City" SET "centerLatitude"=35.01127, "centerLongitude"=37.05324
WHERE "nameEn"='Salamiyah' AND "governorateId" IN (SELECT id FROM "Governorate" WHERE "isoCode"='SY-HM');
