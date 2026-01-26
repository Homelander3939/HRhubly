import { sendEmail, testEmailConfiguration } from "~/server/utils/email";
import { env } from "~/server/env";
import { Resend } from 'resend';

async function testEmailSystem() {
  console.log("📧 ============================================");
  console.log("📧 EMAIL SYSTEM DIAGNOSTIC TOOL");
  console.log("📧 ============================================\n");

  try {
    // 1. Check environment variables
    console.log("📊 STEP 1: Checking environment variables\n");
    
    const envVars = {
      RESEND_API_KEY: env.RESEND_API_KEY,
      EMAIL_FROM: env.EMAIL_FROM,
      ADMIN_EMAIL: env.ADMIN_EMAIL,
    };

    console.log("Environment Variables:");
    console.log(`   RESEND_API_KEY: ${envVars.RESEND_API_KEY ? envVars.RESEND_API_KEY.substring(0, 8) + '...' : '❌ NOT SET'}`);
    console.log(`   EMAIL_FROM: ${envVars.EMAIL_FROM || '❌ NOT SET'}`);
    console.log(`   ADMIN_EMAIL: ${envVars.ADMIN_EMAIL || '❌ NOT SET'}\n`);

    const missingVars = Object.entries(envVars)
      .filter(([_, value]) => !value)
      .map(([key, _]) => key);

    if (missingVars.length > 0) {
      console.log(`❌ Missing required environment variables: ${missingVars.join(', ')}\n`);
      console.log("Please set these variables in your .env file and try again.\n");
      return;
    }

    console.log("✅ All required environment variables are set\n");

    // 2. Test Resend API connection
    console.log("📊 STEP 2: Testing Resend API connection\n");
    
    const resend = new Resend(env.RESEND_API_KEY);
    
    try {
      console.log("Attempting to list domains...");
      const { data: domains, error: listError } = await resend.domains.list();

      if (listError) {
        console.log(`❌ Failed to connect to Resend API: ${listError.message}\n`);
        console.log("This usually means your API key is invalid or revoked.\n");
        console.log("To fix this:");
        console.log("1. Go to https://resend.com/api-keys");
        console.log("2. Create a new API key");
        console.log("3. Update RESEND_API_KEY in your .env file\n");
        return;
      }

      console.log(`✅ Successfully connected to Resend API\n`);
      console.log(`Found ${domains?.length || 0} domain(s) in your Resend account:\n`);
      
      if (domains && domains.length > 0) {
        domains.forEach((domain: any, index: number) => {
          console.log(`   ${index + 1}. Domain: ${domain.name}`);
          console.log(`      Status: ${domain.status}`);
          console.log(`      ID: ${domain.id}`);
          console.log(`      Region: ${domain.region || 'N/A'}`);
          console.log('');
        });
      } else {
        console.log("   ⚠️  No domains configured in your Resend account");
        console.log("   Emails will be sent via sandbox domain (onboarding@resend.dev)\n");
      }

      // Check if the configured domain is verified
      const emailMatch = env.EMAIL_FROM.match(/<(.+@(.+))>/) || env.EMAIL_FROM.match(/(.+@(.+))/);
      if (emailMatch) {
        const domain = emailMatch[2];
        console.log(`Checking configured domain: ${domain}\n`);
        
        if (domain === 'resend.dev') {
          console.log("✅ Using Resend sandbox domain (onboarding@resend.dev)");
          console.log("   This works immediately but is only for development\n");
        } else {
          const matchingDomain = domains?.find((d: any) => d.name === domain);
          
          if (!matchingDomain) {
            console.log(`⚠️  Domain "${domain}" is not in your Resend account`);
            console.log("   Emails will automatically fall back to sandbox domain\n");
          } else if (matchingDomain.status !== 'verified') {
            console.log(`⚠️  Domain "${domain}" is not verified (status: ${matchingDomain.status})`);
            console.log("   Emails will automatically fall back to sandbox domain\n");
            console.log("   To verify your domain:");
            console.log(`   1. Go to https://resend.com/domains/${matchingDomain.id}`);
            console.log("   2. Add the DNS records to your domain provider");
            console.log("   3. Wait for DNS propagation (15-30 minutes)");
            console.log("   4. Click 'Verify' in Resend dashboard\n");
          } else {
            console.log(`✅ Domain "${domain}" is verified and ready to use\n`);
          }
        }
      }

    } catch (error: any) {
      console.log(`❌ Error connecting to Resend API: ${error.message}\n`);
      return;
    }

    // 3. Test email sending
    console.log("📊 STEP 3: Testing email sending\n");
    
    console.log(`Sending test email to: ${env.ADMIN_EMAIL}\n`);
    
    const result = await testEmailConfiguration();
    
    if (result.success) {
      console.log(`✅ ✅ ✅ EMAIL SENT SUCCESSFULLY! ✅ ✅ ✅\n`);
      console.log(result.message);
      if (result.details) {
        console.log("\nDetails:");
        console.log(`   Message ID: ${result.details.messageId || 'N/A'}`);
        console.log(`   From: ${result.details.from || env.EMAIL_FROM}`);
        console.log(`   Domain: ${result.details.domain || 'N/A'}`);
      }
      console.log("\n✅ Check your inbox (including spam folder) for the test email\n");
    } else {
      console.log(`❌ ❌ ❌ EMAIL SENDING FAILED! ❌ ❌ ❌\n`);
      console.log(result.message);
      if (result.details) {
        console.log("\nError Details:");
        console.log(JSON.stringify(result.details, null, 2));
      }
      console.log('');
    }

    // 4. Summary
    console.log("📊 STEP 4: Summary and Recommendations\n");
    
    if (result.success) {
      console.log("✅ Email system is working correctly!");
      console.log("\nYour email configuration:");
      console.log(`   API Key: Valid and working`);
      console.log(`   From Address: ${env.EMAIL_FROM}`);
      console.log(`   Admin Email: ${env.ADMIN_EMAIL}`);
      console.log("\n✅ All email features should work correctly:\n");
      console.log("   - Password reset emails");
      console.log("   - Test invitation emails");
      console.log("   - Application notification emails");
      console.log("   - Test completion emails");
      console.log("   - Results notification emails\n");
    } else {
      console.log("❌ Email system is not working correctly\n");
      console.log("Troubleshooting steps:");
      console.log("1. Verify your RESEND_API_KEY is correct");
      console.log("   - Go to https://resend.com/api-keys");
      console.log("   - Create a new API key if needed");
      console.log("   - Update .env file with the new key\n");
      console.log("2. Check your Resend account status");
      console.log("   - Make sure your account is active");
      console.log("   - Check if you've hit any rate limits\n");
      console.log("3. Try using the sandbox domain temporarily");
      console.log("   - Update .env: EMAIL_FROM=\"HR Platform <onboarding@resend.dev>\"");
      console.log("   - This should work immediately for testing\n");
    }

    console.log("✅ Diagnostic complete!\n");
    console.log("📧 ============================================\n");

  } catch (error: any) {
    console.error("❌ Diagnostic failed:", error);
    console.error("\nError details:", {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
    });
    throw error;
  }
}

testEmailSystem()
  .then(() => {
    console.log("Email diagnostic script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Email diagnostic script failed:", error);
    process.exit(1);
  });
