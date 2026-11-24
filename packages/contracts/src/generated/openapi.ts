export interface paths {
  '/api/v1/admin/audit': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * listAuditHistory
     * @description Active authorized ADMIN; same complete actions available to web and mobile. Private case evidence additionally requires handling assignment.
     */
    get: operations['listAuditHistory'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/cases': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * listAdminCases
     * @description Active authorized ADMIN; same complete actions available to web and mobile. Private case evidence additionally requires handling assignment.
     */
    get: operations['listAdminCases'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/cases/{caseId}/assign': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * assignAdminCase
     * @description Case resolution conserves held units, computes commission/refund on backend and never charges unfunded balance. Global starts at 0%; configured workspace zero overrides global. Commission changes never rewrite snapshots. Topups are fictional simulator credits only. Active authorized ADMIN; same complete actions available to web and mobile. Private case evidence additionally requires handling assignment.
     */
    post: operations['assignAdminCase'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/cases/{caseId}/resolve': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * resolveAdminCase
     * @description Case resolution conserves held units, computes commission/refund on backend and never charges unfunded balance. Global starts at 0%; configured workspace zero overrides global. Commission changes never rewrite snapshots. Topups are fictional simulator credits only. Active authorized ADMIN; same complete actions available to web and mobile. Private case evidence additionally requires handling assignment.
     */
    post: operations['resolveAdminCase'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/cases/{caseId}/resume-final-payment': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Authorize documented overdue resumption
     * @description Must record participant agreement/new deadline and resolve case without allocation. No deposit forfeiture or automatic balance charge. Active authorized ADMIN; same complete actions available to web and mobile. Private case evidence additionally requires handling assignment.
     */
    post: operations['resumeOverdueFinalPayment'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/commission-rates': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * listCommissionRates
     * @description Active authorized ADMIN; same complete actions available to web and mobile. Private case evidence additionally requires handling assignment.
     */
    get: operations['listCommissionRates'];
    put?: never;
    /**
     * configureCommission
     * @description Case resolution conserves held units, computes commission/refund on backend and never charges unfunded balance. Global starts at 0%; configured workspace zero overrides global. Commission changes never rewrite snapshots. Topups are fictional simulator credits only. Active authorized ADMIN; same complete actions available to web and mobile. Private case evidence additionally requires handling assignment.
     */
    post: operations['configureCommission'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/deliveries/{deliveryId}/reassign': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * reassignDelivery
     * @description Case resolution conserves held units, computes commission/refund on backend and never charges unfunded balance. Global starts at 0%; configured workspace zero overrides global. Commission changes never rewrite snapshots. Topups are fictional simulator credits only. Active authorized ADMIN; same complete actions available to web and mobile. Private case evidence additionally requires handling assignment.
     */
    post: operations['reassignDelivery'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/delivery-rates': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * listDeliveryRates
     * @description Active authorized ADMIN; same complete actions available to web and mobile. Private case evidence additionally requires handling assignment.
     */
    get: operations['listDeliveryRates'];
    put?: never;
    /**
     * configureDeliveryRate
     * @description Case resolution conserves held units, computes commission/refund on backend and never charges unfunded balance. Global starts at 0%; configured workspace zero overrides global. Commission changes never rewrite snapshots. Topups are fictional simulator credits only. Active authorized ADMIN; same complete actions available to web and mobile. Private case evidence additionally requires handling assignment.
     */
    post: operations['configureDeliveryRate'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/driver-zones': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * listDriverZones
     * @description Active authorized ADMIN; same complete actions available to web and mobile. Private case evidence additionally requires handling assignment.
     */
    get: operations['listDriverZones'];
    put?: never;
    /**
     * assignDriverZone
     * @description Case resolution conserves held units, computes commission/refund on backend and never charges unfunded balance. Global starts at 0%; configured workspace zero overrides global. Commission changes never rewrite snapshots. Topups are fictional simulator credits only. Active authorized ADMIN; same complete actions available to web and mobile. Private case evidence additionally requires handling assignment.
     */
    post: operations['assignDriverZone'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/driver-zones/{zoneId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    /**
     * Remove driver zone with commitment checks
     * @description Active authorized ADMIN; same complete actions available to web and mobile. Private case evidence additionally requires handling assignment.
     */
    delete: operations['removeDriverZone'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/moderation': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * listModerationQueue
     * @description Active authorized ADMIN; same complete actions available to web and mobile. Private case evidence additionally requires handling assignment.
     */
    get: operations['listModerationQueue'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/moderation/{resourceId}/decision': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * moderateResource
     * @description Case resolution conserves held units, computes commission/refund on backend and never charges unfunded balance. Global starts at 0%; configured workspace zero overrides global. Commission changes never rewrite snapshots. Topups are fictional simulator credits only. Active authorized ADMIN; same complete actions available to web and mobile. Private case evidence additionally requires handling assignment.
     */
    post: operations['moderateResource'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/restrictions/{restrictionId}/revoke': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Revoke restriction with audit reason
     * @description Active authorized ADMIN; same complete actions available to web and mobile. Private case evidence additionally requires handling assignment.
     */
    post: operations['revokeRestriction'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/reviews/{reviewId}/moderate': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * moderateReview
     * @description Case resolution conserves held units, computes commission/refund on backend and never charges unfunded balance. Global starts at 0%; configured workspace zero overrides global. Commission changes never rewrite snapshots. Topups are fictional simulator credits only. Active authorized ADMIN; same complete actions available to web and mobile. Private case evidence additionally requires handling assignment.
     */
    post: operations['moderateReview'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/simulator/topups': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * simulateWalletTopUp
     * @description Case resolution conserves held units, computes commission/refund on backend and never charges unfunded balance. Global starts at 0%; configured workspace zero overrides global. Commission changes never rewrite snapshots. Topups are fictional simulator credits only. Active authorized ADMIN; same complete actions available to web and mobile. Private case evidence additionally requires handling assignment.
     */
    post: operations['simulateWalletTopUp'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/users/{userId}/restrictions': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * restrictAccount
     * @description Case resolution conserves held units, computes commission/refund on backend and never charges unfunded balance. Global starts at 0%; configured workspace zero overrides global. Commission changes never rewrite snapshots. Topups are fictional simulator credits only. Active authorized ADMIN; same complete actions available to web and mobile. Private case evidence additionally requires handling assignment.
     */
    post: operations['restrictAccount'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/auth/forgot-password': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * forgotPassword
     * @description Public. Registration cannot grant ADMIN; refresh rotates once and detects reuse.
     */
    post: operations['forgotPassword'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/auth/login': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * login
     * @description Public. Registration cannot grant ADMIN; refresh rotates once and detects reuse.
     */
    post: operations['login'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/auth/logout': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Revoke current session
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    post: operations['logout'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/auth/me': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Current authenticated identity
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    get: operations['getSessionUser'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/auth/refresh': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * refreshSession
     * @description Public. Registration cannot grant ADMIN; refresh rotates once and detects reuse.
     */
    post: operations['refreshSession'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/auth/register': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * register
     * @description Public. Registration cannot grant ADMIN; refresh rotates once and detects reuse.
     */
    post: operations['register'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/auth/reset-password': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * resetPassword
     * @description Public. Registration cannot grant ADMIN; refresh rotates once and detects reuse.
     */
    post: operations['resetPassword'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/business-profiles': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Own active and archived business profiles
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    get: operations['listOwnBusinessProfiles'];
    put?: never;
    /**
     * Create draft profile
     * @description A draft does not activate a new workspace; activation uses atomic switching checks. One active business profile per user. Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    post: operations['createBusinessProfile'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/business-profiles/{profileId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Edit owned active workspace profile
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    patch: operations['updateBusinessProfile'];
    trace?: never;
  };
  '/api/v1/business-profiles/{profileId}/portfolio': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Add portfolio item
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    post: operations['createPortfolioItem'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/business-profiles/{profileId}/portfolio/{itemId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    /**
     * Remove owned portfolio reference
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    delete: operations['removePortfolioItem'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/business-profiles/{profileId}/public-venue': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Read venue publication settings
     * @description Owner of the active professional or store workspace.
     */
    get: operations['getPublicVenue'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Publish or withdraw a customer-facing venue
     * @description Owner of the active professional or store workspace.
     */
    patch: operations['setPublicVenue'];
    trace?: never;
  };
  '/api/v1/business-profiles/{profileId}/reactivate': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Reactivate owned archived profile
     * @description Same commitment checks as switch; existing restrictions and moderation survive. Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    post: operations['reactivateBusinessProfile'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/business-profiles/{profileId}/service-areas': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Owned coverage
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    get: operations['listServiceAreas'];
    put?: never;
    /**
     * Add owned seller coverage
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    post: operations['addServiceArea'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/business-profiles/{profileId}/service-areas/{areaId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    /**
     * Remove owned coverage
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    delete: operations['removeServiceArea'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/business-profiles/switch': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Automatically switch when eligible
     * @description Atomic zero active orders, open cases, pending delivery or unsettled escrow checks across buyer/provider/driver commitments. Archive previous profile; retain history. Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    post: operations['switchBusinessWorkspace'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/cases/{caseId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Authorized case and evidence
     * @description Buyer/provider or assigned handling admin; private evidence visibility filtered; driver explicitly scoped evidence contribution only.
     */
    get: operations['getCase'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/cases/{caseId}/evidence': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Authorized paginated case evidence
     * @description Case parties see shared and own submissions; private-admin evidence only handling admin. Drivers see only explicitly granted delivery evidence.
     */
    get: operations['listEvidence'];
    put?: never;
    /**
     * Append immutable evidence
     * @description Case party during own 72h window; late evidence needs handling-admin reason; files authorized. No deadline-based automatic award.
     */
    post: operations['submitEvidence'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/cases/{caseId}/proposals': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Documented proposal history
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    get: operations['listProposals'];
    put?: never;
    /**
     * Document cancellation split/revision
     * @description Buyer/provider; proposal alone never moves money; source case keeps funds frozen.
     */
    post: operations['proposeResolution'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/cases/{caseId}/proposals/{proposalId}/accept': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * accept proposal
     * @description Participating buyer/provider, exact proposal version; both approvals needed. Rejected/72h unanswered cancellation split -> admin.
     */
    post: operations['acceptResolutionProposal'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/cases/{caseId}/proposals/{proposalId}/reject': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * reject proposal
     * @description Participating buyer/provider, exact proposal version; both approvals needed. Rejected/72h unanswered cancellation split -> admin.
     */
    post: operations['rejectResolutionProposal'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/cases/{caseId}/revisions/accept': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Mutually accept recorded revision plan
     * @description Both buyer/provider approve same recorded plan; no new charge if already fully funded; fresh 72h review after resubmission.
     */
    post: operations['acceptRevisionPlan'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/categories': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Workspace categories
     * @description Public.
     */
    get: operations['listCategories'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/deliveries/{deliveryId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Authorized delivery projection
     * @description Order buyer/seller/current driver/handling admin; contact/address only for fulfillment; no service files or private evidence.
     */
    get: operations['getDelivery'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/deliveries/{deliveryId}/accept': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * acceptDeliveryJob
     * @description If-Match is the parent order version; quote/delivery versions are separate snapshots. Eligible active driver; one assignment wins atomically.
     */
    post: operations['acceptDeliveryJob'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/deliveries/{deliveryId}/dropoff': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * recordDropoff
     * @description If-Match is the parent order version; quote/delivery versions are separate snapshots. Assigned driver or seller; proof status explicit; without proof buyer confirmation/admin required.
     */
    post: operations['recordDropoff'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/deliveries/{deliveryId}/exception': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * reportDeliveryException
     * @description If-Match is the parent order version; quote/delivery versions are separate snapshots. Order participant/current driver; funds held; no automatic payout or forfeiture.
     */
    post: operations['reportDeliveryException'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/deliveries/{deliveryId}/fallback': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * chooseDeliveryFallback
     * @description If-Match is the parent order version; quote/delivery versions are separate snapshots. Seller proposes; buyer approves changed terms; full refund if fulfillment unavailable.
     */
    post: operations['chooseDeliveryFallback'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/deliveries/{deliveryId}/pickup': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * recordPickup
     * @description If-Match is the parent order version; quote/delivery versions are separate snapshots. Assigned driver or seller for seller delivery; immutable pickup history.
     */
    post: operations['recordPickup'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/deliveries/{deliveryId}/release-assignment': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * releaseDriverAssignment
     * @description If-Match is the parent order version; quote/delivery versions are separate snapshots. Current driver or seller before pickup; revoke previous grants.
     */
    post: operations['releaseDriverAssignment'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/deliveries/{deliveryId}/terms': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Propose changed delivery terms
     * @description Backend computes revised fee; no silent debit. Buyer approval required before applying price/method/promised-term changes. Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    post: operations['proposeDeliveryTerms'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/deliveries/{deliveryId}/terms/{revisionId}/approve': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Buyer approves exact revised terms
     * @description Buyer only; explicit delta hold/refund, original terms retained if funding fails.
     */
    post: operations['approveDeliveryTerms'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/delivery-options': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Preview serviceability, methods and fees
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    get: operations['getDeliveryOptions'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/devices': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Register own Expo device token
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    post: operations['registerDevice'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/devices/{deviceId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    /**
     * Revoke own device token
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    delete: operations['revokeDevice'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/discovery/local/search': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Find nearby stores and professionals
     * @description Read-only search over published public locations and service coverage.
     */
    post: operations['searchLocal'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/driver/assignments': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Own assignments
     * @description Active or historical assigned driver; completed history redacted.
     */
    get: operations['listDriverAssignments'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/driver/jobs': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Eligible redacted ready jobs
     * @description Active driver in assigned city/governorate; no exact address/contact until assignment.
     */
    get: operations['listDriverJobs'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/files/{fileId}/download': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Authorized private file stream
     * @description Backend reauthorizes each request. FINAL_DELIVERABLE requires full service funding. Driver limited to current delivery attachments; handling admin case-scoped.
     */
    get: operations['downloadFile'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/files/{fileId}/status': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Own/authorized scan status
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    get: operations['getFileStatus'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/files/uploads': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Quarantine an authorized file
     * @description Authenticated owner with target order/case/workspace authorization; driver delivery-only scope.
     */
    post: operations['uploadFile'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/geography/areas': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Shared Syrian geography
     * @description Public; canonical hierarchy IDs.
     */
    get: operations['listAreas'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/geography/cities': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Shared Syrian geography
     * @description Public; canonical hierarchy IDs.
     */
    get: operations['listCities'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/geography/governorates': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Shared Syrian geography
     * @description Public; canonical hierarchy IDs.
     */
    get: operations['listGovernorates'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/health': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Process liveness
     * @description Public liveness; not database readiness.
     */
    get: operations['getHealth'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/listings': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Browse published listings
     * @description Public published records only; supported filters/sort are validated server-side.
     */
    get: operations['listListings'];
    put?: never;
    /**
     * Create owned Listing
     * @description Owning active workspace of matching type; verified account. Price changes validated by backend; order snapshots stay fixed.
     */
    post: operations['createListing'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/listings/{listingId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Published Listing
     * @description Public published record; inaccessible archived/hidden records return 404.
     */
    get: operations['getListing'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Edit owned Listing
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    patch: operations['updateListing'];
    trace?: never;
  };
  '/api/v1/listings/{listingId}/deactivate': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Deactivate owned Listing
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    post: operations['deactivateListing'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/listings/{listingId}/publish': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Publish validated owned Listing
     * @description Owning active workspace, verified account, complete bilingual content and clean assets; moderation restrictions survive archival.
     */
    post: operations['publishListing'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/me': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Own profile
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    get: operations['getMe'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Update own display name/locale
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    patch: operations['updateMe'];
    trace?: never;
  };
  '/api/v1/me/addresses': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Own saved addresses
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    get: operations['listAddresses'];
    put?: never;
    /**
     * Save own address
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    post: operations['createAddress'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/me/addresses/{addressId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    /**
     * Archive own address
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    delete: operations['archiveAddress'];
    options?: never;
    head?: never;
    /**
     * Update own address
     * @description Existing orders retain immutable address snapshots. Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    patch: operations['updateAddress'];
    trace?: never;
  };
  '/api/v1/notifications': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Own persistent notices
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    get: operations['listNotifications'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/notifications/{notificationId}/read': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Mark own notice read
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    post: operations['readNotification'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/notifications/read-all': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Mark own notices read
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    post: operations['readAllNotifications'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/operations/{operationId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Resolve unknown outcome after timeout
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    get: operations['getOperation'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Own purchase/provider orders
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    get: operations['listOrders'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Private order detail
     * @description Buyer/provider or assigned handling admin; drivers use delivery projection, never service/financial details.
     */
    get: operations['getOrder'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}/accept-booking': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * acceptBooking
     * @description If-Match is the parent order version; quote/delivery versions are separate snapshots. Owning professional accepts AND confirms requested slot.
     */
    post: operations['acceptBooking'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}/accept-extension': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * acceptExtension
     * @description If-Match is the parent order version; quote/delivery versions are separate snapshots. Other participant explicitly agrees new deadline.
     */
    post: operations['acceptExtension'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}/accept-schedule': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * acceptSchedule
     * @description If-Match is the parent order version; quote/delivery versions are separate snapshots. Buyer explicitly accepts alternate slot before funding.
     */
    post: operations['acceptSchedule'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}/accept-store': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * acceptStoreOrder
     * @description If-Match is the parent order version; quote/delivery versions are separate snapshots. Owning store seller within 24h of hold.
     */
    post: operations['acceptStoreOrder'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}/actions': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Server-computed allowed commands
     * @description A hint, not authority; every command rechecks guards under lock. Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    get: operations['getAllowedOrderActions'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}/agree': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * agreeOrder
     * @description If-Match is the parent order version; quote/delivery versions are separate snapshots. Buyer and provider approve identical scope/price.
     */
    post: operations['agreeOrder'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}/cancel': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * cancelOrder
     * @description If-Match is the parent order version; quote/delivery versions are separate snapshots. Buyer/provider; full refund before work/store acceptance, otherwise freeze/propose/admin.
     */
    post: operations['cancelOrder'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}/cases': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Own order cases
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    get: operations['listOrderCases'];
    put?: never;
    /**
     * Freeze unsettled held funds or create support case
     * @description Buyer/provider after hold and before settlement; terminal orders allow support only. Existing case reused; both get 72h evidence.
     */
    post: operations['openCase'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}/chat-rooms': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Authorized order/delivery threads
     * @description Buyer/provider shared thread; assigned driver delivery thread only; handling admin audited case scope.
     */
    get: operations['getOrderRooms'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}/confirm': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * confirmReceipt
     * @description If-Match is the parent order version; quote/delivery versions are separate snapshots. Buyer; fully held and no case/revision, physical proof or explicit confirmation.
     */
    post: operations['confirmReceipt'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}/deliver': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * deliverService
     * @description If-Match is the parent order version; quote/delivery versions are separate snapshots. Owning provider; both holds before final files/on-site handover.
     */
    post: operations['deliverService'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}/delivery/request-driver': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * requestPlatformDriver
     * @description If-Match is the parent order version; quote/delivery versions are separate snapshots. Owning seller; request can be recorded at checkout, offered only when ready.
     */
    post: operations['requestPlatformDriver'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}/inspection-schedule': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Agree free inspection schedule
     * @description Both parties must accept same inspection version; no inspection charge; explicit revised response deadline.
     */
    post: operations['agreeInspectionSchedule'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}/messages': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Immutable room messages
     * @description Room membership rechecked per request; driver cannot read shared service thread.
     */
    get: operations['listMessages'];
    put?: never;
    /**
     * Append message with deduplication
     * @description Authorized room member; immutable text/files, at least text or attachment; dedupe sender/room/clientMessageId.
     */
    post: operations['sendMessage'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}/milestones': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Order progress milestones
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    get: operations['listMilestones'];
    put?: never;
    /**
     * Add non-billing progress milestone
     * @description Owning freelancer; milestones never fund or release money.
     */
    post: operations['createMilestone'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}/payments': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Order payment references
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    get: operations['listOrderPayments'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}/payments/balance': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Hold balance in simulated escrow
     * @description Deposit is rounded one-third; balance is subtraction. Deposit deadline 48h. Balance needs readiness and 72h window; overdue creates one admin case and never forfeits deposit. Order buyer only; no client amount/rate/state accepted. Repeating a successful installment never adds another hold.
     */
    post: operations['holdBalance'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}/payments/deposit': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Hold deposit in simulated escrow
     * @description Deposit is rounded one-third; balance is subtraction. Deposit deadline 48h. Balance needs readiness and 72h window; overdue creates one admin case and never forfeits deposit. Order buyer only; no client amount/rate/state accepted. Repeating a successful installment never adds another hold.
     */
    post: operations['holdDeposit'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}/progress': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * recordProgress
     * @description If-Match is the parent order version; quote/delivery versions are separate snapshots. Owning provider; progress/milestones are nonfinancial.
     */
    post: operations['recordProgress'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}/propose-schedule': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * proposeSchedule
     * @description If-Match is the parent order version; quote/delivery versions are separate snapshots. Owning professional proposes alternate slot; no deposit yet.
     */
    post: operations['proposeSchedule'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}/quotes': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Versioned itemized quotes
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    get: operations['listOrderQuotes'];
    put?: never;
    /**
     * Send itemized quote
     * @description Owning professional; server sums line items, fixes currency and sets 72h response deadline.
     */
    post: operations['sendQuote'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}/ready': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * markReady
     * @description If-Match is the parent order version; quote/delivery versions are separate snapshots. Owning provider; documented readiness starts 72h balance timer; reminders at 24/48h.
     */
    post: operations['markReady'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}/ready-for-delivery': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * markStoreReady
     * @description If-Match is the parent order version; quote/delivery versions are separate snapshots. Owning store seller; preparation complete.
     */
    post: operations['markStoreReady'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}/reject': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * rejectOrder
     * @description If-Match is the parent order version; quote/delivery versions are separate snapshots. Provider declines request or buyer declines proposed agreement; no hold.
     */
    post: operations['rejectOrder'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}/request-extension': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * requestExtension
     * @description If-Match is the parent order version; quote/delivery versions are separate snapshots. Participant; missed agreed deadline offers extension/cancel; contested refund freezes/admin.
     */
    post: operations['requestExtension'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}/review': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Create one verified review
     * @description Order buyer, COMPLETED order, not self-review; one per order.
     */
    post: operations['createReview'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}/settlement': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Recorded conserved allocation
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    get: operations['getSettlement'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}/start': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * startWork
     * @description If-Match is the parent order version; quote/delivery versions are separate snapshots. Owning provider; deposit held, no case.
     */
    post: operations['startWork'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}/submissions': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Authorized readiness and final submission files
     * @description Buyer/provider or handling admin; final files omitted/gated until both holds, drivers denied.
     */
    get: operations['listSubmissions'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/{orderId}/timeline': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Immutable order timeline
     * @description Buyer/provider or handling admin. Driver delivery events are exposed through delivery detail only.
     */
    get: operations['getOrderTimeline'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/freelance': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * createFreelanceOrder
     * @description Backend computes totals and serviceability. Store preview is unfunded DRAFT, no stock reservation; quote valid 15 minutes. Buyer, including a business user buying; not own seller profile.
     */
    post: operations['createFreelanceOrder'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/inspection-requests': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * requestInspectionQuote
     * @description Backend computes totals and serviceability. Store preview is unfunded DRAFT, no stock reservation; quote valid 15 minutes. Buyer, including a business user buying; not own seller profile.
     */
    post: operations['requestInspectionQuote'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/professional-bookings': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * createBooking
     * @description Backend computes totals and serviceability. Store preview is unfunded DRAFT, no stock reservation; quote valid 15 minutes. Buyer, including a business user buying; not own seller profile.
     */
    post: operations['createBooking'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/store-checkout': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Atomically hold total and reserve stock
     * @description One seller and one currency. Full items plus agreed delivery. No amount accepted from buyer; failure advances neither order nor stock. Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    post: operations['checkoutStore'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/orders/store-preview': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * previewStoreCheckout
     * @description Backend computes totals and serviceability. Store preview is unfunded DRAFT, no stock reservation; quote valid 15 minutes. Buyer, including a business user buying; not own seller profile.
     */
    post: operations['previewStoreCheckout'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/products': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Browse published products
     * @description Public published records only; supported filters/sort are validated server-side.
     */
    get: operations['listProducts'];
    put?: never;
    /**
     * Create owned Product
     * @description Owning active workspace of matching type; verified account. Price changes validated by backend; order snapshots stay fixed.
     */
    post: operations['createProduct'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/products/{productId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Published Product
     * @description Public published record; inaccessible archived/hidden records return 404.
     */
    get: operations['getProduct'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Edit owned Product
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    patch: operations['updateProduct'];
    trace?: never;
  };
  '/api/v1/products/{productId}/deactivate': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Deactivate owned Product
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    post: operations['deactivateProduct'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/products/{productId}/publish': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Publish validated owned Product
     * @description Owning active workspace, verified account, complete bilingual content and clean assets; moderation restrictions survive archival.
     */
    post: operations['publishProduct'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/products/{productId}/stock': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Set stock with reservation checks
     * @description Cannot reduce on-hand below reserved stock; atomic conditional update and audit. Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    patch: operations['setProductStock'];
    trace?: never;
  };
  '/api/v1/profiles/{profileId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Published public profile
     * @description Public published projection; private contact/history excluded.
     */
    get: operations['getPublicProfile'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/profiles/{profileId}/reviews': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Published verified reviews
     * @description Public visible reviews only.
     */
    get: operations['listVerifiedReviews'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/quotes/{quoteId}/approve': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * approve itemized quote
     * @description If-Match is the parent order version; quote/delivery versions are separate snapshots. Buyer of quote order; exact version, fixed total and schedule; rejection free.
     */
    post: operations['approveQuote'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/quotes/{quoteId}/reject': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * reject itemized quote
     * @description If-Match is the parent order version; quote/delivery versions are separate snapshots. Buyer of quote order; exact version, fixed total and schedule; rejection free.
     */
    post: operations['rejectQuote'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/realtime/ticket': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Single-use browser socket ticket
     * @description Short-lived JWT-derived capability, 60s, current session/room membership still rechecked. Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    post: operations['createRealtimeTicket'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/reviews/{reviewId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Edit own review once within seven days
     * @description Original buyer, one edit, immutable prior version; admin may hide but never rewrite rating/text.
     */
    patch: operations['editReview'];
    trace?: never;
  };
  '/api/v1/stores': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Browse published stores
     * @description Public published records only; supported filters/sort are validated server-side.
     */
    get: operations['listStores'];
    put?: never;
    /**
     * Create owned Store
     * @description Owning active workspace of matching type; verified account. Price changes validated by backend; order snapshots stay fixed.
     */
    post: operations['createStore'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/stores/{storeId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Published Store
     * @description Public published record; inaccessible archived/hidden records return 404.
     */
    get: operations['getStore'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Edit owned Store
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    patch: operations['updateStore'];
    trace?: never;
  };
  '/api/v1/stores/{storeId}/deactivate': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Deactivate owned Store
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    post: operations['deactivateStore'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/stores/{storeId}/publish': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Publish validated owned Store
     * @description Owning active workspace, verified account, complete bilingual content and clean assets; moderation restrictions survive archival.
     */
    post: operations['publishStore'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/wallets': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Own SYP and USD wallets
     * @description Own wallet only; business users retain purchasing capabilities.
     */
    get: operations['listWallets'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/wallets/{currency}/transactions': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Own immutable transaction history
     * @description Authenticated owner/participant; backend role, active-workspace, ownership and restriction checks.
     */
    get: operations['listWalletTransactions'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    AcceptInput: {
      /** @constant */
      accepted: true;
    };
    Address: {
      areaId: string | null;
      /** Format: uuid */
      cityId: string;
      contactName: string;
      contactPhone: string;
      /** Format: date-time */
      createdAt: string;
      details: string;
      /** Format: uuid */
      id: string;
      label: string;
      /** @description Optional private destination. Omit to preserve on edit, or send null to clear. */
      pin?: components['schemas']['GeoPoint'] | null;
    };
    AddressInput: {
      areaId?: string | null;
      /** Format: uuid */
      cityId: string;
      contactName: string;
      contactPhone: string;
      details: string;
      label: string;
      /** @description Optional private destination. Omit to preserve on edit, or send null to clear. */
      pin?: components['schemas']['GeoPoint'] | null;
    };
    AddressPage: {
      items: components['schemas']['Address'][];
      nextCursor: string | null;
    };
    AgreementInput: {
      /** @constant */
      accepted: true;
      /** Format: date-time */
      dueAt: string;
      scope: string;
    };
    /** @enum {string} */
    AllocationKind:
      'BUYER_REFUND' | 'SELLER_NET' | 'SELLER_DELIVERY' | 'DRIVER_PAYOUT' | 'COMMISSION';
    AllowedAction: {
      deadlineAt: string | null;
      enabled: boolean;
      operationId: string;
      reasonCode: components['schemas']['ErrorCode'] | null;
    };
    AllowedActionPage: {
      items: components['schemas']['AllowedAction'][];
      nextCursor: string | null;
    };
    ApiError: {
      error: {
        code: components['schemas']['ErrorCode'];
        details: components['schemas']['ErrorDetail'][];
        message: string;
        requestId: string;
      };
    };
    Area: {
      center?: components['schemas']['GeoPoint'] | null;
      /** Format: uuid */
      cityId: string;
      /** Format: uuid */
      id: string;
      nameAr: string;
      nameEn: string;
    };
    AreaPage: {
      items: components['schemas']['Area'][];
      nextCursor: string | null;
    };
    /** @enum {string} */
    AssignmentStatus: 'ASSIGNED' | 'PICKED_UP' | 'COMPLETED' | 'RELEASED' | 'CANCELLED';
    AuditRecord: {
      action: string;
      actorId: string | null;
      /** Format: uuid */
      aggregateId: string;
      /** Format: date-time */
      createdAt: string;
      /** Format: uuid */
      id: string;
      /** @description Redacted allowlisted audit metadata; never passwords, tokens or private file URLs. */
      metadata: {
        [key: string]: unknown;
      };
      requestId: string;
    };
    AuditRecordPage: {
      items: components['schemas']['AuditRecord'][];
      nextCursor: string | null;
    };
    Booking: {
      buyerAcceptedAt: string | null;
      /** Format: uuid */
      id: string;
      proposedEndsAt: string | null;
      proposedStartsAt: string | null;
      providerAcceptedAt: string | null;
      /** Format: date-time */
      requestedEndsAt: string;
      /** Format: date-time */
      requestedStartsAt: string;
      state: components['schemas']['BookingState'];
    };
    BookingInput: {
      /** Format: uuid */
      addressId: string;
      description?: string;
      /** Format: uuid */
      listingId: string;
      /** Format: date-time */
      startsAt: string;
    };
    /** @enum {string} */
    BookingState: 'REQUESTED' | 'COUNTER_PROPOSED' | 'CONFIRMED' | 'REJECTED' | 'EXPIRED';
    BusinessProfile: {
      bio: string;
      cityId: string | null;
      /** Format: date-time */
      createdAt: string;
      experienceYears: number | null;
      /** Format: uuid */
      id: string;
      languages: {
        languageCode: string;
        proficiency: string;
      }[];
      portfolio: components['schemas']['PortfolioItem'][];
      skills: string[];
      status: components['schemas']['ProfileStatus'];
      title: string;
      trade: string | null;
      type: components['schemas']['BusinessType'];
      /** Format: date-time */
      updatedAt: string;
      /** Format: uuid */
      userId: string;
    };
    BusinessProfilePage: {
      items: components['schemas']['BusinessProfile'][];
      nextCursor: string | null;
    };
    /** @enum {string} */
    BusinessType: 'FREELANCER' | 'PROFESSIONAL' | 'STORE_OWNER' | 'DELIVERY_DRIVER';
    CancelInput: {
      /** @description Exact stock reconciliation agreed with this proposal; required after goods were collected. */
      inventoryReturns?: components['schemas']['InventoryReturn'][];
      proposal?: components['schemas']['ProposalInput'];
      reason: string;
    };
    Case: {
      /** Format: date-time */
      createdAt: string;
      evidence: components['schemas']['Evidence'][];
      handlingAdminId: string | null;
      /** Format: uuid */
      id: string;
      kind: components['schemas']['CaseKind'];
      /** Format: uuid */
      orderId: string;
      parties: {
        /** Format: date-time */
        evidenceDeadlineAt: string;
        /** @enum {unknown} */
        role: 'BUYER' | 'SELLER';
        /** Format: uuid */
        userId: string;
      }[];
      reason: string;
      status: components['schemas']['CaseStatus'];
    };
    CaseInput: {
      evidenceFileIds?: string[];
      /** @enum {unknown} */
      kind: 'DISPUTE' | 'CANCELLATION' | 'DELIVERY_REVIEW' | 'SUPPORT';
      reason: string;
    };
    /** @enum {string} */
    CaseKind: 'DISPUTE' | 'CANCELLATION' | 'FINAL_PAYMENT_OVERDUE' | 'DELIVERY_REVIEW' | 'SUPPORT';
    CasePage: {
      items: components['schemas']['Case'][];
      nextCursor: string | null;
    };
    /** @enum {string} */
    CaseStatus: 'OPEN' | 'ADMIN_REVIEW' | 'REVISION_ACCEPTED' | 'RESOLVED';
    Category: {
      /** Format: uuid */
      id: string;
      nameAr: string;
      nameEn: string;
      parentId: string | null;
      workspace: components['schemas']['Workspace'];
    };
    CategoryPage: {
      items: components['schemas']['Category'][];
      nextCursor: string | null;
    };
    ChatRoom: {
      /** Format: uuid */
      id: string;
      kind: components['schemas']['RoomKind'];
      /** Format: uuid */
      orderId: string;
    };
    ChatRoomPage: {
      items: components['schemas']['ChatRoom'][];
      nextCursor: string | null;
    };
    CheckoutInput: {
      /** Format: uuid */
      draftOrderId: string;
      simulateFailure?: boolean;
      /** @constant */
      termsAccepted: true;
    };
    City: {
      center?: components['schemas']['GeoPoint'] | null;
      /** Format: uuid */
      governorateId: string;
      /** Format: uuid */
      id: string;
      isDistrict: boolean;
      nameAr: string;
      nameEn: string;
    };
    CityPage: {
      items: components['schemas']['City'][];
      nextCursor: string | null;
    };
    CommissionRate: {
      basisPoints: number;
      /** Format: date-time */
      effectiveAt: string;
      /** Format: uuid */
      id: string;
      version: number;
      workspace: components['schemas']['Workspace'] | null;
    };
    CommissionRateInput: {
      basisPoints: number;
      workspace: components['schemas']['Workspace'] | null;
    };
    CommissionRatePage: {
      items: components['schemas']['CommissionRate'][];
      nextCursor: string | null;
    };
    CreateProfileInput: {
      bio: string;
      cityId?: string | null;
      experienceYears?: number | null;
      languages: {
        languageCode: string;
        proficiency: string;
      }[];
      skills: string[];
      title: string;
      trade?: string | null;
      type: components['schemas']['BusinessType'];
    };
    /** @enum {string} */
    Currency: 'SYP' | 'USD';
    Deadline: {
      /** Format: date-time */
      at: string;
      /** @enum {unknown} */
      kind:
        | 'RESPONSE'
        | 'DEPOSIT'
        | 'BALANCE'
        | 'SELLER_ACCEPTANCE'
        | 'REVIEW'
        | 'EVIDENCE'
        | 'CANCELLATION_AGREEMENT';
    };
    DeliverInput: {
      fileIds?: string[];
      /** @enum {unknown} */
      kind: 'DIGITAL_FINAL' | 'ONSITE_HANDOVER';
      note: string;
      /** Format: uuid */
      proofFileId?: string;
    };
    Delivery: {
      /** @description Available on a freshly authorized delivery read. */
      address: components['schemas']['Destination'] | null;
      assignmentId: string | null;
      driverProfileId: string | null;
      droppedOffAt: string | null;
      events: components['schemas']['DeliveryEvent'][];
      fee: components['schemas']['Money'];
      /** Format: uuid */
      id: string;
      method: components['schemas']['DeliveryMethod'];
      /** Format: uuid */
      orderId: string;
      orderVersion: number;
      status: components['schemas']['DeliveryStatus'];
      termsVersion: number;
    };
    DeliveryEvent: {
      /** Format: uuid */
      actorId: string;
      /** Format: uuid */
      id: string;
      notes: string | null;
      /** Format: date-time */
      occurredAt: string;
      proofFileId: string | null;
      type: components['schemas']['DeliveryEventType'];
      verified: boolean;
    };
    /** @enum {string} */
    DeliveryEventType:
      'REQUESTED' | 'ASSIGNED' | 'RELEASED' | 'PICKUP' | 'DROPOFF' | 'EXCEPTION' | 'REASSIGNED';
    DeliveryExceptionInput: {
      evidenceFileIds: string[];
      /** @enum {unknown} */
      kind: 'NO_DRIVER' | 'DELAY' | 'FAILED_PICKUP' | 'FAILED_DROPOFF' | 'LOST_GOODS' | 'CUSTODY';
      reason: string;
    };
    /** @enum {string} */
    DeliveryMethod: 'SELLER' | 'PLATFORM_DRIVER';
    DeliveryOptions: {
      /** Format: uuid */
      cityId: string;
      methods: {
        fee: components['schemas']['Money'];
        method: components['schemas']['DeliveryMethod'];
        /** Format: date-time */
        promisedAt: string;
      }[];
      serviceable: boolean;
    };
    DeliveryRate: {
      /** Format: uuid */
      cityId: string;
      currency: components['schemas']['Currency'];
      /** Format: date-time */
      effectiveAt: string;
      /** @description Price/allocation in stored units, maximum 9000000000000. SYP whole pounds, USD cents. */
      feeUnits: string;
      /** Format: uuid */
      id: string;
      method: components['schemas']['DeliveryMethod'];
      version: number;
    };
    DeliveryRateInput: {
      /** Format: uuid */
      cityId: string;
      currency: components['schemas']['Currency'];
      /** @description Price/allocation in stored units, maximum 9000000000000. SYP whole pounds, USD cents. */
      feeUnits: string;
      method: components['schemas']['DeliveryMethod'];
    };
    DeliveryRatePage: {
      items: components['schemas']['DeliveryRate'][];
      nextCursor: string | null;
    };
    DeliveryRecordInput: {
      notes: string;
      /** Format: uuid */
      proofFileId?: string;
    };
    /** @enum {string} */
    DeliveryStatus:
      | 'PENDING'
      | 'REQUESTED'
      | 'ASSIGNED'
      | 'PICKED_UP'
      | 'DROPPED_OFF'
      | 'EXCEPTION'
      | 'CANCELLED';
    DeliveryTerms: {
      appliedAt: string | null;
      buyerApprovedAt: string | null;
      /** Format: uuid */
      deliveryId: string;
      fee: components['schemas']['Money'];
      /** Format: uuid */
      id: string;
      method: components['schemas']['DeliveryMethod'];
      /** Format: date-time */
      promisedAt: string;
      reason: string;
      version: number;
    };
    DeliveryTermsInput: {
      method: components['schemas']['DeliveryMethod'];
      /** Format: date-time */
      promisedAt: string;
      reason: string;
    };
    Destination: {
      /** Format: uuid */
      areaId?: string | null;
      /** Format: uuid */
      cityId?: string;
      contactName?: string;
      contactPhone?: string;
      /** Format: date-time */
      createdAt?: string;
      details?: string;
      /** Format: uuid */
      id?: string;
      label?: string;
      pin?: components['schemas']['GeoPoint'] | null;
    };
    Device: {
      /** Format: uuid */
      id: string;
      platform: components['schemas']['DevicePlatform'];
      revokedAt: string | null;
    };
    DeviceInput: {
      platform: components['schemas']['DevicePlatform'];
      token: string;
    };
    /** @enum {string} */
    DevicePlatform: 'IOS' | 'ANDROID';
    DriverJob: {
      area: components['schemas']['GeographicName'] | null;
      city: components['schemas']['GeographicName'];
      fee: components['schemas']['Money'];
      /** Format: uuid */
      id: string;
      /** Format: uuid */
      orderId: string;
      orderVersion: number;
      /** Format: date-time */
      readyAt: string;
      summary: string;
    };
    DriverJobPage: {
      items: components['schemas']['DriverJob'][];
      nextCursor: string | null;
    };
    DriverZone: {
      cityId: string | null;
      /** Format: uuid */
      driverProfileId: string;
      /** Format: uuid */
      governorateId: string;
      /** Format: uuid */
      id: string;
    };
    DriverZoneInput: {
      cityId?: string | null;
      /** Format: uuid */
      driverProfileId: string;
      /** Format: uuid */
      governorateId: string;
    };
    DriverZonePage: {
      items: components['schemas']['DriverZone'][];
      nextCursor: string | null;
    };
    EmailInput: {
      /** Format: email */
      email: string;
    };
    /** @enum {string} */
    ErrorCode:
      | 'INVALID_INPUT'
      | 'INVALID_CURSOR'
      | 'MIXED_CURRENCY'
      | 'INVALID_INSTALLMENT_TOTAL'
      | 'INVALID_IDEMPOTENCY_KEY'
      | 'AGREEMENT_REQUIRED'
      | 'INVALID_ALLOCATION'
      | 'REASON_REQUIRED'
      | 'AUTH_REQUIRED'
      | 'TOKEN_EXPIRED'
      | 'SESSION_REVOKED'
      | 'REFRESH_REUSE_DETECTED'
      | 'FORBIDDEN'
      | 'WORKSPACE_INACTIVE'
      | 'ACCOUNT_RESTRICTED'
      | 'NOT_FOUND'
      | 'INVALID_TRANSITION'
      | 'VERSION_CONFLICT'
      | 'STOCK_UNAVAILABLE'
      | 'DRIVER_ALREADY_ASSIGNED'
      | 'WORKSPACE_SWITCH_BLOCKED'
      | 'DEADLINE_EXPIRED'
      | 'IDEMPOTENCY_CONFLICT'
      | 'REQUEST_IN_PROGRESS'
      | 'ALREADY_SETTLED'
      | 'FUNDS_FROZEN'
      | 'BOOKING_NOT_CONFIRMED'
      | 'QUOTE_NOT_APPROVED'
      | 'DEPOSIT_REQUIRED'
      | 'HOLD_REQUIRED'
      | 'REVIEW_WINDOW_OPEN'
      | 'EVIDENCE_WINDOW_OPEN'
      | 'DELIVERY_PROOF_REQUIRED'
      | 'NOT_ELIGIBLE_FOR_SETTLEMENT'
      | 'TERMS_APPROVAL_REQUIRED'
      | 'FILE_TOO_LARGE'
      | 'UNSUPPORTED_MEDIA_TYPE'
      | 'INSUFFICIENT_FUNDS'
      | 'SIMULATED_PAYMENT_FAILED'
      | 'SIMULATED_FAILURE'
      | 'UNSERVICEABLE_ADDRESS'
      | 'RATE_LIMITED'
      | 'TEMPORARILY_UNAVAILABLE'
      | 'COMMISSION_CONFIGURATION_MISSING'
      | 'SETTLEMENT_POSTING_FAILED'
      | 'CURRENCY_MISMATCH'
      | 'DRIVER_UNAVAILABLE'
      | 'EVIDENCE_WINDOW_CLOSED'
      | 'INVENTORY_RECONCILIATION_REQUIRED'
      | 'CUSTODY_REVIEW_REQUIRED'
      | 'INVALID_DRIVER_AWARD'
      | 'REVIEW_NOT_ALLOWED';
    ErrorDetail: {
      code: string;
      field?: string;
      message?: string;
    };
    /** @enum {string} */
    EscrowStatus: 'OPEN' | 'FROZEN' | 'SETTLED';
    Evidence: {
      /** Format: date-time */
      createdAt: string;
      files: components['schemas']['FileMetadata'][];
      /** Format: uuid */
      id: string;
      /** Format: uuid */
      submitterId: string;
      text: string | null;
      visibility: components['schemas']['EvidenceVisibility'];
    };
    EvidenceInput:
      | {
          fileIds?: string[];
          lateReason?: string;
          text?: string;
          visibility: components['schemas']['EvidenceVisibility'];
        }
      | {
          text: string;
        }
      | {
          fileIds: unknown[];
        };
    EvidencePage: {
      items: components['schemas']['Evidence'][];
      nextCursor: string | null;
    };
    /** @enum {string} */
    EvidenceVisibility: 'SHARED' | 'PRIVATE_ADMIN';
    ExtensionInput: {
      /** Format: date-time */
      dueAt: string;
      reason: string;
    };
    FallbackInput: {
      /** @enum {unknown} */
      choice: 'SELLER_SAME_TERMS' | 'RESCHEDULE' | 'UNFULFILLABLE_REFUND';
      reason: string;
      /** Format: uuid */
      termsRevisionId?: string;
    };
    /** @enum {string} */
    FileAccessClass:
      'PUBLIC_CATALOG' | 'ORDER_SHARED' | 'FINAL_DELIVERABLE' | 'DELIVERY_ONLY' | 'CASE_EVIDENCE';
    FileMetadata: {
      accessClass: components['schemas']['FileAccessClass'];
      /** Format: date-time */
      createdAt: string;
      /** Format: uuid */
      id: string;
      mimeType: string;
      originalName: string;
      scanStatus: components['schemas']['ScanStatus'];
      /** @description Integer stored units as a decimal string, bounded by PostgreSQL BIGINT; never a float. */
      sizeBytes: string;
    };
    FileMetadataPage: {
      items: components['schemas']['FileMetadata'][];
      nextCursor: string | null;
    };
    /** @description ORDER_SHARED may be staged without an order, owner-only, then claimed atomically by an inspection request. Other private classes require their order/case. No staged object is public. */
    FileUploadInput: {
      accessClass: components['schemas']['FileAccessClass'];
      /** Format: uuid */
      caseId?: string;
      /**
       * Format: binary
       * @description Images <=10 MiB, PDF <=20 MiB, final ZIP <=50 MiB. Validate extension, declared MIME, magic bytes, size and ownership; quarantine/scan.
       */
      file: string;
      /** Format: uuid */
      orderId?: string;
    } & (unknown & unknown);
    FreelanceOrderInput: {
      description: string;
      /** Format: uuid */
      listingId: string;
    };
    GeographicName: {
      /** Format: uuid */
      id: string;
      nameAr: string;
      nameEn: string;
    };
    GeoPoint: {
      latitude: number;
      longitude: number;
    };
    Governorate: {
      /** Format: uuid */
      id: string;
      isoCode: string;
      nameAr: string;
      nameEn: string;
    };
    GovernoratePage: {
      items: components['schemas']['Governorate'][];
      nextCursor: string | null;
    };
    Health: {
      /** @constant */
      phase: 'backend';
      /** @constant */
      simulatedPayments: true;
      /** @constant */
      status: 'ok';
    };
    InspectionInput: {
      /** Format: uuid */
      addressId: string;
      currency: components['schemas']['Currency'];
      description: string;
      photoIds: string[];
      /** Format: uuid */
      providerProfileId: string;
    };
    InspectionScheduleInput: {
      /** @constant */
      accepted: true;
      /** Format: date-time */
      endsAt: string;
      /** Format: date-time */
      responseDeadlineAt: string;
      /** Format: date-time */
      startsAt: string;
    };
    /** @enum {string} */
    Installment: 'DEPOSIT' | 'BALANCE' | 'FULL' | 'DELIVERY_ADJUSTMENT';
    InventoryReturn: {
      nonRestockableQuantity: number;
      reason: string;
      /** Format: uuid */
      reservationId: string;
      reusableQuantity: number;
    };
    Listing: {
      /** Format: uuid */
      categoryId: string;
      /** Format: date-time */
      createdAt: string;
      deliveryDays: number | null;
      /** @description May be empty in draft; required nonempty in both languages before publishing. */
      descriptionAr: string;
      /** @description May be empty in draft; required nonempty in both languages before publishing. */
      descriptionEn: string;
      durationMinutes: number | null;
      /** Format: uuid */
      id: string;
      kind: components['schemas']['ListingKind'];
      photoIds: string[];
      price: components['schemas']['ServicePrice'];
      /** Format: uuid */
      profileId: string;
      ratingAverage: number | null;
      status: components['schemas']['PublicationStatus'];
      /** @description May be empty in draft; required nonempty in both languages before publishing. */
      titleAr: string;
      /** @description May be empty in draft; required nonempty in both languages before publishing. */
      titleEn: string;
      /** Format: date-time */
      updatedAt: string;
    };
    ListingInput: {
      /** Format: uuid */
      categoryId: string;
      deliveryDays?: number | null;
      /** @default  */
      descriptionAr: string;
      /** @default  */
      descriptionEn: string;
      durationMinutes?: number | null;
      kind: components['schemas']['ListingKind'];
      photoIds?: string[];
      price: components['schemas']['ServicePrice'];
      /** @default  */
      titleAr: string;
      /** @default  */
      titleEn: string;
    };
    /** @enum {string} */
    ListingKind: 'FREELANCE' | 'PROFESSIONAL_PACKAGE';
    ListingPage: {
      items: components['schemas']['Listing'][];
      nextCursor: string | null;
    };
    ListingPatchInput: {
      /** Format: uuid */
      categoryId?: string;
      deliveryDays?: number | null;
      /** @default  */
      descriptionAr: string;
      /** @default  */
      descriptionEn: string;
      durationMinutes?: number | null;
      kind?: components['schemas']['ListingKind'];
      photoIds?: string[];
      price?: components['schemas']['ServicePrice'];
      /** @default  */
      titleAr: string;
      /** @default  */
      titleEn: string;
    };
    LocalResult: {
      /** Format: uuid */
      cityId: string;
      /** Format: uuid */
      detailId: string;
      /** Format: uuid */
      id: string;
      /** @enum {string} */
      kind: 'STORE' | 'PROFESSIONAL';
      nameAr: string;
      nameEn: string;
      point: components['schemas']['GeoPoint'] | null;
      /** @enum {unknown} */
      precision: 'APPROXIMATE' | 'PUBLIC_VENUE' | null;
      regionAr: string;
      regionEn: string;
    };
    LocalResults: {
      items: components['schemas']['LocalResult'][];
      nextCursor: string | null;
    };
    LocalSearch: {
      /** Format: uuid */
      areaId?: string;
      /** Format: uuid */
      cityId: string;
      cursor?: string;
      /** @enum {string} */
      kind?: 'STORE' | 'PROFESSIONAL';
      /** @description Defaults to 20. */
      limit?: number;
      origin?: {
        /** @description Rounded to two decimal places. */
        latitude: number;
        /** @description Rounded to two decimal places. */
        longitude: number;
      };
    };
    LoginInput: {
      /** @enum {unknown} */
      client: 'WEB' | 'IOS' | 'ANDROID';
      /** Format: email */
      email: string;
      password: string;
    };
    MeInput: {
      displayName?: string;
      /** @enum {unknown} */
      locale?: 'ar' | 'en';
    };
    Message: {
      attachments: components['schemas']['FileMetadata'][];
      /** Format: uuid */
      clientMessageId: string;
      /** Format: date-time */
      createdAt: string;
      /** Format: uuid */
      id: string;
      /** Format: uuid */
      roomId: string;
      /** Format: uuid */
      senderId: string;
      text: string | null;
    };
    MessageInput:
      | {
          attachmentIds?: string[];
          /** Format: uuid */
          clientMessageId: string;
          /** Format: uuid */
          roomId: string;
          text?: string;
        }
      | {
          text: string;
        }
      | {
          attachmentIds: unknown[];
        };
    MessagePage: {
      items: components['schemas']['Message'][];
      nextCursor: string | null;
    };
    Milestone: {
      description: string;
      /** Format: uuid */
      id: string;
      position: number;
      progress: number;
    };
    MilestoneInput: {
      description: string;
      position: number;
    };
    MilestonePage: {
      items: components['schemas']['Milestone'][];
      nextCursor: string | null;
    };
    ModerationDecisionInput: {
      outcome: components['schemas']['ModerationOutcome'];
      reason: string;
    };
    ModerationItem: {
      /** @description Admin-only content inspection, including drafts and hidden resources; no credentials. */
      content?:
        | components['schemas']['BusinessProfile']
        | components['schemas']['Listing']
        | components['schemas']['Store']
        | components['schemas']['Product']
        | components['schemas']['Review'];
      /** Format: date-time */
      createdAt: string;
      /** Format: uuid */
      id: string;
      /** Format: uuid */
      resourceId: string;
      /** @enum {unknown} */
      resourceType: 'PROFILE' | 'LISTING' | 'STORE' | 'PRODUCT' | 'REVIEW';
      status: string;
    };
    ModerationItemPage: {
      items: components['schemas']['ModerationItem'][];
      nextCursor: string | null;
    };
    /** @enum {string} */
    ModerationOutcome: 'APPROVE' | 'HIDE' | 'REJECT' | 'RESTORE';
    Money: {
      currency: components['schemas']['Currency'];
      units: components['schemas']['Units'];
    };
    Notification: {
      category: string;
      /** Format: date-time */
      createdAt: string;
      /** Format: uuid */
      eventId: string;
      /** Format: uuid */
      id: string;
      readAt: string | null;
      /** Format: uuid */
      resourceId: string;
    };
    NotificationPage: {
      items: components['schemas']['Notification'][];
      nextCursor: string | null;
    };
    Operation: {
      errorCode: components['schemas']['ErrorCode'] | null;
      /** Format: uuid */
      id: string;
      /** Format: uuid */
      resourceId: string;
      /** @constant */
      simulated: true;
      /** @enum {unknown} */
      status: 'SUCCEEDED' | 'FAILED' | 'SETTLED' | 'OPEN';
    };
    Order: {
      balance: components['schemas']['Money'] | null;
      /** Format: uuid */
      buyerId: string;
      commissionBpsSnapshot: number | null;
      /** Format: date-time */
      createdAt: string;
      currency: components['schemas']['Currency'];
      deadlines: components['schemas']['Deadline'][];
      deliveredAt: string | null;
      deliveryFee: components['schemas']['Money'];
      deliveryVerified: boolean;
      deposit: components['schemas']['Money'] | null;
      /** @description Immutable fulfillment address on an authorized order detail read. */
      destination?: components['schemas']['Destination'];
      held: components['schemas']['Money'];
      /** Format: uuid */
      id: string;
      paused: boolean;
      sellerAmount: components['schemas']['Money'] | null;
      /** Format: uuid */
      sellerProfileId: string;
      service: components['schemas']['ServiceDetails'] | null;
      /** @constant */
      simulated: true;
      state: components['schemas']['OrderState'];
      store: components['schemas']['StoreDetails'] | null;
      terms: components['schemas']['Terms'];
      total: components['schemas']['Money'] | null;
      /** Format: date-time */
      updatedAt: string;
      version: number;
      workspace: components['schemas']['Workspace'];
    };
    OrderActionResult: {
      caseId: string | null;
      order: components['schemas']['Order'];
      payment: components['schemas']['Payment'] | null;
      settlement: components['schemas']['Settlement'] | null;
    };
    OrderLine: {
      currency: components['schemas']['Currency'];
      /** Format: uuid */
      productId: string;
      quantity: number;
      reservationId: string | null;
      /** @description Price/allocation in stored units, maximum 9000000000000. SYP whole pounds, USD cents. */
      subtotalUnits: string;
      titleAr: string;
      titleEn: string;
      /** @description Price/allocation in stored units, maximum 9000000000000. SYP whole pounds, USD cents. */
      unitPriceUnits: string;
    };
    OrderPage: {
      items: components['schemas']['Order'][];
      nextCursor: string | null;
    };
    /** @enum {string} */
    OrderState:
      | 'DRAFT'
      | 'AWAITING_AGREEMENT'
      | 'BOOKING_REQUESTED'
      | 'SCHEDULE_PROPOSED'
      | 'PENDING_QUOTE'
      | 'QUOTE_SENT'
      | 'APPROVED'
      | 'AWAITING_DEPOSIT'
      | 'DEPOSIT_HELD'
      | 'IN_PROGRESS'
      | 'EN_ROUTE'
      | 'ON_SITE'
      | 'READY_FOR_FINAL_PAYMENT'
      | 'FINAL_PAYMENT_OVERDUE'
      | 'FULLY_FUNDED'
      | 'PAID_IN_ESCROW'
      | 'PREPARING'
      | 'READY_FOR_DELIVERY'
      | 'OUT_FOR_DELIVERY'
      | 'DELIVERED'
      | 'DELIVERY_EXCEPTION'
      | 'DELIVERY_REVIEW_REQUIRED'
      | 'CANCELLATION_PENDING'
      | 'EXTENSION_PENDING'
      | 'DISPUTED'
      | 'REVISION_IN_PROGRESS'
      | 'RESOLVED'
      | 'COMPLETED'
      | 'CANCELLED'
      | 'REJECTED'
      | 'EXPIRED'
      | 'REFUNDED';
    OrderTransition: {
      actorId: string | null;
      fromState: components['schemas']['OrderState'];
      /** Format: uuid */
      id: string;
      /** Format: date-time */
      occurredAt: string;
      /** Format: uuid */
      orderId: string;
      reason: string;
      toState: components['schemas']['OrderState'];
      version: number;
    };
    OrderTransitionPage: {
      items: components['schemas']['OrderTransition'][];
      nextCursor: string | null;
    };
    Payment: {
      amount: components['schemas']['Money'];
      /** Format: date-time */
      createdAt: string;
      failureCode: components['schemas']['ErrorCode'] | null;
      /** Format: uuid */
      id: string;
      installment: components['schemas']['Installment'];
      /** Format: uuid */
      orderId: string;
      providerReference: string;
      /** @constant */
      simulated: true;
      status: components['schemas']['PaymentStatus'];
    };
    PaymentInput: {
      /** @description Only honored by development/test simulator; failure has no ledger/stock effect. */
      simulateFailure?: boolean;
      /** @constant */
      termsAccepted: true;
    };
    PaymentPage: {
      items: components['schemas']['Payment'][];
      nextCursor: string | null;
    };
    /** @enum {string} */
    PaymentStatus: 'SUCCEEDED' | 'FAILED';
    PortfolioInput: {
      caption?: string;
      /** Format: uuid */
      fileId?: string;
      /** @enum {unknown} */
      kind: 'IMAGE' | 'FILE' | 'LINK';
      position: number;
      title: string;
      /** Format: uri */
      url?: string;
    } & (
      | {
          /** @constant */
          kind?: 'LINK';
        }
      | {
          /** @enum {unknown} */
          kind?: 'IMAGE' | 'FILE';
        }
    );
    PortfolioItem: {
      caption: string | null;
      file: components['schemas']['FileMetadata'] | null;
      /** Format: uuid */
      id: string;
      /** @enum {unknown} */
      kind: 'IMAGE' | 'FILE' | 'LINK';
      position: number;
      title: string;
      url: string | null;
    };
    PositiveMoney: {
      currency: components['schemas']['Currency'];
      units: string & unknown;
    };
    /** @description Price/allocation in stored units, maximum 9000000000000. SYP whole pounds, USD cents. */
    PriceUnits: string;
    Product: {
      availableStock: number;
      /** Format: uuid */
      categoryId: string;
      /** Format: date-time */
      createdAt: string;
      /** @description May be empty in draft; required nonempty in both languages before publishing. */
      descriptionAr: string;
      /** @description May be empty in draft; required nonempty in both languages before publishing. */
      descriptionEn: string;
      /** Format: uuid */
      id: string;
      photoIds: string[];
      price: components['schemas']['PositiveMoney'];
      status: components['schemas']['PublicationStatus'];
      /** Format: uuid */
      storeId: string;
      /** @description May be empty in draft; required nonempty in both languages before publishing. */
      titleAr: string;
      /** @description May be empty in draft; required nonempty in both languages before publishing. */
      titleEn: string;
      /** Format: date-time */
      updatedAt: string;
    };
    ProductInput: {
      /** Format: uuid */
      categoryId: string;
      /** @default  */
      descriptionAr: string;
      /** @default  */
      descriptionEn: string;
      photoIds?: string[];
      price: components['schemas']['PositiveMoney'];
      stockOnHand: number;
      /** @default  */
      titleAr: string;
      /** @default  */
      titleEn: string;
    };
    ProductPage: {
      items: components['schemas']['Product'][];
      nextCursor: string | null;
    };
    ProductPatchInput: {
      /** Format: uuid */
      categoryId?: string;
      /** @default  */
      descriptionAr: string;
      /** @default  */
      descriptionEn: string;
      photoIds?: string[];
      price?: components['schemas']['PositiveMoney'];
      stockOnHand?: number;
      /** @default  */
      titleAr: string;
      /** @default  */
      titleEn: string;
    };
    ProfileInput: {
      bio: string;
      cityId?: string | null;
      experienceYears?: number | null;
      languages: {
        languageCode: string;
        proficiency: string;
      }[];
      skills: string[];
      title: string;
      trade?: string | null;
    };
    /** @enum {string} */
    ProfileStatus: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'SUSPENDED';
    ProgressInput: {
      /** @enum {unknown} */
      kind: 'UPDATE' | 'EN_ROUTE' | 'ON_SITE';
      /** Format: uuid */
      milestoneId?: string;
      note: string;
      progress?: number;
    };
    Proposal: {
      /** Format: date-time */
      agreementDeadlineAt: string;
      buyerDecision: ('ACCEPT' | 'REJECT') | null;
      /** Format: uuid */
      caseId: string;
      /** @description Price/allocation in stored units, maximum 9000000000000. SYP whole pounds, USD cents. */
      driverAwardUnits: string;
      /** Format: uuid */
      id: string;
      inventoryReturns?: components['schemas']['InventoryReturn'][] | null;
      kind: components['schemas']['ProposalKind'];
      newDueAt: string | null;
      reason: string;
      scope: string | null;
      /** @description Price/allocation in stored units, maximum 9000000000000. SYP whole pounds, USD cents. */
      sellerAwardUnits: string;
      sellerDecision: ('ACCEPT' | 'REJECT') | null;
      /** @description Price/allocation in stored units, maximum 9000000000000. SYP whole pounds, USD cents. */
      sellerDeliveryUnits: string;
      version: number;
    };
    ProposalInput: {
      /** @description Price/allocation in stored units, maximum 9000000000000. SYP whole pounds, USD cents. */
      driverAwardUnits?: string;
      /** @description Exact stock reconciliation agreed with this proposal; required after goods were collected. */
      inventoryReturns?: components['schemas']['InventoryReturn'][];
      kind: components['schemas']['ProposalKind'];
      /** Format: date-time */
      newDueAt?: string;
      reason: string;
      scope?: string;
      /** @description Price/allocation in stored units, maximum 9000000000000. SYP whole pounds, USD cents. */
      sellerAwardUnits?: string;
      /** @description Price/allocation in stored units, maximum 9000000000000. SYP whole pounds, USD cents. */
      sellerDeliveryUnits?: string;
    };
    /** @enum {string} */
    ProposalKind: 'CANCELLATION_SPLIT' | 'REVISION' | 'EXTENSION' | 'DELIVERY_REMEDY';
    ProposalPage: {
      items: components['schemas']['Proposal'][];
      nextCursor: string | null;
    };
    /** @enum {string} */
    PublicationStatus: 'DRAFT' | 'PUBLISHED' | 'INACTIVE' | 'HIDDEN';
    PublicProfile: {
      bio: string;
      cityId: string | null;
      experienceYears: number | null;
      /** Format: uuid */
      id: string;
      languages: {
        languageCode: string;
        proficiency: string;
      }[];
      portfolio: components['schemas']['PortfolioItem'][];
      ratingAverage: number | null;
      reviewCount: number;
      skills: string[];
      title: string;
      trade: string | null;
      type: components['schemas']['BusinessType'];
    };
    Quote: {
      /** @description Price/allocation in stored units, maximum 9000000000000. SYP whole pounds, USD cents. */
      balanceUnits: string;
      currency: components['schemas']['Currency'];
      /** @description Price/allocation in stored units, maximum 9000000000000. SYP whole pounds, USD cents. */
      depositUnits: string;
      /** Format: date-time */
      dueAt: string;
      /** Format: date-time */
      endsAt: string;
      /** Format: uuid */
      id: string;
      items: {
        description: string;
        quantity: number;
        unitPriceUnits: components['schemas']['PriceUnits'] & unknown;
      }[];
      /** Format: uuid */
      orderId: string;
      orderVersion: number;
      responseDeadlineAt: string | null;
      scope: string;
      /** Format: date-time */
      startsAt: string;
      state: components['schemas']['QuoteState'];
      /** @description Price/allocation in stored units, maximum 9000000000000. SYP whole pounds, USD cents. */
      totalUnits: string;
      version: number;
    };
    QuoteInput: {
      currency: components['schemas']['Currency'];
      /** Format: date-time */
      dueAt: string;
      /** Format: date-time */
      endsAt: string;
      items: {
        description: string;
        quantity: number;
        unitPriceUnits: components['schemas']['PriceUnits'] & unknown;
      }[];
      scope: string;
      /** Format: date-time */
      startsAt: string;
    };
    QuotePage: {
      items: components['schemas']['Quote'][];
      nextCursor: string | null;
    };
    /** @enum {string} */
    QuoteState: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
    ReadinessInput: {
      completedScope: string[];
      note: string;
      previewFileIds: string[];
    };
    RealtimeAck:
      | {
          data:
            | components['schemas']['Message']
            | {
                subscribed: boolean;
              }
            | {
                acknowledged: boolean;
              };
          /** @constant */
          ok: true;
          requestId: string;
        }
      | {
          error: components['schemas']['ApiError'];
          /** @constant */
          ok: false;
          requestId: string;
        };
    RealtimeCommand:
      | {
          data: {
            lastSeenVersion: number;
            /** Format: uuid */
            orderId: string;
          };
          /** @constant */
          type: 'order.subscribe';
        }
      | {
          data: {
            /** Format: uuid */
            orderId: string;
          };
          /** @constant */
          type: 'order.unsubscribe';
        }
      | {
          data: components['schemas']['MessageInput'];
          /** @constant */
          type: 'chat.send';
        }
      | {
          data: {
            /** Format: uuid */
            notificationId: string;
          };
          /** @constant */
          type: 'notification.ack';
        };
    RealtimeEvent:
      | {
          /** Format: uuid */
          aggregateId: string;
          aggregateVersion: number;
          data: {
            deadlineAt: string | null;
            /** Format: uuid */
            orderId: string;
            state: components['schemas']['OrderState'];
          };
          /** Format: uuid */
          eventId: string;
          /** Format: date-time */
          occurredAt: string;
          /** @constant */
          type: 'order.updated';
          /** @constant */
          version: 1;
        }
      | {
          /** Format: uuid */
          aggregateId: string;
          aggregateVersion: number;
          data: {
            amount: components['schemas']['Money'];
            installment: components['schemas']['Installment'];
            /** Format: uuid */
            operationId: string;
            /** @constant */
            simulated: true;
            status: components['schemas']['PaymentStatus'];
          };
          /** Format: uuid */
          eventId: string;
          /** Format: date-time */
          occurredAt: string;
          /** @constant */
          type: 'payment.updated';
          /** @constant */
          version: 1;
        }
      | {
          /** Format: uuid */
          aggregateId: string;
          aggregateVersion: number;
          data: {
            /** Format: uuid */
            messageId: string;
            /** Format: uuid */
            roomId: string;
            /** Format: uuid */
            senderId: string;
          };
          /** Format: uuid */
          eventId: string;
          /** Format: date-time */
          occurredAt: string;
          /** @constant */
          type: 'chat.message.created';
          /** @constant */
          version: 1;
        }
      | {
          /** Format: uuid */
          aggregateId: string;
          aggregateVersion: number;
          data: {
            /** Format: uuid */
            deliveryId: string;
            proofAvailable: boolean;
            status: components['schemas']['DeliveryStatus'];
          };
          /** Format: uuid */
          eventId: string;
          /** Format: date-time */
          occurredAt: string;
          /** @constant */
          type: 'delivery.updated';
          /** @constant */
          version: 1;
        }
      | {
          /** Format: uuid */
          aggregateId: string;
          aggregateVersion: number;
          data: components['schemas']['DriverJob'];
          /** Format: uuid */
          eventId: string;
          /** Format: date-time */
          occurredAt: string;
          /** @constant */
          type: 'driver.job.available';
          /** @constant */
          version: 1;
        }
      | {
          /** Format: uuid */
          aggregateId: string;
          aggregateVersion: number;
          data: {
            /** Format: uuid */
            caseId: string;
            /** Format: date-time */
            evidenceDeadlineAt: string;
            status: components['schemas']['CaseStatus'];
          };
          /** Format: uuid */
          eventId: string;
          /** Format: date-time */
          occurredAt: string;
          /** @constant */
          type: 'case.updated';
          /** @constant */
          version: 1;
        }
      | {
          /** Format: uuid */
          aggregateId: string;
          aggregateVersion: number;
          data: {
            category: string;
            /** Format: uuid */
            notificationId: string;
            /** Format: uuid */
            resourceId: string;
          };
          /** Format: uuid */
          eventId: string;
          /** Format: date-time */
          occurredAt: string;
          /** @constant */
          type: 'notification.created';
          /** @constant */
          version: 1;
        }
      | {
          /** Format: uuid */
          aggregateId: string;
          aggregateVersion: number;
          data: {
            reasonCode: components['schemas']['ErrorCode'];
            /** Format: uuid */
            roomId: string;
          };
          /** Format: uuid */
          eventId: string;
          /** Format: date-time */
          occurredAt: string;
          /** @constant */
          type: 'permissions.revoked';
          /** @constant */
          version: 1;
        };
    RealtimeTicket: {
      /** @constant */
      expiresIn: 60;
      /** @constant */
      namespace: '/orders';
      ticket: string;
    };
    RealtimeTicketInput: {
      /** Format: uuid */
      orderId: string;
    };
    ReasonInput: {
      reason: string;
    };
    ReassignInput: {
      custodyEvidenceFileIds?: string[];
      /** Format: uuid */
      driverProfileId: string;
      reason: string;
    };
    RefreshInput: {
      refreshToken: string;
    };
    RegisterInput: {
      businessRole?: components['schemas']['BusinessType'] | null;
      displayName: string;
      /** Format: email */
      email: string;
      /** @enum {unknown} */
      locale: 'ar' | 'en';
      /** @description Server also enforces maximum 72 UTF-8 bytes before bcrypt hashing. */
      password: string;
    };
    ResetPasswordInput: {
      password: string;
      token: string;
    };
    ResolveCaseInput: {
      /** Format: uuid */
      driverAssignmentId?: string;
      /** @description Price/allocation in stored units, maximum 9000000000000. SYP whole pounds, USD cents. */
      driverAwardUnits: string;
      /** @description Required for cancelled/refunded store orders: reconcile every reserved/consumed item once, including non-restockable units. */
      inventoryReturns?: components['schemas']['InventoryReturn'][];
      /** @enum {unknown} */
      outcome: 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
      reason: string;
      /** @description Price/allocation in stored units, maximum 9000000000000. SYP whole pounds, USD cents. */
      sellerAwardUnits: string;
      /** @description Price/allocation in stored units, maximum 9000000000000. SYP whole pounds, USD cents. */
      sellerDeliveryUnits: string;
      substantiation: string;
    };
    Restriction: {
      expiresAt: string | null;
      /** Format: uuid */
      id: string;
      kind: components['schemas']['RestrictionKind'];
      reason: string;
      revokedAt: string | null;
      /** Format: uuid */
      userId: string;
    };
    RestrictionInput: {
      expiresAt?: string | null;
      kind: components['schemas']['RestrictionKind'];
      reason: string;
    };
    /** @enum {string} */
    RestrictionKind: 'SUSPENSION' | 'PURCHASING' | 'PUBLISHING' | 'MESSAGING';
    Review: {
      body: string | null;
      buyerDisplayName: string;
      /** Format: date-time */
      createdAt: string;
      /** Format: date-time */
      editableUntil: string;
      /** Format: uuid */
      id: string;
      /** Format: uuid */
      orderId: string;
      /** Format: uuid */
      sellerProfileId: string;
      stars: number;
      /** @constant */
      verified: true;
      version: number;
    };
    ReviewInput: {
      body?: string;
      stars: number;
    };
    ReviewPage: {
      items: components['schemas']['Review'][];
      nextCursor: string | null;
    };
    /** @enum {string} */
    RoleCode:
      'CUSTOMER' | 'FREELANCER' | 'PROFESSIONAL' | 'STORE_OWNER' | 'DELIVERY_DRIVER' | 'ADMIN';
    /** @enum {string} */
    RoomKind: 'ORDER_SHARED' | 'DELIVERY';
    /** @enum {string} */
    ScanStatus: 'QUARANTINED' | 'CLEAN' | 'REJECTED' | 'DELETED';
    ScheduleInput: {
      reason?: string;
      /** Format: date-time */
      startsAt: string;
    };
    ServiceArea: {
      areaId: string | null;
      /** Format: uuid */
      cityId: string;
      /** Format: uuid */
      id: string;
      /** Format: uuid */
      profileId: string;
    };
    ServiceAreaInput: {
      areaId?: string | null;
      /** Format: uuid */
      cityId: string;
    };
    ServiceAreaPage: {
      items: components['schemas']['ServiceArea'][];
      nextCursor: string | null;
    };
    ServiceDetails: {
      approvedQuoteId: string | null;
      booking: components['schemas']['Booking'] | null;
      dueAt: string | null;
      kind: components['schemas']['ServiceKind'];
      listingId: string | null;
      milestones: components['schemas']['Milestone'][];
      readyAt: string | null;
    };
    /** @enum {string} */
    ServiceKind: 'FREELANCE' | 'FIXED_BOOKING' | 'INSPECTION_QUOTE';
    ServicePrice: {
      currency: components['schemas']['Currency'];
      units: string & unknown;
    };
    Settlement: {
      allocations: components['schemas']['SettlementAllocation'][];
      currency: components['schemas']['Currency'];
      /** @description Price/allocation in stored units, maximum 9000000000000. SYP whole pounds, USD cents. */
      heldUnits: string;
      /** Format: uuid */
      id: string;
      /** @enum {unknown} */
      mode:
        | 'BUYER_CONFIRMATION'
        | 'AUTO_COMPLETION'
        | 'ADMIN_RESOLUTION'
        | 'MUTUAL_CANCELLATION'
        | 'PROVIDER_CANCEL'
        | 'PRESTART_CANCEL'
        | 'STORE_DECLINE'
        | 'STORE_TIMEOUT'
        | 'UNFULFILLABLE';
      /** Format: uuid */
      orderId: string;
      reason: string;
      /** Format: date-time */
      settledAt: string;
      /** @constant */
      simulated: true;
    };
    SettlementAllocation: {
      kind: components['schemas']['AllocationKind'];
      /** @description Price/allocation in stored units, maximum 9000000000000. SYP whole pounds, USD cents. */
      units: string;
    };
    StockInput: {
      reason: string;
      stockOnHand: number;
    };
    Store: {
      /** Format: uuid */
      cityId: string;
      /** Format: date-time */
      createdAt: string;
      /** @description May be empty in draft; required nonempty in both languages before publishing. */
      descriptionAr: string;
      /** @description May be empty in draft; required nonempty in both languages before publishing. */
      descriptionEn: string;
      /** Format: uuid */
      id: string;
      logoId: string | null;
      /** @description May be empty in draft; required nonempty in both languages before publishing. */
      nameAr: string;
      /** @description May be empty in draft; required nonempty in both languages before publishing. */
      nameEn: string;
      /** Format: uuid */
      profileId: string;
      status: components['schemas']['PublicationStatus'];
      supportsPlatformDelivery: boolean;
      supportsSellerDelivery: boolean;
      /** Format: date-time */
      updatedAt: string;
    };
    StoreDetails: {
      /** Format: uuid */
      deliveryId: string;
      items: components['schemas']['OrderLine'][];
      sellerAcceptedAt: string | null;
      /** Format: uuid */
      storeId: string;
    };
    StoreInput: {
      /** Format: uuid */
      cityId: string;
      /** @default  */
      descriptionAr: string;
      /** @default  */
      descriptionEn: string;
      logoId?: string | null;
      /** @default  */
      nameAr: string;
      /** @default  */
      nameEn: string;
      supportsPlatformDelivery: boolean;
      supportsSellerDelivery: boolean;
    };
    StorePage: {
      items: components['schemas']['Store'][];
      nextCursor: string | null;
    };
    StorePatchInput: {
      /** Format: uuid */
      cityId?: string;
      /** @default  */
      descriptionAr: string;
      /** @default  */
      descriptionEn: string;
      logoId?: string | null;
      /** @default  */
      nameAr: string;
      /** @default  */
      nameEn: string;
      supportsPlatformDelivery?: boolean;
      supportsSellerDelivery?: boolean;
    };
    StorePreview: {
      /** Format: date-time */
      expiresAt: string;
      options: {
        fee: components['schemas']['Money'];
        method: components['schemas']['DeliveryMethod'];
        /** Format: date-time */
        promisedAt: string;
      }[];
      order: components['schemas']['Order'];
      serviceable: boolean;
      termsText: string;
    };
    StorePreviewInput: {
      /** Format: uuid */
      addressId: string;
      items: {
        /** Format: uuid */
        productId: string;
        quantity: number;
      }[];
      method: components['schemas']['DeliveryMethod'];
      /** Format: uuid */
      storeId: string;
    };
    SwitchInput: {
      target: components['schemas']['BusinessType'] | 'CUSTOMER';
    };
    SwitchResult: {
      archivedProfileId: string | null;
      blockers: {
        /** @enum {unknown} */
        kind: 'ACTIVE_ORDER' | 'OPEN_CASE' | 'PENDING_DELIVERY' | 'UNSETTLED_ESCROW';
        /** Format: uuid */
        resourceId: string;
      }[];
      user: components['schemas']['User'];
    };
    Terms: {
      deliveryMethod?: components['schemas']['DeliveryMethod'] | null;
      /** @description Null before the parties establish a service agreement; never a fabricated promised deadline. */
      dueAt: string | null;
      endsAt?: string | null;
      promisedDeliveryAt?: string | null;
      scope: string;
      startsAt?: string | null;
    };
    TokenPair: {
      accessToken: string;
      /** @constant */
      expiresIn: 900;
      refreshToken: string;
      /** Format: uuid */
      sessionId: string;
      /** @constant */
      tokenType: 'Bearer';
      user: components['schemas']['User'];
    };
    TopUpInput: {
      amount: components['schemas']['PositiveMoney'];
      reason: string;
      /** Format: uuid */
      userId: string;
    };
    Transaction: {
      /** @description Integer stored units as a decimal string, bounded by PostgreSQL BIGINT; never a float. */
      creditUnits: string;
      currency: components['schemas']['Currency'];
      /** @description Integer stored units as a decimal string, bounded by PostgreSQL BIGINT; never a float. */
      debitUnits: string;
      /** Format: uuid */
      id: string;
      /** @enum {unknown} */
      kind:
        | 'SIMULATED_TOPUP'
        | 'DEPOSIT_HOLD'
        | 'BALANCE_HOLD'
        | 'STORE_HOLD'
        | 'DELIVERY_ADJUSTMENT_HOLD'
        | 'DELIVERY_ADJUSTMENT_REFUND'
        | 'SETTLEMENT';
      operationKey: string;
      orderId: string | null;
      /** Format: date-time */
      postedAt: string;
      /** @constant */
      simulated: true;
    };
    TransactionPage: {
      items: components['schemas']['Transaction'][];
      nextCursor: string | null;
    };
    /** @description Integer stored units as a decimal string, up to 19 digits; backend additionally enforces PostgreSQL BIGINT maximum 9223372036854775807. Never a float. */
    Units: string;
    User: {
      activeBusinessProfile: components['schemas']['BusinessProfile'] | null;
      displayName: string;
      /** Format: email */
      email: string;
      /** Format: uuid */
      id: string;
      /** @enum {unknown} */
      locale: 'ar' | 'en';
      /** @description Current restrictions visible only in the authenticated own-account DTO. */
      restrictions?: components['schemas']['Restriction'][];
      roles: components['schemas']['RoleCode'][];
    };
    /** @description Publishing requires explicit confirmation that customers can visit and the point will be public. Null withdraws. */
    VenueInput: {
      confirmedPublic: boolean;
      point: components['schemas']['GeoPoint'] | null;
    };
    VenueSetting: {
      point: components['schemas']['GeoPoint'] | null;
    };
    Wallet: {
      /** @description Integer stored units as a decimal string, bounded by PostgreSQL BIGINT; never a float. */
      availableUnits: string;
      currency: components['schemas']['Currency'];
      /** Format: uuid */
      id: string;
      /** @constant */
      simulated: true;
    };
    WalletPage: {
      items: components['schemas']['Wallet'][];
      nextCursor: string | null;
    };
    /** @enum {string} */
    Workspace: 'FREELANCE' | 'PROFESSIONALS' | 'HOME_STORE';
  };
  responses: {
    /** @description INVALID_INPUT INVALID_CURSOR MIXED_CURRENCY INVALID_INSTALLMENT_TOTAL INVALID_IDEMPOTENCY_KEY AGREEMENT_REQUIRED INVALID_ALLOCATION REASON_REQUIRED */
    Error400: {
      headers: {
        'X-Request-Id'?: string;
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['ApiError'];
      };
    };
    /** @description AUTH_REQUIRED TOKEN_EXPIRED SESSION_REVOKED REFRESH_REUSE_DETECTED */
    Error401: {
      headers: {
        'X-Request-Id'?: string;
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['ApiError'];
      };
    };
    /** @description FORBIDDEN WORKSPACE_INACTIVE ACCOUNT_RESTRICTED */
    Error403: {
      headers: {
        'X-Request-Id'?: string;
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['ApiError'];
      };
    };
    /** @description NOT_FOUND */
    Error404: {
      headers: {
        'X-Request-Id'?: string;
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['ApiError'];
      };
    };
    /** @description INVALID_TRANSITION VERSION_CONFLICT STOCK_UNAVAILABLE DRIVER_ALREADY_ASSIGNED WORKSPACE_SWITCH_BLOCKED DEADLINE_EXPIRED IDEMPOTENCY_CONFLICT REQUEST_IN_PROGRESS ALREADY_SETTLED FUNDS_FROZEN BOOKING_NOT_CONFIRMED QUOTE_NOT_APPROVED DEPOSIT_REQUIRED HOLD_REQUIRED REVIEW_WINDOW_OPEN EVIDENCE_WINDOW_OPEN DELIVERY_PROOF_REQUIRED NOT_ELIGIBLE_FOR_SETTLEMENT TERMS_APPROVAL_REQUIRED */
    Error409: {
      headers: {
        'Retry-After'?: number;
        'X-Request-Id'?: string;
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['ApiError'];
      };
    };
    /** @description FILE_TOO_LARGE */
    Error413: {
      headers: {
        'X-Request-Id'?: string;
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['ApiError'];
      };
    };
    /** @description UNSUPPORTED_MEDIA_TYPE */
    Error415: {
      headers: {
        'X-Request-Id'?: string;
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['ApiError'];
      };
    };
    /** @description INSUFFICIENT_FUNDS SIMULATED_PAYMENT_FAILED SIMULATED_FAILURE UNSERVICEABLE_ADDRESS */
    Error422: {
      headers: {
        'X-Request-Id'?: string;
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['ApiError'];
      };
    };
    /** @description RATE_LIMITED */
    Error429: {
      headers: {
        'Retry-After'?: number;
        'X-Request-Id'?: string;
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['ApiError'];
      };
    };
    /** @description TEMPORARILY_UNAVAILABLE COMMISSION_CONFIGURATION_MISSING SETTLEMENT_POSTING_FAILED */
    Error503: {
      headers: {
        'Retry-After'?: number;
        'X-Request-Id'?: string;
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['ApiError'];
      };
    };
  };
  parameters: {
    /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
    IdempotencyKey: string;
    /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
    IfMatch: string;
  };
  requestBodies: never;
  headers: never;
  pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
  listAuditHistory: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['AuditRecordPage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  listAdminCases: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['CasePage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  assignAdminCase: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        caseId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ReasonInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Case'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  resolveAdminCase: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        caseId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ResolveCaseInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrderActionResult'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  resumeOverdueFinalPayment: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        caseId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ExtensionInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrderActionResult'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  listCommissionRates: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['CommissionRatePage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  configureCommission: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['CommissionRateInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['CommissionRate'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  reassignDelivery: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        deliveryId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ReassignInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Delivery'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  listDeliveryRates: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['DeliveryRatePage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  configureDeliveryRate: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['DeliveryRateInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['DeliveryRate'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  listDriverZones: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['DriverZonePage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  assignDriverZone: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['DriverZoneInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['DriverZone'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  removeDriverZone: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        zoneId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Operation completed without content */
      204: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  listModerationQueue: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ModerationItemPage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  moderateResource: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        resourceId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ModerationDecisionInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ModerationItem'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  revokeRestriction: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        restrictionId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ReasonInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Restriction'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  moderateReview: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        reviewId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ModerationDecisionInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Review'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  simulateWalletTopUp: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['TopUpInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Transaction'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  restrictAccount: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        userId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['RestrictionInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Restriction'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  forgotPassword: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['EmailInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Operation'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  login: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['LoginInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['TokenPair'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  logout: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['RefreshInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Operation'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  getSessionUser: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['User'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  refreshSession: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['RefreshInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['TokenPair'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  register: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['RegisterInput'];
      };
    };
    responses: {
      /** @description Successful result */
      201: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['User'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  resetPassword: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ResetPasswordInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Operation'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  listOwnBusinessProfiles: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['BusinessProfilePage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  createBusinessProfile: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['CreateProfileInput'];
      };
    };
    responses: {
      /** @description Successful result */
      201: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['BusinessProfile'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  updateBusinessProfile: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        profileId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ProfileInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['BusinessProfile'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  createPortfolioItem: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        profileId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['PortfolioInput'];
      };
    };
    responses: {
      /** @description Successful result */
      201: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PortfolioItem'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  removePortfolioItem: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        itemId: string;
        profileId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Operation completed without content */
      204: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  getPublicVenue: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        profileId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['VenueSetting'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  setPublicVenue: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        profileId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['VenueInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['VenueSetting'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  reactivateBusinessProfile: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        profileId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['AcceptInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['SwitchResult'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  listServiceAreas: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
      };
      header?: never;
      path: {
        profileId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ServiceAreaPage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  addServiceArea: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        profileId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ServiceAreaInput'];
      };
    };
    responses: {
      /** @description Successful result */
      201: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ServiceArea'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  removeServiceArea: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        areaId: string;
        profileId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Operation completed without content */
      204: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  switchBusinessWorkspace: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['SwitchInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['SwitchResult'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  getCase: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        caseId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Case'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  listEvidence: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
      };
      header?: never;
      path: {
        caseId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['EvidencePage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  submitEvidence: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        caseId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['EvidenceInput'];
      };
    };
    responses: {
      /** @description Successful result */
      201: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Evidence'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  listProposals: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
      };
      header?: never;
      path: {
        caseId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ProposalPage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  proposeResolution: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        caseId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ProposalInput'];
      };
    };
    responses: {
      /** @description Successful result */
      201: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Proposal'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  acceptResolutionProposal: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        caseId: string;
        proposalId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['AcceptInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrderActionResult'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  rejectResolutionProposal: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        caseId: string;
        proposalId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ReasonInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrderActionResult'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  acceptRevisionPlan: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        caseId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['AcceptInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrderActionResult'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  listCategories: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
        workspace?: components['schemas']['Workspace'];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['CategoryPage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  getDelivery: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        deliveryId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Delivery'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  acceptDeliveryJob: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        deliveryId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['AcceptInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Delivery'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  recordDropoff: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        deliveryId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['DeliveryRecordInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Delivery'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  reportDeliveryException: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        deliveryId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['DeliveryExceptionInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Delivery'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  chooseDeliveryFallback: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        deliveryId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['FallbackInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrderActionResult'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  recordPickup: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        deliveryId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['DeliveryRecordInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Delivery'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  releaseDriverAssignment: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        deliveryId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ReasonInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Delivery'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  proposeDeliveryTerms: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        deliveryId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['DeliveryTermsInput'];
      };
    };
    responses: {
      /** @description Successful result */
      201: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['DeliveryTerms'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  approveDeliveryTerms: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        deliveryId: string;
        revisionId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['AcceptInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrderActionResult'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  getDeliveryOptions: {
    parameters: {
      query: {
        addressId: string;
        currency: components['schemas']['Currency'];
        storeId: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['DeliveryOptions'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  registerDevice: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['DeviceInput'];
      };
    };
    responses: {
      /** @description Successful result */
      201: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Device'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  revokeDevice: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        deviceId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Operation completed without content */
      204: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  searchLocal: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['LocalSearch'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['LocalResults'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  listDriverAssignments: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['DriverJobPage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  listDriverJobs: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['DriverJobPage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  downloadFile: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        fileId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/octet-stream': string;
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  getFileStatus: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        fileId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['FileMetadata'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  uploadFile: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'multipart/form-data': components['schemas']['FileUploadInput'];
      };
    };
    responses: {
      /** @description Successful result */
      202: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['FileMetadata'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  listAreas: {
    parameters: {
      query: {
        cityId: string;
        cursor?: string;
        limit?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['AreaPage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  listCities: {
    parameters: {
      query: {
        cursor?: string;
        governorateId: string;
        limit?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['CityPage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  listGovernorates: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['GovernoratePage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  getHealth: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Health'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  listListings: {
    parameters: {
      query?: {
        categoryId?: string;
        cityId?: string;
        currency?: components['schemas']['Currency'];
        cursor?: string;
        governorateId?: string;
        limit?: number;
        maxDeliveryDays?: number;
        maxPriceUnits?: string;
        /** @description Owner-only management view, including drafts and inactive records. Requires a valid bearer session when true. */
        mine?: boolean;
        minPriceUnits?: string;
        minRating?: number;
        q?: string;
        sort?:
          | 'createdAt:desc'
          | 'priceUnits:asc'
          | 'priceUnits:desc'
          | 'rating:desc'
          | 'deliveryDays:asc';
        workspace?: 'FREELANCE' | 'PROFESSIONALS';
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ListingPage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  createListing: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ListingInput'];
      };
    };
    responses: {
      /** @description Successful result */
      201: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Listing'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  getListing: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        listingId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Listing'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  updateListing: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        listingId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ListingPatchInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Listing'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  deactivateListing: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        listingId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ReasonInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Listing'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  publishListing: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        listingId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['AcceptInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Listing'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  getMe: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['User'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  updateMe: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['MeInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['User'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  listAddresses: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['AddressPage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  createAddress: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['AddressInput'];
      };
    };
    responses: {
      /** @description Successful result */
      201: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Address'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  archiveAddress: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        addressId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Operation completed without content */
      204: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  updateAddress: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        addressId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['AddressInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Address'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  listNotifications: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
        unread?: boolean;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['NotificationPage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  readNotification: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        notificationId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Notification'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  readAllNotifications: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Operation'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  getOperation: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        operationId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Operation'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  listOrders: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
        participation?: 'BUYER' | 'PROVIDER';
        sort?: 'createdAt:desc' | 'createdAt:asc';
        state?: components['schemas']['OrderState'];
        workspace?: components['schemas']['Workspace'];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrderPage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  getOrder: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Order'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  acceptBooking: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['AcceptInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrderActionResult'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  acceptExtension: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['AcceptInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrderActionResult'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  acceptSchedule: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['AcceptInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrderActionResult'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  acceptStoreOrder: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['AcceptInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrderActionResult'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  getAllowedOrderActions: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['AllowedActionPage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  agreeOrder: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['AgreementInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrderActionResult'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  cancelOrder: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['CancelInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrderActionResult'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  listOrderCases: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
      };
      header?: never;
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['CasePage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  openCase: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['CaseInput'];
      };
    };
    responses: {
      /** @description Successful result */
      201: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Case'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  getOrderRooms: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
      };
      header?: never;
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ChatRoomPage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  confirmReceipt: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['AcceptInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrderActionResult'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  deliverService: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['DeliverInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrderActionResult'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  requestPlatformDriver: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['AcceptInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrderActionResult'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  agreeInspectionSchedule: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['InspectionScheduleInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Order'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  listMessages: {
    parameters: {
      query: {
        cursor?: string;
        limit?: number;
        roomId: string;
      };
      header?: never;
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['MessagePage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  sendMessage: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['MessageInput'];
      };
    };
    responses: {
      /** @description Successful result */
      201: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Message'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  listMilestones: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
      };
      header?: never;
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['MilestonePage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  createMilestone: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['MilestoneInput'];
      };
    };
    responses: {
      /** @description Successful result */
      201: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Milestone'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  listOrderPayments: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
      };
      header?: never;
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PaymentPage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  holdBalance: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['PaymentInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrderActionResult'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  holdDeposit: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['PaymentInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrderActionResult'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  recordProgress: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ProgressInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrderActionResult'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  proposeSchedule: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ScheduleInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrderActionResult'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  listOrderQuotes: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
      };
      header?: never;
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['QuotePage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  sendQuote: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['QuoteInput'];
      };
    };
    responses: {
      /** @description Successful result */
      201: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Quote'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  markReady: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ReadinessInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrderActionResult'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  markStoreReady: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['AcceptInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrderActionResult'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  rejectOrder: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ReasonInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrderActionResult'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  requestExtension: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ExtensionInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrderActionResult'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  createReview: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ReviewInput'];
      };
    };
    responses: {
      /** @description Successful result */
      201: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Review'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  getSettlement: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Settlement'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  startWork: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['AcceptInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrderActionResult'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  listSubmissions: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
      };
      header?: never;
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['FileMetadataPage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  getOrderTimeline: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
      };
      header?: never;
      path: {
        orderId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrderTransitionPage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  createFreelanceOrder: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['FreelanceOrderInput'];
      };
    };
    responses: {
      /** @description Successful result */
      201: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Order'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  requestInspectionQuote: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['InspectionInput'];
      };
    };
    responses: {
      /** @description Successful result */
      201: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Order'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  createBooking: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['BookingInput'];
      };
    };
    responses: {
      /** @description Successful result */
      201: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Order'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  checkoutStore: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['CheckoutInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrderActionResult'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  previewStoreCheckout: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['StorePreviewInput'];
      };
    };
    responses: {
      /** @description Successful result */
      201: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['StorePreview'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  listProducts: {
    parameters: {
      query?: {
        categoryId?: string;
        cityId?: string;
        currency?: components['schemas']['Currency'];
        cursor?: string;
        governorateId?: string;
        limit?: number;
        maxPriceUnits?: string;
        /** @description Owner-only management view, including drafts and inactive records. Requires a valid bearer session when true. */
        mine?: boolean;
        minPriceUnits?: string;
        q?: string;
        sort?: 'createdAt:desc' | 'priceUnits:asc' | 'priceUnits:desc' | 'rating:desc';
        storeId?: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ProductPage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  createProduct: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ProductInput'];
      };
    };
    responses: {
      /** @description Successful result */
      201: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Product'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  getProduct: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        productId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Product'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  updateProduct: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        productId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ProductPatchInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Product'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  deactivateProduct: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        productId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ReasonInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Product'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  publishProduct: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        productId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['AcceptInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Product'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  setProductStock: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        productId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['StockInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Product'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  getPublicProfile: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        profileId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PublicProfile'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  listVerifiedReviews: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
        sort?: 'createdAt:desc' | 'stars:desc' | 'stars:asc';
      };
      header?: never;
      path: {
        profileId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ReviewPage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  approveQuote: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        quoteId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['AcceptInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrderActionResult'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  rejectQuote: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
        /** @description Quoted current parent order.version. Rechecked under lock; stale version -> VERSION_CONFLICT. Idempotency replay may return original result despite stale version. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        quoteId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ReasonInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrderActionResult'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  createRealtimeTicket: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['RealtimeTicketInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['RealtimeTicket'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  editReview: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        reviewId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ReviewInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Review'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  listStores: {
    parameters: {
      query?: {
        cityId?: string;
        cursor?: string;
        governorateId?: string;
        limit?: number;
        /** @description Owner-only management view, including drafts and inactive records. Requires a valid bearer session when true. */
        mine?: boolean;
        q?: string;
        sort?: 'createdAt:desc' | 'nameEn:asc';
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['StorePage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  createStore: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['StoreInput'];
      };
    };
    responses: {
      /** @description Successful result */
      201: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Store'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  getStore: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        storeId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Store'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  updateStore: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        storeId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['StorePatchInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Store'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  deactivateStore: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        storeId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ReasonInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Store'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  publishStore: {
    parameters: {
      query?: never;
      header: {
        /** @description Actor/route/key scoped, request-hash bound. Reuse same key on timeout; different body -> 409. Permanent installment/settlement operation keys prevent duplicates across different client keys. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        storeId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['AcceptInput'];
      };
    };
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Store'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  listWallets: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['WalletPage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
  listWalletTransactions: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
      };
      header?: never;
      path: {
        currency: components['schemas']['Currency'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful result */
      200: {
        headers: {
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['TransactionPage'];
        };
      };
      400: components['responses']['Error400'];
      401: components['responses']['Error401'];
      403: components['responses']['Error403'];
      404: components['responses']['Error404'];
      409: components['responses']['Error409'];
      413: components['responses']['Error413'];
      415: components['responses']['Error415'];
      422: components['responses']['Error422'];
      429: components['responses']['Error429'];
      503: components['responses']['Error503'];
    };
  };
}
