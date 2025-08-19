-- Update plan prices to USD values
-- These will be displayed as-is in the UI with $ symbol
-- Razorpay will process them as INR (treating the numeric value as rupees)

BEGIN;

-- Update Starter Plan: $29/month, $299/year
UPDATE plans 
SET price_monthly = 29, 
    price_yearly = 299
WHERE type = 'starter';

-- Update Professional Plan: $75/month, $759/year  
UPDATE plans 
SET price_monthly = 75, 
    price_yearly = 759
WHERE type = 'professional';

-- Update Enterprise Plan: $100/month, $999/year
UPDATE plans 
SET price_monthly = 100, 
    price_yearly = 999
WHERE type = 'enterprise';

-- Keep Free Plan at 0
UPDATE plans 
SET price_monthly = 0, 
    price_yearly = 0
WHERE type = 'free';

-- Verify the updates
SELECT type, name, price_monthly, price_yearly 
FROM plans 
ORDER BY 
  CASE type 
    WHEN 'free' THEN 1
    WHEN 'starter' THEN 2
    WHEN 'professional' THEN 3
    WHEN 'enterprise' THEN 4
  END;

COMMIT;

-- Expected output:
-- free         | Free Plan         | 0    | 0
-- starter      | Starter Plan      | 29   | 299
-- professional | Professional Plan | 75   | 759
-- enterprise   | Enterprise Plan   | 100  | 999