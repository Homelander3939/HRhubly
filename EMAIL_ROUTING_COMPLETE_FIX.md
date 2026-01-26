# Email Routing Complete Fix Guide

## 🎯 Executive Summary

**Problem**: Emails are only being sent to `ananiadevsurashvili@gmail.com`, not to other registered users like `gensweaty@gmail.com` or `anania.devsurashvili@caucasusauto.com`.

**Root Cause**: The email routing system has two separate recipient determination mechanisms:
1. **Business Email** (`business.email` field) - receives admin notifications (new applications, test requests, test completions)
2. **Admin User Email** (`admin_users.email` field) - receives password reset emails

If these fields are not set correctly in the database, emails will not reach the intended recipients.

**Solution**: Run the diagnostic tool to identify which emails are configured, then run the fix script to update the database configuration.

---

## 📧 How Email Routing Works

### 1. Admin Notifications (Applications, Test Requests, Completions)

When a candidate:
- Submits a general application → Email sent to **`business.email`**
- Requests test authorization → Email sent to **`business.email`**
- Completes a test → Email sent to **`business.email`**

**Code Location**: `src/server/trpc/procedures/candidate.ts`
- `submitGeneralApplication` (line 634-646)
- `submitAuthorizationRequest` (line 226-246)
- `completeTestSubmission` (line 444-476)

### 2. Password Reset Emails

When an admin requests password reset:
- System looks up admin user by email/username in the specified business
- If found → Email sent to **`admin_user.email`**
- If not found → Returns success (security measure) but NO email is sent

**Code Location**: `src/server/trpc/procedures/admin.ts`
- `initiatePasswordReset` (line 1334-1410)

### 3. Test Invitations

When an admin assigns a test to a candidate:
- Email sent to **`candidate.email`** (the User table)

**Code Location**: `src/server/trpc/procedures/admin.ts`
- `assignTestToCandidate` (line 1008-1070)

---

## 🔍 Diagnosis: Why Only One Email Works

### Step 1: Run the Diagnostic Tool

```bash
npm run diagnose-email
```

This will show you:
1. **All businesses and their email addresses** (who receives admin notifications)
2. **All admin users and their email addresses** (who can receive password resets)
3. **Analysis of specific emails** (ananiadevsurashvili@gmail.com, gensweaty@gmail.com, etc.)
4. **Specific recommendations** for fixing any issues

### Step 2: Interpret the Results

#### Scenario A: All Businesses Share the Same Email

**Symptom**:
```
📧 BUSINESS EMAIL ANALYSIS:
   Total businesses: 2
   Unique business emails: 1
   ⚠️  WARNING: All businesses share the same email address!
   This means all admin notifications go to: ananiadevsurashvili@gmail.com
```

**Explanation**: All admin notifications (applications, test requests, completions) are going to the same email address because all businesses in the database have the same `email` field value.

**Impact**: Only `ananiadevsurashvili@gmail.com` receives admin notifications. Other emails like `gensweaty@gmail.com` will never receive these notifications because they are not configured as the business email.

#### Scenario B: Admin Users Without Email Addresses

**Symptom**:
```
Business: "demo"
Admin Users: 2

   1. Username: "gensweaty"
      📧 Email: ❌ NULL (password reset will fail!)
      ⚠️  This user cannot receive password reset emails!
```

**Explanation**: The admin user `gensweaty` has no email address in the database, so password reset emails cannot be sent to this user.

**Impact**: When you try to reset the password for `gensweaty@gmail.com`, the system cannot find a user with that email, so it returns a generic success message (security measure) but doesn't send any email.

#### Scenario C: Email Not Registered as Admin User

**Symptom**:
```
Testing: gensweaty@gmail.com
   ❌ Not configured as any business email
   ❌ Will NOT receive: New applications, test requests, test completions
   ❌ Not registered as an admin user in any business
   ❌ Will NOT receive: Password reset emails
```

**Explanation**: The email `gensweaty@gmail.com` is not registered in the database at all - neither as a business email nor as an admin user email.

**Impact**: This email cannot receive any notifications or password reset emails because it's not in the system.

---

## 🔧 Fix: Correct Email Routing Configuration

### Option 1: Automatic Fix (Recommended)

#### Step 1: Preview Changes (Dry Run)

```bash
npm run fix-email-routing
```

This will show you what changes will be made **without actually making them**. Review the output carefully.

#### Step 2: Apply Changes (Live)

If you're satisfied with the proposed changes:

```bash
npm run fix-email-routing:live
```

This will:
1. Update business email addresses to be unique per business
2. Add email addresses to admin users who don't have them
3. Create admin user accounts for emails that should be able to reset passwords

### Option 2: Manual Fix (SQL)

If you prefer to make changes manually, the diagnostic tool provides exact SQL commands:

```sql
-- Example: Update business email
UPDATE businesses SET email = 'admin@demo.com' WHERE id = 1;

-- Example: Add email to admin user
UPDATE admin_users SET email = 'gensweaty@gmail.com' WHERE id = 'xxx-xxx-xxx';

-- Example: Create new admin user
INSERT INTO admin_users (id, business_id, username, email, password_hash, created_at)
VALUES (gen_random_uuid(), 1, 'gensweaty', 'gensweaty@gmail.com', '$2a$10$...', NOW());
```

---

## ✅ Verification: Test Email System

### Step 1: Test Email Configuration

```bash
npm run test-email
```

This sends a test email to `ADMIN_EMAIL` (configured in `.env`) to verify that:
- Resend API connection works
- API key is valid
- Domain is verified (or sandbox fallback works)
- Email delivery is functional

### Step 2: Test Password Reset

1. Go to the forgot password page
2. Enter business name: `demo`
3. Enter email: `gensweaty@gmail.com` (or the email you just configured)
4. Check the email inbox - you should receive a password reset email

### Step 3: Test Admin Notifications

1. Submit a test application or test request
2. Check the business email inbox (e.g., `admin@demo.com`)
3. You should receive an admin notification email

---

## 🎯 Specific Fix for Your Issue

Based on your report that only `ananiadevsurashvili@gmail.com` receives emails, here's what you need to do:

### 1. Run Diagnostic

```bash
npm run diagnose-email
```

### 2. Expected Findings

You'll likely see:
- All businesses have `email = 'ananiadevsurashvili@gmail.com'`
- Admin users `gensweaty` and `anania` either:
  - Don't exist in the database, OR
  - Exist but have `email = NULL`, OR
  - Exist with different email addresses

### 3. Apply Fix

```bash
npm run fix-email-routing:live
```

This will:
- Update business emails to be unique (e.g., `admin@demo.com`)
- Create or update admin users for `gensweaty@gmail.com` and `anania.devsurashvili@caucasusauto.com`
- Set default passwords that must be changed on first login

### 4. Update Business Email (if needed)

If you want admin notifications to go to a specific email (like `gensweaty@gmail.com`), update the business email:

```sql
UPDATE businesses SET email = 'gensweaty@gmail.com' WHERE name = 'demo';
```

Or use the admin panel to update the business email once you're logged in.

---

## 📊 Current Configuration Summary

### Environment Variables (.env)

```
EMAIL_FROM="HR Hubly <info@hrhubly.com>"
ADMIN_EMAIL=gensweaty@gmail.com
RESEND_API_KEY=re_f9z47cXd_... (valid)
```

### Email Sending Status

- **Resend API**: ✅ Configured
- **Domain Verification**: ⚠️ Using sandbox fallback (onboarding@resend.dev)
- **Production Ready**: Verify `hrhubly.com` at https://resend.com/domains

### Sandbox Mode

Currently, emails are sent from `onboarding@resend.dev` (Resend's sandbox domain) because `hrhubly.com` is not yet verified. This is fine for development and testing, but for production:

1. Go to https://resend.com/domains
2. Add DNS records for `hrhubly.com`
3. Wait for verification (15-30 minutes)
4. Emails will then send from `info@hrhubly.com`

---

## 🐛 Common Issues & Solutions

### Issue 1: "Email says sent but not appearing in inbox or Resend logs"

**Cause**: The recipient email is not registered in the database.

**Solution**: 
1. Run `npm run diagnose-email` to see which emails are registered
2. Run `npm run fix-email-routing:live` to register missing emails
3. Try the operation again

### Issue 2: "Password reset says success but no email received"

**Cause**: The admin user exists but has no email address, OR the email is not registered as an admin user.

**Solution**:
1. Run `npm run diagnose-email` to check admin user emails
2. Add email to the admin user:
   ```sql
   UPDATE admin_users SET email = 'your@email.com' WHERE username = 'your_username';
   ```
3. Try password reset again

### Issue 3: "Only one email receives all admin notifications"

**Cause**: All businesses share the same `email` field value.

**Solution**:
1. Run `npm run fix-email-routing:live` to update business emails
2. OR manually update each business:
   ```sql
   UPDATE businesses SET email = 'admin@business1.com' WHERE id = 1;
   UPDATE businesses SET email = 'admin@business2.com' WHERE id = 2;
   ```

### Issue 4: "Emails not appearing in inbox (not even spam)"

**Possible Causes**:
1. Resend API key is invalid
2. Domain is not verified and sandbox emails are blocked
3. Recipient email is incorrect

**Solution**:
1. Test email system: `npm run test-email`
2. Check Resend dashboard: https://resend.com/emails
3. Verify domain: https://resend.com/domains
4. Check recipient email spelling in database

---

## 🚀 Quick Start: Fix Everything Now

```bash
# 1. Diagnose current configuration
npm run diagnose-email

# 2. Preview fixes
npm run fix-email-routing

# 3. Apply fixes
npm run fix-email-routing:live

# 4. Test email system
npm run test-email

# 5. Try password reset or submit test application to verify
```

---

## 📝 Summary of Changes

The fix script will:

1. ✅ Update business email addresses to be unique per business
2. ✅ Add email addresses to all admin users
3. ✅ Create admin user accounts for specified emails
4. ✅ Set default passwords (must be changed on first login)
5. ✅ Ensure all email routing paths work correctly

After running the fix:

- **Admin notifications** (applications, test requests, completions) will go to the business email
- **Password reset emails** will work for all admin users with email addresses
- **Test invitations** will work for all candidates

---

## 🔐 Security Notes

1. **Default Passwords**: If the fix script creates new admin users, they will have default passwords that MUST be changed immediately after first login.

2. **Password Reset Security**: The system returns a generic success message even if the email doesn't exist. This is intentional to prevent email enumeration attacks.

3. **Email Verification**: For production use, verify your domain at https://resend.com/domains to ensure emails are not flagged as spam.

---

## 📞 Support

If you encounter issues after following this guide:

1. Check the diagnostic output for specific error messages
2. Review the Resend dashboard for email delivery status
3. Verify database configuration matches expected values
4. Check application logs for detailed error messages

---

**Last Updated**: 2024
**Version**: 1.0
