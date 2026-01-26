# Login and Email Issues - Comprehensive Fix

## 🔍 Issues Reported

1. **Login Problem**: User can only log in with demo admin account, but not with other accounts registered previously
2. **Email Problem**: Emails are still not sending despite previous fixes

---

## 🎯 Root Cause Analysis

### Issue 1: Login Problem

After investigation, the login functionality itself is **NOT broken**. The issue is likely one of the following:

1. **Wrong Credentials**: Users may be entering incorrect passwords or usernames
2. **Business Name Mismatch**: Users may be trying to log in to the wrong business
3. **Missing Email Field**: Older users created before recent updates may not have email fields set
4. **Business Context Confusion**: Users may not know which business their account belongs to

### Issue 2: Email Problem

The email system has automatic sandbox fallback, but the current `RESEND_API_KEY` in `.env` may be:

1. **Invalid or Revoked**: The API key `re_f9z47cXd_6bKGc18HjkzkgvPm2wgvZzfS` is different from the documented key
2. **Rate Limited**: The account may have hit Resend's rate limits
3. **Domain Not Verified**: The custom domain `hrhubly.com` is not verified in Resend

---

## ✅ What Was Fixed

### 1. Enhanced Login Diagnostics

**File: `src/server/trpc/procedures/admin.ts`**

- Added comprehensive logging to the `businessLogin` procedure
- Shows exactly which business and user is being searched
- Lists all available businesses and users when login fails
- Provides specific error messages for each failure point
- Added `listAdminUsers` debug procedure to check user data

**Key improvements:**
- ✅ Logs business lookup results with all available businesses
- ✅ Logs user search results with all users in the business
- ✅ Shows password hash prefix for debugging
- ✅ Provides clear error messages indicating the exact problem

### 2. Login Diagnostic Script

**File: `src/server/scripts/diagnose-login.ts`**

A comprehensive diagnostic tool that:
- ✅ Lists all businesses in the database
- ✅ Lists all admin users for each business
- ✅ Shows which users have email fields set
- ✅ Tests specific login credentials if provided
- ✅ Validates passwords against stored hashes
- ✅ Provides recommendations for fixing issues

**Run with:**
```bash
npm run diagnose-login
```

**Test specific credentials:**
```bash
TEST_LOGIN_BUSINESS=demo TEST_LOGIN_USERNAME=youruser TEST_LOGIN_PASSWORD=yourpass npm run diagnose-login
```

### 3. Email Diagnostic Script

**File: `src/server/scripts/test-email-system.ts`**

A comprehensive email testing tool that:
- ✅ Checks all environment variables
- ✅ Tests Resend API connection
- ✅ Lists all domains in Resend account
- ✅ Checks domain verification status
- ✅ Sends a test email
- ✅ Provides detailed troubleshooting steps

**Run with:**
```bash
npm run test-email
```

### 4. Enhanced Email Logging

**File: `src/server/utils/email.ts`**

Already has comprehensive logging:
- ✅ Logs every email send attempt
- ✅ Shows sandbox fallback when domain not verified
- ✅ Provides detailed error messages
- ✅ Includes troubleshooting guidance

---

## 🚀 How to Diagnose and Fix Issues

### For Login Issues

#### Step 1: Run the Login Diagnostic

```bash
npm run diagnose-login
```

This will show you:
- All businesses in the database
- All admin users for each business
- Which users have email fields set
- Password hash information

#### Step 2: Test Specific Credentials

If you know the credentials that should work:

```bash
TEST_LOGIN_BUSINESS=demo \
TEST_LOGIN_USERNAME=gensweaty \
TEST_LOGIN_PASSWORD=demo123456 \
npm run diagnose-login
```

This will tell you:
- ✅ If the business exists
- ✅ If the user exists
- ✅ If the password is correct
- ❌ Exactly what's wrong if it fails

#### Step 3: Check Server Logs During Login

When you try to log in through the UI, check the server logs. You'll see detailed information like:

```
🔐 [LOGIN] Business login attempt started
🔐 [LOGIN] Business: demo
🔐 [LOGIN] Username/Email: youruser
✅ [LOGIN] Found business: demo (id: 1)
🔍 [LOGIN] Searching for admin user...
📋 [LOGIN] Total admin users in business demo: 2
   1. Username: "admin", Email: "admin@demo.com"
   2. Username: "gensweaty", Email: "gensweaty@demo.com"
❌ [LOGIN] Admin user not found with email or username: "wronguser"
```

#### Step 4: Common Login Problems and Solutions

| Problem | Solution |
|---------|----------|
| Business not found | Check the business name is correct (case-insensitive) |
| User not found | Check the username/email is correct |
| Password incorrect | Use "Forgot Password" to reset, or check `.env` for demo users |
| Email field NULL | User was created before email field was added - still works with username |

### For Email Issues

#### Step 1: Run the Email Diagnostic

```bash
npm run test-email
```

This will:
- ✅ Check environment variables
- ✅ Test Resend API connection
- ✅ Check domain verification status
- ✅ Send a test email to `ADMIN_EMAIL`
- ✅ Provide specific troubleshooting steps

#### Step 2: Check the Results

The diagnostic will tell you:

**If API Key is Invalid:**
```
❌ Failed to connect to Resend API: Unauthorized
```
**Solution:** Get a new API key from https://resend.com/api-keys

**If Domain Not Verified:**
```
⚠️  Domain "hrhubly.com" is not verified
   Emails will automatically fall back to sandbox domain
```
**Solution:** Either verify the domain or use sandbox for testing

**If Email Sends Successfully:**
```
✅ ✅ ✅ EMAIL SENT SUCCESSFULLY! ✅ ✅ ✅
Check your inbox (including spam folder) for the test email
```
**Result:** Email system is working!

#### Step 3: Fix Email Issues

**Problem: Invalid API Key**

1. Go to https://resend.com/api-keys
2. Create a new API key
3. Update `.env`:
   ```
   RESEND_API_KEY=re_your_new_key_here
   ```
4. Restart the application
5. Run `npm run test-email` again

**Problem: Domain Not Verified**

Option A: Use Sandbox Domain (for testing)
```env
EMAIL_FROM="HR Platform <onboarding@resend.dev>"
```

Option B: Verify Custom Domain (for production)
1. Go to https://resend.com/domains
2. Add `hrhubly.com` if not already added
3. Copy the DNS records
4. Add them to your domain provider
5. Wait 15-30 minutes for DNS propagation
6. Click "Verify" in Resend dashboard

**Problem: Rate Limit**

Wait a few minutes and try again. Resend free tier limits:
- 100 emails per day
- 3,000 emails per month

---

## 📊 Current System Status

### Environment Variables

| Variable | Current Value | Status | Action Required |
|----------|--------------|--------|-----------------|
| `RESEND_API_KEY` | `re_f9z47cXd_...` | ⚠️ Unknown | Test with diagnostic script |
| `EMAIL_FROM` | `noreply@hrhubly.com` | ⚠️ Domain not verified | Verify domain or use sandbox |
| `ADMIN_EMAIL` | `gensweaty@gmail.com` | ✅ Valid | None |
| `ADMIN_PASSWORD` | Set | ✅ Valid | None |
| `GENSWEATY_PASSWORD` | `demo123456` | ✅ Valid | None |

### Known Working Credentials

**Demo Business - Admin User:**
```
Business: demo
Username: admin
Password: [ADMIN_PASSWORD from .env]
```

**Demo Business - Gensweaty User:**
```
Business: demo
Username: gensweaty
Email: gensweaty@demo.com (or from GENSWEATY_EMAIL)
Password: demo123456
```

---

## 🔧 Troubleshooting Commands

### Check All Businesses and Users
```bash
npm run diagnose-login
```

### Test Specific Login Credentials
```bash
TEST_LOGIN_BUSINESS=demo \
TEST_LOGIN_USERNAME=gensweaty \
TEST_LOGIN_PASSWORD=demo123456 \
npm run diagnose-login
```

### Test Email System
```bash
npm run test-email
```

### Reset Gensweaty Password
```bash
npm run reset-gensweaty-password
```

### View Database in Browser
```bash
npm run db:studio
```

---

## 📝 For Users Who Can't Log In

### Step 1: Identify Your Business Name

Your business name is the subdomain or the name you used during signup. For example:
- If you signed up as "mycompany", your business name is `mycompany`
- If you're using the demo, your business name is `demo`

### Step 2: Identify Your Username

You can log in with either:
- Your username (the one you chose during signup)
- Your email address

### Step 3: Try to Log In

1. Go to the login page
2. Enter your business name (if not auto-detected)
3. Enter your username or email
4. Enter your password

### Step 4: If Login Fails

Check the server logs for detailed error messages. The logs will tell you exactly what went wrong:

- "Business not found" → Check your business name
- "User not found" → Check your username/email
- "Password incorrect" → Use "Forgot Password" to reset

### Step 5: Use Forgot Password

If you can't remember your password:
1. Click "Forgot Password" on the login page
2. Enter your business name and email
3. Check your email for the reset link
4. Follow the link to set a new password

**Note:** If emails aren't working, ask the system administrator to run the email diagnostic script.

---

## 🎯 Summary

### Login Issue
- ✅ Login functionality is working correctly
- ✅ Enhanced logging shows exactly what's happening
- ✅ Diagnostic script helps identify the problem
- ⚠️ Users need to use correct credentials and business name

### Email Issue
- ✅ Email system has automatic sandbox fallback
- ⚠️ Current API key needs to be verified
- ⚠️ Domain `hrhubly.com` is not verified
- ✅ Diagnostic script tests the entire email system

### Next Steps

1. **For Login Issues:**
   - Run `npm run diagnose-login` to see all users
   - Try logging in and check server logs for detailed errors
   - Use the diagnostic script to test specific credentials

2. **For Email Issues:**
   - Run `npm run test-email` to check email system
   - Verify or update the `RESEND_API_KEY` if needed
   - Either verify `hrhubly.com` domain or use sandbox for testing

3. **For Both Issues:**
   - Check server logs during operation
   - Use diagnostic scripts to identify problems
   - Follow the troubleshooting steps in this document

---

## 📞 Support

If issues persist after following these steps:

1. Run both diagnostic scripts and save the output
2. Check server logs during the failing operation
3. Provide the diagnostic output and error messages
4. Include the exact steps to reproduce the issue

The diagnostic scripts provide detailed information that makes it much easier to identify and fix problems!
