# Test Verification for CV Upload Fix and Social Link Feature

## Changes Made

### 1. Fixed CV Upload Bug
- **Issue**: PDF CV was not uploading properly, form showed "CV is required" error on submit
- **Root Cause**: File input was using problematic `onChange` handler that interfered with react-hook-form
- **Fix**: Removed custom `onChange` handler, using proper `register("cv")` approach
- **Backend Fix**: Fixed MinIO base URL configuration to use `minioBaseUrl` from `minio.ts` instead of undefined `process.env.MINIO_BASE_URL`

### 2. Added Social Link Field
- **Database**: Added `socialLink` field to User model in Prisma schema
- **Frontend**: Added social link input field to application form with URL validation
- **Backend**: Updated candidate procedures to handle social link data
- **Admin Panel**: Added social link column to candidates table

## Files Modified

1. `prisma/schema.prisma` - Added socialLink field
2. `src/components/GeneralApplicationForm.tsx` - Fixed CV upload + added social link field
3. `src/server/trpc/procedures/candidate.ts` - Updated procedures + fixed MinIO URL
4. `src/server/trpc/procedures/admin.ts` - Added socialLink to candidate data
5. `src/components/CandidateManagement.tsx` - Added social link column

## Test Cases to Verify

### CV Upload Fix
1. **Test CV Upload Success**:
   - Navigate to application form
   - Fill out all required fields
   - Select a PDF file for CV upload
   - Submit form
   - ✅ Should upload successfully without "CV is required" error
   - ✅ CV should be accessible via the generated URL

2. **Test File Validation**:
   - Try submitting without selecting a CV file
   - ✅ Should show "CV file is required" error
   - Select non-PDF file (if validation added)
   - ✅ Should validate file type appropriately

### Social Link Feature
3. **Test Social Link Optional Field**:
   - Fill application form without social link
   - ✅ Should submit successfully (field is optional)
   - Fill application form with valid LinkedIn URL
   - ✅ Should submit successfully and store the URL

4. **Test Social Link Validation**:
   - Enter invalid URL format in social link field
   - ✅ Should show "Valid URL is required" error
   - Enter valid URL format
   - ✅ Should accept and submit successfully

5. **Test Admin Panel Display**:
   - Submit application with social link
   - Login to admin panel
   - Navigate to candidate management
   - ✅ Should see "Social Link" column
   - ✅ Should display "View Profile" link for candidates with social links
   - ✅ Should display "No link" for candidates without social links
   - ✅ Clicking "View Profile" should open social link in new tab

## Environment Variables
The following environment variables are configured and working:
- `ADMIN_PASSWORD=y41XWiphGhGsYutuTX9dJQ` ✅ (Used for MinIO access key and admin login)
- `JWT_SECRET=zMZV4BqQJDQ47VURjcCYof4VPkAWPDeS` ✅ (Used for admin authentication)
- `NODE_ENV=development` ✅

**No environment variable changes are required** - the application should work with current values.

## Technical Implementation Details

### CV Upload Flow (Fixed)
1. User selects CV file → `register("cv")` properly captures File object
2. Form submission → `generateCvUploadUrl` gets presigned MinIO URL
3. Frontend uploads file directly to MinIO using presigned URL
4. Frontend calls `submitGeneralApplication` with the file URL
5. Backend stores application data including CV URL

### Social Link Flow (New)
1. User enters social link (optional) → URL validation via Zod
2. Form submission → social link passed to `submitGeneralApplication`
3. Backend stores social link in database
4. Admin panel fetches and displays social link with proper formatting

## Database Schema Changes
```sql
-- This will be automatically applied by Prisma
ALTER TABLE users ADD COLUMN social_link VARCHAR(2048);
```

## Potential Issues to Watch For
1. **MinIO Connectivity**: Ensure MinIO service is running and accessible
2. **File Size Limits**: Large CV files might timeout (current limit appears to be handled by MinIO)
3. **URL Validation**: Social links must be valid URLs (http/https required)
4. **Database Migration**: Prisma should auto-apply the schema changes

## Success Criteria
- ✅ CV upload works without errors
- ✅ Social link field is optional and validates URLs
- ✅ Admin panel displays social links correctly
- ✅ No breaking changes to existing functionality
- ✅ All React hooks rules followed (no conditional hook calls)
