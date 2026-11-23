-- Preserve original readiness; an approved resumption has a separate actual anchor and case reference.
ALTER TABLE "ServiceOrder" ADD COLUMN "balanceResumedAt" timestamptz(3), ADD COLUMN "balanceResumptionCaseId" uuid;
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_balanceResumptionCaseId_fkey" FOREIGN KEY ("balanceResumptionCaseId") REFERENCES "CaseRecord"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
CREATE INDEX "ServiceOrder_balanceResumptionCaseId_idx" ON "ServiceOrder"("balanceResumptionCaseId");
ALTER TABLE "ServiceOrder" DROP CONSTRAINT "Service_installments";
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "Service_installments" CHECK (
 (("depositUnits" IS NULL AND "balanceUnits" IS NULL) OR ("depositUnits">0 AND "balanceUnits">0)) AND
 (("balanceResumedAt" IS NULL)=("balanceResumptionCaseId" IS NULL)) AND
 ("balanceDeadlineAt" IS NULL OR ("readyAt" IS NOT NULL AND "readinessEvidence" IS NOT NULL AND
  (("balanceResumedAt" IS NULL AND "balanceDeadlineAt"="readyAt"+interval '72 hours') OR
   ("balanceResumedAt" IS NOT NULL AND "balanceDeadlineAt">"balanceResumedAt" AND "balanceDeadlineAt"<="balanceResumedAt"+interval '72 hours')))));
CREATE FUNCTION marketplace_payment_resumption() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE c "CaseRecord"; p "ResolutionProposal"; o "MarketOrder"; seller uuid; n bigint;
BEGIN
 IF NEW."balanceResumedAt" IS NULL THEN RETURN NULL; END IF;
 IF TG_OP='UPDATE' AND (NEW."balanceResumedAt",NEW."balanceResumptionCaseId",NEW."balanceDeadlineAt") IS NOT DISTINCT FROM (OLD."balanceResumedAt",OLD."balanceResumptionCaseId",OLD."balanceDeadlineAt") THEN RETURN NULL; END IF;
 SELECT * INTO STRICT c FROM "CaseRecord" WHERE "id"=NEW."balanceResumptionCaseId";
 SELECT * INTO STRICT o FROM "MarketOrder" WHERE "id"=NEW."orderId";
 SELECT "userId" INTO STRICT seller FROM "BusinessProfile" WHERE "id"=o."sellerProfileId";
 SELECT * INTO p FROM "ResolutionProposal" WHERE "caseId"=c."id" ORDER BY "version" DESC LIMIT 1;
 SELECT count(*) INTO n FROM "ProposalApproval" WHERE "proposalId"=p."id" AND "decision"='ACCEPT' AND "userId" IN (o."buyerId",seller) AND "createdAt"<=p."agreementDeadlineAt";
 IF c."orderId"!=o."id" OR c."kind"!='FINAL_PAYMENT_OVERDUE' OR c."status"!='RESOLVED' OR c."handlingAdminId" IS NULL OR
 p."id" IS NULL OR p."kind"!='EXTENSION' OR p."newDueAt" IS DISTINCT FROM NEW."balanceDeadlineAt" OR n!=2 OR p."agreementDeadlineAt"<NEW."balanceResumedAt" OR
 NOT EXISTS (SELECT 1 FROM "UserRole" u JOIN "Role" r ON r."id"=u."roleId" WHERE u."userId"=c."handlingAdminId" AND u."revokedAt" IS NULL AND r."code"='ADMIN') THEN
 RAISE EXCEPTION 'Payment resumption requires assigned admin and exact mutual recorded plan' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END; $$;
CREATE CONSTRAINT TRIGGER "authorized_payment_resumption" AFTER INSERT OR UPDATE ON "ServiceOrder" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION marketplace_payment_resumption();
-- No configured commission means the explicit backend default of zero, with no invented rate owner.
ALTER TABLE "MarketOrder" DROP CONSTRAINT "Order_amounts";
ALTER TABLE "MarketOrder" ADD CONSTRAINT "Order_amounts" CHECK (
 "version">0 AND "deliveryVersion">=0 AND "deliveryFeeUnits">=0 AND
 ("commissionBpsSnapshot" IS NULL OR "commissionBpsSnapshot" BETWEEN 0 AND 10000) AND
 (("agreedTotalUnits" IS NULL AND "eligibleSellerUnits" IS NULL) OR ("agreedTotalUnits" BETWEEN 1 AND 9000000000000 AND "eligibleSellerUnits">0 AND "agreedTotalUnits"="eligibleSellerUnits"+"deliveryFeeUnits")) AND
 ("workspace"='HOME_STORE' OR "deliveryFeeUnits"=0) AND
 (("commissionBpsSnapshot" IS NULL AND "commissionRateId" IS NULL) OR ("commissionBpsSnapshot"=0 AND "commissionRateId" IS NULL) OR ("commissionBpsSnapshot" IS NOT NULL AND "commissionRateId" IS NOT NULL)) AND
 ("reviewDeadlineAt" IS NULL OR ("deliveredAt" IS NOT NULL AND "reviewDeadlineAt"="deliveredAt"+interval '72 hours')));
