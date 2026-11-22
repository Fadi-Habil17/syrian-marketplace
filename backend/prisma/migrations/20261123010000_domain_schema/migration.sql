-- CreateEnum
CREATE TYPE "RoleCode" AS ENUM ('CUSTOMER', 'FREELANCER', 'PROFESSIONAL', 'STORE_OWNER', 'DELIVERY_DRIVER', 'ADMIN');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('FREELANCER', 'PROFESSIONAL', 'STORE_OWNER', 'DELIVERY_DRIVER');

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "Workspace" AS ENUM ('FREELANCE', 'PROFESSIONALS', 'HOME_STORE');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('SYP', 'USD');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'INACTIVE', 'HIDDEN');

-- CreateEnum
CREATE TYPE "ListingKind" AS ENUM ('FREELANCE', 'PROFESSIONAL_PACKAGE');

-- CreateEnum
CREATE TYPE "OrderState" AS ENUM ('DRAFT', 'AWAITING_AGREEMENT', 'BOOKING_REQUESTED', 'SCHEDULE_PROPOSED', 'PENDING_QUOTE', 'QUOTE_SENT', 'APPROVED', 'AWAITING_DEPOSIT', 'DEPOSIT_HELD', 'IN_PROGRESS', 'EN_ROUTE', 'ON_SITE', 'READY_FOR_FINAL_PAYMENT', 'FINAL_PAYMENT_OVERDUE', 'FULLY_FUNDED', 'PAID_IN_ESCROW', 'PREPARING', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_EXCEPTION', 'DELIVERY_REVIEW_REQUIRED', 'CANCELLATION_PENDING', 'EXTENSION_PENDING', 'DISPUTED', 'REVISION_IN_PROGRESS', 'RESOLVED', 'COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ServiceKind" AS ENUM ('FREELANCE', 'FIXED_BOOKING', 'INSPECTION_QUOTE');

-- CreateEnum
CREATE TYPE "BookingState" AS ENUM ('REQUESTED', 'COUNTER_PROPOSED', 'CONFIRMED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "QuoteState" AS ENUM ('DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('RESERVED', 'CONSUMED', 'RELEASED');

-- CreateEnum
CREATE TYPE "FileAccessClass" AS ENUM ('PUBLIC_CATALOG', 'ORDER_SHARED', 'FINAL_DELIVERABLE', 'DELIVERY_ONLY', 'CASE_EVIDENCE');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('QUARANTINED', 'CLEAN', 'REJECTED', 'DELETED');

-- CreateEnum
CREATE TYPE "PortfolioKind" AS ENUM ('IMAGE', 'FILE', 'LINK');

-- CreateEnum
CREATE TYPE "SubmissionKind" AS ENUM ('READINESS', 'DIGITAL_FINAL', 'ONSITE_HANDOVER');

-- CreateEnum
CREATE TYPE "AccountKind" AS ENUM ('AVAILABLE', 'ESCROW', 'COMMISSION', 'SIMULATOR_CLEARING');

-- CreateEnum
CREATE TYPE "JournalKind" AS ENUM ('SIMULATED_TOPUP', 'DEPOSIT_HOLD', 'BALANCE_HOLD', 'STORE_HOLD', 'DELIVERY_ADJUSTMENT_HOLD', 'DELIVERY_ADJUSTMENT_REFUND', 'SETTLEMENT');

-- CreateEnum
CREATE TYPE "Installment" AS ENUM ('DEPOSIT', 'BALANCE', 'FULL', 'DELIVERY_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('OPEN', 'FROZEN', 'SETTLED');

-- CreateEnum
CREATE TYPE "AllocationKind" AS ENUM ('BUYER_REFUND', 'SELLER_NET', 'SELLER_DELIVERY', 'DRIVER_PAYOUT', 'COMMISSION');

-- CreateEnum
CREATE TYPE "SettlementMode" AS ENUM ('BUYER_CONFIRMATION', 'AUTO_COMPLETION', 'ADMIN_RESOLUTION', 'MUTUAL_CANCELLATION', 'PROVIDER_CANCEL', 'PRESTART_CANCEL', 'STORE_DECLINE', 'STORE_TIMEOUT', 'UNFULFILLABLE');

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('SELLER', 'PLATFORM_DRIVER');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'REQUESTED', 'ASSIGNED', 'PICKED_UP', 'DROPPED_OFF', 'EXCEPTION', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ASSIGNED', 'PICKED_UP', 'COMPLETED', 'RELEASED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliveryEventType" AS ENUM ('REQUESTED', 'ASSIGNED', 'RELEASED', 'PICKUP', 'DROPOFF', 'EXCEPTION', 'REASSIGNED');

-- CreateEnum
CREATE TYPE "CaseKind" AS ENUM ('DISPUTE', 'CANCELLATION', 'FINAL_PAYMENT_OVERDUE', 'DELIVERY_REVIEW', 'SUPPORT');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('OPEN', 'ADMIN_REVIEW', 'REVISION_ACCEPTED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "EvidenceVisibility" AS ENUM ('SHARED', 'PRIVATE_ADMIN');

-- CreateEnum
CREATE TYPE "ProposalKind" AS ENUM ('CANCELLATION_SPLIT', 'REVISION', 'EXTENSION', 'DELIVERY_REMEDY');

-- CreateEnum
CREATE TYPE "ApprovalDecision" AS ENUM ('ACCEPT', 'REJECT');

-- CreateEnum
CREATE TYPE "RoomKind" AS ENUM ('ORDER_SHARED', 'DELIVERY');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'PUSH', 'WEBSOCKET');

-- CreateEnum
CREATE TYPE "DeliveryAttemptStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'DISABLED');

-- CreateEnum
CREATE TYPE "DevicePlatform" AS ENUM ('IOS', 'ANDROID');

-- CreateEnum
CREATE TYPE "RestrictionKind" AS ENUM ('SUSPENSION', 'PURCHASING', 'PUBLISHING', 'MESSAGING');

-- CreateEnum
CREATE TYPE "VerificationKind" AS ENUM ('EMAIL', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "ModerationOutcome" AS ENUM ('APPROVE', 'HIDE', 'REJECT', 'RESTORE');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('READY', 'RUNNING', 'DONE', 'FAILED');

-- CreateEnum
CREATE TYPE "JobKind" AS ENUM ('RESPONSE_EXPIRY', 'DEPOSIT_EXPIRY', 'BALANCE_REMINDER_24', 'BALANCE_REMINDER_48', 'BALANCE_EXPIRY', 'STORE_ACCEPTANCE_EXPIRY', 'CANCELLATION_EXPIRY', 'EVIDENCE_EXPIRY', 'DELIVERY_REVIEW', 'DISPATCH_ESCALATION');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(254) NOT NULL,
    "passwordHash" VARCHAR(100) NOT NULL,
    "displayName" VARCHAR(120) NOT NULL,
    "locale" VARCHAR(2) NOT NULL DEFAULT 'ar',
    "verifiedAt" TIMESTAMPTZ(3),
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" "RoleCode" NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "revokedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "refreshHash" VARCHAR(128) NOT NULL,
    "familyId" UUID NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),
    "replacedById" UUID,
    "client" VARCHAR(16) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kind" "VerificationKind" NOT NULL,
    "tokenHash" VARCHAR(128) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "consumedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Restriction" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kind" "RestrictionKind" NOT NULL,
    "reason" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3),
    "revokedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "userId" UUID NOT NULL,
    "adminId" UUID NOT NULL,

    CONSTRAINT "Restriction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(2) NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Governorate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "isoCode" VARCHAR(5) NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "countryId" UUID NOT NULL,

    CONSTRAINT "Governorate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "isDistrict" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "governorateId" UUID NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Area" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "cityId" UUID NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "label" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "userId" UUID NOT NULL,
    "cityId" UUID NOT NULL,
    "areaId" UUID,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessProfile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "BusinessType" NOT NULL,
    "status" "ProfileStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "trade" TEXT,
    "experienceYears" INTEGER,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "userId" UUID NOT NULL,
    "cityId" UUID,

    CONSTRAINT "BusinessProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileSkill" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "profileId" UUID NOT NULL,

    CONSTRAINT "ProfileSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileLanguage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "languageCode" VARCHAR(10) NOT NULL,
    "proficiency" VARCHAR(40) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "profileId" UUID NOT NULL,

    CONSTRAINT "ProfileLanguage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceArea" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "profileId" UUID NOT NULL,
    "cityId" UUID NOT NULL,
    "areaId" UUID,

    CONSTRAINT "ServiceArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverZone" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "profileId" UUID NOT NULL,
    "governorateId" UUID NOT NULL,
    "cityId" UUID,

    CONSTRAINT "DriverZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAsset" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "storageKey" TEXT NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "extension" VARCHAR(12) NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "sha256" VARCHAR(64),
    "accessClass" "FileAccessClass" NOT NULL,
    "scanStatus" "ScanStatus" NOT NULL DEFAULT 'QUARANTINED',
    "deletedAt" TIMESTAMPTZ(3),
    "retainUntil" TIMESTAMPTZ(3),
    "legalHold" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "ownerId" UUID NOT NULL,
    "orderId" UUID,
    "caseId" UUID,

    CONSTRAINT "FileAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kind" "PortfolioKind" NOT NULL,
    "title" TEXT NOT NULL,
    "caption" TEXT,
    "url" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "profileId" UUID NOT NULL,
    "fileId" UUID,

    CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace" "Workspace" NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "parentId" UUID,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kind" "ListingKind" NOT NULL,
    "titleAr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "currency" "Currency" NOT NULL,
    "priceUnits" BIGINT NOT NULL,
    "deliveryDays" INTEGER,
    "durationMinutes" INTEGER,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "profileId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingAsset" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "listingId" UUID NOT NULL,
    "fileId" UUID NOT NULL,

    CONSTRAINT "ListingAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Storefront" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "supportsSellerDelivery" BOOLEAN NOT NULL DEFAULT true,
    "supportsPlatformDelivery" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "profileId" UUID NOT NULL,
    "cityId" UUID NOT NULL,
    "logoId" UUID,

    CONSTRAINT "Storefront_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "titleAr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "currency" "Currency" NOT NULL,
    "priceUnits" BIGINT NOT NULL,
    "stockOnHand" INTEGER NOT NULL DEFAULT 0,
    "stockReserved" INTEGER NOT NULL DEFAULT 0,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "storefrontId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAsset" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "productId" UUID NOT NULL,
    "fileId" UUID NOT NULL,

    CONSTRAINT "ProductAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationDecision" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "outcome" "ModerationOutcome" NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "adminId" UUID NOT NULL,
    "profileId" UUID,
    "listingId" UUID,
    "storefrontId" UUID,
    "productId" UUID,
    "reviewId" UUID,

    CONSTRAINT "ModerationDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionRate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace" "Workspace",
    "basisPoints" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL,
    "effectiveAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "adminId" UUID NOT NULL,

    CONSTRAINT "CommissionRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketOrder" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace" "Workspace" NOT NULL,
    "state" "OrderState" NOT NULL DEFAULT 'DRAFT',
    "currency" "Currency" NOT NULL,
    "agreedTotalUnits" BIGINT,
    "eligibleSellerUnits" BIGINT,
    "deliveryFeeUnits" BIGINT NOT NULL DEFAULT 0,
    "commissionBpsSnapshot" INTEGER,
    "agreementSnapshot" JSONB NOT NULL,
    "addressSnapshot" JSONB,
    "termsAcceptedAt" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "deliveredAt" TIMESTAMPTZ(3),
    "reviewDeadlineAt" TIMESTAMPTZ(3),
    "deliveryVersion" INTEGER NOT NULL DEFAULT 0,
    "deliveryVerified" BOOLEAN NOT NULL DEFAULT false,
    "buyerConfirmedAt" TIMESTAMPTZ(3),
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "workStartedAt" TIMESTAMPTZ(3),
    "completedAt" TIMESTAMPTZ(3),
    "checkoutExpiresAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "buyerId" UUID NOT NULL,
    "sellerProfileId" UUID NOT NULL,
    "commissionRateId" UUID,

    CONSTRAINT "MarketOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceOrder" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kind" "ServiceKind" NOT NULL,
    "depositUnits" BIGINT,
    "balanceUnits" BIGINT,
    "responseDeadlineAt" TIMESTAMPTZ(3),
    "depositDeadlineAt" TIMESTAMPTZ(3),
    "dueAt" TIMESTAMPTZ(3),
    "readyAt" TIMESTAMPTZ(3),
    "readinessEvidence" JSONB,
    "balanceDeadlineAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "orderId" UUID NOT NULL,
    "listingId" UUID,
    "approvedQuoteId" UUID,

    CONSTRAINT "ServiceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "state" "BookingState" NOT NULL DEFAULT 'REQUESTED',
    "requestedStartsAt" TIMESTAMPTZ(3) NOT NULL,
    "requestedEndsAt" TIMESTAMPTZ(3) NOT NULL,
    "proposedStartsAt" TIMESTAMPTZ(3),
    "proposedEndsAt" TIMESTAMPTZ(3),
    "providerAcceptedAt" TIMESTAMPTZ(3),
    "buyerAcceptedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "serviceOrderId" UUID NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionRequest" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "description" TEXT NOT NULL,
    "agreedAt" TIMESTAMPTZ(3),
    "startsAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "serviceOrderId" UUID NOT NULL,
    "addressId" UUID NOT NULL,

    CONSTRAINT "InspectionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionPhoto" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "inspectionId" UUID NOT NULL,
    "fileId" UUID NOT NULL,

    CONSTRAINT "InspectionPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "version" INTEGER NOT NULL,
    "state" "QuoteState" NOT NULL DEFAULT 'DRAFT',
    "currency" "Currency" NOT NULL,
    "totalUnits" BIGINT NOT NULL,
    "scope" TEXT NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "dueAt" TIMESTAMPTZ(3) NOT NULL,
    "sentAt" TIMESTAMPTZ(3),
    "responseDeadlineAt" TIMESTAMPTZ(3),
    "approvedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "serviceOrderId" UUID NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceUnits" BIGINT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "quoteId" UUID NOT NULL,

    CONSTRAINT "QuoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleReservation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'RESERVED',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "serviceOrderId" UUID NOT NULL,
    "providerId" UUID NOT NULL,

    CONSTRAINT "ScheduleReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "description" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "serviceOrderId" UUID NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kind" "SubmissionKind" NOT NULL,
    "version" INTEGER NOT NULL,
    "evidence" JSONB,
    "submittedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "serviceOrderId" UUID NOT NULL,
    "fileId" UUID,
    "actorId" UUID NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreOrder" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sellerAcceptanceDeadlineAt" TIMESTAMPTZ(3),
    "acceptedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "orderId" UUID NOT NULL,
    "storefrontId" UUID NOT NULL,

    CONSTRAINT "StoreOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "quantity" INTEGER NOT NULL,
    "unitPriceUnits" BIGINT NOT NULL,
    "currency" "Currency" NOT NULL,
    "productSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "storeOrderId" UUID NOT NULL,
    "productId" UUID NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockReservation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "quantity" INTEGER NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'RESERVED',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "orderItemId" UUID NOT NULL,
    "productId" UUID NOT NULL,

    CONSTRAINT "StockReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockReconciliation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reusableQuantity" INTEGER NOT NULL,
    "nonRestockableQuantity" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "reservationId" UUID NOT NULL,
    "actorId" UUID NOT NULL,

    CONSTRAINT "StockReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderTransition" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fromState" "OrderState" NOT NULL,
    "toState" "OrderState" NOT NULL,
    "version" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "operationKey" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "orderId" UUID NOT NULL,
    "actorId" UUID,

    CONSTRAINT "OrderTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerAccount" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "currency" "Currency" NOT NULL,
    "kind" "AccountKind" NOT NULL,
    "balanceUnits" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "userId" UUID,
    "orderId" UUID,

    CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "currency" "Currency" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "userId" UUID NOT NULL,
    "accountId" UUID NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Escrow" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "currency" "Currency" NOT NULL,
    "heldUnits" BIGINT NOT NULL DEFAULT 0,
    "status" "EscrowStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "orderId" UUID NOT NULL,
    "accountId" UUID NOT NULL,

    CONSTRAINT "Escrow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerJournal" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "operationKey" TEXT NOT NULL,
    "requestHash" VARCHAR(64) NOT NULL,
    "currency" "Currency" NOT NULL,
    "kind" "JournalKind" NOT NULL,
    "creatingTxId" BIGINT NOT NULL DEFAULT txid_current(),
    "postedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" UUID,
    "actorId" UUID,

    CONSTRAINT "LedgerJournal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "currency" "Currency" NOT NULL,
    "debitUnits" BIGINT NOT NULL DEFAULT 0,
    "creditUnits" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "journalId" UUID NOT NULL,
    "accountId" UUID NOT NULL,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAttempt" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "operationKey" TEXT NOT NULL,
    "installment" "Installment" NOT NULL,
    "termsVersion" INTEGER NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL,
    "units" BIGINT NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "failureCode" TEXT,
    "providerReference" TEXT NOT NULL,
    "simulated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "journalId" UUID,

    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "currency" "Currency" NOT NULL,
    "heldUnits" BIGINT NOT NULL,
    "mode" "SettlementMode" NOT NULL,
    "reason" TEXT NOT NULL,
    "operationKey" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" UUID NOT NULL,
    "journalId" UUID NOT NULL,
    "decisionId" UUID,
    "proposalId" UUID,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allocation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "currency" "Currency" NOT NULL,
    "kind" "AllocationKind" NOT NULL,
    "units" BIGINT NOT NULL,
    "settlementId" UUID NOT NULL,
    "recipientId" UUID NOT NULL,

    CONSTRAINT "Allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyRecord" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "route" TEXT NOT NULL,
    "key" VARCHAR(128) NOT NULL,
    "requestHash" VARCHAR(64) NOT NULL,
    "response" JSONB NOT NULL,
    "httpStatus" INTEGER NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "actorId" UUID NOT NULL,

    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryRate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "method" "DeliveryMethod" NOT NULL,
    "currency" "Currency" NOT NULL,
    "feeUnits" BIGINT NOT NULL,
    "version" INTEGER NOT NULL,
    "effectiveAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "cityId" UUID NOT NULL,
    "adminId" UUID NOT NULL,

    CONSTRAINT "DeliveryRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "method" "DeliveryMethod" NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "currency" "Currency" NOT NULL,
    "feeUnits" BIGINT NOT NULL,
    "termsSnapshot" JSONB NOT NULL,
    "termsVersion" INTEGER NOT NULL DEFAULT 1,
    "requestedAt" TIMESTAMPTZ(3),
    "droppedOffAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "storeOrderId" UUID NOT NULL,
    "rateId" UUID,
    "cityId" UUID NOT NULL,
    "areaId" UUID,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryTermsRevision" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "version" INTEGER NOT NULL,
    "method" "DeliveryMethod" NOT NULL,
    "currency" "Currency" NOT NULL,
    "feeUnits" BIGINT NOT NULL,
    "previousFeeUnits" BIGINT NOT NULL,
    "journalId" UUID,
    "promisedAt" TIMESTAMPTZ(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "buyerApprovedAt" TIMESTAMPTZ(3),
    "appliedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deliveryId" UUID NOT NULL,
    "proposedById" UUID NOT NULL,

    CONSTRAINT "DeliveryTermsRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverAssignment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "acceptedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deliveryId" UUID NOT NULL,
    "driverId" UUID NOT NULL,

    CONSTRAINT "DriverAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "DeliveryEventType" NOT NULL,
    "notes" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryId" UUID NOT NULL,
    "assignmentId" UUID,
    "actorId" UUID NOT NULL,
    "proofId" UUID,

    CONSTRAINT "DeliveryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseRecord" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kind" "CaseKind" NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'OPEN',
    "reason" TEXT NOT NULL,
    "evidenceDeadlineAt" TIMESTAMPTZ(3) NOT NULL,
    "pausedState" "OrderState",
    "pausedReview" JSONB,
    "resolvedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "orderId" UUID NOT NULL,
    "openerId" UUID,
    "handlingAdminId" UUID,

    CONSTRAINT "CaseRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseParty" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role" VARCHAR(10) NOT NULL,
    "notifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "evidenceDeadlineAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "caseId" UUID NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "CaseParty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseEvidence" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "text" TEXT,
    "visibility" "EvidenceVisibility" NOT NULL DEFAULT 'SHARED',
    "lateReason" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "caseId" UUID NOT NULL,
    "submitterId" UUID NOT NULL,
    "fileId" UUID,

    CONSTRAINT "CaseEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResolutionProposal" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kind" "ProposalKind" NOT NULL,
    "version" INTEGER NOT NULL,
    "sellerAwardUnits" BIGINT NOT NULL DEFAULT 0,
    "sellerDeliveryUnits" BIGINT NOT NULL DEFAULT 0,
    "driverAwardUnits" BIGINT NOT NULL DEFAULT 0,
    "reason" TEXT NOT NULL,
    "scope" TEXT,
    "newDueAt" TIMESTAMPTZ(3),
    "agreementDeadlineAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "caseId" UUID NOT NULL,
    "proposedById" UUID NOT NULL,

    CONSTRAINT "ResolutionProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalApproval" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "decision" "ApprovalDecision" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "proposalId" UUID NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "ProposalApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminDecision" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reason" TEXT NOT NULL,
    "substantiation" TEXT NOT NULL,
    "sellerAwardUnits" BIGINT NOT NULL,
    "sellerDeliveryUnits" BIGINT NOT NULL,
    "driverAwardUnits" BIGINT NOT NULL,
    "buyerRefundUnits" BIGINT NOT NULL,
    "commissionUnits" BIGINT NOT NULL,
    "outcome" "OrderState" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "caseId" UUID NOT NULL,
    "adminId" UUID NOT NULL,

    CONSTRAINT "AdminDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatRoom" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kind" "RoomKind" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "orderId" UUID NOT NULL,

    CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clientMessageId" UUID NOT NULL,
    "body" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roomId" UUID NOT NULL,
    "senderId" UUID NOT NULL,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageAttachment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "messageId" UUID NOT NULL,
    "fileId" UUID NOT NULL,

    CONSTRAINT "MessageAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "orderId" UUID NOT NULL,
    "buyerId" UUID NOT NULL,
    "sellerProfileId" UUID NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewVersion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "version" INTEGER NOT NULL,
    "stars" INTEGER NOT NULL,
    "body" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewId" UUID NOT NULL,
    "actorId" UUID NOT NULL,

    CONSTRAINT "ReviewVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "aggregateId" UUID NOT NULL,
    "aggregateVersion" INTEGER NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "deduplicationKey" TEXT NOT NULL,
    "publishedAt" TIMESTAMPTZ(3),
    "claimedUntil" TIMESTAMPTZ(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledJob" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "operationKey" TEXT NOT NULL,
    "kind" "JobKind" NOT NULL,
    "deadlineVersion" INTEGER NOT NULL,
    "dueAt" TIMESTAMPTZ(3) NOT NULL,
    "claimedUntil" TIMESTAMPTZ(3),
    "status" "JobStatus" NOT NULL DEFAULT 'READY',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "orderId" UUID NOT NULL,
    "caseId" UUID,

    CONSTRAINT "ScheduledJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "channel" "NotificationChannel" NOT NULL,
    "category" TEXT NOT NULL,
    "resourceId" UUID NOT NULL,
    "readAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "userId" UUID NOT NULL,
    "eventId" UUID NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceToken" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token" TEXT NOT NULL,
    "platform" "DevicePlatform" NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "channel" "NotificationChannel" NOT NULL,
    "status" "DeliveryAttemptStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "errorCode" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "notificationId" UUID NOT NULL,
    "deviceId" UUID,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditRecord" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "action" TEXT NOT NULL,
    "aggregateId" UUID NOT NULL,
    "requestId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" UUID,

    CONSTRAINT "AuditRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_id_idx" ON "User"("createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshHash_key" ON "Session"("refreshHash");

-- CreateIndex
CREATE INDEX "Session_userId_revokedAt_idx" ON "Session"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "Session_familyId_idx" ON "Session"("familyId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_tokenHash_key" ON "VerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "VerificationToken_userId_kind_idx" ON "VerificationToken"("userId", "kind");

-- CreateIndex
CREATE INDEX "VerificationToken_expiresAt_idx" ON "VerificationToken"("expiresAt");

-- CreateIndex
CREATE INDEX "Restriction_userId_revokedAt_expiresAt_idx" ON "Restriction"("userId", "revokedAt", "expiresAt");

-- CreateIndex
CREATE INDEX "Restriction_adminId_idx" ON "Restriction"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Governorate_isoCode_key" ON "Governorate"("isoCode");

-- CreateIndex
CREATE INDEX "Governorate_countryId_idx" ON "Governorate"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "City_id_governorateId_key" ON "City"("id", "governorateId");

-- CreateIndex
CREATE UNIQUE INDEX "City_governorateId_nameEn_key" ON "City"("governorateId", "nameEn");

-- CreateIndex
CREATE UNIQUE INDEX "Area_id_cityId_key" ON "Area"("id", "cityId");

-- CreateIndex
CREATE UNIQUE INDEX "Area_cityId_nameEn_key" ON "Area"("cityId", "nameEn");

-- CreateIndex
CREATE INDEX "Address_userId_archivedAt_idx" ON "Address"("userId", "archivedAt");

-- CreateIndex
CREATE INDEX "Address_cityId_idx" ON "Address"("cityId");

-- CreateIndex
CREATE INDEX "Address_areaId_idx" ON "Address"("areaId");

-- CreateIndex
CREATE INDEX "BusinessProfile_type_status_cityId_idx" ON "BusinessProfile"("type", "status", "cityId");

-- CreateIndex
CREATE INDEX "BusinessProfile_userId_status_idx" ON "BusinessProfile"("userId", "status");

-- CreateIndex
CREATE INDEX "BusinessProfile_cityId_idx" ON "BusinessProfile"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProfile_id_userId_key" ON "BusinessProfile"("id", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileSkill_profileId_name_key" ON "ProfileSkill"("profileId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileLanguage_profileId_languageCode_key" ON "ProfileLanguage"("profileId", "languageCode");

-- CreateIndex
CREATE INDEX "ServiceArea_cityId_areaId_idx" ON "ServiceArea"("cityId", "areaId");

-- CreateIndex
CREATE INDEX "ServiceArea_areaId_idx" ON "ServiceArea"("areaId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceArea_profileId_cityId_areaId_key" ON "ServiceArea"("profileId", "cityId", "areaId");

-- CreateIndex
CREATE INDEX "DriverZone_governorateId_cityId_idx" ON "DriverZone"("governorateId", "cityId");

-- CreateIndex
CREATE INDEX "DriverZone_cityId_idx" ON "DriverZone"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverZone_profileId_governorateId_cityId_key" ON "DriverZone"("profileId", "governorateId", "cityId");

-- CreateIndex
CREATE UNIQUE INDEX "FileAsset_storageKey_key" ON "FileAsset"("storageKey");

-- CreateIndex
CREATE INDEX "FileAsset_ownerId_createdAt_idx" ON "FileAsset"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "FileAsset_orderId_accessClass_idx" ON "FileAsset"("orderId", "accessClass");

-- CreateIndex
CREATE INDEX "FileAsset_scanStatus_idx" ON "FileAsset"("scanStatus");

-- CreateIndex
CREATE INDEX "FileAsset_retainUntil_idx" ON "FileAsset"("retainUntil");

-- CreateIndex
CREATE INDEX "FileAsset_caseId_idx" ON "FileAsset"("caseId");

-- CreateIndex
CREATE INDEX "PortfolioItem_profileId_position_idx" ON "PortfolioItem"("profileId", "position");

-- CreateIndex
CREATE INDEX "PortfolioItem_fileId_idx" ON "PortfolioItem"("fileId");

-- CreateIndex
CREATE INDEX "Category_workspace_active_idx" ON "Category"("workspace", "active");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE INDEX "Listing_categoryId_status_currency_priceUnits_idx" ON "Listing"("categoryId", "status", "currency", "priceUnits");

-- CreateIndex
CREATE INDEX "Listing_profileId_status_idx" ON "Listing"("profileId", "status");

-- CreateIndex
CREATE INDEX "Listing_kind_status_deliveryDays_idx" ON "Listing"("kind", "status", "deliveryDays");

-- CreateIndex
CREATE INDEX "ListingAsset_fileId_idx" ON "ListingAsset"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "ListingAsset_listingId_fileId_key" ON "ListingAsset"("listingId", "fileId");

-- CreateIndex
CREATE UNIQUE INDEX "Storefront_profileId_key" ON "Storefront"("profileId");

-- CreateIndex
CREATE INDEX "Storefront_cityId_status_idx" ON "Storefront"("cityId", "status");

-- CreateIndex
CREATE INDEX "Storefront_logoId_idx" ON "Storefront"("logoId");

-- CreateIndex
CREATE INDEX "Product_storefrontId_status_idx" ON "Product"("storefrontId", "status");

-- CreateIndex
CREATE INDEX "Product_categoryId_status_currency_priceUnits_idx" ON "Product"("categoryId", "status", "currency", "priceUnits");

-- CreateIndex
CREATE INDEX "ProductAsset_fileId_idx" ON "ProductAsset"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAsset_productId_fileId_key" ON "ProductAsset"("productId", "fileId");

-- CreateIndex
CREATE INDEX "ModerationDecision_createdAt_id_idx" ON "ModerationDecision"("createdAt", "id");

-- CreateIndex
CREATE INDEX "ModerationDecision_adminId_idx" ON "ModerationDecision"("adminId");

-- CreateIndex
CREATE INDEX "ModerationDecision_profileId_idx" ON "ModerationDecision"("profileId");

-- CreateIndex
CREATE INDEX "ModerationDecision_listingId_idx" ON "ModerationDecision"("listingId");

-- CreateIndex
CREATE INDEX "ModerationDecision_storefrontId_idx" ON "ModerationDecision"("storefrontId");

-- CreateIndex
CREATE INDEX "ModerationDecision_productId_idx" ON "ModerationDecision"("productId");

-- CreateIndex
CREATE INDEX "ModerationDecision_reviewId_idx" ON "ModerationDecision"("reviewId");

-- CreateIndex
CREATE INDEX "CommissionRate_workspace_effectiveAt_version_idx" ON "CommissionRate"("workspace", "effectiveAt", "version");

-- CreateIndex
CREATE INDEX "CommissionRate_adminId_idx" ON "CommissionRate"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionRate_workspace_version_key" ON "CommissionRate"("workspace", "version");

-- CreateIndex
CREATE INDEX "MarketOrder_buyerId_createdAt_id_idx" ON "MarketOrder"("buyerId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "MarketOrder_sellerProfileId_state_createdAt_idx" ON "MarketOrder"("sellerProfileId", "state", "createdAt");

-- CreateIndex
CREATE INDEX "MarketOrder_state_reviewDeadlineAt_idx" ON "MarketOrder"("state", "reviewDeadlineAt");

-- CreateIndex
CREATE INDEX "MarketOrder_commissionRateId_idx" ON "MarketOrder"("commissionRateId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketOrder_id_currency_key" ON "MarketOrder"("id", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceOrder_orderId_key" ON "ServiceOrder"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceOrder_approvedQuoteId_key" ON "ServiceOrder"("approvedQuoteId");

-- CreateIndex
CREATE INDEX "ServiceOrder_depositDeadlineAt_idx" ON "ServiceOrder"("depositDeadlineAt");

-- CreateIndex
CREATE INDEX "ServiceOrder_balanceDeadlineAt_idx" ON "ServiceOrder"("balanceDeadlineAt");

-- CreateIndex
CREATE INDEX "ServiceOrder_responseDeadlineAt_idx" ON "ServiceOrder"("responseDeadlineAt");

-- CreateIndex
CREATE INDEX "ServiceOrder_listingId_idx" ON "ServiceOrder"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_serviceOrderId_key" ON "Booking"("serviceOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "InspectionRequest_serviceOrderId_key" ON "InspectionRequest"("serviceOrderId");

-- CreateIndex
CREATE INDEX "InspectionRequest_addressId_idx" ON "InspectionRequest"("addressId");

-- CreateIndex
CREATE INDEX "InspectionPhoto_fileId_idx" ON "InspectionPhoto"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "InspectionPhoto_inspectionId_fileId_key" ON "InspectionPhoto"("inspectionId", "fileId");

-- CreateIndex
CREATE INDEX "Quote_state_responseDeadlineAt_idx" ON "Quote"("state", "responseDeadlineAt");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_serviceOrderId_version_key" ON "Quote"("serviceOrderId", "version");

-- CreateIndex
CREATE INDEX "QuoteItem_quoteId_idx" ON "QuoteItem"("quoteId");

-- CreateIndex
CREATE INDEX "ScheduleReservation_providerId_startsAt_idx" ON "ScheduleReservation"("providerId", "startsAt");

-- CreateIndex
CREATE INDEX "ScheduleReservation_serviceOrderId_status_idx" ON "ScheduleReservation"("serviceOrderId", "status");

-- CreateIndex
CREATE INDEX "Milestone_serviceOrderId_position_idx" ON "Milestone"("serviceOrderId", "position");

-- CreateIndex
CREATE INDEX "Submission_fileId_idx" ON "Submission"("fileId");

-- CreateIndex
CREATE INDEX "Submission_actorId_idx" ON "Submission"("actorId");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_serviceOrderId_kind_version_key" ON "Submission"("serviceOrderId", "kind", "version");

-- CreateIndex
CREATE UNIQUE INDEX "StoreOrder_orderId_key" ON "StoreOrder"("orderId");

-- CreateIndex
CREATE INDEX "StoreOrder_sellerAcceptanceDeadlineAt_idx" ON "StoreOrder"("sellerAcceptanceDeadlineAt");

-- CreateIndex
CREATE INDEX "StoreOrder_storefrontId_idx" ON "StoreOrder"("storefrontId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_storeOrderId_productId_key" ON "OrderItem"("storeOrderId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "StockReservation_orderItemId_key" ON "StockReservation"("orderItemId");

-- CreateIndex
CREATE INDEX "StockReservation_productId_status_idx" ON "StockReservation"("productId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "StockReconciliation_reservationId_key" ON "StockReconciliation"("reservationId");

-- CreateIndex
CREATE INDEX "StockReconciliation_actorId_idx" ON "StockReconciliation"("actorId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderTransition_operationKey_key" ON "OrderTransition"("operationKey");

-- CreateIndex
CREATE INDEX "OrderTransition_orderId_createdAt_id_idx" ON "OrderTransition"("orderId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "OrderTransition_actorId_idx" ON "OrderTransition"("actorId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderTransition_orderId_version_key" ON "OrderTransition"("orderId", "version");

-- CreateIndex
CREATE INDEX "LedgerAccount_userId_currency_idx" ON "LedgerAccount"("userId", "currency");

-- CreateIndex
CREATE INDEX "LedgerAccount_orderId_idx" ON "LedgerAccount"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_id_currency_key" ON "LedgerAccount"("id", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_accountId_key" ON "Wallet"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_currency_key" ON "Wallet"("userId", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "Escrow_orderId_key" ON "Escrow"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Escrow_accountId_key" ON "Escrow"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Escrow_orderId_currency_key" ON "Escrow"("orderId", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "Escrow_accountId_currency_key" ON "Escrow"("accountId", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerJournal_operationKey_key" ON "LedgerJournal"("operationKey");

-- CreateIndex
CREATE INDEX "LedgerJournal_orderId_postedAt_id_idx" ON "LedgerJournal"("orderId", "postedAt", "id");

-- CreateIndex
CREATE INDEX "LedgerJournal_actorId_idx" ON "LedgerJournal"("actorId");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerJournal_id_currency_key" ON "LedgerJournal"("id", "currency");

-- CreateIndex
CREATE INDEX "LedgerEntry_accountId_createdAt_id_idx" ON "LedgerEntry"("accountId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "LedgerEntry_journalId_idx" ON "LedgerEntry"("journalId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_operationKey_key" ON "PaymentAttempt"("operationKey");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_providerReference_key" ON "PaymentAttempt"("providerReference");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_journalId_key" ON "PaymentAttempt"("journalId");

-- CreateIndex
CREATE INDEX "PaymentAttempt_orderId_createdAt_id_idx" ON "PaymentAttempt"("orderId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "PaymentAttempt_actorId_idx" ON "PaymentAttempt"("actorId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_journalId_currency_key" ON "PaymentAttempt"("journalId", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_operationKey_key" ON "Settlement"("operationKey");

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_orderId_key" ON "Settlement"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_journalId_key" ON "Settlement"("journalId");

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_decisionId_key" ON "Settlement"("decisionId");

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_proposalId_key" ON "Settlement"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_orderId_currency_key" ON "Settlement"("orderId", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_journalId_currency_key" ON "Settlement"("journalId", "currency");

-- CreateIndex
CREATE INDEX "Allocation_recipientId_idx" ON "Allocation"("recipientId");

-- CreateIndex
CREATE UNIQUE INDEX "Allocation_settlementId_kind_key" ON "Allocation"("settlementId", "kind");

-- CreateIndex
CREATE INDEX "IdempotencyRecord_expiresAt_idx" ON "IdempotencyRecord"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyRecord_actorId_route_key_key" ON "IdempotencyRecord"("actorId", "route", "key");

-- CreateIndex
CREATE INDEX "DeliveryRate_cityId_method_currency_effectiveAt_idx" ON "DeliveryRate"("cityId", "method", "currency", "effectiveAt");

-- CreateIndex
CREATE INDEX "DeliveryRate_adminId_idx" ON "DeliveryRate"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryRate_cityId_method_currency_version_key" ON "DeliveryRate"("cityId", "method", "currency", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_storeOrderId_key" ON "Delivery"("storeOrderId");

-- CreateIndex
CREATE INDEX "Delivery_cityId_status_createdAt_idx" ON "Delivery"("cityId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Delivery_rateId_idx" ON "Delivery"("rateId");

-- CreateIndex
CREATE INDEX "Delivery_areaId_idx" ON "Delivery"("areaId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryTermsRevision_journalId_key" ON "DeliveryTermsRevision"("journalId");

-- CreateIndex
CREATE INDEX "DeliveryTermsRevision_proposedById_idx" ON "DeliveryTermsRevision"("proposedById");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryTermsRevision_deliveryId_version_key" ON "DeliveryTermsRevision"("deliveryId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryTermsRevision_journalId_currency_key" ON "DeliveryTermsRevision"("journalId", "currency");

-- CreateIndex
CREATE INDEX "DriverAssignment_driverId_status_idx" ON "DriverAssignment"("driverId", "status");

-- CreateIndex
CREATE INDEX "DriverAssignment_deliveryId_status_idx" ON "DriverAssignment"("deliveryId", "status");

-- CreateIndex
CREATE INDEX "DeliveryEvent_deliveryId_occurredAt_id_idx" ON "DeliveryEvent"("deliveryId", "occurredAt", "id");

-- CreateIndex
CREATE INDEX "DeliveryEvent_assignmentId_idx" ON "DeliveryEvent"("assignmentId");

-- CreateIndex
CREATE INDEX "DeliveryEvent_actorId_idx" ON "DeliveryEvent"("actorId");

-- CreateIndex
CREATE INDEX "DeliveryEvent_proofId_idx" ON "DeliveryEvent"("proofId");

-- CreateIndex
CREATE INDEX "CaseRecord_status_evidenceDeadlineAt_idx" ON "CaseRecord"("status", "evidenceDeadlineAt");

-- CreateIndex
CREATE INDEX "CaseRecord_orderId_createdAt_idx" ON "CaseRecord"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "CaseRecord_openerId_idx" ON "CaseRecord"("openerId");

-- CreateIndex
CREATE INDEX "CaseRecord_handlingAdminId_idx" ON "CaseRecord"("handlingAdminId");

-- CreateIndex
CREATE INDEX "CaseParty_userId_idx" ON "CaseParty"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CaseParty_caseId_userId_key" ON "CaseParty"("caseId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CaseParty_caseId_role_key" ON "CaseParty"("caseId", "role");

-- CreateIndex
CREATE INDEX "CaseEvidence_caseId_createdAt_id_idx" ON "CaseEvidence"("caseId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "CaseEvidence_submitterId_idx" ON "CaseEvidence"("submitterId");

-- CreateIndex
CREATE INDEX "CaseEvidence_fileId_idx" ON "CaseEvidence"("fileId");

-- CreateIndex
CREATE INDEX "ResolutionProposal_proposedById_idx" ON "ResolutionProposal"("proposedById");

-- CreateIndex
CREATE UNIQUE INDEX "ResolutionProposal_caseId_version_key" ON "ResolutionProposal"("caseId", "version");

-- CreateIndex
CREATE INDEX "ProposalApproval_userId_idx" ON "ProposalApproval"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProposalApproval_proposalId_userId_key" ON "ProposalApproval"("proposalId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminDecision_caseId_key" ON "AdminDecision"("caseId");

-- CreateIndex
CREATE INDEX "AdminDecision_adminId_idx" ON "AdminDecision"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatRoom_orderId_kind_key" ON "ChatRoom"("orderId", "kind");

-- CreateIndex
CREATE INDEX "ChatMessage_roomId_createdAt_id_idx" ON "ChatMessage"("roomId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "ChatMessage_senderId_idx" ON "ChatMessage"("senderId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMessage_roomId_senderId_clientMessageId_key" ON "ChatMessage"("roomId", "senderId", "clientMessageId");

-- CreateIndex
CREATE INDEX "MessageAttachment_fileId_idx" ON "MessageAttachment"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageAttachment_messageId_fileId_key" ON "MessageAttachment"("messageId", "fileId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_orderId_key" ON "Review"("orderId");

-- CreateIndex
CREATE INDEX "Review_sellerProfileId_hidden_createdAt_id_idx" ON "Review"("sellerProfileId", "hidden", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Review_buyerId_idx" ON "Review"("buyerId");

-- CreateIndex
CREATE INDEX "ReviewVersion_actorId_idx" ON "ReviewVersion"("actorId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewVersion_reviewId_version_key" ON "ReviewVersion"("reviewId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "OutboxEvent_deduplicationKey_key" ON "OutboxEvent"("deduplicationKey");

-- CreateIndex
CREATE INDEX "OutboxEvent_publishedAt_claimedUntil_createdAt_idx" ON "OutboxEvent"("publishedAt", "claimedUntil", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledJob_operationKey_key" ON "ScheduledJob"("operationKey");

-- CreateIndex
CREATE INDEX "ScheduledJob_status_dueAt_claimedUntil_idx" ON "ScheduledJob"("status", "dueAt", "claimedUntil");

-- CreateIndex
CREATE INDEX "ScheduledJob_orderId_idx" ON "ScheduledJob"("orderId");

-- CreateIndex
CREATE INDEX "ScheduledJob_caseId_idx" ON "ScheduledJob"("caseId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_id_idx" ON "Notification"("userId", "readAt", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Notification_eventId_idx" ON "Notification"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_userId_eventId_channel_key" ON "Notification"("userId", "eventId", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceToken_token_key" ON "DeviceToken"("token");

-- CreateIndex
CREATE INDEX "DeviceToken_userId_revokedAt_idx" ON "DeviceToken"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "NotificationDelivery_status_nextAttemptAt_idx" ON "NotificationDelivery"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "NotificationDelivery_deviceId_idx" ON "NotificationDelivery"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationDelivery_notificationId_channel_deviceId_key" ON "NotificationDelivery"("notificationId", "channel", "deviceId");

-- CreateIndex
CREATE INDEX "AuditRecord_aggregateId_createdAt_id_idx" ON "AuditRecord"("aggregateId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "AuditRecord_actorId_createdAt_idx" ON "AuditRecord"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditRecord_action_createdAt_idx" ON "AuditRecord"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_replacedById_fkey" FOREIGN KEY ("replacedById") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Restriction" ADD CONSTRAINT "Restriction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Restriction" ADD CONSTRAINT "Restriction_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Governorate" ADD CONSTRAINT "Governorate_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_governorateId_fkey" FOREIGN KEY ("governorateId") REFERENCES "Governorate"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Area" ADD CONSTRAINT "Area_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ProfileSkill" ADD CONSTRAINT "ProfileSkill_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "BusinessProfile"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ProfileLanguage" ADD CONSTRAINT "ProfileLanguage_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "BusinessProfile"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ServiceArea" ADD CONSTRAINT "ServiceArea_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "BusinessProfile"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ServiceArea" ADD CONSTRAINT "ServiceArea_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ServiceArea" ADD CONSTRAINT "ServiceArea_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "DriverZone" ADD CONSTRAINT "DriverZone_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "BusinessProfile"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "DriverZone" ADD CONSTRAINT "DriverZone_governorateId_fkey" FOREIGN KEY ("governorateId") REFERENCES "Governorate"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "DriverZone" ADD CONSTRAINT "DriverZone_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MarketOrder"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "BusinessProfile"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "FileAsset"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "BusinessProfile"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ListingAsset" ADD CONSTRAINT "ListingAsset_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ListingAsset" ADD CONSTRAINT "ListingAsset_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "FileAsset"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Storefront" ADD CONSTRAINT "Storefront_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "BusinessProfile"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Storefront" ADD CONSTRAINT "Storefront_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Storefront" ADD CONSTRAINT "Storefront_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "FileAsset"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_storefrontId_fkey" FOREIGN KEY ("storefrontId") REFERENCES "Storefront"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ProductAsset" ADD CONSTRAINT "ProductAsset_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ProductAsset" ADD CONSTRAINT "ProductAsset_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "FileAsset"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ModerationDecision" ADD CONSTRAINT "ModerationDecision_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ModerationDecision" ADD CONSTRAINT "ModerationDecision_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "BusinessProfile"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ModerationDecision" ADD CONSTRAINT "ModerationDecision_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ModerationDecision" ADD CONSTRAINT "ModerationDecision_storefrontId_fkey" FOREIGN KEY ("storefrontId") REFERENCES "Storefront"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ModerationDecision" ADD CONSTRAINT "ModerationDecision_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ModerationDecision" ADD CONSTRAINT "ModerationDecision_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "CommissionRate" ADD CONSTRAINT "CommissionRate_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "MarketOrder" ADD CONSTRAINT "MarketOrder_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "MarketOrder" ADD CONSTRAINT "MarketOrder_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "BusinessProfile"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "MarketOrder" ADD CONSTRAINT "MarketOrder_commissionRateId_fkey" FOREIGN KEY ("commissionRateId") REFERENCES "CommissionRate"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MarketOrder"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_approvedQuoteId_fkey" FOREIGN KEY ("approvedQuoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "InspectionRequest" ADD CONSTRAINT "InspectionRequest_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "InspectionRequest" ADD CONSTRAINT "InspectionRequest_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "InspectionPhoto" ADD CONSTRAINT "InspectionPhoto_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "InspectionRequest"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "InspectionPhoto" ADD CONSTRAINT "InspectionPhoto_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "FileAsset"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ScheduleReservation" ADD CONSTRAINT "ScheduleReservation_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ScheduleReservation" ADD CONSTRAINT "ScheduleReservation_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "BusinessProfile"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "FileAsset"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "StoreOrder" ADD CONSTRAINT "StoreOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MarketOrder"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "StoreOrder" ADD CONSTRAINT "StoreOrder_storefrontId_fkey" FOREIGN KEY ("storefrontId") REFERENCES "Storefront"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_storeOrderId_fkey" FOREIGN KEY ("storeOrderId") REFERENCES "StoreOrder"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "StockReconciliation" ADD CONSTRAINT "StockReconciliation_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "StockReservation"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "StockReconciliation" ADD CONSTRAINT "StockReconciliation_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "OrderTransition" ADD CONSTRAINT "OrderTransition_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MarketOrder"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "OrderTransition" ADD CONSTRAINT "OrderTransition_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "LedgerAccount" ADD CONSTRAINT "LedgerAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "LedgerAccount" ADD CONSTRAINT "LedgerAccount_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MarketOrder"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Escrow" ADD CONSTRAINT "Escrow_orderId_currency_fkey" FOREIGN KEY ("orderId", "currency") REFERENCES "MarketOrder"("id", "currency") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Escrow" ADD CONSTRAINT "Escrow_accountId_currency_fkey" FOREIGN KEY ("accountId", "currency") REFERENCES "LedgerAccount"("id", "currency") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "LedgerJournal" ADD CONSTRAINT "LedgerJournal_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MarketOrder"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "LedgerJournal" ADD CONSTRAINT "LedgerJournal_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_journalId_currency_fkey" FOREIGN KEY ("journalId", "currency") REFERENCES "LedgerJournal"("id", "currency") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_accountId_currency_fkey" FOREIGN KEY ("accountId", "currency") REFERENCES "LedgerAccount"("id", "currency") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_orderId_currency_fkey" FOREIGN KEY ("orderId", "currency") REFERENCES "MarketOrder"("id", "currency") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_journalId_currency_fkey" FOREIGN KEY ("journalId", "currency") REFERENCES "LedgerJournal"("id", "currency") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_orderId_currency_fkey" FOREIGN KEY ("orderId", "currency") REFERENCES "MarketOrder"("id", "currency") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_journalId_currency_fkey" FOREIGN KEY ("journalId", "currency") REFERENCES "LedgerJournal"("id", "currency") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "AdminDecision"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "ResolutionProposal"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_recipientId_currency_fkey" FOREIGN KEY ("recipientId", "currency") REFERENCES "LedgerAccount"("id", "currency") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "IdempotencyRecord" ADD CONSTRAINT "IdempotencyRecord_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "DeliveryRate" ADD CONSTRAINT "DeliveryRate_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "DeliveryRate" ADD CONSTRAINT "DeliveryRate_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_storeOrderId_fkey" FOREIGN KEY ("storeOrderId") REFERENCES "StoreOrder"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_rateId_fkey" FOREIGN KEY ("rateId") REFERENCES "DeliveryRate"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "DeliveryTermsRevision" ADD CONSTRAINT "DeliveryTermsRevision_journalId_currency_fkey" FOREIGN KEY ("journalId", "currency") REFERENCES "LedgerJournal"("id", "currency") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "DeliveryTermsRevision" ADD CONSTRAINT "DeliveryTermsRevision_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "DeliveryTermsRevision" ADD CONSTRAINT "DeliveryTermsRevision_proposedById_fkey" FOREIGN KEY ("proposedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "DriverAssignment" ADD CONSTRAINT "DriverAssignment_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "DriverAssignment" ADD CONSTRAINT "DriverAssignment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "BusinessProfile"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "DeliveryEvent" ADD CONSTRAINT "DeliveryEvent_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "DeliveryEvent" ADD CONSTRAINT "DeliveryEvent_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "DriverAssignment"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "DeliveryEvent" ADD CONSTRAINT "DeliveryEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "DeliveryEvent" ADD CONSTRAINT "DeliveryEvent_proofId_fkey" FOREIGN KEY ("proofId") REFERENCES "FileAsset"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "CaseRecord" ADD CONSTRAINT "CaseRecord_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MarketOrder"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "CaseRecord" ADD CONSTRAINT "CaseRecord_openerId_fkey" FOREIGN KEY ("openerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "CaseRecord" ADD CONSTRAINT "CaseRecord_handlingAdminId_fkey" FOREIGN KEY ("handlingAdminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "CaseParty" ADD CONSTRAINT "CaseParty_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "CaseParty" ADD CONSTRAINT "CaseParty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "CaseEvidence" ADD CONSTRAINT "CaseEvidence_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "CaseEvidence" ADD CONSTRAINT "CaseEvidence_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "CaseEvidence" ADD CONSTRAINT "CaseEvidence_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "FileAsset"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ResolutionProposal" ADD CONSTRAINT "ResolutionProposal_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ResolutionProposal" ADD CONSTRAINT "ResolutionProposal_proposedById_fkey" FOREIGN KEY ("proposedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ProposalApproval" ADD CONSTRAINT "ProposalApproval_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "ResolutionProposal"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ProposalApproval" ADD CONSTRAINT "ProposalApproval_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AdminDecision" ADD CONSTRAINT "AdminDecision_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AdminDecision" ADD CONSTRAINT "AdminDecision_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MarketOrder"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "MessageAttachment" ADD CONSTRAINT "MessageAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "MessageAttachment" ADD CONSTRAINT "MessageAttachment_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "FileAsset"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MarketOrder"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "BusinessProfile"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ReviewVersion" ADD CONSTRAINT "ReviewVersion_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ReviewVersion" ADD CONSTRAINT "ReviewVersion_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ScheduledJob" ADD CONSTRAINT "ScheduledJob_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MarketOrder"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ScheduledJob" ADD CONSTRAINT "ScheduledJob_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "OutboxEvent"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "DeviceToken" ADD CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "DeviceToken"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AuditRecord" ADD CONSTRAINT "AuditRecord_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

