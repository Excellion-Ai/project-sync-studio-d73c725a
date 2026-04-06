

## Stripe Course Purchase Pipeline — Status and Plan

### Current State: NOT FUNCTIONAL

The database has the scaffolding (columns like `stripe_account_id`, `stripe_price_id`, `stripe_product_id` on `courses`, `stripe_account_id` on `profiles`, a `purchases` table, and a `PricingTab` component showing 2% Excellion fee), but **zero backend logic** exists to actually process course payments:

1. **No Stripe Connect onboarding** — creators cannot connect their Stripe accounts
2. **No course checkout edge function** — there's no function to create a checkout session for buying a course (the existing `create-checkout` is only for platform subscriptions)
3. **Checkout page is a placeholder** — `src/pages/Checkout.tsx` renders a static placeholder
4. **No `application_fee_amount` or `transfer_data`** anywhere — the 2% Excellion fee is only shown in the UI breakdown but never applied in Stripe
5. **No course purchase verification** — no function to verify a course was purchased and create the enrollment

### What Needs to Be Built

**Phase 1: Stripe Connect Onboarding**
- Create edge function `create-connect-account` — generates a Stripe Connect Express account for the creator, stores `stripe_account_id` on `profiles`, returns onboarding link
- Create edge function `connect-account-callback` — handles return from Stripe Connect onboarding, marks `stripe_onboarding_complete = true`
- Add "Connect Stripe" button in builder settings or profile settings

**Phase 2: Course Checkout**
- Create edge function `create-course-checkout` — creates a Stripe Checkout session in `mode: "payment"` with:
  - `payment_intent_data.application_fee_amount` = 2% of price (the Excellion fee)
  - `payment_intent_data.transfer_data.destination` = creator's `stripe_account_id`
  - Line item using the course `price_cents`
- Build out `src/pages/Checkout.tsx` — fetches course, shows summary, calls `create-course-checkout`, redirects to Stripe

**Phase 3: Purchase Fulfillment**
- Create edge function `verify-course-purchase` — given a `session_id`, verifies payment with Stripe, inserts into `purchases` table, creates `enrollments` row, returns success
- Build `src/pages/PurchaseSuccess.tsx` — calls verify function, shows confirmation, links to course

**Phase 4: Webhook Handling (Optional but Recommended)**
- Extend existing `stripe-webhook` to handle `checkout.session.completed` for `mode: "payment"` (course purchases), as a safety net for fulfillment

### Technical Details

- **Stripe Connect type**: Express accounts (simplest — Stripe handles payouts/tax/KYC)
- **Fee model**: `application_fee_amount` in cents = `Math.round(price_cents * 0.02)` on the PaymentIntent
- **Flow**: Student clicks "Enroll Now" on paid course → redirected to Stripe Checkout → Stripe splits payment (98% to creator, 2% to Excellion platform account) → student redirected to success page → enrollment created
- **Existing `PricingTab`** component already shows the correct fee breakdown (Stripe 2.9%+$0.30 + Excellion 2%); backend just needs to match it
- **Edge functions needed**: 3 new (`create-connect-account`, `connect-account-callback`, `create-course-checkout`), 1 modified (`stripe-webhook`), 1 new verification (`verify-course-purchase`)
- **Pages needed**: Rebuild `Checkout.tsx`, new `PurchaseSuccess.tsx`, new Connect settings UI

### Scope
This is a significant feature (~5-7 edge functions and pages). Recommend building in phases, starting with Phase 1 (Connect onboarding) so creators can link their Stripe accounts, then Phase 2-3 for the actual checkout flow.

