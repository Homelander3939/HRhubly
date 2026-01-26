# Email Domain Verification Fix

## Issue Summary

Password reset emails (and all other emails from the platform) are failing with a **403 Forbidden** error from Resend API:

```
❌ [EMAIL] Resend API error: {
  statusCode: 403,
  message: 'The hrhubly.com domain is not verified. Please, add and verify your domain on https://resend.com/domains',
  name: 'validation_error'
}
```

## Root Cause

The domain `hrhubly.com` configured in the `EMAIL_FROM` environment variable is **not fully verified** in your Resend account. Resend requires domain verification before allowing emails to be sent from that domain to prevent spam.

## Current Configuration

From `.env`:
```
RESEND_API_KEY=re_CqWAxZFk_39iSq8xBUZ3a8BUoeDYmz9m9
EMAIL_FROM="HR Platform <noreply@hrhubly.com>"
ADMIN_EMAIL=gensweaty@gmail.com
```

## Solution Options

### Option 1: Complete Domain Verification (Recommended for Production)

This is the proper long-term solution. Follow these steps:

1. **Log in to Resend Dashboard**
   - Go to https://resend.com/domains
   - Log in with your Resend account

2. **Verify Domain Status**
   - Check if `hrhubly.com` is listed
   - Look at its verification status
   - It should show as "Verified" with a green checkmark

3. **Add DNS Records** (if not already done)
   
   Resend requires you to add specific DNS records to your domain. You should see something like:
   
   **SPF Record (TXT)**
   ```
   Name: @ (or your domain)
   Type: TXT
   Value: v=spf1 include:_spf.resend.com ~all
   ```

   **DKIM Records (CNAME)**
   ```
   Name: resend._domainkey
   Type: CNAME
   Value: [provided by Resend]
   ```

   **DMARC Record (TXT)** (optional but recommended)
   ```
   Name: _dmarc
   Type: TXT
   Value: v=DMARC1; p=none; rua=mailto:your-email@example.com
   ```

4. **Add DNS Records to Your Domain Provider**
   - Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
   - Navigate to DNS settings for `hrhubly.com`
   - Add each DNS record exactly as shown in Resend dashboard
   - Save changes

5. **Wait for DNS Propagation**
   - DNS changes can take 5 minutes to 48 hours to propagate
   - Usually takes 15-30 minutes
   - You can check propagation status at: https://dnschecker.org/

6. **Verify in Resend Dashboard**
   - Go back to https://resend.com/domains
   - Click "Verify" button next to your domain
   - If DNS records are correct, status will change to "Verified"

7. **Test Email Sending**
   - Once verified, restart your application
   - Try the password reset flow again
   - Check server logs for success messages

### Option 2: Use Resend Sandbox Domain (Temporary Solution)

If you need emails working immediately while waiting for DNS propagation, use Resend's pre-verified sandbox domain:

1. **Update `.env` file**
   
   Change:
   ```
   EMAIL_FROM="HR Platform <noreply@hrhubly.com>"
   ```
   
   To:
   ```
   EMAIL_FROM="HR Platform <onboarding@resend.dev>"
   ```

2. **Restart Application**
   ```bash
   scripts/stop
   scripts/run
   ```

3. **Test Password Reset**
   - Try the forgot password flow
   - Emails should now send successfully
   - Check server logs for success messages

4. **Important Limitations of Sandbox Domain**
   - ⚠️ Emails may be marked as spam
   - ⚠️ Not suitable for production use
   - ⚠️ Limited sending volume
   - ✅ Good for testing and development
   - ✅ Works immediately without DNS setup

5. **Switch Back to Custom Domain**
   - Once your domain is verified, change `EMAIL_FROM` back to:
     ```
     EMAIL_FROM="HR Platform <noreply@hrhubly.com>"
     ```
   - Restart the application

## Verification Checklist

Use this checklist to verify everything is working:

- [ ] Domain added to Resend dashboard
- [ ] DNS records added to domain provider
- [ ] DNS propagation complete (check with dnschecker.org)
- [ ] Domain shows "Verified" status in Resend
- [ ] `EMAIL_FROM` environment variable matches verified domain
- [ ] Application restarted after configuration changes
- [ ] Password reset email sends successfully
- [ ] Email appears in inbox (not spam folder)
- [ ] Test notification emails working (application submissions, test assignments, etc.)

## Testing Email Configuration

The platform includes a built-in email configuration test. Use it to verify your setup:

1. **Log in to Admin Panel**
   - Go to your admin dashboard
   - Look for "Test Email Configuration" button (if available)

2. **Check Server Logs**
   - Watch the console output when sending emails
   - Look for these success indicators:
     ```
     ✅ [EMAIL] Email sent successfully!
     📬 [EMAIL] Message ID: [some-id]
     ```

3. **Check for Errors**
   - If you see errors like this, domain is not verified:
     ```
     ❌ [EMAIL] Resend API error: domain is not verified
     ```

## Common Issues and Solutions

### Issue: "Domain not found in Resend"
**Solution**: You need to add the domain first
- Go to https://resend.com/domains
- Click "Add Domain"
- Enter `hrhubly.com`
- Follow DNS verification steps

### Issue: "DNS records not propagating"
**Solution**: Wait longer or check DNS configuration
- Use https://dnschecker.org/ to check propagation
- Verify DNS records are added correctly
- Contact your domain provider if issues persist
- Can take up to 48 hours (usually 15-30 minutes)

### Issue: "Emails going to spam"
**Solution**: Complete full domain verification
- Add all DNS records (SPF, DKIM, DMARC)
- Wait for records to propagate
- Avoid using sandbox domain in production
- Consider adding domain to recipient's safe sender list during testing

### Issue: "Wrong domain in EMAIL_FROM"
**Solution**: Update environment variable
- Check that `EMAIL_FROM` matches your verified domain
- If domain is `hrhubly.com`, email should be `something@hrhubly.com`
- Restart application after changing `.env`

## Using Resend API to Check Domain Status

You can use the Resend API to programmatically check your domain status:

```typescript
import { Resend } from 'resend';

const resend = new Resend('re_CqWAxZFk_39iSq8xBUZ3a8BUoeDYmz9m9');

// List all domains
const domains = await resend.domains.list();
console.log(domains);

// Get specific domain by ID (you'll see the ID in the list response)
const domain = await resend.domains.get('your-domain-id');
console.log(domain);

// Check verification status
if (domain.status === 'verified') {
  console.log('✅ Domain is verified and ready to use');
} else {
  console.log('❌ Domain verification incomplete');
  console.log('Status:', domain.status);
  console.log('Records:', domain.records);
}
```

## Next Steps After Fix

Once your domain is verified and emails are working:

1. **Test All Email Flows**
   - Password reset
   - Test invitations
   - Application notifications
   - Result notifications

2. **Monitor Email Delivery**
   - Check Resend dashboard for delivery statistics
   - Monitor bounce rates
   - Watch for spam complaints

3. **Update Documentation**
   - Document your email configuration
   - Save DNS record values for future reference
   - Note any custom settings

4. **Consider Email Best Practices**
   - Use a dedicated email subdomain (e.g., `mail.hrhubly.com`)
   - Set up email forwarding for `noreply@` address
   - Configure email reply handling
   - Add unsubscribe functionality if needed

## Support Resources

- **Resend Documentation**: https://resend.com/docs
- **Resend Domain Verification Guide**: https://resend.com/docs/dashboard/domains/introduction
- **DNS Checker Tool**: https://dnschecker.org/
- **Resend Support**: support@resend.com

## Summary

The password reset email failure is caused by an **unverified domain** in Resend. You have two options:

1. **Production Solution**: Complete domain verification in Resend (recommended)
2. **Quick Fix**: Use sandbox domain `onboarding@resend.dev` (temporary)

The application code is working correctly - this is purely a configuration issue that must be resolved in your Resend account and DNS settings.
