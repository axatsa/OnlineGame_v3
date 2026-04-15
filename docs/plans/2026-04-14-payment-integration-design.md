# Design Document: Payment Integration (Payme & Click)

**Date**: 2026-04-14  
**Topic**: Payment Integration for OnlineGame_v3  
**Status**: Approved

## 1. Overview
The goal is to enable users to pay for subscriptions ("pro" and "school" plans) using Uzbekistan's local payment providers: Payme and Click.

## 2. Architecture
The system uses a manual redirection flow to the payment provider's checkout page and handles asynchronous status updates via HTTP Webhooks.

- **Frontend**: `front/src/pages/payment/Checkout.tsx` initiates the payment by calling the backend.
- **Backend**: `backend/apps/payments/router.py` handles creation of `UserPayment` records and provides webhook endpoints.
- **Database**: `UserPayment` tracks transaction state, and `UserSubscription` stores active plans.

## 3. Configuration (.env)
The following variables are required:
- `PAYMENT_SIMULATE`: Set to `true` for testing without real providers.
- `PAYME_MERCHANT_ID`, `PAYME_SECRET_KEY`
- `CLICK_SERVICE_ID`, `CLICK_MERCHANT_ID`, `CLICK_SECRET_KEY`
- `PLAN_PRO_PRICE_TIYIN`, `PLAN_SCHOOL_PRICE_TIYIN` (Prices in tiyin: 1 UZS = 100 tiyin)
- `FRONTEND_URL`: Used for redirecting the user back to the success page.

## 4. Legal & Compliance
To pass moderation by Payme/Click:
- The website must have a **Public Offer** (Oferta).
- Clear pricing information.
- Official logos of payment systems on the checkout page.

## 5. Security
- Use HMAC signature verification for Click webhooks.
- Use Basic Auth (Merchant ID:Secret Key) for Payme webhooks.
- All webhook endpoints must be protected by HTTPS in production.

## 6. Testing Plan
1. **Simulation Phase**: Set `PAYMENT_SIMULATE=true` and verify the full user flow.
2. **Sandbox Phase**: Use provider-specific test keys and cards.
3. **Production Phase**: Switch to real keys and perform a small real transaction.

## 7. Important: Multi-project restrictions

Do **NOT** reuse `Merchant ID` or `Service ID` from other projects (e.g., "Testora").

**Risks of reuse:**
- **Webhook Collision**: Both service providers (Click/Payme) allow only ONE callback URL per service. If you point it to OnlineGame_v3, the other project's payments will break.
- **Accounting**: Revenue will be mixed in the dashboard.
- **Transaction ID Clashes**: If both projects use similar order numbering, payments will fail with "Duplicate transaction" errors.

**Correct Action**: Create a separate "Service" or "Project" in the Click and Payme merchant cabinets for OnlineGame_v3 to get unique credentials and a separate callback URL.

