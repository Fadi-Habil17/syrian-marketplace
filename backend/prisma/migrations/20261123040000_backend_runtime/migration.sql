-- Backend runtime support; existing applied migrations remain unchanged.
ALTER TYPE "VerificationKind" ADD VALUE 'REALTIME_TICKET';
ALTER TABLE "BusinessProfile" ADD COLUMN "ratingAverage" DOUBLE PRECISION,
  ADD COLUMN "reviewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "Profile_rating_cache_valid"
  CHECK ("reviewCount">=0 AND ("ratingAverage" IS NULL OR "ratingAverage" BETWEEN 1 AND 5));
CREATE INDEX "BusinessProfile_status_ratingAverage_id_idx" ON "BusinessProfile"("status","ratingAverage","id");
ALTER TABLE "PortfolioItem" ADD COLUMN "archivedAt" TIMESTAMPTZ(3);

CREATE FUNCTION marketplace_refresh_profile_rating() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE profile_id uuid;
BEGIN
 IF TG_TABLE_NAME='Review' THEN profile_id:=NEW."sellerProfileId";
 ELSE SELECT "sellerProfileId" INTO STRICT profile_id FROM "Review" WHERE "id"=NEW."reviewId"; END IF;
 UPDATE "BusinessProfile" SET "ratingAverage"=s.average,"reviewCount"=s.count
 FROM (SELECT avg(x."stars")::double precision AS average,count(*)::integer AS count
   FROM (SELECT DISTINCT ON (r."id") v."stars" FROM "Review" r JOIN "ReviewVersion" v ON v."reviewId"=r."id"
     WHERE r."sellerProfileId"=profile_id AND NOT r."hidden" ORDER BY r."id",v."version" DESC) x) s
 WHERE "id"=profile_id;
 RETURN NULL;
END; $$;
CREATE TRIGGER "review_version_refresh_rating" AFTER INSERT ON "ReviewVersion" FOR EACH ROW EXECUTE FUNCTION marketplace_refresh_profile_rating();
CREATE TRIGGER "review_moderation_refresh_rating" AFTER UPDATE OF "hidden" ON "Review" FOR EACH ROW EXECUTE FUNCTION marketplace_refresh_profile_rating();
UPDATE "BusinessProfile" p SET "ratingAverage"=s.average,"reviewCount"=s.count
FROM (SELECT p2.id,avg(x.stars)::double precision AS average,count(x.stars)::integer AS count FROM "BusinessProfile" p2
 LEFT JOIN LATERAL (SELECT DISTINCT ON(r.id) v.stars FROM "Review" r JOIN "ReviewVersion" v ON v."reviewId"=r.id
  WHERE r."sellerProfileId"=p2.id AND NOT r.hidden ORDER BY r.id,v.version DESC) x ON true GROUP BY p2.id) s WHERE p.id=s.id;

CREATE OR REPLACE FUNCTION marketplace_child_limits() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
 IF TG_TABLE_NAME='MessageAttachment' THEN SELECT count(*) INTO n FROM "MessageAttachment" WHERE "messageId"=NEW."messageId"; IF n>10 THEN RAISE EXCEPTION 'At most 10 attachments' USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='ProductAsset' THEN SELECT count(*) INTO n FROM "ProductAsset" WHERE "productId"=NEW."productId"; IF n>10 THEN RAISE EXCEPTION 'At most 10 product images' USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='PortfolioItem' THEN SELECT count(*) INTO n FROM "PortfolioItem" WHERE "profileId"=NEW."profileId" AND "archivedAt" IS NULL; IF n>20 THEN RAISE EXCEPTION 'At most 20 active portfolio entries' USING ERRCODE='23514'; END IF;
 END IF; RETURN NULL;
END; $$;
