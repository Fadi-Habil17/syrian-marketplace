-- Cross-aggregate policy guards and immutable agreement/adjustment references.
ALTER TABLE "MarketOrder" ADD CONSTRAINT "Order_amount_nullability" CHECK (("agreedTotalUnits" IS NULL) = ("eligibleSellerUnits" IS NULL));
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "Service_split_nullability" CHECK (("depositUnits" IS NULL) = ("balanceUnits" IS NULL));
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "Service_listing_required" CHECK ("kind"='INSPECTION_QUOTE' OR "listingId" IS NOT NULL);
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_publish_ready" CHECK ("status"!='PUBLISHED' OR
 (length(btrim("titleAr"))>0 AND length(btrim("titleEn"))>0 AND length(btrim("descriptionAr"))>0 AND length(btrim("descriptionEn"))>0 AND
 (("kind"='FREELANCE' AND "deliveryDays" IS NOT NULL AND "deliveryDays">0) OR ("kind"='PROFESSIONAL_PACKAGE' AND "durationMinutes" IS NOT NULL AND "durationMinutes">0))));
ALTER TABLE "Storefront" ADD CONSTRAINT "Store_publish_ready" CHECK ("status"!='PUBLISHED' OR (length(btrim("nameAr"))>0 AND length(btrim("nameEn"))>0 AND length(btrim("descriptionAr"))>0 AND length(btrim("descriptionEn"))>0 AND ("supportsSellerDelivery" OR "supportsPlatformDelivery")));
ALTER TABLE "Product" ADD CONSTRAINT "Product_publish_ready" CHECK ("status"!='PUBLISHED' OR (length(btrim("titleAr"))>0 AND length(btrim("titleEn"))>0 AND length(btrim("descriptionAr"))>0 AND length(btrim("descriptionEn"))>0));
ALTER TABLE "FileAsset" ADD CONSTRAINT "File_extension_matches_mime" CHECK (("mimeType"='image/jpeg' AND "extension" IN ('jpg','jpeg')) OR ("mimeType"='image/png' AND "extension"='png') OR ("mimeType"='image/webp' AND "extension"='webp') OR ("mimeType"='application/pdf' AND "extension"='pdf') OR ("mimeType"='application/zip' AND "extension"='zip'));
CREATE FUNCTION marketplace_journal_policy() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW."kind"!='SIMULATED_TOPUP' AND (NEW."orderId" IS NULL OR NOT EXISTS (SELECT 1 FROM "MarketOrder" WHERE "id"=NEW."orderId" AND "currency"=NEW."currency")) THEN RAISE EXCEPTION 'Journal order currency mismatch' USING ERRCODE='23514'; END IF;
 IF NEW."kind" IN ('DEPOSIT_HOLD','BALANCE_HOLD','STORE_HOLD','DELIVERY_ADJUSTMENT_HOLD') AND NOT EXISTS (SELECT 1 FROM "PaymentAttempt" WHERE "journalId"=NEW."id" AND "status"='SUCCEEDED') THEN RAISE EXCEPTION 'Hold journal requires its successful provider attempt' USING ERRCODE='23514'; END IF;
 IF NEW."kind"='SETTLEMENT' AND NOT EXISTS (SELECT 1 FROM "Settlement" WHERE "journalId"=NEW."id") THEN RAISE EXCEPTION 'Settlement journal requires one settlement' USING ERRCODE='23514'; END IF;
 IF NEW."kind"='SIMULATED_TOPUP' THEN
  IF NEW."orderId" IS NOT NULL OR NOT EXISTS (SELECT 1 FROM "UserRole" ur JOIN "Role" r ON r."id"=ur."roleId" WHERE ur."userId"=NEW."actorId" AND ur."revokedAt" IS NULL AND r."code"='ADMIN') OR
     NOT EXISTS (SELECT 1 FROM "LedgerEntry" e JOIN "LedgerAccount" a ON a."id"=e."accountId" WHERE e."journalId"=NEW."id" AND a."kind"='SIMULATOR_CLEARING' AND e."debitUnits">0) OR
     EXISTS (SELECT 1 FROM "LedgerEntry" e JOIN "LedgerAccount" a ON a."id"=e."accountId" WHERE e."journalId"=NEW."id" AND ((e."debitUnits">0 AND a."kind"!='SIMULATOR_CLEARING') OR (e."creditUnits">0 AND a."kind"!='AVAILABLE'))) THEN RAISE EXCEPTION 'Simulator credit requires admin and clearing-to-wallet postings' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW."kind"='DELIVERY_ADJUSTMENT_REFUND' AND NOT EXISTS (SELECT 1 FROM "DeliveryTermsRevision" WHERE "journalId"=NEW."id" AND "buyerApprovedAt" IS NOT NULL AND "appliedAt" IS NOT NULL) THEN RAISE EXCEPTION 'Refund requires unique approved delivery revision' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END; $$;
CREATE CONSTRAINT TRIGGER "journal_policy" AFTER INSERT ON "LedgerJournal" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION marketplace_journal_policy();

CREATE FUNCTION marketplace_terms_adjustment() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE d "Delivery"; o "MarketOrder"; j "LedgerJournal"; delta bigint; escrow_account uuid; moved numeric;
BEGIN
 IF NEW."appliedAt" IS NULL THEN RETURN NULL; END IF;
 SELECT * INTO STRICT d FROM "Delivery" WHERE "id"=NEW."deliveryId";
 SELECT x.* INTO STRICT o FROM "StoreOrder" so JOIN "MarketOrder" x ON x."id"=so."orderId" WHERE so."id"=d."storeOrderId";
 IF NEW."buyerApprovedAt" IS NULL OR NEW."currency"!=o."currency" OR NEW."previousFeeUnits"<0 OR NEW."version">d."termsVersion" THEN RAISE EXCEPTION 'Invalid approved delivery revision' USING ERRCODE='23514'; END IF;
 IF NEW."version"=d."termsVersion" AND (NEW."feeUnits"!=d."feeUnits" OR NEW."method"!=d."method" OR NEW."feeUnits"!=o."deliveryFeeUnits") THEN RAISE EXCEPTION 'Applied terms mismatch order' USING ERRCODE='23514'; END IF;
 delta:=NEW."feeUnits"-NEW."previousFeeUnits";
 IF delta=0 THEN IF NEW."journalId" IS NOT NULL THEN RAISE EXCEPTION 'Unchanged fee has no money operation' USING ERRCODE='23514'; END IF; RETURN NULL; END IF;
 IF NEW."journalId" IS NULL THEN RAISE EXCEPTION 'Changed fee requires atomic hold/refund' USING ERRCODE='23514'; END IF;
 SELECT * INTO STRICT j FROM "LedgerJournal" WHERE "id"=NEW."journalId";
 SELECT "accountId" INTO STRICT escrow_account FROM "Escrow" WHERE "orderId"=o."id";
 SELECT coalesce(sum("creditUnits"-"debitUnits"),0) INTO moved FROM "LedgerEntry" WHERE "journalId"=j."id" AND "accountId"=escrow_account;
 IF j."orderId"!=o."id" OR j."currency"!=o."currency" OR moved!=delta OR (delta>0 AND j."kind"!='DELIVERY_ADJUSTMENT_HOLD') OR (delta<0 AND j."kind"!='DELIVERY_ADJUSTMENT_REFUND') THEN RAISE EXCEPTION 'Delivery delta ledger mismatch' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END; $$;
CREATE CONSTRAINT TRIGGER "approved_terms_money" AFTER INSERT OR UPDATE ON "DeliveryTermsRevision" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION marketplace_terms_adjustment();

CREATE FUNCTION marketplace_terms_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD."appliedAt" IS NOT NULL OR TG_OP='DELETE' THEN RAISE EXCEPTION 'Preserve applied delivery terms history' USING ERRCODE='23514'; END IF;
 IF OLD."buyerApprovedAt" IS NOT NULL AND (NEW."feeUnits",NEW."previousFeeUnits",NEW."method",NEW."currency",NEW."promisedAt",NEW."deliveryId",NEW."version") IS DISTINCT FROM (OLD."feeUnits",OLD."previousFeeUnits",OLD."method",OLD."currency",OLD."promisedAt",OLD."deliveryId",OLD."version") THEN RAISE EXCEPTION 'Approved terms cannot change before application' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER "terms_snapshot_immutable" BEFORE UPDATE OR DELETE ON "DeliveryTermsRevision" FOR EACH ROW EXECUTE FUNCTION marketplace_terms_immutable();

CREATE FUNCTION marketplace_funded_agreement_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS (SELECT 1 FROM "PaymentAttempt" WHERE "orderId"=OLD."id" AND "status"='SUCCEEDED') THEN
  IF NEW."agreementSnapshot" IS DISTINCT FROM OLD."agreementSnapshot" OR NEW."addressSnapshot" IS DISTINCT FROM OLD."addressSnapshot" OR NEW."eligibleSellerUnits" IS DISTINCT FROM OLD."eligibleSellerUnits" THEN RAISE EXCEPTION 'Funded scope, seller amount and address are immutable snapshots' USING ERRCODE='23514'; END IF;
  IF (NEW."agreedTotalUnits",NEW."deliveryFeeUnits") IS DISTINCT FROM (OLD."agreedTotalUnits",OLD."deliveryFeeUnits") THEN
   IF NEW."workspace"!='HOME_STORE' OR NOT EXISTS (SELECT 1 FROM "DeliveryTermsRevision" r JOIN "Delivery" d ON d."id"=r."deliveryId" JOIN "StoreOrder" so ON so."id"=d."storeOrderId" WHERE so."orderId"=NEW."id" AND r."version"=d."termsVersion" AND r."buyerApprovedAt" IS NOT NULL AND r."appliedAt" IS NOT NULL AND r."feeUnits"=NEW."deliveryFeeUnits") THEN RAISE EXCEPTION 'Buyer approval required before changed total/terms' USING ERRCODE='23514'; END IF;
  END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER "funded_agreement_immutable" BEFORE UPDATE ON "MarketOrder" FOR EACH ROW EXECUTE FUNCTION marketplace_funded_agreement_immutable();

CREATE FUNCTION marketplace_case_party_check() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE o "MarketOrder"; seller uuid;
BEGIN
 SELECT x.* INTO STRICT o FROM "CaseRecord" c JOIN "MarketOrder" x ON x."id"=c."orderId" WHERE c."id"=NEW."caseId";
 SELECT "userId" INTO STRICT seller FROM "BusinessProfile" WHERE "id"=o."sellerProfileId";
 IF (NEW."role"='BUYER' AND NEW."userId"!=o."buyerId") OR (NEW."role"='SELLER' AND NEW."userId"!=seller) THEN RAISE EXCEPTION 'Case party must be original order buyer/seller' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END; $$;
CREATE CONSTRAINT TRIGGER "case_party_owner" AFTER INSERT ON "CaseParty" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION marketplace_case_party_check();

CREATE FUNCTION marketplace_escrow_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF (NEW."orderId",NEW."accountId",NEW."currency") IS DISTINCT FROM (OLD."orderId",OLD."accountId",OLD."currency") THEN RAISE EXCEPTION 'Escrow economic identity is immutable' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER "escrow_identity_immutable" BEFORE UPDATE ON "Escrow" FOR EACH ROW EXECUTE FUNCTION marketplace_escrow_identity();

CREATE FUNCTION marketplace_quote_snapshot() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE sent boolean;
BEGIN
 IF TG_TABLE_NAME='Quote' THEN
  IF OLD."state"!='DRAFT' AND (NEW."serviceOrderId",NEW."version",NEW."currency",NEW."totalUnits",NEW."scope",NEW."startsAt",NEW."endsAt",NEW."dueAt") IS DISTINCT FROM (OLD."serviceOrderId",OLD."version",OLD."currency",OLD."totalUnits",OLD."scope",OLD."startsAt",OLD."endsAt",OLD."dueAt") THEN RAISE EXCEPTION 'Sent quote is an immutable version' USING ERRCODE='23514'; END IF;
 ELSE
  SELECT "state"!='DRAFT' INTO sent FROM "Quote" WHERE "id"=OLD."quoteId";
  IF sent THEN RAISE EXCEPTION 'Sent quote items cannot change' USING ERRCODE='23514'; END IF;
  IF TG_OP='UPDATE' AND NEW."quoteId" IS DISTINCT FROM OLD."quoteId" THEN RAISE EXCEPTION 'Quote item parent is immutable' USING ERRCODE='23514'; END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END; $$;
CREATE TRIGGER "quote_snapshot" BEFORE UPDATE ON "Quote" FOR EACH ROW EXECUTE FUNCTION marketplace_quote_snapshot();
CREATE TRIGGER "quote_item_snapshot" BEFORE UPDATE OR DELETE ON "QuoteItem" FOR EACH ROW EXECUTE FUNCTION marketplace_quote_snapshot();

CREATE FUNCTION marketplace_check_children_against_order() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE order_id uuid; row_record record;
BEGIN
 IF TG_OP='DELETE' THEN row_record:=OLD; ELSE row_record:=NEW; END IF;
 IF TG_TABLE_NAME='StoreOrder' OR TG_TABLE_NAME='ServiceOrder' THEN order_id:=row_record."orderId";
 ELSIF TG_TABLE_NAME='OrderItem' OR TG_TABLE_NAME='Delivery' THEN SELECT "orderId" INTO STRICT order_id FROM "StoreOrder" WHERE "id"=row_record."storeOrderId";
 ELSE order_id:=row_record."orderId";
 END IF;
 -- Force deferred header checks to run when a child changes without a header update.
 UPDATE "MarketOrder" SET "updatedAt"="updatedAt" WHERE "id"=order_id;
 RETURN NULL;
END; $$;
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['ServiceOrder','StoreOrder','OrderItem','Delivery','Escrow'] LOOP
 EXECUTE format('CREATE CONSTRAINT TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON %I DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION marketplace_check_children_against_order()', 'child_integrity_'||t,t);
END LOOP; END; $$;

CREATE FUNCTION marketplace_role_count() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF (SELECT count(*) FROM "UserRole" ur JOIN "Role" r ON r."id"=ur."roleId" WHERE ur."userId"=NEW."userId" AND ur."revokedAt" IS NULL AND r."code" IN ('FREELANCER','PROFESSIONAL','STORE_OWNER','DELIVERY_DRIVER'))>1 THEN RAISE EXCEPTION 'At most one current business role grant' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END; $$;
CREATE CONSTRAINT TRIGGER "one_current_business_role" AFTER INSERT OR UPDATE ON "UserRole" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION marketplace_role_count();

CREATE FUNCTION marketplace_service_hold_guards() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE s "ServiceOrder"; o "MarketOrder"; j "LedgerJournal"; b "Booking";
BEGIN
 IF NEW."status"!='SUCCEEDED' OR NEW."installment" NOT IN ('DEPOSIT','BALANCE') THEN RETURN NULL; END IF;
 SELECT * INTO STRICT o FROM "MarketOrder" WHERE "id"=NEW."orderId";
 SELECT * INTO STRICT s FROM "ServiceOrder" WHERE "orderId"=o."id";
 SELECT * INTO STRICT j FROM "LedgerJournal" WHERE "id"=NEW."journalId";
 IF NEW."installment"='DEPOSIT' THEN
  IF s."depositDeadlineAt" IS NULL OR j."postedAt">=s."depositDeadlineAt" THEN RAISE EXCEPTION 'Deposit deadline expired' USING ERRCODE='23514'; END IF;
  IF s."kind"='FIXED_BOOKING' THEN
   SELECT * INTO STRICT b FROM "Booking" WHERE "serviceOrderId"=s."id";
   IF b."state"!='CONFIRMED' OR b."providerAcceptedAt" IS NULL OR (b."proposedStartsAt" IS NOT NULL AND b."buyerAcceptedAt" IS NULL) THEN RAISE EXCEPTION 'Provider and buyer must confirm schedule before deposit' USING ERRCODE='23514'; END IF;
  ELSIF s."kind"='INSPECTION_QUOTE' THEN
   IF s."approvedQuoteId" IS NULL OR NOT EXISTS (SELECT 1 FROM "Quote" WHERE "id"=s."approvedQuoteId" AND "state"='APPROVED') THEN RAISE EXCEPTION 'Quote approval required before deposit' USING ERRCODE='23514'; END IF;
  END IF;
  IF s."kind"!='FREELANCE' AND NOT EXISTS (SELECT 1 FROM "ScheduleReservation" WHERE "serviceOrderId"=s."id" AND "providerId"=o."sellerProfileId" AND "status" IN ('RESERVED','RELEASED')) THEN RAISE EXCEPTION 'Confirmed professional schedule required' USING ERRCODE='23514'; END IF;
 ELSE
  IF s."readyAt" IS NULL OR s."readinessEvidence" IS NULL OR s."balanceDeadlineAt" IS NULL OR j."postedAt"<s."readyAt" OR j."postedAt">=s."balanceDeadlineAt" OR NOT EXISTS (SELECT 1 FROM "PaymentAttempt" WHERE "orderId"=o."id" AND "installment"='DEPOSIT' AND "status"='SUCCEEDED') THEN RAISE EXCEPTION 'Documented readiness and held deposit required before balance' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NULL;
END; $$;
CREATE CONSTRAINT TRIGGER "service_payment_guards" AFTER INSERT ON "PaymentAttempt" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION marketplace_service_hold_guards();

CREATE FUNCTION marketplace_delivery_proof_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW."assignmentId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "DriverAssignment" WHERE "id"=NEW."assignmentId" AND "deliveryId"=NEW."deliveryId") THEN RAISE EXCEPTION 'Delivery event assignment mismatch' USING ERRCODE='23514'; END IF;
 IF NEW."verified" AND NOT EXISTS (SELECT 1 FROM "FileAsset" f JOIN "Delivery" d ON d."id"=NEW."deliveryId" JOIN "StoreOrder" so ON so."id"=d."storeOrderId" WHERE f."id"=NEW."proofId" AND f."scanStatus"='CLEAN' AND f."accessClass"='DELIVERY_ONLY' AND f."orderId"=so."orderId") THEN RAISE EXCEPTION 'Verified physical proof must be clean and scoped to this delivery' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER "delivery_proof_scope" BEFORE INSERT ON "DeliveryEvent" FOR EACH ROW EXECUTE FUNCTION marketplace_delivery_proof_guard();

CREATE FUNCTION marketplace_quote_item_insert() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM "Quote" WHERE "id"=NEW."quoteId" AND "state"='DRAFT') THEN RAISE EXCEPTION 'Build quote lines while draft, then publish the version atomically' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER "quote_lines_no_late_append" BEFORE INSERT ON "QuoteItem" FOR EACH ROW EXECUTE FUNCTION marketplace_quote_item_insert();

CREATE FUNCTION marketplace_review_version_chain() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM "ReviewVersion" WHERE "reviewId"=NEW."reviewId" AND "version"=1) THEN RAISE EXCEPTION 'Review edits require their original immutable version' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END; $$;
CREATE CONSTRAINT TRIGGER "review_original_required" AFTER INSERT ON "ReviewVersion" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION marketplace_review_version_chain();

CREATE FUNCTION marketplace_order_item_snapshot() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE sid uuid; oid uuid;
BEGIN
 IF TG_OP='INSERT' THEN sid:=NEW."storeOrderId"; ELSE sid:=OLD."storeOrderId"; END IF;
 SELECT "orderId" INTO STRICT oid FROM "StoreOrder" WHERE "id"=sid;
 IF EXISTS (SELECT 1 FROM "PaymentAttempt" WHERE "orderId"=oid AND "status"='SUCCEEDED') THEN RAISE EXCEPTION 'Funded order items are immutable' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND NEW."storeOrderId" IS DISTINCT FROM OLD."storeOrderId" THEN RAISE EXCEPTION 'Order item parent is immutable' USING ERRCODE='23514'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END; $$;
CREATE TRIGGER "order_item_snapshot" BEFORE INSERT OR UPDATE OR DELETE ON "OrderItem" FOR EACH ROW EXECUTE FUNCTION marketplace_order_item_snapshot();

CREATE FUNCTION marketplace_specialization_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Retain order specialization and escrow history' USING ERRCODE='23514'; END IF;
 IF NEW."orderId" IS DISTINCT FROM OLD."orderId" THEN RAISE EXCEPTION 'Order specialization parent is immutable' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='ServiceOrder' THEN
  IF EXISTS (SELECT 1 FROM "PaymentAttempt" WHERE "orderId"=OLD."orderId" AND "status"='SUCCEEDED') AND
    (NEW."kind",NEW."listingId",NEW."approvedQuoteId",NEW."depositUnits",NEW."balanceUnits") IS DISTINCT FROM (OLD."kind",OLD."listingId",OLD."approvedQuoteId",OLD."depositUnits",OLD."balanceUnits") THEN RAISE EXCEPTION 'Funded service agreement reference and installment amounts are immutable' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER "service_parent_identity" BEFORE UPDATE OR DELETE ON "ServiceOrder" FOR EACH ROW EXECUTE FUNCTION marketplace_specialization_identity();
CREATE TRIGGER "store_parent_identity" BEFORE UPDATE OR DELETE ON "StoreOrder" FOR EACH ROW EXECUTE FUNCTION marketplace_specialization_identity();
CREATE TRIGGER "escrow_parent_identity" BEFORE DELETE ON "Escrow" FOR EACH ROW EXECUTE FUNCTION marketplace_specialization_identity();
