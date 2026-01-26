# Test Fixes Verification Guide

This document outlines how to test the three major fixes implemented:

## 1. SCORING & CORRECT ANSWERS FIX

### Issue Fixed:
- Radio buttons for single choice questions now work correctly
- Correct answers are properly remembered when editing tests
- Auto-scoring logic improved with better debugging
- Test evaluation popup shows correct scoring

### How to Test:

#### A. Create a Test with Single Choice Questions
1. Go to Admin Panel → Tests → Create Test
2. Add a single choice question (e.g., "What is 5+10?")
3. Add answers: "12", "15", "20"
4. **IMPORTANT**: Click the radio button next to "15" to mark it as correct
5. Save the test

#### B. Edit the Test to Verify Correct Answer is Remembered
1. Click "Edit" on the test you just created
2. Expand the question
3. **VERIFY**: The radio button next to "15" should still be selected
4. **VERIFY**: Only one radio button should be selected per question

#### C. Take the Test as a Candidate
1. Copy the test link
2. Open in incognito/private window
3. Fill in candidate details and request test
4. Go back to admin panel and approve the request
5. Complete the test, selecting "15" for the math question
6. Submit the test

#### D. Check Scoring in Admin Panel
1. Go to Admin Panel → Results
2. Click "Review" on the submission
3. **VERIFY**: The question shows "15" as selected (highlighted in green)
4. **VERIFY**: The question shows "Correct" status
5. **VERIFY**: The assigned score matches the max score
6. **VERIFY**: Final score calculation is correct

### Expected Results:
- Single choice questions only allow one correct answer
- Correct answers are preserved when editing tests
- Candidates selecting correct answers get full points
- Test review shows accurate scoring and highlighting

---

## 2. NOTIFICATIONS FIX

### Issue Fixed:
- Admin dashboard now properly detects new test completions
- Improved polling logic with better debugging
- Toast notifications appear when candidates complete tests

### How to Test:

#### A. Set Up Admin Dashboard
1. Open Admin Panel in one browser tab
2. Go to the "Results" tab
3. Keep this tab open and visible

#### B. Complete a Test as Candidate
1. Open a new incognito/private browser window
2. Go to a test link
3. Complete the entire test submission process:
   - Fill candidate details
   - Wait for admin approval (approve in other tab)
   - Take and submit the test

#### C. Check for Notifications
1. Go back to the Admin Panel tab
2. **VERIFY**: Within 30 seconds, a green toast notification should appear
3. **VERIFY**: The notification should say "New test completion: [Name] completed [Test Name]"
4. **VERIFY**: The "Results" tab should show a notification badge with count

### Expected Results:
- Toast notifications appear within 30 seconds of test completion
- Notification count updates on Results tab
- Console logs show completion detection (check browser dev tools)

---

## 3. EMAIL FIX

### Issue Fixed:
- Updated SMTP password format instructions
- Improved error handling and debugging
- Better Gmail App Password validation

### How to Test:

#### A. Configure Email Settings
1. **IMPORTANT**: Update `.env` file with a real Gmail App Password
2. Replace `SMTP_PASS=abcdabcdabcdabcd` with your actual 16-character App Password
3. To get a Gmail App Password:
   - Go to Google Account → Security
   - Enable 2-Factor Authentication
   - Go to App Passwords → Generate new password
   - Select "Mail" and your device
   - Copy the 16-character password (no spaces)

#### B. Test Email Configuration
1. Go to Admin Panel → Tests (or any admin section)
2. Open browser dev tools → Network tab
3. Try the email test functionality (if available in UI)
4. Check server logs for email-related messages

#### C. Test Candidate Email Flow
1. Assign a test to a candidate (Admin Panel → Candidates → Assign Test)
2. **VERIFY**: Candidate should receive invitation email
3. Complete the test submission process
4. **VERIFY**: Admin should receive notification email about new request
5. **VERIFY**: If test shows results to candidate, they should receive results email

#### D. Check Email Logs
1. Check server console logs for email-related messages
2. Look for successful email sending confirmations
3. Look for any EAUTH or connection errors

### Expected Results:
- No EAUTH authentication errors
- Email sending confirmations in logs
- Candidates receive invitation emails
- Admin receives notification emails
- Proper error messages if configuration is wrong

---

## DEBUGGING TIPS

### Check Console Logs
- Server logs will show detailed scoring information
- Email sending attempts and results
- Notification emission logs

### Browser Dev Tools
- Network tab shows tRPC calls
- Console shows any client-side errors
- Application tab shows localStorage (admin tokens)

### Common Issues & Solutions

#### Scoring Issues:
- Check that only one radio button is selected for single choice
- Verify `isCorrect` values are properly saved in database
- Check auto-scoring logs in server console

#### Notification Issues:
- Ensure admin dashboard is polling every 30 seconds
- Check that submission status is "COMPLETED" in database
- Verify `endTime` is being set when test is completed

#### Email Issues:
- Verify Gmail App Password is exactly 16 characters
- Check that 2FA is enabled on Gmail account
- Ensure SMTP settings are correct
- Check server logs for specific error codes

---

## SUCCESS CRITERIA

All fixes are working correctly when:

1. **Scoring**: 
   - ✅ Single choice questions allow only one correct answer
   - ✅ Correct answers are preserved when editing tests
   - ✅ Auto-scoring gives full points for correct answers
   - ✅ Test review shows accurate scoring

2. **Notifications**:
   - ✅ Toast notifications appear within 30 seconds of completion
   - ✅ Results tab shows notification badge
   - ✅ No errors in console logs

3. **Emails**:
   - ✅ No EAUTH authentication errors
   - ✅ Test invitation emails are sent
   - ✅ Admin notification emails are sent
   - ✅ Results notification emails are sent (when enabled)

If any of these criteria are not met, check the debugging tips above and verify the configuration.
