# Migration Instructions to Fix scheduled_at Column Error

## Problem
The error `The column campaigns.scheduled_at does not exist in the current database` indicates that the database schema is out of sync with the Prisma schema. The `scheduled_at` column is defined in the Prisma schema but doesn't exist in the actual database.

## Solution
A migration has been created to add the missing `scheduled_at` column to the campaigns table.

### Migration File Location
`/workspace/prisma/migrations/20250822063135_add_scheduled_at_to_campaigns/migration.sql`

### Migration SQL Content
```sql
-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN "scheduled_at" TIMESTAMP(3);
```

## How to Apply the Migration

### Option 1: Using Prisma CLI (Recommended)
If you have access to the production database credentials:

1. Set the required environment variables:
   ```bash
   export POSTGRES_URL="your-database-url"
   export POSTGRES_URL_NON_POOLING="your-direct-database-url"
   ```

2. Run the migration:
   ```bash
   npx prisma migrate deploy
   ```

### Option 2: Direct SQL Execution
If you prefer to run the SQL directly:

1. Connect to your PostgreSQL database
2. Run the following SQL command:
   ```sql
   ALTER TABLE "campaigns" ADD COLUMN "scheduled_at" TIMESTAMP(3);
   ```

### Option 3: Using Database Management Tool
1. Open your database management tool (e.g., pgAdmin, DBeaver, etc.)
2. Connect to your production database
3. Execute the ALTER TABLE command above

## Post-Migration Steps

1. Verify the column was added:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'campaigns' AND column_name = 'scheduled_at';
   ```

2. Regenerate Prisma Client:
   ```bash
   npx prisma generate
   ```

3. Restart your application to pick up the schema changes

## Additional Notes
- The `scheduled_at` column is nullable (optional), so existing records won't be affected
- This column is used to schedule campaigns to start at a specific time in the future
- The column type is TIMESTAMP(3), which includes millisecond precision