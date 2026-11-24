# Implemented relational database design

Generated from the canonical Prisma datamodel by `npm run db:erd`. There are 72 domain models plus the unchanged legacy SetupMetadata table. All domain primary identifiers are PostgreSQL UUIDs with database-generated defaults; Country now has a UUID primary key and unique code. Money is BIGINT stored units (SYP pounds / USD cents), never floating point. LedgerJournal represents a financial transaction; PaymentAttempt represents its simulated provider result.

The schema and migration files are implemented; application against a live PostgreSQL database is a separate validation result in [database and contract report](DATABASE_CONTRACT_REPORT.md). Enum definitions and exact nullability/indexes are authoritative in `backend/prisma/schema.prisma`. PK, FK and UK below are literal datamodel constraints. Every physical relation is shown once, including references crossing diagrams.

## Identity and access

```mermaid
erDiagram
  User {
    uuid id PK
    string email UK
    string passwordHash
    string displayName
    string locale
    datetime archivedAt
    datetime createdAt
    datetime updatedAt
  }
  Role {
    uuid id PK
    string code UK
    string name
    datetime createdAt
    datetime updatedAt
  }
  User ||--o{ UserRole : user
  Role ||--o{ UserRole : role
  UserRole {
    uuid id PK
    datetime revokedAt
    datetime createdAt
    datetime updatedAt
    uuid userId FK
    uuid roleId FK
  }
  User ||--o{ Session : user
  Session o|--o{ Session : replacedBy
  Session {
    uuid id PK
    string refreshHash UK
    uuid familyId
    datetime expiresAt
    datetime revokedAt
    uuid replacedById FK
    string client
    datetime createdAt
    datetime updatedAt
    uuid userId FK
  }
  User ||--o{ VerificationToken : user
  VerificationToken {
    uuid id PK
    string kind
    string tokenHash UK
    datetime expiresAt
    datetime consumedAt
    datetime createdAt
    datetime updatedAt
    uuid userId FK
  }
  User ||--o{ Restriction : user
  User ||--o{ Restriction : admin
  Restriction {
    uuid id PK
    string kind
    string reason
    datetime expiresAt
    datetime revokedAt
    datetime createdAt
    datetime updatedAt
    uuid userId FK
    uuid adminId FK
  }
```

## Geography, profiles and catalog

```mermaid
erDiagram
  Country {
    uuid id PK
    string code UK
    string nameAr
    string nameEn
    datetime createdAt
    datetime updatedAt
  }
  Country ||--o{ Governorate : country
  Governorate {
    uuid id PK
    string isoCode UK
    string nameAr
    string nameEn
    datetime createdAt
    datetime updatedAt
    uuid countryId FK
  }
  Governorate ||--o{ City : governorate
  City {
    float centerLatitude
    float centerLongitude
    uuid id PK
    string nameAr
    string nameEn
    boolean isDistrict
    datetime createdAt
    datetime updatedAt
    uuid governorateId FK
  }
  City ||--o{ Area : city
  Area {
    float centerLatitude
    float centerLongitude
    uuid id PK
    string nameAr
    string nameEn
    datetime createdAt
    datetime updatedAt
    uuid cityId FK
  }
  User ||--o{ Address : user
  City ||--o{ Address : city
  Area o|--o{ Address : area
  Address {
    float latitude
    float longitude
    uuid id PK
    string label
    string details
    string contactName
    string contactPhone
    datetime archivedAt
    datetime createdAt
    datetime updatedAt
    uuid userId FK
    uuid cityId FK
    uuid areaId FK
  }
  User ||--o{ BusinessProfile : user
  City o|--o{ BusinessProfile : city
  BusinessProfile {
    float venueLatitude
    float venueLongitude
    boolean venuePublished
    uuid id PK
    string type
    string status
    string title
    string bio
    string trade
    int experienceYears
    float ratingAverage
    int reviewCount
    datetime archivedAt
    datetime createdAt
    datetime updatedAt
    uuid userId FK
    uuid cityId FK
  }
  BusinessProfile ||--o{ ProfileSkill : profile
  ProfileSkill {
    uuid id PK
    string name
    datetime createdAt
    datetime updatedAt
    uuid profileId FK
  }
  BusinessProfile ||--o{ ProfileLanguage : profile
  ProfileLanguage {
    uuid id PK
    string languageCode
    string proficiency
    datetime createdAt
    datetime updatedAt
    uuid profileId FK
  }
  BusinessProfile ||--o{ ServiceArea : profile
  City ||--o{ ServiceArea : city
  Area o|--o{ ServiceArea : area
  ServiceArea {
    uuid id PK
    datetime createdAt
    datetime updatedAt
    uuid profileId FK
    uuid cityId FK
    uuid areaId FK
  }
  BusinessProfile ||--o{ DriverZone : profile
  Governorate ||--o{ DriverZone : governorate
  City o|--o{ DriverZone : city
  DriverZone {
    uuid id PK
    datetime createdAt
    datetime updatedAt
    uuid profileId FK
    uuid governorateId FK
    uuid cityId FK
  }
  User ||--o{ FileAsset : owner
  MarketOrder o|--o{ FileAsset : order
  CaseRecord o|--o{ FileAsset : case
  FileAsset {
    uuid id PK
    string storageKey UK
    string originalName
    string mimeType
    string extension
    bigint sizeBytes
    string sha256
    string accessClass
    string scanStatus
    datetime deletedAt
    datetime retainUntil
    boolean legalHold
    datetime createdAt
    datetime updatedAt
    uuid ownerId FK
    uuid orderId FK
    uuid caseId FK
  }
  BusinessProfile ||--o{ PortfolioItem : profile
  FileAsset o|--o{ PortfolioItem : file
  PortfolioItem {
    uuid id PK
    string kind
    string title
    string caption
    string url
    int position
    datetime archivedAt
    datetime createdAt
    datetime updatedAt
    uuid profileId FK
    uuid fileId FK
  }
  Category o|--o{ Category : parent
  Category {
    uuid id PK
    string workspace
    string nameAr
    string nameEn
    boolean active
    datetime createdAt
    datetime updatedAt
    uuid parentId FK
  }
  BusinessProfile ||--o{ Listing : profile
  Category ||--o{ Listing : category
  Listing {
    uuid id PK
    string kind
    string titleAr
    string titleEn
    string descriptionAr
    string descriptionEn
    string currency
    bigint priceUnits
    int deliveryDays
    int durationMinutes
    string status
    datetime createdAt
    datetime updatedAt
    uuid profileId FK
    uuid categoryId FK
  }
  Listing ||--o{ ListingAsset : listing
  FileAsset ||--o{ ListingAsset : file
  ListingAsset {
    uuid id PK
    int position
    datetime createdAt
    datetime updatedAt
    uuid listingId FK
    uuid fileId FK
  }
  BusinessProfile ||--o| Storefront : profile
  City ||--o{ Storefront : city
  FileAsset o|--o{ Storefront : logo
  Storefront {
    float venueLatitude
    float venueLongitude
    boolean venuePublished
    uuid id PK
    string nameAr
    string nameEn
    string descriptionAr
    string descriptionEn
    string status
    boolean supportsSellerDelivery
    boolean supportsPlatformDelivery
    datetime createdAt
    datetime updatedAt
    uuid profileId FK,UK
    uuid cityId FK
    uuid logoId FK
  }
  Storefront ||--o{ Product : storefront
  Category ||--o{ Product : category
  Product {
    uuid id PK
    string titleAr
    string titleEn
    string descriptionAr
    string descriptionEn
    string currency
    bigint priceUnits
    int stockOnHand
    int stockReserved
    string status
    datetime createdAt
    datetime updatedAt
    uuid storefrontId FK
    uuid categoryId FK
  }
  Product ||--o{ ProductAsset : product
  FileAsset ||--o{ ProductAsset : file
  ProductAsset {
    uuid id PK
    int position
    datetime createdAt
    datetime updatedAt
    uuid productId FK
    uuid fileId FK
  }
  User ||--o{ ModerationDecision : admin
  BusinessProfile o|--o{ ModerationDecision : profile
  Listing o|--o{ ModerationDecision : listing
  Storefront o|--o{ ModerationDecision : storefront
  Product o|--o{ ModerationDecision : product
  Review o|--o{ ModerationDecision : review
  ModerationDecision {
    uuid id PK
    string outcome
    string reason
    datetime createdAt
    datetime updatedAt
    uuid adminId FK
    uuid profileId FK
    uuid listingId FK
    uuid storefrontId FK
    uuid productId FK
    uuid reviewId FK
  }
```

## Orders, scheduling, quotes and inventory

```mermaid
erDiagram
  User ||--o{ MarketOrder : buyer
  BusinessProfile ||--o{ MarketOrder : sellerProfile
  CommissionRate o|--o{ MarketOrder : commissionRate
  MarketOrder {
    uuid id PK
    string workspace
    string state
    string currency
    bigint agreedTotalUnits
    bigint eligibleSellerUnits
    bigint deliveryFeeUnits
    int commissionBpsSnapshot
    json agreementSnapshot
    json addressSnapshot
    datetime termsAcceptedAt
    int version
    datetime deliveredAt
    datetime reviewDeadlineAt
    int deliveryVersion
    boolean deliveryVerified
    datetime buyerConfirmedAt
    boolean paused
    datetime workStartedAt
    datetime completedAt
    datetime checkoutExpiresAt
    datetime createdAt
    datetime updatedAt
    uuid buyerId FK
    uuid sellerProfileId FK
    uuid commissionRateId FK
  }
  CaseRecord o|--o{ ServiceOrder : balanceResumptionCase
  MarketOrder ||--o| ServiceOrder : order
  Listing o|--o{ ServiceOrder : listing
  Quote o|--o| ServiceOrder : approvedQuote
  ServiceOrder {
    uuid id PK
    string kind
    bigint depositUnits
    bigint balanceUnits
    datetime responseDeadlineAt
    datetime depositDeadlineAt
    datetime dueAt
    datetime readyAt
    json readinessEvidence
    datetime balanceDeadlineAt
    datetime balanceResumedAt
    uuid balanceResumptionCaseId FK
    datetime createdAt
    datetime updatedAt
    uuid orderId FK,UK
    uuid listingId FK
    uuid approvedQuoteId FK,UK
  }
  ServiceOrder ||--o| Booking : serviceOrder
  Booking {
    uuid id PK
    string state
    datetime requestedStartsAt
    datetime requestedEndsAt
    datetime proposedStartsAt
    datetime proposedEndsAt
    datetime providerAcceptedAt
    datetime buyerAcceptedAt
    datetime createdAt
    datetime updatedAt
    uuid serviceOrderId FK,UK
  }
  ServiceOrder ||--o| InspectionRequest : serviceOrder
  Address ||--o{ InspectionRequest : address
  InspectionRequest {
    uuid id PK
    string description
    datetime agreedAt
    datetime startsAt
    datetime createdAt
    datetime updatedAt
    uuid serviceOrderId FK,UK
    uuid addressId FK
  }
  InspectionRequest ||--o{ InspectionPhoto : inspection
  FileAsset ||--o{ InspectionPhoto : file
  InspectionPhoto {
    uuid id PK
    datetime createdAt
    datetime updatedAt
    uuid inspectionId FK
    uuid fileId FK
  }
  ServiceOrder ||--o{ Quote : serviceOrder
  Quote {
    uuid id PK
    int version
    string state
    string currency
    bigint totalUnits
    string scope
    datetime startsAt
    datetime endsAt
    datetime dueAt
    datetime sentAt
    datetime responseDeadlineAt
    datetime approvedAt
    datetime createdAt
    datetime updatedAt
    uuid serviceOrderId FK
  }
  Quote ||--o{ QuoteItem : quote
  QuoteItem {
    uuid id PK
    string description
    int quantity
    bigint unitPriceUnits
    datetime createdAt
    datetime updatedAt
    uuid quoteId FK
  }
  ServiceOrder ||--o{ ScheduleReservation : serviceOrder
  BusinessProfile ||--o{ ScheduleReservation : provider
  ScheduleReservation {
    uuid id PK
    datetime startsAt
    datetime endsAt
    string status
    datetime createdAt
    datetime updatedAt
    uuid serviceOrderId FK
    uuid providerId FK
  }
  ServiceOrder ||--o{ Milestone : serviceOrder
  Milestone {
    uuid id PK
    string description
    int progress
    int position
    datetime createdAt
    datetime updatedAt
    uuid serviceOrderId FK
  }
  ServiceOrder ||--o{ Submission : serviceOrder
  FileAsset o|--o{ Submission : file
  User ||--o{ Submission : actor
  Submission {
    uuid id PK
    string kind
    int version
    json evidence
    datetime submittedAt
    datetime createdAt
    datetime updatedAt
    uuid serviceOrderId FK
    uuid fileId FK
    uuid actorId FK
  }
  MarketOrder ||--o| StoreOrder : order
  Storefront ||--o{ StoreOrder : storefront
  StoreOrder {
    uuid id PK
    datetime sellerAcceptanceDeadlineAt
    datetime acceptedAt
    datetime createdAt
    datetime updatedAt
    uuid orderId FK,UK
    uuid storefrontId FK
  }
  StoreOrder ||--o{ OrderItem : storeOrder
  Product ||--o{ OrderItem : product
  OrderItem {
    uuid id PK
    int quantity
    bigint unitPriceUnits
    string currency
    json productSnapshot
    datetime createdAt
    datetime updatedAt
    uuid storeOrderId FK
    uuid productId FK
  }
  OrderItem ||--o| StockReservation : orderItem
  Product ||--o{ StockReservation : product
  StockReservation {
    uuid id PK
    int quantity
    string status
    datetime createdAt
    datetime updatedAt
    uuid orderItemId FK,UK
    uuid productId FK
  }
  StockReservation ||--o| StockReconciliation : reservation
  User ||--o{ StockReconciliation : actor
  StockReconciliation {
    uuid id PK
    int reusableQuantity
    int nonRestockableQuantity
    string reason
    datetime createdAt
    datetime updatedAt
    uuid reservationId FK,UK
    uuid actorId FK
  }
  MarketOrder ||--o{ OrderTransition : order
  User o|--o{ OrderTransition : actor
  OrderTransition {
    uuid id PK
    string fromState
    string toState
    int version
    string reason
    string operationKey UK
    datetime createdAt
    datetime updatedAt
    uuid orderId FK
    uuid actorId FK
  }
```

## Wallets, financial transactions and escrow

```mermaid
erDiagram
  User ||--o{ CommissionRate : admin
  CommissionRate {
    uuid id PK
    string workspace
    int basisPoints
    int version
    datetime effectiveAt
    datetime createdAt
    datetime updatedAt
    uuid adminId FK
  }
  User o|--o{ LedgerAccount : user
  MarketOrder o|--o{ LedgerAccount : order
  LedgerAccount {
    uuid id PK
    string currency
    string kind
    bigint balanceUnits
    datetime createdAt
    datetime updatedAt
    uuid userId FK
    uuid orderId FK
  }
  User ||--o{ Wallet : user
  LedgerAccount ||--o| Wallet : account
  Wallet {
    uuid id PK
    string currency
    datetime createdAt
    datetime updatedAt
    uuid userId FK
    uuid accountId FK,UK
  }
  MarketOrder ||--o| Escrow : order
  LedgerAccount ||--o| Escrow : account
  Escrow {
    uuid id PK
    string currency FK
    bigint heldUnits
    string status
    datetime createdAt
    datetime updatedAt
    uuid orderId FK,UK
    uuid accountId FK,UK
  }
  MarketOrder o|--o{ LedgerJournal : order
  User o|--o{ LedgerJournal : actor
  LedgerJournal {
    uuid id PK
    string operationKey UK
    string requestHash
    string currency
    string kind
    bigint creatingTxId
    datetime postedAt
    uuid orderId FK
    uuid actorId FK
  }
  LedgerJournal ||--o{ LedgerEntry : journal
  LedgerAccount ||--o{ LedgerEntry : account
  LedgerEntry {
    uuid id PK
    string currency FK
    bigint debitUnits
    bigint creditUnits
    datetime createdAt
    uuid journalId FK
    uuid accountId FK
  }
  MarketOrder ||--o{ PaymentAttempt : order
  User ||--o{ PaymentAttempt : actor
  LedgerJournal o|--o| PaymentAttempt : journal
  PaymentAttempt {
    uuid id PK
    string operationKey UK
    string installment
    int termsVersion
    string currency FK
    bigint units
    string status
    string failureCode
    string providerReference UK
    boolean simulated
    datetime createdAt
    uuid orderId FK
    uuid actorId FK
    uuid journalId FK,UK
  }
  MarketOrder ||--o| Settlement : order
  LedgerJournal ||--o| Settlement : journal
  AdminDecision o|--o| Settlement : decision
  ResolutionProposal o|--o| Settlement : proposal
  Settlement {
    uuid id PK
    string currency FK
    bigint heldUnits
    string mode
    string reason
    string operationKey UK
    datetime createdAt
    uuid orderId FK,UK
    uuid journalId FK,UK
    uuid decisionId FK,UK
    uuid proposalId FK,UK
  }
  Settlement ||--o{ Allocation : settlement
  LedgerAccount ||--o{ Allocation : recipient
  Allocation {
    uuid id PK
    string currency FK
    string kind
    bigint units
    uuid settlementId FK
    uuid recipientId FK
  }
  User ||--o{ IdempotencyRecord : actor
  IdempotencyRecord {
    uuid id PK
    string route
    string key
    string requestHash
    json response
    int httpStatus
    datetime expiresAt
    datetime createdAt
    datetime updatedAt
    uuid actorId FK
  }
```

## Delivery

```mermaid
erDiagram
  City ||--o{ DeliveryRate : city
  User ||--o{ DeliveryRate : admin
  DeliveryRate {
    uuid id PK
    string method
    string currency
    bigint feeUnits
    int version
    datetime effectiveAt
    datetime createdAt
    datetime updatedAt
    uuid cityId FK
    uuid adminId FK
  }
  StoreOrder ||--o| Delivery : storeOrder
  DeliveryRate o|--o{ Delivery : rate
  City ||--o{ Delivery : city
  Area o|--o{ Delivery : area
  Delivery {
    uuid id PK
    string method
    string status
    string currency
    bigint feeUnits
    json termsSnapshot
    int termsVersion
    datetime requestedAt
    datetime droppedOffAt
    datetime createdAt
    datetime updatedAt
    uuid storeOrderId FK,UK
    uuid rateId FK
    uuid cityId FK
    uuid areaId FK
  }
  LedgerJournal o|--o| DeliveryTermsRevision : journal
  Delivery ||--o{ DeliveryTermsRevision : delivery
  User ||--o{ DeliveryTermsRevision : proposedBy
  DeliveryTermsRevision {
    uuid id PK
    int version
    string method
    string currency FK
    bigint feeUnits
    bigint previousFeeUnits
    uuid journalId FK,UK
    datetime promisedAt
    string reason
    datetime buyerApprovedAt
    datetime appliedAt
    datetime createdAt
    datetime updatedAt
    uuid deliveryId FK
    uuid proposedById FK
  }
  Delivery ||--o{ DriverAssignment : delivery
  BusinessProfile ||--o{ DriverAssignment : driver
  DriverAssignment {
    uuid id PK
    string status
    datetime acceptedAt
    datetime endedAt
    datetime createdAt
    datetime updatedAt
    uuid deliveryId FK
    uuid driverId FK
  }
  Delivery ||--o{ DeliveryEvent : delivery
  DriverAssignment o|--o{ DeliveryEvent : assignment
  User ||--o{ DeliveryEvent : actor
  FileAsset o|--o{ DeliveryEvent : proof
  DeliveryEvent {
    uuid id PK
    string type
    string notes
    boolean verified
    datetime occurredAt
    uuid deliveryId FK
    uuid assignmentId FK
    uuid actorId FK
    uuid proofId FK
  }
```

## Cases, chat and verified reviews

```mermaid
erDiagram
  MarketOrder ||--o{ CaseRecord : order
  User o|--o{ CaseRecord : opener
  User o|--o{ CaseRecord : handlingAdmin
  CaseRecord {
    uuid id PK
    string kind
    string status
    string reason
    datetime evidenceDeadlineAt
    string pausedState
    json pausedReview
    datetime resolvedAt
    datetime createdAt
    datetime updatedAt
    uuid orderId FK
    uuid openerId FK
    uuid handlingAdminId FK
  }
  CaseRecord ||--o{ CaseParty : case
  User ||--o{ CaseParty : user
  CaseParty {
    uuid id PK
    string role
    datetime notifiedAt
    datetime evidenceDeadlineAt
    datetime createdAt
    datetime updatedAt
    uuid caseId FK
    uuid userId FK
  }
  CaseRecord ||--o{ CaseEvidence : case
  User ||--o{ CaseEvidence : submitter
  FileAsset o|--o{ CaseEvidence : file
  CaseEvidence {
    uuid id PK
    string text
    string visibility
    string lateReason
    datetime createdAt
    datetime updatedAt
    uuid caseId FK
    uuid submitterId FK
    uuid fileId FK
  }
  CaseRecord ||--o{ ResolutionProposal : case
  User ||--o{ ResolutionProposal : proposedBy
  ResolutionProposal {
    uuid id PK
    string kind
    int version
    bigint sellerAwardUnits
    bigint sellerDeliveryUnits
    bigint driverAwardUnits
    string reason
    string scope
    datetime newDueAt
    json inventoryReturns
    datetime agreementDeadlineAt
    datetime createdAt
    datetime updatedAt
    uuid caseId FK
    uuid proposedById FK
  }
  ResolutionProposal ||--o{ ProposalApproval : proposal
  User ||--o{ ProposalApproval : user
  ProposalApproval {
    uuid id PK
    string decision
    datetime createdAt
    datetime updatedAt
    uuid proposalId FK
    uuid userId FK
  }
  CaseRecord ||--o| AdminDecision : case
  User ||--o{ AdminDecision : admin
  AdminDecision {
    uuid id PK
    string reason
    string substantiation
    bigint sellerAwardUnits
    bigint sellerDeliveryUnits
    bigint driverAwardUnits
    bigint buyerRefundUnits
    bigint commissionUnits
    string outcome
    datetime createdAt
    uuid caseId FK,UK
    uuid adminId FK
  }
  MarketOrder ||--o{ ChatRoom : order
  ChatRoom {
    uuid id PK
    string kind
    datetime createdAt
    datetime updatedAt
    uuid orderId FK
  }
  ChatRoom ||--o{ ChatMessage : room
  User ||--o{ ChatMessage : sender
  ChatMessage {
    uuid id PK
    uuid clientMessageId
    string body
    datetime createdAt
    uuid roomId FK
    uuid senderId FK
  }
  ChatMessage ||--o{ MessageAttachment : message
  FileAsset ||--o{ MessageAttachment : file
  MessageAttachment {
    uuid id PK
    uuid messageId FK
    uuid fileId FK
  }
  MarketOrder ||--o| Review : order
  User ||--o{ Review : buyer
  BusinessProfile ||--o{ Review : sellerProfile
  Review {
    uuid id PK
    boolean hidden
    datetime createdAt
    datetime updatedAt
    uuid orderId FK,UK
    uuid buyerId FK
    uuid sellerProfileId FK
  }
  Review ||--o{ ReviewVersion : review
  User ||--o{ ReviewVersion : actor
  ReviewVersion {
    uuid id PK
    int version
    int stars
    string body
    datetime createdAt
    uuid reviewId FK
    uuid actorId FK
  }
```

## Notifications, jobs and audit

```mermaid
erDiagram
  OutboxEvent {
    uuid id PK
    uuid aggregateId
    int aggregateVersion
    string type
    json payload
    string deduplicationKey UK
    datetime publishedAt
    datetime claimedUntil
    int attempts
    datetime createdAt
    datetime updatedAt
  }
  MarketOrder ||--o{ ScheduledJob : order
  CaseRecord o|--o{ ScheduledJob : case
  ScheduledJob {
    uuid id PK
    string operationKey UK
    string kind
    int deadlineVersion
    datetime dueAt
    datetime claimedUntil
    string status
    int attempts
    datetime createdAt
    datetime updatedAt
    uuid orderId FK
    uuid caseId FK
  }
  User ||--o{ Notification : user
  OutboxEvent ||--o{ Notification : event
  Notification {
    uuid id PK
    string channel
    string category
    uuid resourceId
    datetime readAt
    datetime createdAt
    datetime updatedAt
    uuid userId FK
    uuid eventId FK
  }
  User ||--o{ DeviceToken : user
  DeviceToken {
    uuid id PK
    string token UK
    string platform
    datetime revokedAt
    datetime createdAt
    datetime updatedAt
    uuid userId FK
  }
  Notification ||--o{ NotificationDelivery : notification
  DeviceToken o|--o{ NotificationDelivery : device
  NotificationDelivery {
    uuid id PK
    string channel
    string status
    int attempts
    datetime nextAttemptAt
    string errorCode
    string providerTicketId
    datetime providerAcceptedAt
    datetime receiptCheckedAt
    datetime createdAt
    datetime updatedAt
    uuid notificationId FK
    uuid deviceId FK
  }
  User o|--o{ AuditRecord : actor
  AuditRecord {
    uuid id PK
    string action
    uuid aggregateId
    string requestId
    json metadata
    datetime createdAt
    uuid actorId FK
  }
```

## PostgreSQL invariants beyond Prisma notation

The domain_constraints migration supplies partial unique indexes for one active business profile, one active driver assignment, successful installment/adjustment uniqueness, one unresolved financial case, platform/wallet accounts, and nullable global/city-wide scopes. It adds provider/time exclusion with btree_gist; minor-unit, stock, price, review, deadline and geographic parent checks; exact service split and itemized totals; and deferred cross-row integrity checks.

Ledger entries and journals are immutable and must be inserted in one transaction. Entry triggers maintain account and escrow balances; direct balance writes and late journal appends fail. Deferred checks require at least two balanced entries in one currency. Settlement uniqueness, grouped recipient credits, held-unit conservation, snapshotted commission, recipient ownership, case gating and review eligibility are checked before commit. Historical records use RESTRICT rather than cascading deletes.

Database constraints do not replace authenticated backend policies. Transaction-safe financial application commands coordinate holds, inventory, cases, settlement, audit, idempotency and outbox. Cancellation negotiation, revisions, delivery changes, worker scheduling, HTTP controllers and client integration remain subsequent application slices; their contracts are specified now. See [database implementation notes](DATABASE.md) for lock ordering, privileges, migration and seed instructions.
