-- Update Client table schema
ALTER TABLE "Client" 
  ADD COLUMN IF NOT EXISTS "addressLine1" TEXT,
  ADD COLUMN IF NOT EXISTS "addressLine2" TEXT,
  ADD COLUMN IF NOT EXISTS "city" TEXT,
  ADD COLUMN IF NOT EXISTS "state" TEXT,
  ADD COLUMN IF NOT EXISTS "postalCode" TEXT,
  ADD COLUMN IF NOT EXISTS "country" TEXT DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS "taxIdLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "taxIdValue" TEXT;

-- Migrate data from old address column to new columns (if address exists)
UPDATE "Client" 
SET "addressLine1" = "address"
WHERE "address" IS NOT NULL AND "addressLine1" IS NULL;

-- Migrate data from old taxId column to new columns (if taxId exists)
UPDATE "Client" 
SET "taxIdValue" = "taxId"
WHERE "taxId" IS NOT NULL AND "taxIdValue" IS NULL;

-- Drop old columns after migration
ALTER TABLE "Client" 
  DROP COLUMN IF EXISTS "address",
  DROP COLUMN IF EXISTS "taxId";

-- Update Company table schema
ALTER TABLE "Company" 
  ADD COLUMN IF NOT EXISTS "addressLine1" TEXT,
  ADD COLUMN IF NOT EXISTS "addressLine2" TEXT,
  ADD COLUMN IF NOT EXISTS "city" TEXT,
  ADD COLUMN IF NOT EXISTS "state" TEXT,
  ADD COLUMN IF NOT EXISTS "postalCode" TEXT,
  ADD COLUMN IF NOT EXISTS "country" TEXT DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS "taxIdLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "taxIdValue" TEXT,
  ADD COLUMN IF NOT EXISTS "timeZone" TEXT DEFAULT 'America/New_York';

-- Migrate data from old address column to new columns (if address exists)
UPDATE "Company" 
SET "addressLine1" = "address"
WHERE "address" IS NOT NULL AND "addressLine1" IS NULL;

-- Migrate data from old taxId column to new columns (if taxId exists)
UPDATE "Company" 
SET "taxIdValue" = "taxId"
WHERE "taxId" IS NOT NULL AND "taxIdValue" IS NULL;

-- Drop old columns after migration
ALTER TABLE "Company" 
  DROP COLUMN IF EXISTS "address",
  DROP COLUMN IF EXISTS "taxId";

-- Update Invoice table (add missing columns, keep pdfUrl for now)
ALTER TABLE "Invoice"
  ADD COLUMN IF NOT EXISTS "paymentTerms" TEXT DEFAULT 'NET_30',
  ADD COLUMN IF NOT EXISTS "paymentTermsCustomDays" INTEGER,
  ADD COLUMN IF NOT EXISTS "poNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "memo" TEXT,
  ADD COLUMN IF NOT EXISTS "termsConditions" TEXT,
  ADD COLUMN IF NOT EXISTS "lateFeePercent" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "lateFeeFixed" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "shippingAmount" DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "taxMode" TEXT DEFAULT 'NONE',
  ADD COLUMN IF NOT EXISTS "taxScope" TEXT DEFAULT 'LINE_ITEM',
  ADD COLUMN IF NOT EXISTS "invoiceTaxPercent" DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "template" TEXT DEFAULT 'CLASSIC',
  ADD COLUMN IF NOT EXISTS "achRouting" TEXT,
  ADD COLUMN IF NOT EXISTS "achAccount" TEXT,
  ADD COLUMN IF NOT EXISTS "wireIban" TEXT,
  ADD COLUMN IF NOT EXISTS "wireSwift" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentLink" TEXT,
  ADD COLUMN IF NOT EXISTS "checkPayableTo" TEXT,
  ADD COLUMN IF NOT EXISTS "subtotal" DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "discountTotal" DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "taxTotal" DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "total" DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "paidAmount" DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "dueAmount" DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "latestPdfUrl" TEXT;
