-- Update Razorpay Plan IDs in the database
-- This script updates the razorpay_plan_id field for each plan

-- Update Starter Plan
UPDATE plans 
SET razorpay_plan_id = jsonb_build_object(
    'monthly', 'plan_R756ULe2ADKrAK',
    'yearly', 'plan_R75C5I1wMcFKWJ'
)
WHERE type = 'starter';

-- Update Professional Plan
UPDATE plans 
SET razorpay_plan_id = jsonb_build_object(
    'monthly', 'plan_R75ENZQF1ZP3fk',
    'yearly', 'plan_R75Euuno76irUT'
)
WHERE type = 'professional';

-- Update Enterprise Plan
UPDATE plans 
SET razorpay_plan_id = jsonb_build_object(
    'monthly', 'plan_R75FKqSLzCEm5D',
    'yearly', 'plan_R75FVzznhMhvVA'
)
WHERE type = 'enterprise';

-- Verify the updates
SELECT 
    id,
    name,
    type,
    price_monthly,
    price_yearly,
    razorpay_plan_id
FROM plans
WHERE type IN ('starter', 'professional', 'enterprise')
ORDER BY 
    CASE type
        WHEN 'starter' THEN 1
        WHEN 'professional' THEN 2
        WHEN 'enterprise' THEN 3
    END;