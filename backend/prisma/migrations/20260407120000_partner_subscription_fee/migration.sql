-- Partner subscription columns (later removed by 20260407210000_drop_partner_subscription_columns)
ALTER TABLE "users" ADD COLUMN "partner_subscription_paid_at" TIMESTAMP(3),
ADD COLUMN "partner_subscription_checkout_session_id" TEXT;
