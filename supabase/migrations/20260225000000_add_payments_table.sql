-- ============================================================
-- Payments table for GCash (and future payment-method) tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  request_id    UUID REFERENCES public.citizen_concerns(id),  -- links to the service request
  amount        NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'gcash',                -- gcash | cash | bank_transfer …
  reference_number TEXT,                                       -- GCash ref no
  gcash_number  TEXT,                                          -- payer's GCash number
  proof_url     TEXT,                                          -- optional screenshot URL
  status        TEXT NOT NULL DEFAULT 'pending_verification',  -- pending_verification | verified | rejected | refunded
  verified_by   UUID REFERENCES auth.users(id),
  verified_at   TIMESTAMPTZ,
  notes         TEXT,                                          -- admin notes
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Row-level security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can read their own payments
CREATE POLICY "Users can read own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own payments
CREATE POLICY "Users can insert own payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all payments
CREATE POLICY "Admins can read all payments"
  ON public.payments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update any payment (verify / reject)
CREATE POLICY "Admins can update payments"
  ON public.payments FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
