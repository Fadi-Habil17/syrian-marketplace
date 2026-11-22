-- PostgreSQL-specific invariants. Apply after the generated domain schema.
-- No live gateway, balance override, or automatic deposit forfeiture exists.
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE UNIQUE INDEX "BusinessProfile_one_active" ON "BusinessProfile"("userId") WHERE "status" = 'ACTIVE';
CREATE UNIQUE INDEX "CommissionRate_global_version" ON "CommissionRate"("version") WHERE "workspace" IS NULL;
CREATE UNIQUE INDEX "ServiceArea_city_wide" ON "ServiceArea"("profileId", "cityId") WHERE "areaId" IS NULL;
CREATE UNIQUE INDEX "DriverZone_governorate_wide" ON "DriverZone"("profileId", "governorateId") WHERE "cityId" IS NULL;
CREATE UNIQUE INDEX "NotificationDelivery_non_device" ON "NotificationDelivery"("notificationId", "channel") WHERE "deviceId" IS NULL;
CREATE UNIQUE INDEX "LedgerAccount_available" ON "LedgerAccount"("userId", "currency") WHERE "kind" = 'AVAILABLE';
CREATE UNIQUE INDEX "LedgerAccount_order_escrow" ON "LedgerAccount"("orderId", "currency") WHERE "kind" = 'ESCROW';
CREATE UNIQUE INDEX "LedgerAccount_platform" ON "LedgerAccount"("kind", "currency") WHERE "kind" IN ('COMMISSION', 'SIMULATOR_CLEARING');
CREATE UNIQUE INDEX "PaymentAttempt_successful_installment" ON "PaymentAttempt"("orderId", "installment") WHERE "status" = 'SUCCEEDED' AND "installment" != 'DELIVERY_ADJUSTMENT';
CREATE UNIQUE INDEX "PaymentAttempt_successful_adjustment" ON "PaymentAttempt"("orderId", "termsVersion") WHERE "status" = 'SUCCEEDED' AND "installment" = 'DELIVERY_ADJUSTMENT';
CREATE UNIQUE INDEX "DriverAssignment_one_active" ON "DriverAssignment"("deliveryId") WHERE "status" IN ('ASSIGNED', 'PICKED_UP');
CREATE UNIQUE INDEX "CaseRecord_one_financial_case" ON "CaseRecord"("orderId") WHERE "kind" != 'SUPPORT' AND "status" IN ('OPEN', 'ADMIN_REVIEW');

ALTER TABLE "User" ADD CONSTRAINT "User_normalized_email" CHECK ("email" = lower(btrim("email")) AND "email" LIKE '%_@_%._%' AND "locale" IN ('ar','en'));
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "Profile_experience" CHECK ("experienceYears" IS NULL OR "experienceYears" >= 0);
ALTER TABLE "CommissionRate" ADD CONSTRAINT "Commission_valid" CHECK ("basisPoints" BETWEEN 0 AND 10000 AND "version" > 0);
ALTER TABLE "LedgerAccount" ADD CONSTRAINT "Account_identity" CHECK (
  ("kind" = 'AVAILABLE' AND "userId" IS NOT NULL AND "orderId" IS NULL) OR
  ("kind" = 'ESCROW' AND "userId" IS NULL AND "orderId" IS NOT NULL) OR
  ("kind" IN ('COMMISSION','SIMULATOR_CLEARING') AND "userId" IS NULL AND "orderId" IS NULL));
ALTER TABLE "LedgerAccount" ADD CONSTRAINT "Account_nonnegative" CHECK ("kind" = 'SIMULATOR_CLEARING' OR "balanceUnits" >= 0);
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "Entry_one_positive_side" CHECK (("debitUnits" > 0 AND "creditUnits" = 0) OR ("creditUnits" > 0 AND "debitUnits" = 0));
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "Payment_valid" CHECK ("units" > 0 AND "units" <= 9000000000000 AND "simulated" AND
 (("status" = 'SUCCEEDED' AND "journalId" IS NOT NULL AND "failureCode" IS NULL) OR ("status" = 'FAILED' AND "journalId" IS NULL AND "failureCode" IS NOT NULL)) AND
 (("installment" = 'DELIVERY_ADJUSTMENT' AND "termsVersion" > 0) OR ("installment" != 'DELIVERY_ADJUSTMENT' AND "termsVersion" = 0)));
ALTER TABLE "Escrow" ADD CONSTRAINT "Escrow_nonnegative" CHECK ("heldUnits" >= 0 AND ("status" != 'SETTLED' OR "heldUnits" = 0));
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_positive" CHECK ("heldUnits" > 0 AND btrim("reason") != '');
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_nonnegative" CHECK ("units" >= 0);
ALTER TABLE "MarketOrder" ADD CONSTRAINT "Order_amounts" CHECK (
  "version" > 0 AND "deliveryVersion" >= 0 AND "deliveryFeeUnits" >= 0 AND
  ("commissionBpsSnapshot" IS NULL OR "commissionBpsSnapshot" BETWEEN 0 AND 10000) AND
  (("agreedTotalUnits" IS NULL AND "eligibleSellerUnits" IS NULL) OR
   ("agreedTotalUnits" BETWEEN 1 AND 9000000000000 AND "eligibleSellerUnits" > 0 AND "agreedTotalUnits" = "eligibleSellerUnits" + "deliveryFeeUnits")) AND
  ("workspace" = 'HOME_STORE' OR "deliveryFeeUnits" = 0) AND
  (("commissionBpsSnapshot" IS NULL) = ("commissionRateId" IS NULL)) AND
  ("reviewDeadlineAt" IS NULL OR ("deliveredAt" IS NOT NULL AND "reviewDeadlineAt" = "deliveredAt" + interval '72 hours')));
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "Service_installments" CHECK (
 (("depositUnits" IS NULL AND "balanceUnits" IS NULL) OR ("depositUnits" > 0 AND "balanceUnits" > 0)) AND
 ("balanceDeadlineAt" IS NULL OR ("readyAt" IS NOT NULL AND "readinessEvidence" IS NOT NULL AND "balanceDeadlineAt" = "readyAt" + interval '72 hours')));
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_price_duration" CHECK ("priceUnits" BETWEEN 2 AND 9000000000000 AND
 (("kind" = 'FREELANCE' AND "deliveryDays" > 0 AND "durationMinutes" IS NULL) OR
  ("kind" = 'PROFESSIONAL_PACKAGE' AND "durationMinutes" > 0 AND "durationMinutes" % 30 = 0 AND "deliveryDays" IS NULL)));
ALTER TABLE "Product" ADD CONSTRAINT "Product_stock_price" CHECK ("priceUnits" BETWEEN 1 AND 9000000000000 AND "stockOnHand" >= 0 AND "stockReserved" >= 0 AND "stockReserved" <= "stockOnHand");
ALTER TABLE "OrderItem" ADD CONSTRAINT "Item_positive" CHECK ("quantity" > 0 AND "unitPriceUnits" > 0);
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_valid" CHECK ("version" > 0 AND "totalUnits" BETWEEN 2 AND 9000000000000 AND "endsAt" > "startsAt" AND "dueAt" >= "endsAt");
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_positive" CHECK ("quantity" > 0 AND "unitPriceUnits" > 0);
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_positive" CHECK ("quantity" > 0);
ALTER TABLE "StockReconciliation" ADD CONSTRAINT "Return_nonnegative" CHECK ("reusableQuantity" >= 0 AND "nonRestockableQuantity" >= 0 AND btrim("reason") != '');
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_progress" CHECK ("progress" BETWEEN 0 AND 100);
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_times" CHECK ("requestedEndsAt" > "requestedStartsAt" AND ("proposedStartsAt" IS NULL) = ("proposedEndsAt" IS NULL) AND ("proposedEndsAt" IS NULL OR "proposedEndsAt" > "proposedStartsAt"));
ALTER TABLE "ScheduleReservation" ADD CONSTRAINT "Schedule_times" CHECK ("endsAt" > "startsAt" AND extract(minute FROM "startsAt") IN (0,30) AND extract(second FROM "startsAt") = 0 AND extract(minute FROM "endsAt") IN (0,30) AND extract(second FROM "endsAt") = 0);
ALTER TABLE "ScheduleReservation" ADD CONSTRAINT "Provider_no_overlap" EXCLUDE USING gist ("providerId" WITH =, tstzrange("startsAt", "endsAt", '[)') WITH &&) WHERE ("status" = 'RESERVED');
ALTER TABLE "FileAsset" ADD CONSTRAINT "File_limits" CHECK ("sizeBytes" > 0 AND
 (("mimeType" IN ('image/jpeg','image/png','image/webp') AND "extension" IN ('jpg','jpeg','png','webp') AND "sizeBytes" <= 10485760) OR
 ("mimeType" = 'application/pdf' AND "extension" = 'pdf' AND "sizeBytes" <= 20971520) OR
 ("mimeType" = 'application/zip' AND "extension" = 'zip' AND "accessClass" = 'FINAL_DELIVERABLE' AND "sizeBytes" <= 52428800)));
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "Portfolio_target" CHECK (("kind" = 'LINK' AND "url" IS NOT NULL AND "fileId" IS NULL) OR ("kind" != 'LINK' AND "url" IS NULL AND "fileId" IS NOT NULL));
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_evidence" CHECK ("version" > 0 AND ("fileId" IS NOT NULL OR "evidence" IS NOT NULL) AND ("kind" != 'DIGITAL_FINAL' OR "fileId" IS NOT NULL));
ALTER TABLE "DeliveryRate" ADD CONSTRAINT "DeliveryRate_valid" CHECK ("feeUnits" >= 0 AND "version" > 0);
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_valid" CHECK ("feeUnits" >= 0 AND "termsVersion" > 0);
ALTER TABLE "DeliveryTermsRevision" ADD CONSTRAINT "Terms_valid" CHECK ("feeUnits" >= 0 AND "version" > 1 AND ("appliedAt" IS NULL OR "buyerApprovedAt" IS NOT NULL));
ALTER TABLE "DeliveryEvent" ADD CONSTRAINT "Proof_required_if_verified" CHECK (NOT "verified" OR "proofId" IS NOT NULL);
ALTER TABLE "CaseParty" ADD CONSTRAINT "CaseParty_deadline" CHECK ("role" IN ('BUYER','SELLER') AND "evidenceDeadlineAt" = "notifiedAt" + interval '72 hours');
ALTER TABLE "CaseEvidence" ADD CONSTRAINT "Evidence_present" CHECK ("fileId" IS NOT NULL OR coalesce(length(btrim("text")),0) > 0);
ALTER TABLE "ResolutionProposal" ADD CONSTRAINT "Proposal_amounts" CHECK ("version" > 0 AND "sellerAwardUnits" >= 0 AND "sellerDeliveryUnits" >= 0 AND "driverAwardUnits" >= 0 AND ("kind" != 'REVISION' OR ("scope" IS NOT NULL AND "newDueAt" IS NOT NULL)));
ALTER TABLE "AdminDecision" ADD CONSTRAINT "Decision_amounts" CHECK ("sellerAwardUnits" >= 0 AND "sellerDeliveryUnits" >= 0 AND "driverAwardUnits" >= 0 AND "buyerRefundUnits" >= 0 AND "commissionUnits" >= 0 AND btrim("reason") != '' AND btrim("substantiation") != '' AND "outcome" IN ('COMPLETED','CANCELLED','REFUNDED'));
ALTER TABLE "ReviewVersion" ADD CONSTRAINT "Review_version_rating" CHECK ("stars" BETWEEN 1 AND 5 AND "version" IN (1,2));
ALTER TABLE "ModerationDecision" ADD CONSTRAINT "One_moderation_target" CHECK (num_nonnulls("profileId","listingId","storefrontId","productId","reviewId") = 1 AND btrim("reason") != '');
ALTER TABLE "IdempotencyRecord" ADD CONSTRAINT "Idempotency_status" CHECK ("httpStatus" BETWEEN 100 AND 599 AND length("key") BETWEEN 1 AND 128);

CREATE FUNCTION marketplace_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION '% is append-only', TG_TABLE_NAME USING ERRCODE = '23514'; END;
$$;

CREATE FUNCTION marketplace_account_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP = 'INSERT' AND NEW."balanceUnits" != 0 THEN
  RAISE EXCEPTION 'Accounts must start at zero; use a balanced journal' USING ERRCODE = '23514';
 END IF;
 IF TG_OP = 'UPDATE' THEN
  IF (NEW."kind", NEW."currency", NEW."userId", NEW."orderId") IS DISTINCT FROM (OLD."kind", OLD."currency", OLD."userId", OLD."orderId") THEN
   RAISE EXCEPTION 'Account economic identity is immutable' USING ERRCODE = '23514';
  END IF;
  IF NEW."balanceUnits" != OLD."balanceUnits" AND pg_trigger_depth() < 2 THEN
   RAISE EXCEPTION 'Balances may only change through ledger entries' USING ERRCODE = '23514';
  END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER "account_balance_guard" BEFORE INSERT OR UPDATE ON "LedgerAccount" FOR EACH ROW EXECUTE FUNCTION marketplace_account_guard();

CREATE FUNCTION marketplace_apply_entry() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE j "LedgerJournal";
BEGIN
 SELECT * INTO STRICT j FROM "LedgerJournal" WHERE "id" = NEW."journalId";
 IF j."creatingTxId" != txid_current() THEN
  RAISE EXCEPTION 'Cannot append to a journal from a previous transaction' USING ERRCODE = '23514';
 END IF;
 UPDATE "LedgerAccount" SET "balanceUnits" = "balanceUnits" + NEW."creditUnits" - NEW."debitUnits", "updatedAt" = transaction_timestamp() WHERE "id" = NEW."accountId";
 RETURN NEW;
END; $$;
CREATE TRIGGER "entry_apply_balance" AFTER INSERT ON "LedgerEntry" FOR EACH ROW EXECUTE FUNCTION marketplace_apply_entry();

CREATE FUNCTION marketplace_sync_escrow() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW."kind" = 'ESCROW' THEN
  UPDATE "Escrow" SET "heldUnits" = NEW."balanceUnits", "updatedAt" = transaction_timestamp() WHERE "accountId" = NEW."id";
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER "account_sync_escrow" AFTER UPDATE OF "balanceUnits" ON "LedgerAccount" FOR EACH ROW EXECUTE FUNCTION marketplace_sync_escrow();

CREATE FUNCTION marketplace_escrow_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP = 'INSERT' AND NEW."heldUnits" != 0 THEN
  RAISE EXCEPTION 'Escrow starts at zero' USING ERRCODE = '23514';
 END IF;
 IF TG_OP = 'UPDATE' AND NEW."heldUnits" != OLD."heldUnits" AND pg_trigger_depth() < 3 THEN
  RAISE EXCEPTION 'Escrow balance is maintained by ledger entries' USING ERRCODE = '23514';
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER "escrow_balance_guard" BEFORE INSERT OR UPDATE ON "Escrow" FOR EACH ROW EXECUTE FUNCTION marketplace_escrow_guard();

CREATE FUNCTION marketplace_check_journal() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE jid uuid; n bigint; d numeric; c numeric; j "LedgerJournal";
BEGIN
 IF TG_TABLE_NAME = 'LedgerJournal' THEN jid := NEW."id"; ELSE jid := NEW."journalId"; END IF;
 SELECT * INTO STRICT j FROM "LedgerJournal" WHERE "id" = jid;
 SELECT count(*), coalesce(sum("debitUnits"),0), coalesce(sum("creditUnits"),0) INTO n,d,c FROM "LedgerEntry" WHERE "journalId" = jid;
 IF n < 2 OR d <= 0 OR d != c OR j."creatingTxId" != txid_current() THEN
  RAISE EXCEPTION 'Journal must be balanced, nonempty and posted atomically' USING ERRCODE = '23514';
 END IF;
 IF EXISTS (SELECT 1 FROM "LedgerEntry" e JOIN "LedgerAccount" a ON a."id"=e."accountId" WHERE e."journalId"=jid AND (e."currency" != j."currency" OR a."currency" != j."currency")) THEN
  RAISE EXCEPTION 'Journal currency mismatch' USING ERRCODE = '23514';
 END IF;
 RETURN NULL;
END; $$;
CREATE CONSTRAINT TRIGGER "journal_balanced" AFTER INSERT ON "LedgerJournal" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION marketplace_check_journal();
CREATE CONSTRAINT TRIGGER "entry_journal_balanced" AFTER INSERT ON "LedgerEntry" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION marketplace_check_journal();

CREATE FUNCTION marketplace_check_relations() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE a "LedgerAccount"; o "MarketOrder"; s "ServiceOrder"; st "StoreOrder"; p "BusinessProfile"; qty bigint; total numeric;
BEGIN
 IF TG_TABLE_NAME = 'Address' OR TG_TABLE_NAME = 'ServiceArea' OR TG_TABLE_NAME = 'Delivery' THEN
  IF NEW."areaId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Area" WHERE "id"=NEW."areaId" AND "cityId"=NEW."cityId") THEN RAISE EXCEPTION 'Area is not in selected city' USING ERRCODE='23514'; END IF;
 END IF;
 IF TG_TABLE_NAME = 'DriverZone' THEN
  IF NEW."cityId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "City" WHERE "id"=NEW."cityId" AND "governorateId"=NEW."governorateId") THEN RAISE EXCEPTION 'City is not in selected governorate' USING ERRCODE='23514'; END IF;
  IF NOT EXISTS (SELECT 1 FROM "BusinessProfile" WHERE "id"=NEW."profileId" AND "type"='DELIVERY_DRIVER') THEN RAISE EXCEPTION 'Driver zone requires a driver profile' USING ERRCODE='23514'; END IF;
 END IF;
 IF TG_TABLE_NAME = 'Wallet' OR TG_TABLE_NAME = 'Escrow' THEN
  SELECT * INTO STRICT a FROM "LedgerAccount" WHERE "id"=NEW."accountId";
  IF a."currency" != NEW."currency" THEN RAISE EXCEPTION 'Wallet/escrow currency mismatch' USING ERRCODE='23514'; END IF;
  IF TG_TABLE_NAME = 'Wallet' THEN
   IF a."kind" != 'AVAILABLE' OR a."userId" != NEW."userId" THEN RAISE EXCEPTION 'Wallet account owner mismatch' USING ERRCODE='23514'; END IF;
  ELSE
   IF a."kind" != 'ESCROW' OR a."orderId" != NEW."orderId" OR a."balanceUnits" != (SELECT "heldUnits" FROM "Escrow" WHERE "id"=NEW."id") THEN RAISE EXCEPTION 'Escrow account mismatch' USING ERRCODE='23514'; END IF;
  END IF;
 END IF;
 IF TG_TABLE_NAME = 'Listing' THEN
  SELECT * INTO STRICT p FROM "BusinessProfile" WHERE "id"=NEW."profileId";
  IF (NEW."kind"='FREELANCE' AND p."type"!='FREELANCER') OR (NEW."kind"='PROFESSIONAL_PACKAGE' AND p."type"!='PROFESSIONAL') THEN RAISE EXCEPTION 'Wrong listing workspace owner' USING ERRCODE='23514'; END IF;
  IF NOT EXISTS (SELECT 1 FROM "Category" WHERE "id"=NEW."categoryId" AND "workspace"=(CASE WHEN NEW."kind"='FREELANCE' THEN 'FREELANCE' ELSE 'PROFESSIONALS' END)::"Workspace") THEN RAISE EXCEPTION 'Listing category workspace mismatch' USING ERRCODE='23514'; END IF;
 END IF;
 IF TG_TABLE_NAME = 'Storefront' THEN
  IF NOT EXISTS (SELECT 1 FROM "BusinessProfile" WHERE "id"=NEW."profileId" AND "type"='STORE_OWNER') THEN RAISE EXCEPTION 'Store requires store owner' USING ERRCODE='23514'; END IF;
 END IF;
 IF TG_TABLE_NAME = 'Product' THEN
  IF NOT EXISTS (SELECT 1 FROM "Category" WHERE "id"=NEW."categoryId" AND "workspace"='HOME_STORE') THEN RAISE EXCEPTION 'Product category workspace mismatch' USING ERRCODE='23514'; END IF;
 END IF;
 IF TG_TABLE_NAME = 'ServiceOrder' THEN
  SELECT * INTO STRICT o FROM "MarketOrder" WHERE "id"=NEW."orderId";
  IF o."workspace"='HOME_STORE' OR (NEW."kind"='FREELANCE') != (o."workspace"='FREELANCE') THEN RAISE EXCEPTION 'Service specialization mismatch' USING ERRCODE='23514'; END IF;
  SELECT * INTO STRICT s FROM "ServiceOrder" WHERE "id"=NEW."id";
  IF o."agreedTotalUnits" IS NOT NULL AND (s."depositUnits" IS NULL OR s."balanceUnits" IS NULL OR s."depositUnits" != floor((2*o."agreedTotalUnits"::numeric+3)/6) OR s."balanceUnits" != o."agreedTotalUnits"-s."depositUnits") THEN RAISE EXCEPTION 'Service split must be rounded one-third and remainder' USING ERRCODE='23514'; END IF;
  IF s."approvedQuoteId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Quote" WHERE "id"=s."approvedQuoteId" AND "serviceOrderId"=s."id" AND "state"='APPROVED' AND "currency"=o."currency" AND "totalUnits"=o."agreedTotalUnits") THEN RAISE EXCEPTION 'Approved quote mismatch' USING ERRCODE='23514'; END IF;
 END IF;
 IF TG_TABLE_NAME = 'OrderItem' THEN
  SELECT x.* INTO STRICT o FROM "StoreOrder" so JOIN "MarketOrder" x ON x."id"=so."orderId" WHERE so."id"=NEW."storeOrderId";
  IF NEW."currency" != o."currency" OR NOT EXISTS (SELECT 1 FROM "Product" x JOIN "StoreOrder" so ON so."id"=NEW."storeOrderId" WHERE x."id"=NEW."productId" AND x."storefrontId"=so."storefrontId" AND x."currency"=o."currency") THEN RAISE EXCEPTION 'Checkout must use one seller and currency' USING ERRCODE='23514'; END IF;
 END IF;
 IF TG_TABLE_NAME = 'StockReservation' OR TG_TABLE_NAME = 'Product' THEN
  IF TG_TABLE_NAME = 'Product' THEN
   SELECT coalesce(sum("quantity"),0) INTO qty FROM "StockReservation" WHERE "productId"=NEW."id" AND "status"='RESERVED';
   IF qty != (SELECT "stockReserved" FROM "Product" WHERE "id"=NEW."id") THEN RAISE EXCEPTION 'Stock reservation counter mismatch' USING ERRCODE='23514'; END IF;
  ELSE
   IF NOT EXISTS (SELECT 1 FROM "OrderItem" WHERE "id"=NEW."orderItemId" AND "productId"=NEW."productId" AND "quantity"=NEW."quantity") THEN RAISE EXCEPTION 'Stock reservation must match order item' USING ERRCODE='23514'; END IF;
   SELECT coalesce(sum("quantity"),0) INTO qty FROM "StockReservation" WHERE "productId"=NEW."productId" AND "status"='RESERVED';
   IF qty != (SELECT "stockReserved" FROM "Product" WHERE "id"=NEW."productId") THEN RAISE EXCEPTION 'Stock reservation counter mismatch' USING ERRCODE='23514'; END IF;
  END IF;
 END IF;
 IF TG_TABLE_NAME = 'StockReconciliation' THEN
  IF NEW."reusableQuantity"+NEW."nonRestockableQuantity" != (SELECT "quantity" FROM "StockReservation" WHERE "id"=NEW."reservationId") THEN RAISE EXCEPTION 'Return must reconcile every reserved unit once' USING ERRCODE='23514'; END IF;
 END IF;
 IF TG_TABLE_NAME = 'Category' THEN
 IF NEW."parentId" IS NOT NULL THEN
  IF NEW."parentId"=NEW."id" OR NOT EXISTS (SELECT 1 FROM "Category" WHERE "id"=NEW."parentId" AND "workspace"=NEW."workspace") THEN RAISE EXCEPTION 'Invalid category parent' USING ERRCODE='23514'; END IF;
  IF EXISTS (WITH RECURSIVE parents AS (SELECT "id","parentId" FROM "Category" WHERE "id"=NEW."parentId" UNION ALL SELECT c."id",c."parentId" FROM "Category" c JOIN parents p ON c."id"=p."parentId") SELECT 1 FROM parents WHERE "id"=NEW."id") THEN RAISE EXCEPTION 'Category hierarchy cycle' USING ERRCODE='23514'; END IF;
 END IF;
 END IF;
 RETURN NULL;
END; $$;

CREATE FUNCTION marketplace_check_order() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE o "MarketOrder"; p "BusinessProfile"; s "ServiceOrder"; item_total numeric;
BEGIN
 SELECT * INTO STRICT o FROM "MarketOrder" WHERE "id"=NEW."id";
 SELECT * INTO STRICT p FROM "BusinessProfile" WHERE "id"=o."sellerProfileId";
 IF o."buyerId"=p."userId" OR (o."workspace"='FREELANCE' AND p."type"!='FREELANCER') OR (o."workspace"='PROFESSIONALS' AND p."type"!='PROFESSIONAL') OR (o."workspace"='HOME_STORE' AND p."type"!='STORE_OWNER') THEN RAISE EXCEPTION 'Invalid order seller or self-order' USING ERRCODE='23514'; END IF;
 IF (o."workspace"='HOME_STORE') != EXISTS (SELECT 1 FROM "StoreOrder" WHERE "orderId"=o."id") OR (o."workspace"!='HOME_STORE') != EXISTS (SELECT 1 FROM "ServiceOrder" WHERE "orderId"=o."id") OR NOT EXISTS (SELECT 1 FROM "Escrow" WHERE "orderId"=o."id") THEN RAISE EXCEPTION 'Order requires exactly its workspace specialization and escrow' USING ERRCODE='23514'; END IF;
 IF o."workspace"='HOME_STORE' THEN
  IF NOT EXISTS (SELECT 1 FROM "StoreOrder" so JOIN "Storefront" st ON st."id"=so."storefrontId" JOIN "Delivery" d ON d."storeOrderId"=so."id" WHERE so."orderId"=o."id" AND st."profileId"=o."sellerProfileId" AND d."currency"=o."currency" AND d."feeUnits"=o."deliveryFeeUnits") THEN RAISE EXCEPTION 'Store ownership/delivery terms mismatch' USING ERRCODE='23514'; END IF;
  SELECT coalesce(sum(i."quantity"::numeric*i."unitPriceUnits"),0) INTO item_total FROM "OrderItem" i JOIN "StoreOrder" so ON so."id"=i."storeOrderId" WHERE so."orderId"=o."id";
  IF o."agreedTotalUnits" IS NOT NULL AND item_total != o."eligibleSellerUnits" THEN RAISE EXCEPTION 'Store item sum mismatch' USING ERRCODE='23514'; END IF;
 ELSE
  SELECT * INTO STRICT s FROM "ServiceOrder" WHERE "orderId"=o."id";
  IF o."agreedTotalUnits" IS NOT NULL AND (s."depositUnits" IS NULL OR s."depositUnits" != floor((2*o."agreedTotalUnits"::numeric+3)/6) OR s."balanceUnits" != o."agreedTotalUnits"-s."depositUnits") THEN RAISE EXCEPTION 'Invalid service installment split' USING ERRCODE='23514'; END IF;
 END IF;
 IF EXISTS (SELECT 1 FROM "PaymentAttempt" WHERE "orderId"=o."id" AND "status"='SUCCEEDED') AND o."commissionBpsSnapshot" IS NULL THEN RAISE EXCEPTION 'First hold must snapshot commission' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END; $$;
CREATE CONSTRAINT TRIGGER "order_integrity" AFTER INSERT OR UPDATE ON "MarketOrder" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION marketplace_check_order();

CREATE FUNCTION marketplace_order_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='UPDATE' AND (NEW."buyerId",NEW."sellerProfileId",NEW."workspace",NEW."currency") IS DISTINCT FROM (OLD."buyerId",OLD."sellerProfileId",OLD."workspace",OLD."currency") THEN RAISE EXCEPTION 'Order participant/workspace/currency identity is immutable' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND OLD."commissionBpsSnapshot" IS NOT NULL AND (NEW."commissionBpsSnapshot",NEW."commissionRateId") IS DISTINCT FROM (OLD."commissionBpsSnapshot",OLD."commissionRateId") THEN RAISE EXCEPTION 'Commission snapshot is immutable after first hold' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER "order_identity_snapshot" BEFORE UPDATE ON "MarketOrder" FOR EACH ROW EXECUTE FUNCTION marketplace_order_guard();

CREATE FUNCTION marketplace_quote_total() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE qid uuid; q "Quote"; total numeric;
BEGIN
 IF TG_TABLE_NAME='Quote' THEN qid:=NEW."id"; ELSIF TG_OP='DELETE' THEN qid:=OLD."quoteId"; ELSE qid:=NEW."quoteId"; END IF;
 SELECT * INTO STRICT q FROM "Quote" WHERE "id"=qid;
 SELECT coalesce(sum("quantity"::numeric*"unitPriceUnits"),0) INTO total FROM "QuoteItem" WHERE "quoteId"=qid;
 IF total != q."totalUnits" THEN RAISE EXCEPTION 'Itemized quote total mismatch' USING ERRCODE='23514'; END IF;
 IF NOT EXISTS (SELECT 1 FROM "ServiceOrder" s JOIN "MarketOrder" o ON o."id"=s."orderId" WHERE s."id"=q."serviceOrderId" AND s."kind"='INSPECTION_QUOTE' AND o."currency"=q."currency") THEN RAISE EXCEPTION 'Quote workspace/currency mismatch' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END; $$;
CREATE CONSTRAINT TRIGGER "quote_total" AFTER INSERT OR UPDATE ON "Quote" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION marketplace_quote_total();
CREATE CONSTRAINT TRIGGER "quote_item_total" AFTER INSERT OR UPDATE OR DELETE ON "QuoteItem" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION marketplace_quote_total();

CREATE FUNCTION marketplace_check_settlement() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE sid uuid; s "Settlement"; o "MarketOrder"; e "Escrow"; seller uuid; net numeric; comm numeric; delivery_s numeric; driver numeric; refund numeric; allocated numeric; src numeric;
BEGIN
 IF TG_TABLE_NAME='Allocation' THEN sid:=NEW."settlementId"; ELSE sid:=NEW."id"; END IF;
 SELECT * INTO STRICT s FROM "Settlement" WHERE "id"=sid;
 SELECT * INTO STRICT o FROM "MarketOrder" WHERE "id"=s."orderId" FOR UPDATE;
 SELECT * INTO STRICT e FROM "Escrow" WHERE "orderId"=o."id";
 SELECT "userId" INTO STRICT seller FROM "BusinessProfile" WHERE "id"=o."sellerProfileId";
 SELECT coalesce(sum("units") FILTER(WHERE "kind"='SELLER_NET'),0), coalesce(sum("units") FILTER(WHERE "kind"='COMMISSION'),0), coalesce(sum("units") FILTER(WHERE "kind"='SELLER_DELIVERY'),0), coalesce(sum("units") FILTER(WHERE "kind"='DRIVER_PAYOUT'),0), coalesce(sum("units") FILTER(WHERE "kind"='BUYER_REFUND'),0), coalesce(sum("units"),0) INTO net,comm,delivery_s,driver,refund,allocated FROM "Allocation" WHERE "settlementId"=s."id";
 SELECT coalesce(sum("debitUnits"-"creditUnits"),0) INTO src FROM "LedgerEntry" WHERE "journalId"=s."journalId" AND "accountId"=e."accountId";
 IF allocated != s."heldUnits" OR src != s."heldUnits" OR e."heldUnits" != 0 OR e."status"!='SETTLED' OR o."commissionBpsSnapshot" IS NULL OR net+comm > o."eligibleSellerUnits" OR delivery_s+driver > o."deliveryFeeUnits" OR comm != floor(((net+comm)*o."commissionBpsSnapshot"+5000)/10000) THEN RAISE EXCEPTION 'Settlement does not conserve held units or commission' USING ERRCODE='23514'; END IF;
 IF EXISTS (SELECT 1 FROM "CaseRecord" WHERE "orderId"=o."id" AND "kind"!='SUPPORT' AND "status" IN ('OPEN','ADMIN_REVIEW')) OR o."paused" THEN RAISE EXCEPTION 'Open case/paused order prevents settlement' USING ERRCODE='23514'; END IF;
 IF NOT EXISTS (SELECT 1 FROM "LedgerJournal" WHERE "id"=s."journalId" AND "kind"='SETTLEMENT' AND "orderId"=o."id" AND "currency"=o."currency" AND "creatingTxId"=txid_current()) THEN RAISE EXCEPTION 'Settlement journal mismatch or late allocation append' USING ERRCODE='23514'; END IF;
 IF EXISTS (SELECT 1 FROM "Allocation" x JOIN "LedgerAccount" a ON a."id"=x."recipientId" WHERE x."settlementId"=s."id" AND
  (x."currency"!=o."currency" OR (x."kind"='BUYER_REFUND' AND (a."kind"!='AVAILABLE' OR a."userId"!=o."buyerId")) OR
   (x."kind" IN ('SELLER_NET','SELLER_DELIVERY') AND (a."kind"!='AVAILABLE' OR a."userId"!=seller)) OR
   (x."kind"='COMMISSION' AND a."kind"!='COMMISSION') OR
   (x."kind"='DRIVER_PAYOUT' AND NOT EXISTS (SELECT 1 FROM "DriverAssignment" da JOIN "BusinessProfile" p ON p."id"=da."driverId" JOIN "Delivery" d ON d."id"=da."deliveryId" JOIN "StoreOrder" so ON so."id"=d."storeOrderId" WHERE so."orderId"=o."id" AND p."userId"=a."userId" AND a."kind"='AVAILABLE')))) THEN RAISE EXCEPTION 'Invalid settlement recipient' USING ERRCODE='23514'; END IF;
 -- Multiple allocations can legitimately credit one wallet (seller delivery or
 -- a buyer who is also the assigned driver); compare grouped recipients.
 IF EXISTS (SELECT 1 FROM "Allocation" x WHERE x."settlementId"=s."id" GROUP BY x."recipientId" HAVING sum(x."units") != coalesce((SELECT sum(le."creditUnits"-le."debitUnits") FROM "LedgerEntry" le WHERE le."journalId"=s."journalId" AND le."accountId"=x."recipientId"),0)) THEN RAISE EXCEPTION 'Settlement credits must match grouped allocations' USING ERRCODE='23514'; END IF;
 IF s."mode" IN ('AUTO_COMPLETION','BUYER_CONFIRMATION') THEN
  IF s."heldUnits"!=o."agreedTotalUnits" OR o."state"!='COMPLETED' OR (NOT o."deliveryVerified" AND o."buyerConfirmedAt" IS NULL) OR o."deliveredAt" IS NULL OR
     (s."mode"='AUTO_COMPLETION' AND (o."reviewDeadlineAt" IS NULL OR o."reviewDeadlineAt">transaction_timestamp())) OR
     (s."mode"='BUYER_CONFIRMATION' AND o."buyerConfirmedAt" IS NULL) THEN RAISE EXCEPTION 'Order not eligible for completion' USING ERRCODE='23514'; END IF;
 END IF;
 IF s."mode"='ADMIN_RESOLUTION' THEN
  IF s."decisionId" IS NULL OR NOT EXISTS (SELECT 1 FROM "AdminDecision" d JOIN "CaseRecord" c ON c."id"=d."caseId" WHERE d."id"=s."decisionId" AND c."orderId"=o."id" AND c."status"='RESOLVED' AND d."sellerAwardUnits"=net+comm AND d."sellerDeliveryUnits"=delivery_s AND d."driverAwardUnits"=driver AND d."buyerRefundUnits"=refund AND d."commissionUnits"=comm) THEN RAISE EXCEPTION 'Admin allocation mismatch' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NULL;
END; $$;
CREATE CONSTRAINT TRIGGER "settlement_conservation" AFTER INSERT ON "Settlement" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION marketplace_check_settlement();
CREATE CONSTRAINT TRIGGER "allocation_conservation" AFTER INSERT ON "Allocation" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION marketplace_check_settlement();

CREATE FUNCTION marketplace_driver_check() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW."status" IN ('ASSIGNED','PICKED_UP') AND NOT EXISTS (
 SELECT 1 FROM "BusinessProfile" p JOIN "DriverZone" z ON z."profileId"=p."id" JOIN "Delivery" d ON d."id"=NEW."deliveryId" JOIN "City" ci ON ci."id"=d."cityId" JOIN "StoreOrder" so ON so."id"=d."storeOrderId" JOIN "MarketOrder" o ON o."id"=so."orderId"
 WHERE p."id"=NEW."driverId" AND p."type"='DELIVERY_DRIVER' AND p."status"='ACTIVE' AND z."governorateId"=ci."governorateId" AND (z."cityId" IS NULL OR z."cityId"=ci."id") AND d."method"='PLATFORM_DRIVER' AND o."state" IN ('READY_FOR_DELIVERY','OUT_FOR_DELIVERY','DELIVERY_EXCEPTION')) THEN RAISE EXCEPTION 'Ineligible driver assignment' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END; $$;
CREATE CONSTRAINT TRIGGER "driver_eligibility" AFTER INSERT OR UPDATE ON "DriverAssignment" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION marketplace_driver_check();

CREATE FUNCTION marketplace_review_check() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE r "Review";
BEGIN
 IF TG_TABLE_NAME='Review' THEN SELECT * INTO STRICT r FROM "Review" WHERE "id"=NEW."id"; ELSE SELECT * INTO STRICT r FROM "Review" WHERE "id"=NEW."reviewId"; END IF;
 IF NOT EXISTS (SELECT 1 FROM "MarketOrder" WHERE "id"=r."orderId" AND "state"='COMPLETED' AND "buyerId"=r."buyerId" AND "sellerProfileId"=r."sellerProfileId") THEN RAISE EXCEPTION 'Only buyer of completed order may review' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='ReviewVersion' THEN
  IF NEW."actorId"!=r."buyerId" OR (NEW."version"=2 AND NEW."createdAt">r."createdAt"+interval '7 days') THEN RAISE EXCEPTION 'Review edit not permitted' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NULL;
END; $$;
CREATE CONSTRAINT TRIGGER "verified_review" AFTER INSERT ON "Review" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION marketplace_review_check();
CREATE CONSTRAINT TRIGGER "review_edit_window" AFTER INSERT ON "ReviewVersion" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION marketplace_review_check();

-- Application and migration credentials must be distinct in deployment. These
-- triggers also reject UPDATE/DELETE by ordinary table owners during application use.
REVOKE UPDATE, DELETE ON "LedgerJournal", "LedgerEntry", "PaymentAttempt", "Settlement", "Allocation", "AuditRecord", "OrderTransition", "ChatMessage", "CaseEvidence", "ReviewVersion", "AdminDecision", "DeliveryEvent", "CommissionRate" FROM PUBLIC;

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['LedgerJournal','LedgerEntry','PaymentAttempt','Settlement','Allocation','AuditRecord','OrderTransition','ChatMessage','MessageAttachment','CaseEvidence','ReviewVersion','AdminDecision','DeliveryEvent','CommissionRate','StockReconciliation','ProposalApproval','CaseParty'] LOOP
  EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION marketplace_immutable()', 'immutable_'||t, t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['Address','ServiceArea','DriverZone','Wallet','Escrow','Listing','Storefront','Product','ServiceOrder','OrderItem','StockReservation','StockReconciliation','Delivery','Category'] LOOP
  EXECUTE format('CREATE CONSTRAINT TRIGGER %I AFTER INSERT OR UPDATE ON %I DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION marketplace_check_relations()', 'relations_'||t, t);
 END LOOP;
END; $$;

CREATE FUNCTION marketplace_allocation_append_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM "Settlement" s JOIN "LedgerJournal" j ON j."id"=s."journalId" WHERE s."id"=NEW."settlementId" AND j."creatingTxId"=txid_current()) THEN RAISE EXCEPTION 'Allocations must be appended in settlement transaction' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER "allocation_append_once" BEFORE INSERT ON "Allocation" FOR EACH ROW EXECUTE FUNCTION marketplace_allocation_append_guard();

CREATE FUNCTION marketplace_payment_consistency() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE o "MarketOrder"; s "ServiceOrder"; e "Escrow"; j "LedgerJournal"; expected bigint; debited numeric; credited numeric;
BEGIN
 IF NEW."status"='FAILED' THEN RETURN NULL; END IF;
 SELECT * INTO STRICT o FROM "MarketOrder" WHERE "id"=NEW."orderId";
 SELECT * INTO STRICT e FROM "Escrow" WHERE "orderId"=o."id";
 SELECT * INTO STRICT j FROM "LedgerJournal" WHERE "id"=NEW."journalId";
 IF NEW."actorId"!=o."buyerId" OR NEW."currency"!=o."currency" OR j."orderId"!=o."id" OR j."actorId"!=o."buyerId" OR j."operationKey"!=NEW."operationKey" THEN RAISE EXCEPTION 'Payment participant/currency/reference mismatch' USING ERRCODE='23514'; END IF;
 IF NEW."installment" IN ('DEPOSIT','BALANCE') THEN
  SELECT * INTO STRICT s FROM "ServiceOrder" WHERE "orderId"=o."id";
  IF NEW."installment"='DEPOSIT' THEN expected:=s."depositUnits"; ELSE expected:=s."balanceUnits"; END IF;
  IF NEW."units" IS DISTINCT FROM expected OR (NEW."installment"='DEPOSIT' AND j."kind"!='DEPOSIT_HOLD') OR (NEW."installment"='BALANCE' AND j."kind"!='BALANCE_HOLD') THEN RAISE EXCEPTION 'Incorrect service installment' USING ERRCODE='23514'; END IF;
 ELSIF NEW."installment"='FULL' THEN
  IF o."workspace"!='HOME_STORE' OR NEW."units"!=o."agreedTotalUnits" OR j."kind"!='STORE_HOLD' THEN RAISE EXCEPTION 'Store requires full checkout hold' USING ERRCODE='23514'; END IF;
 ELSE
  IF o."workspace"!='HOME_STORE' OR j."kind"!='DELIVERY_ADJUSTMENT_HOLD' OR NOT EXISTS (SELECT 1 FROM "DeliveryTermsRevision" r JOIN "Delivery" d ON d."id"=r."deliveryId" JOIN "StoreOrder" so ON so."id"=d."storeOrderId" WHERE so."orderId"=o."id" AND r."version"=NEW."termsVersion" AND r."buyerApprovedAt" IS NOT NULL AND r."appliedAt" IS NOT NULL) THEN RAISE EXCEPTION 'Delivery adjustment requires prior buyer approval' USING ERRCODE='23514'; END IF;
 END IF;
 SELECT coalesce(sum(le."debitUnits"),0) INTO debited FROM "LedgerEntry" le JOIN "LedgerAccount" a ON a."id"=le."accountId" WHERE le."journalId"=j."id" AND a."kind"='AVAILABLE' AND a."userId"=o."buyerId";
 SELECT coalesce(sum("creditUnits"),0) INTO credited FROM "LedgerEntry" WHERE "journalId"=j."id" AND "accountId"=e."accountId";
 IF debited!=NEW."units" OR credited!=NEW."units" THEN RAISE EXCEPTION 'Hold ledger postings mismatch' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END; $$;
CREATE CONSTRAINT TRIGGER "payment_postings" AFTER INSERT ON "PaymentAttempt" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION marketplace_payment_consistency();

CREATE FUNCTION marketplace_case_permission() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE o "MarketOrder"; seller uuid;
BEGIN
 SELECT * INTO STRICT o FROM "MarketOrder" WHERE "id"=NEW."orderId" FOR UPDATE;
 SELECT "userId" INTO STRICT seller FROM "BusinessProfile" WHERE "id"=o."sellerProfileId";
 IF NEW."kind"!='SUPPORT' THEN
  IF EXISTS (SELECT 1 FROM "Settlement" WHERE "orderId"=o."id") THEN RAISE EXCEPTION 'Settled orders permit support cases only' USING ERRCODE='23514'; END IF;
  IF NOT EXISTS (SELECT 1 FROM "PaymentAttempt" WHERE "orderId"=o."id" AND "status"='SUCCEEDED') THEN RAISE EXCEPTION 'Financial case requires a hold' USING ERRCODE='23514'; END IF;
  IF NEW."openerId" IS NOT NULL AND NEW."openerId" NOT IN (o."buyerId",seller) THEN RAISE EXCEPTION 'Only buyer/provider may open a financial case' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW."handlingAdminId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "UserRole" ur JOIN "Role" r ON r."id"=ur."roleId" WHERE ur."userId"=NEW."handlingAdminId" AND ur."revokedAt" IS NULL AND r."code"='ADMIN') THEN RAISE EXCEPTION 'Invalid handling admin' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER "case_order_serialization" BEFORE INSERT OR UPDATE ON "CaseRecord" FOR EACH ROW EXECUTE FUNCTION marketplace_case_permission();

CREATE FUNCTION marketplace_admin_decision() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE c "CaseRecord"; parties bigint;
BEGIN
 SELECT * INTO STRICT c FROM "CaseRecord" WHERE "id"=NEW."caseId";
 IF c."handlingAdminId" IS DISTINCT FROM NEW."adminId" OR c."kind"='SUPPORT' OR c."status"!='RESOLVED' THEN RAISE EXCEPTION 'Financial decision requires assigned admin and resolved financial case' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO parties FROM "CaseParty" WHERE "caseId"=c."id";
 IF parties!=2 OR EXISTS (SELECT 1 FROM "CaseParty" WHERE "caseId"=c."id" AND "evidenceDeadlineAt">transaction_timestamp()) THEN RAISE EXCEPTION 'Both parties must receive 72 hours to submit evidence' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END; $$;
CREATE CONSTRAINT TRIGGER "admin_evidence_window" AFTER INSERT ON "AdminDecision" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION marketplace_admin_decision();

CREATE FUNCTION marketplace_child_limits() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
 IF TG_TABLE_NAME='MessageAttachment' THEN SELECT count(*) INTO n FROM "MessageAttachment" WHERE "messageId"=NEW."messageId"; IF n>10 THEN RAISE EXCEPTION 'At most 10 attachments' USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='ProductAsset' THEN SELECT count(*) INTO n FROM "ProductAsset" WHERE "productId"=NEW."productId"; IF n>10 THEN RAISE EXCEPTION 'At most 10 product images' USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='PortfolioItem' THEN SELECT count(*) INTO n FROM "PortfolioItem" WHERE "profileId"=NEW."profileId"; IF n>20 THEN RAISE EXCEPTION 'At most 20 portfolio entries' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NULL;
END; $$;
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['MessageAttachment','ProductAsset','PortfolioItem'] LOOP
 EXECUTE format('CREATE CONSTRAINT TRIGGER %I AFTER INSERT OR UPDATE ON %I DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION marketplace_child_limits()', 'limits_'||t, t);
END LOOP; END; $$;

CREATE FUNCTION marketplace_profile_switch_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 PERFORM 1 FROM "User" WHERE "id"=NEW."userId" FOR UPDATE;
 IF TG_OP='UPDATE' THEN
  IF (NEW."userId",NEW."type") IS DISTINCT FROM (OLD."userId",OLD."type") THEN RAISE EXCEPTION 'Archive/create another profile instead of changing its identity' USING ERRCODE='23514'; END IF;
 END IF;
 IF (TG_OP='INSERT' AND NEW."status"='ACTIVE') OR (TG_OP='UPDATE' AND NEW."status" IS DISTINCT FROM OLD."status" AND NEW."status" IN ('ACTIVE','ARCHIVED')) THEN
  IF EXISTS (SELECT 1 FROM "MarketOrder" o JOIN "BusinessProfile" p ON p."id"=o."sellerProfileId" WHERE (o."buyerId"=NEW."userId" OR p."userId"=NEW."userId") AND o."state" NOT IN ('DRAFT','COMPLETED','CANCELLED','REJECTED','EXPIRED','REFUNDED')) OR
     EXISTS (SELECT 1 FROM "CaseRecord" c JOIN "MarketOrder" o ON o."id"=c."orderId" JOIN "BusinessProfile" p ON p."id"=o."sellerProfileId" WHERE (o."buyerId"=NEW."userId" OR p."userId"=NEW."userId") AND c."kind"!='SUPPORT' AND c."status" IN ('OPEN','ADMIN_REVIEW')) OR
     EXISTS (SELECT 1 FROM "Escrow" e JOIN "MarketOrder" o ON o."id"=e."orderId" JOIN "BusinessProfile" p ON p."id"=o."sellerProfileId" WHERE (o."buyerId"=NEW."userId" OR p."userId"=NEW."userId") AND e."heldUnits">0) OR
     EXISTS (SELECT 1 FROM "DriverAssignment" da JOIN "BusinessProfile" p ON p."id"=da."driverId" JOIN "Delivery" d ON d."id"=da."deliveryId" JOIN "StoreOrder" so ON so."id"=d."storeOrderId" LEFT JOIN "Settlement" st ON st."orderId"=so."orderId" WHERE p."userId"=NEW."userId" AND (da."status" IN ('ASSIGNED','PICKED_UP') OR (da."status"='COMPLETED' AND st."id" IS NULL))) THEN RAISE EXCEPTION 'Workspace switch blocked by active commitment' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER "profile_switch_eligibility" BEFORE INSERT OR UPDATE ON "BusinessProfile" FOR EACH ROW EXECUTE FUNCTION marketplace_profile_switch_guard();

CREATE FUNCTION marketplace_order_participant_lock() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE seller uuid;
BEGIN
 SELECT "userId" INTO STRICT seller FROM "BusinessProfile" WHERE "id"=NEW."sellerProfileId";
 PERFORM 1 FROM "User" WHERE "id" IN (NEW."buyerId",seller) ORDER BY "id" FOR UPDATE;
 IF NOT EXISTS (SELECT 1 FROM "BusinessProfile" WHERE "id"=NEW."sellerProfileId" AND "status"='ACTIVE') THEN RAISE EXCEPTION 'Seller workspace is inactive' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER "new_order_participant_locks" BEFORE INSERT ON "MarketOrder" FOR EACH ROW EXECUTE FUNCTION marketplace_order_participant_lock();

CREATE FUNCTION marketplace_assignment_participant_lock() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE driver_user uuid;
BEGIN
 SELECT "userId" INTO STRICT driver_user FROM "BusinessProfile" WHERE "id"=NEW."driverId";
 PERFORM 1 FROM "User" WHERE "id"=driver_user FOR UPDATE;
 RETURN NEW;
END; $$;
CREATE TRIGGER "assignment_participant_lock" BEFORE INSERT ON "DriverAssignment" FOR EACH ROW EXECUTE FUNCTION marketplace_assignment_participant_lock();
