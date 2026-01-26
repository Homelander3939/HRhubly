# Data Persistence Fix - Complete Documentation

## 🚨 Critical Issue Identified

The platform was experiencing **catastrophic data loss** where registered users, their businesses, candidates, tests, and submissions were being periodically deleted from the database, leaving only demo data (gensweaty@gmail.com and associated demo business).

This is a **critical production issue** that makes the platform unusable as a real business application.

## 🔍 Root Causes Identified

### 1. Aggressive Database Reset in setup.ts
**Location**: `src/server/scripts/setup.ts`

**Problem**: The setup script (which runs on EVERY application startup) contained logic that would perform a **full database reset** (deleting ALL user data) if it detected `existingBusinessCount === 0`.

```typescript
// DANGEROUS CODE (NOW REMOVED):
if (existingBusinessCount === 0) {
  // Full database reset - deletes ALL data
  await db.submission.deleteMany({});
  await db.user.deleteMany({});
  await db.test.deleteMany({});
  await db.business.deleteMany({});
  await db.adminUser.deleteMany({});
  // ... etc
}
```

**Why this was dangerous**:
- If the business count check ever returned 0 (database connection issue, race condition, etc.), ALL user data would be deleted
- The script ran on every app startup, creating multiple opportunities for data loss
- There was no safety mechanism to prevent this in production
- Once triggered, all registered businesses, users, candidates, tests, and submissions would be permanently deleted

### 2. Aggressive TRUNCATE Operations in Cleanup Scripts
**Locations**: 
- `src/server/scripts/pre-db-push-cleanup.ts`
- `src/server/scripts/pre-migration-cleanup.ts`

**Problem**: Both cleanup scripts contained "aggressive cleanup" modes using `TRUNCATE TABLE ... CASCADE` that would wipe entire tables if they detected any orphaned records.

```typescript
// DANGEROUS CODE (NOW REMOVED):
if (orphanedRecordsFound) {
  // Nuclear option - delete EVERYTHING
  await client.query(`TRUNCATE TABLE submissions CASCADE`);
  await client.query(`TRUNCATE TABLE users CASCADE`);
  await client.query(`TRUNCATE TABLE businesses CASCADE`);
  // ... etc
}
```

**Why this was dangerous**:
- These scripts were meant to run before database migrations
- If they detected ANY data inconsistency, they would delete ALL data
- They could be triggered during normal operations
- No distinction between fixing a few orphaned records vs. deleting everything

### 3. No Production Safety Mechanisms
**Problem**: There were no safeguards to prevent data deletion in production:
- No environment variable check before destructive operations
- No explicit confirmation required for data deletion
- No logging of what was about to be deleted
- No way to disable automatic cleanup in production

## ✅ Fixes Implemented

### 1. Complete Rewrite of setup.ts (Safe Mode)

**Changes Made**:
- ✅ **REMOVED all `deleteMany` operations** - the script now NEVER deletes user data
- ✅ **Made the script truly idempotent** - it only creates missing data, never removes existing data
- ✅ **Added comprehensive safety checks** before any database operations
- ✅ **Added detailed logging** of database state before and after operations
- ✅ **Added ALLOW_DATABASE_RESET environment variable** as a safety mechanism
- ✅ **Preserves all existing businesses, users, candidates, tests, and submissions**
- ✅ **Only creates demo data if database is completely empty**

**New Behavior**:
```typescript
// NEW SAFE CODE:
const isDatabaseEmpty = existingBusinessCount === 0 && 
                       existingUserCount === 0 && 
                       existingAdminCount === 0 && 
                       existingTestCount === 0 && 
                       existingSubmissionCount === 0;

if (!isDatabaseEmpty) {
  console.log("✅ Database contains user data - preserving all existing data");
  console.log("✅ Will only create missing default/demo entries if needed");
  // NEVER delete anything - only create what's missing
}
```

**What the script now does**:
1. Counts all existing data (businesses, users, admins, tests, submissions)
2. Logs the current database state
3. Checks if database is truly empty (ALL tables have 0 rows)
4. If data exists: Preserves everything, only creates missing demo/default entries
5. If database is empty: Creates initial demo data for testing
6. Never performs any delete operations unless ALLOW_DATABASE_RESET=true AND database is empty

### 2. Disabled Aggressive Cleanup in pre-db-push-cleanup.ts

**Changes Made**:
- ✅ **REMOVED the TRUNCATE TABLE CASCADE fallback** that was deleting all data
- ✅ **Kept only selective cleanup** of orphaned records (records with invalid foreign keys)
- ✅ **Added safety warnings** explaining that aggressive cleanup is disabled
- ✅ **Made it clear** this script only fixes data integrity issues, not deletes user data

**New Behavior**:
- Only deletes records with invalid foreign key references (orphaned data)
- Never performs bulk deletion of entire tables
- Preserves all valid user data
- Logs what it's cleaning up and why

### 3. Disabled Aggressive Cleanup in pre-migration-cleanup.ts

**Changes Made**:
- ✅ **REMOVED the TRUNCATE TABLE CASCADE fallback**
- ✅ **Kept only selective cleanup** of orphaned records
- ✅ **Added safety warnings**
- ✅ **Made cleanup failures non-fatal** (script continues even if cleanup fails)

### 4. Added ALLOW_DATABASE_RESET Environment Variable

**New Environment Variable**: `ALLOW_DATABASE_RESET`

**Purpose**: Critical safety mechanism to prevent accidental data deletion

**Default Value**: `false`

**When to set to true**: NEVER in production, only in local development if you explicitly want to reset

**How it works**:
```typescript
const allowReset = process.env.ALLOW_DATABASE_RESET === 'true';

if (allowReset) {
  console.warn("⚠️  WARNING: ALLOW_DATABASE_RESET is enabled!");
  console.warn("⚠️  This should NEVER be enabled in production!");
}

// Even with allowReset=true, data is only deleted if database is completely empty
if (allowReset && isDatabaseEmpty) {
  // Only now is it safe to create initial data
}
```

**Added to**:
- `src/server/env.ts` - Zod schema validation
- `.env` - Configuration with detailed documentation

## 🛡️ Safety Mechanisms Now in Place

### 1. Multiple Layers of Protection
1. **Environment Variable Check**: ALLOW_DATABASE_RESET must be explicitly set to 'true'
2. **Empty Database Check**: Even with reset allowed, only acts if ALL tables are empty
3. **No Automatic Deletion**: Setup script never deletes data, only creates missing data
4. **Comprehensive Logging**: Every operation is logged with clear status messages
5. **Preserved User Data**: All existing businesses, users, tests, and submissions are protected

### 2. Idempotent Operations
- Setup script can be run multiple times safely
- Each run only creates what's missing
- Existing data is always preserved
- No risk of duplicate data or data loss

### 3. Clear Warnings and Documentation
- Console logs clearly indicate when data is being preserved
- Warnings shown if ALLOW_DATABASE_RESET is enabled
- Documentation in code and .env file
- This comprehensive documentation file

## 📊 Current Database State (After Fix)

The fix ensures that your database will maintain:
- ✅ All registered businesses (not just 'demo')
- ✅ All business admin users (not just gensweaty@gmail.com)
- ✅ All candidates/users who have submitted applications
- ✅ All tests created by businesses
- ✅ All test submissions and results
- ✅ All other user data (questions, answers, trainings, etc.)

**Demo Data** (only created if database is completely empty):
- Business: 'demo' (ID: 1, Demo Company)
- Admin Users: 'admin' and 'gensweaty' for demo business
- Sample Test: Pre-configured test with questions
- Sample Candidates: 5 demo candidates with various statuses
- Sample Submissions: 3 test submissions (2 completed, 1 in progress)

## 🔧 Environment Variables

### Critical Variables

#### ALLOW_DATABASE_RESET
- **Type**: String ("true" or "false")
- **Default**: "false"
- **Current Value**: "false"
- **Must Change**: NO - Keep as "false" in production
- **Purpose**: Safety mechanism to prevent data deletion
- **When to use "true"**: ONLY in local development when you explicitly want to reset an empty database

#### Other Important Variables
All other environment variables remain unchanged and are working correctly:
- `ADMIN_PASSWORD`: Password for admin user
- `JWT_SECRET`: Secret for JWT token generation
- `RESEND_API_KEY`: Email service API key
- `EMAIL_FROM`: Sender email address
- `OPENROUTER_API_KEY`: AI service API key

## 🧪 Testing Recommendations

### 1. Verify Data Persistence
1. Register a new business via signup
2. Create candidates and tests for that business
3. Restart the application
4. Verify all data is still present
5. Check that no data was deleted

### 2. Verify Demo Data Creation
1. Start with a completely empty database
2. Run the application
3. Verify demo business and sample data are created
4. Restart the application
5. Verify demo data is preserved (not recreated or deleted)

### 3. Verify Safety Mechanisms
1. Try setting ALLOW_DATABASE_RESET=true with existing data
2. Verify that data is still preserved (only acts on empty databases)
3. Check console logs for safety warnings
4. Set ALLOW_DATABASE_RESET=false for production

### 4. Monitor Database State
- Check database counts before and after app restarts
- Verify businesses, users, tests, and submissions remain constant
- Look for any unexpected deletions in logs
- Confirm all registered users can still log in

## 📝 Maintenance Guidelines

### DO:
✅ Keep ALLOW_DATABASE_RESET=false in production
✅ Monitor database counts regularly
✅ Check logs for any unexpected cleanup operations
✅ Backup database regularly
✅ Test data persistence after any deployment

### DON'T:
❌ NEVER set ALLOW_DATABASE_RESET=true in production
❌ Don't modify cleanup scripts without thorough testing
❌ Don't add any deleteMany operations to setup.ts
❌ Don't use TRUNCATE TABLE CASCADE in production code
❌ Don't assume data will persist without testing

## 🎯 Summary

### Problem
- Users' data (businesses, candidates, tests) was being periodically deleted
- Only demo data remained after deletion
- Platform was unusable as a real business application

### Root Cause
- Aggressive database reset in setup.ts triggered on every app startup
- Cleanup scripts using TRUNCATE CASCADE deleting all data
- No safety mechanisms to prevent production data loss

### Solution
- Completely rewrote setup.ts to NEVER delete user data
- Disabled aggressive cleanup in all cleanup scripts
- Added ALLOW_DATABASE_RESET safety mechanism
- Made all operations idempotent and safe
- Added comprehensive logging and warnings

### Result
- ✅ User data is now safe and persistent
- ✅ Registered businesses and users are preserved
- ✅ Setup script only creates missing data
- ✅ Multiple layers of safety protection
- ✅ Platform can now function as a real business application

## 🚀 Next Steps

1. **Deploy the fix** to production immediately
2. **Verify** that existing data is preserved after restart
3. **Monitor** database state for the next few days
4. **Test** new business registrations to ensure they persist
5. **Keep** ALLOW_DATABASE_RESET=false permanently

---

**Date**: January 2025
**Status**: ✅ FIXED - Data persistence is now safe and reliable
**Priority**: 🚨 CRITICAL - This fix is essential for production use
