ALTER TABLE "ResolutionProposal" ADD COLUMN "inventoryReturns" jsonb;
CREATE TRIGGER "immutable_ResolutionProposal" BEFORE UPDATE OR DELETE ON "ResolutionProposal"
FOR EACH ROW EXECUTE FUNCTION marketplace_immutable();
CREATE FUNCTION marketplace_settlement_policy() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE p "ResolutionProposal"; c "CaseRecord"; o "MarketOrder"; seller uuid; n bigint;
BEGIN
 SELECT * INTO STRICT o FROM "MarketOrder" WHERE "id"=NEW."orderId";
 IF NEW."mode" IN ('PROVIDER_CANCEL','PRESTART_CANCEL','STORE_DECLINE','STORE_TIMEOUT','UNFULFILLABLE') AND EXISTS
 (SELECT 1 FROM "Allocation" WHERE "settlementId"=NEW."id" AND "kind"!='BUYER_REFUND') THEN
 RAISE EXCEPTION 'Uncontested refund returns every held unit to buyer' USING ERRCODE='23514'; END IF;
 IF NEW."mode"='MUTUAL_CANCELLATION' THEN
  SELECT * INTO STRICT p FROM "ResolutionProposal" WHERE "id"=NEW."proposalId";
  SELECT * INTO STRICT c FROM "CaseRecord" WHERE "id"=p."caseId";
  SELECT "userId" INTO STRICT seller FROM "BusinessProfile" WHERE "id"=o."sellerProfileId";
  SELECT count(*) INTO n FROM "ProposalApproval" WHERE "proposalId"=p."id" AND "userId" IN (o."buyerId",seller) AND "decision"='ACCEPT' AND "createdAt"<=p."agreementDeadlineAt";
  IF n!=2 OR p."kind"!='CANCELLATION_SPLIT' OR c."orderId"!=o."id" OR c."status"!='RESOLVED' OR transaction_timestamp()>p."agreementDeadlineAt" OR
    p."sellerAwardUnits"!=(SELECT coalesce(sum("units"),0) FROM "Allocation" WHERE "settlementId"=NEW."id" AND "kind" IN ('SELLER_NET','COMMISSION')) OR
    p."sellerDeliveryUnits"!=(SELECT coalesce(sum("units"),0) FROM "Allocation" WHERE "settlementId"=NEW."id" AND "kind"='SELLER_DELIVERY') OR
    p."driverAwardUnits"!=(SELECT coalesce(sum("units"),0) FROM "Allocation" WHERE "settlementId"=NEW."id" AND "kind"='DRIVER_PAYOUT') THEN
    RAISE EXCEPTION 'Mutual settlement requires exact immutable two-party approval' USING ERRCODE='23514'; END IF;
 END IF;
 IF o."workspace"='HOME_STORE' AND o."state" IN ('CANCELLED','REFUNDED') AND EXISTS
 (SELECT 1 FROM "StockReservation" r JOIN "OrderItem" i ON i."id"=r."orderItemId" JOIN "StoreOrder" so ON so."id"=i."storeOrderId" WHERE so."orderId"=o."id" AND r."status"!='RELEASED') THEN
 RAISE EXCEPTION 'Cancelled store stock must be reconciled or released' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END; $$;
CREATE CONSTRAINT TRIGGER "settlement_policy" AFTER INSERT ON "Settlement" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION marketplace_settlement_policy();
