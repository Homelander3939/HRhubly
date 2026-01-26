import { Resend } from 'resend';
import { env } from "~/server/env";

// Create Resend client
const resend = new Resend(env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  console.log(`🚀 [EMAIL] Starting email send process`);
  console.log(`📧 [EMAIL] To: ${to}`);
  console.log(`📝 [EMAIL] Subject: ${subject}`);
  console.log(`⚙️  [EMAIL] Resend Config:`, {
    from: env.EMAIL_FROM,
    hasApiKey: !!env.RESEND_API_KEY,
    apiKeyLength: env.RESEND_API_KEY?.length,
    apiKeyPrefix: env.RESEND_API_KEY?.substring(0, 10) + '...',
    apiKeySuffix: '...' + env.RESEND_API_KEY?.substring(env.RESEND_API_KEY.length - 4),
    nodeEnv: env.NODE_ENV,
  });

  // Validate API key format
  if (!env.RESEND_API_KEY || !env.RESEND_API_KEY.startsWith('re_')) {
    console.error(`❌ [EMAIL] Invalid Resend API key format. Key should start with 're_'`);
    return {
      success: false,
      error: "Invalid Resend API key configuration",
      troubleshooting: "Check that RESEND_API_KEY in .env file starts with 're_' and is a valid Resend API key",
    };
  }
  
  try {
    console.log(`📡 [EMAIL] Attempting to send email via Resend API...`);

    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: [to],
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML as fallback text
    });

    if (error) {
      console.error(`❌ [EMAIL] Resend API error:`, error);
      
      // Check if this is a domain verification error
      const isDomainError = error.message?.toLowerCase().includes('domain') && 
                           (error.message?.toLowerCase().includes('not verified') || 
                            error.message?.toLowerCase().includes('verify'));
      
      if (isDomainError) {
        console.log(`🔄 [EMAIL] Domain verification error detected, attempting fallback to sandbox domain...`);
        console.log(`💡 [EMAIL] Original error: ${error.message}`);
        
        // Try again with Resend's sandbox domain
        const sandboxFrom = 'onboarding@resend.dev';
        console.log(`📧 [EMAIL] Retrying with sandbox domain: ${sandboxFrom}`);
        console.log(`🔑 [EMAIL] Using API key (first 10 chars): ${env.RESEND_API_KEY?.substring(0, 10)}...`);
        
        try {
          const { data: sandboxData, error: sandboxError } = await resend.emails.send({
            from: sandboxFrom,
            to: [to],
            subject: `[DEV] ${subject}`,
            html: `
              <div style="background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <p style="margin: 0; font-weight: bold; color: #92400e;">⚠️ Development Mode - Sandbox Email</p>
                <p style="margin: 8px 0 0 0; color: #92400e; font-size: 14px;">
                  This email was sent using Resend's sandbox domain because your custom domain is not verified.
                  To use your custom domain in production, verify it at 
                  <a href="https://resend.com/domains" style="color: #2563eb;">https://resend.com/domains</a>
                </p>
              </div>
              ${html}
            `,
            text: `[DEV MODE - Sandbox Email]\n\nThis email was sent using Resend's sandbox domain because your custom domain is not verified.\nTo use your custom domain in production, verify it at https://resend.com/domains\n\n---\n\n${text || html.replace(/<[^>]*>/g, '')}`,
          });
          
          if (sandboxError) {
            console.error(`❌ [EMAIL] Sandbox domain also failed:`, sandboxError);
            console.error(`💡 [EMAIL] This suggests an API key or account issue, not just domain verification`);
            
            return { 
              success: false, 
              error: "Email sending failed even with sandbox domain. Please check your Resend API key.",
              troubleshooting: `Original error: ${error.message}. Sandbox error: ${sandboxError.message}. This suggests the API key (${env.RESEND_API_KEY?.substring(0, 10)}...) may be invalid or the Resend account may have issues. Verify your API key at https://resend.com/api-keys`,
              originalError: error.message,
              sandboxError: sandboxError.message,
            };
          }
          
          console.log(`🎉 [EMAIL] Email sent successfully via sandbox domain!`);
          console.log(`📬 [EMAIL] Message ID: ${sandboxData?.id}`);
          console.log(`⚠️  [EMAIL] IMPORTANT: This email was sent from the sandbox domain (onboarding@resend.dev)`);
          console.log(`💡 [EMAIL] To use your custom domain (${env.EMAIL_FROM}), verify it at: https://resend.com/domains`);
          
          return { 
            success: true, 
            messageId: sandboxData?.id,
            usedSandbox: true,
            warning: "Email sent via sandbox domain. Verify your custom domain for production use.",
          };
        } catch (sandboxError: any) {
          console.error(`💥 [EMAIL] Exception during sandbox fallback:`, sandboxError);
          return {
            success: false,
            error: "Email sending failed during sandbox fallback",
            troubleshooting: `Sandbox fallback failed with exception: ${sandboxError.message}. Check your Resend API key and account status.`,
            originalError: error.message,
            sandboxError: sandboxError.message,
          };
        }
      }
      
      // Provide more specific error messages based on error type
      let errorMessage = error.message || 'Unknown error occurred';
      let troubleshooting = '';
      
      if (error.message?.includes('API key')) {
        errorMessage = "Invalid Resend API key. Please check your configuration.";
        troubleshooting = "Verify RESEND_API_KEY in your environment variables is correct.";
      } else if (error.message?.includes('rate limit')) {
        errorMessage = "Rate limit exceeded. Please try again later.";
        troubleshooting = "You've sent too many emails. Wait a few minutes and try again.";
      } else if (error.message?.includes('recipient')) {
        errorMessage = "Invalid recipient email address.";
        troubleshooting = `Check that the recipient email (${to}) is valid.`;
      }
      
      console.error(`💡 [EMAIL] Troubleshooting: ${troubleshooting}`);
      
      return { 
        success: false, 
        error: errorMessage, 
        troubleshooting,
        originalError: error.message,
      };
    }

    console.log(`🎉 [EMAIL] Email sent successfully!`);
    console.log(`📬 [EMAIL] Message ID: ${data?.id}`);
    
    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error(`❌ [EMAIL] Email sending failed:`, error);
    console.error(`🔍 [EMAIL] Error details:`, {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
    });
    
    return { 
      success: false, 
      error: error.message || 'Failed to send email',
      troubleshooting: 'Check your Resend API configuration and try again.',
      originalError: error.message,
    };
  }
}

// Test Resend API configuration
export async function testEmailConfiguration(): Promise<{ success: boolean; message: string; details?: any }> {
  console.log(`🧪 [EMAIL TEST] Starting comprehensive email configuration test...`);
  
  // Check environment variables first
  const missingVars = [];
  if (!env.RESEND_API_KEY) missingVars.push('RESEND_API_KEY');
  if (!env.EMAIL_FROM) missingVars.push('EMAIL_FROM');
  if (!env.ADMIN_EMAIL) missingVars.push('ADMIN_EMAIL');

  if (missingVars.length > 0) {
    const message = `Missing required environment variables: ${missingVars.join(', ')}`;
    console.error(`❌ [EMAIL TEST] ${message}`);
    return { success: false, message };
  }

  console.log(`✅ [EMAIL TEST] All required environment variables are present`);
  console.log(`⚙️  [EMAIL TEST] Configuration:`, {
    from: env.EMAIL_FROM,
    adminEmail: env.ADMIN_EMAIL,
    hasApiKey: !!env.RESEND_API_KEY,
    apiKeyPrefix: env.RESEND_API_KEY?.substring(0, 8) + '...',
  });

  try {
    // Send test email using Resend API
    console.log(`📧 [EMAIL TEST] Sending test email to ${env.ADMIN_EMAIL}...`);
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: [env.ADMIN_EMAIL],
      subject: `✅ Email Configuration Test - ${new Date().toLocaleString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #10b981; margin-bottom: 10px;">✅ Email Configuration Test Successful!</h1>
            <p style="color: #6b7280; font-size: 16px;">HR Assessment Platform</p>
          </div>
          
          <div style="background-color: #f0fdf4; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #065f46;">Test Results</h3>
            <ul style="color: #065f46; margin: 10px 0; padding-left: 20px;">
              <li>✅ Resend API connection established successfully</li>
              <li>✅ API key validated</li>
              <li>✅ Email sending functionality working</li>
              <li>✅ All email templates will work correctly</li>
            </ul>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Configuration Details</h3>
            <p><strong>Email Service:</strong> Resend API</p>
            <p><strong>From Address:</strong> ${env.EMAIL_FROM}</p>
            <p><strong>Domain:</strong> hrhubly.com</p>
            <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #10b981; font-size: 18px; font-weight: bold;">
              🎉 Your email system is ready to send notifications!
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; text-align: center;">
            <p>This is an automated test email from the HR Assessment Platform.</p>
          </div>
        </div>
      `,
      text: `✅ Email Configuration Test Successful!\n\nYour HR Assessment Platform email system is working correctly.\n\nTest Results:\n✅ Resend API connection established\n✅ API key validated\n✅ Email sending working\n\nConfiguration:\nEmail Service: Resend API\nFrom Address: ${env.EMAIL_FROM}\nDomain: hrhubly.com\nTest Time: ${new Date().toLocaleString()}\n\n🎉 Your email system is ready!`
    });

    if (error) {
      console.error(`❌ [EMAIL TEST] Test email failed:`, error);
      
      let message = `❌ Email configuration test failed: ${error.message}`;
      let troubleshooting = '';
      
      if (error.message?.includes('API key')) {
        message = "❌ Invalid Resend API key. Please check your configuration.";
        troubleshooting = "Make sure RESEND_API_KEY contains your valid Resend API key (starts with 're_').";
      } else if (error.message?.includes('domain')) {
        message = "❌ Email domain not verified in Resend.";
        troubleshooting = `Verify that hrhubly.com is added and verified in your Resend dashboard at https://resend.com/domains`;
      } else if (error.message?.includes('rate limit')) {
        message = "❌ Rate limit exceeded. Please try again later.";
        troubleshooting = "You've sent too many test emails. Wait a few minutes and try again.";
      }
      
      return { 
        success: false, 
        message,
        details: {
          originalError: error.message,
          troubleshooting,
          configuration: {
            from: env.EMAIL_FROM,
            hasApiKey: !!env.RESEND_API_KEY,
          }
        }
      };
    }

    if (data?.id) {
      console.log(`🎉 [EMAIL TEST] Test email sent successfully!`);
      console.log(`📬 [EMAIL TEST] Message ID: ${data.id}`);
      
      return { 
        success: true, 
        message: "✅ Email configuration test successful! Check your inbox for the test email.",
        details: {
          messageId: data.id,
          from: env.EMAIL_FROM,
          domain: 'hrhubly.com',
          testTime: new Date().toISOString(),
        }
      };
    } else {
      console.error(`❌ [EMAIL TEST] No message ID returned from Resend API`);
      return { 
        success: false, 
        message: "❌ Email test failed: No message ID returned from Resend",
      };
    }
  } catch (error: any) {
    console.error(`❌ [EMAIL TEST] Email configuration test failed:`, error);
    console.error(`🔍 [EMAIL TEST] Error details:`, {
      message: error.message,
    });
    
    return { 
      success: false, 
      message: `❌ Email configuration test failed: ${error.message}`,
      details: {
        originalError: error.message,
        troubleshooting: 'Check your Resend API key and domain verification in the Resend dashboard.',
        configuration: {
          from: env.EMAIL_FROM,
          hasApiKey: !!env.RESEND_API_KEY,
        }
      }
    };
  }
}

export function createNewApplicationEmailTemplate(candidateName: string, candidateEmail: string, adminPanelLink: string, businessName?: string) {
  return {
    subject: `New Application: ${candidateName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">New Candidate Application</h1>
          ${businessName ? `<p style="color: #6b7280; font-size: 16px;">for ${businessName}</p>` : ''}
        </div>
        
        <p style="font-size: 16px;">A new candidate has submitted an application through your HR platform:</p>
        
        <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151; font-size: 18px;">Candidate Information</h3>
          <div style="background-color: white; padding: 15px; border-radius: 6px; margin-top: 15px;">
            <p style="margin: 8px 0;"><strong>Name:</strong> ${candidateName}</p>
            <p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${candidateEmail}" style="color: #2563eb;">${candidateEmail}</a></p>
            <p style="margin: 8px 0;"><strong>Application Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
        
        <div style="background-color: #eff6ff; border: 1px solid #2563eb; border-radius: 8px; padding: 20px; margin: 30px 0;">
          <p style="margin: 0; font-weight: bold; color: #1e40af;">Next Steps:</p>
          <ul style="color: #1e40af; margin: 10px 0; padding-left: 20px;">
            <li>Review the candidate's full application in the admin panel</li>
            <li>Assess their qualifications and experience</li>
            <li>Assign appropriate tests if they meet initial criteria</li>
            <li>Schedule interviews for promising candidates</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="font-size: 16px; margin-bottom: 20px;">Log in to your admin panel to review this application:</p>
          <a href="${adminPanelLink}" style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold;">Review Application</a>
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; text-align: center;">
          <p>This is an automated notification from ${businessName || 'the HR Assessment Platform'}.</p>
        </div>
      </div>
    `,
    text: `New Candidate Application${businessName ? ` for ${businessName}` : ''}\n\nA new candidate has submitted an application:\n\nName: ${candidateName}\nEmail: ${candidateEmail}\nApplication Date: ${new Date().toLocaleDateString()}\n\nPlease log in to your admin panel to review the application and assign tests if appropriate.\n\nAdmin Panel: ${adminPanelLink}`
  };
}

export function createNewTestRequestEmailTemplate(candidateName: string, testName: string, adminPanelLink: string, businessName?: string) {
  return {
    subject: `Test Request: ${candidateName} - ${testName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f59e0b; margin-bottom: 10px;">Test Request Pending</h1>
          ${businessName ? `<p style="color: #6b7280; font-size: 16px;">for ${businessName}</p>` : ''}
        </div>
        
        <p style="font-size: 16px;">A candidate is requesting authorization to take an assessment test:</p>
        
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 25px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #92400e; font-size: 18px;">Request Details</h3>
          <div style="background-color: white; padding: 15px; border-radius: 6px; margin-top: 15px;">
            <p style="margin: 8px 0;"><strong>Candidate:</strong> ${candidateName}</p>
            <p style="margin: 8px 0;"><strong>Test:</strong> ${testName}</p>
            <p style="margin: 8px 0;"><strong>Request Time:</strong> ${new Date().toLocaleString()}</p>
            <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;">Awaiting Approval</span></p>
          </div>
        </div>
        
        <div style="background-color: #fee2e2; border: 1px solid #dc2626; border-radius: 8px; padding: 20px; margin: 30px 0;">
          <p style="margin: 0; font-weight: bold; color: #991b1b;">Action Required:</p>
          <p style="color: #991b1b; margin: 10px 0;">This candidate is waiting for your approval to begin their assessment. Please review and approve or reject this request promptly.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="font-size: 16px; margin-bottom: 20px;">Log in to your admin panel to approve or reject this request:</p>
          <a href="${adminPanelLink}" style="background-color: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold;">Review Request</a>
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; text-align: center;">
          <p>This is an automated notification from ${businessName || 'the HR Assessment Platform'}.</p>
        </div>
      </div>
    `,
    text: `Test Request: ${candidateName} - ${testName}${businessName ? ` for ${businessName}` : ''}\n\nA candidate is requesting authorization to take an assessment test:\n\nCandidate: ${candidateName}\nTest: ${testName}\nRequest Time: ${new Date().toLocaleString()}\nStatus: Awaiting Approval\n\nAction Required: This candidate is waiting for your approval to begin their assessment. Please log in to your admin panel to approve or reject this request promptly.\n\nAdmin Panel: ${adminPanelLink}`
  };
}

export function createTestInvitationEmailTemplate(candidateName: string, testName: string, testLink: string, businessName?: string) {
  return {
    subject: `Test Invitation: ${testName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">Assessment Invitation</h1>
          ${businessName ? `<p style="color: #6b7280; font-size: 16px;">from ${businessName}</p>` : ''}
        </div>
        
        <p style="font-size: 16px;">Hello ${candidateName},</p>
        
        <p style="font-size: 16px;">You have been invited to take the following assessment test:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="margin: 0; color: #374151; font-size: 20px;">${testName}</h3>
        </div>
        
        <p style="font-size: 16px;">To begin your test, please click the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${testLink}" style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold;">Start Assessment</a>
        </div>
        
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 30px 0;">
          <p style="margin: 0; font-weight: bold; color: #92400e;">Important Instructions:</p>
          <ul style="color: #92400e; margin: 10px 0; padding-left: 20px;">
            <li>Ensure you have a stable internet connection</li>
            <li>Complete the test in one sitting without interruptions</li>
            <li>Read all instructions carefully before starting</li>
            <li>Contact us immediately if you experience technical issues</li>
          </ul>
        </div>
        
        <p style="font-size: 16px;">If you have any questions or need assistance, please don't hesitate to contact our team.</p>
        
        <p style="font-size: 16px;">Good luck with your assessment!</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; text-align: center;">
          <p>This is an automated notification from ${businessName || 'the HR Assessment Platform'}.</p>
        </div>
      </div>
    `,
    text: `Test Invitation: ${testName}${businessName ? ` from ${businessName}` : ''}\n\nHello ${candidateName},\n\nYou have been invited to take the assessment test: ${testName}\n\nTo begin your test, please visit: ${testLink}\n\nImportant Instructions:\n- Ensure you have a stable internet connection\n- Complete the test in one sitting without interruptions\n- Read all instructions carefully before starting\n- Contact us immediately if you experience technical issues\n\nIf you have any questions or need assistance, please don't hesitate to contact our team.\n\nGood luck with your assessment!`
  };
}

export function createResultsAvailableEmailTemplate(candidateName: string, testName: string, resultLink: string, businessName?: string) {
  return {
    subject: `Test Results Available: ${testName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #10b981; margin-bottom: 10px;">Results Available</h1>
          ${businessName ? `<p style="color: #6b7280; font-size: 16px;">from ${businessName}</p>` : ''}
        </div>
        
        <p style="font-size: 16px;">Hello ${candidateName},</p>
        
        <p style="font-size: 16px;">Great news! Your results for the <strong>${testName}</strong> assessment are now available for review.</p>
        
        <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
          <h3 style="margin: 0; color: #065f46; font-size: 18px;">Assessment Completed Successfully</h3>
          <p style="margin: 10px 0 0 0; color: #047857;">Click below to view your detailed results</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resultLink}" style="background-color: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold;">View Your Results</a>
        </div>
        
        <p style="font-size: 16px;">If you have any questions about your results or the next steps in the process, please contact our HR team.</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; text-align: center;">
          <p>This is an automated notification from ${businessName || 'the HR Assessment Platform'}.</p>
        </div>
      </div>
    `,
    text: `Test Results Available: ${testName}${businessName ? ` from ${businessName}` : ''}\n\nHello ${candidateName},\n\nGreat news! Your results for the ${testName} assessment are now available for review.\n\nView your results at: ${resultLink}\n\nIf you have any questions about your results or the next steps in the process, please contact our HR team.`
  };
}

export function createTestCompletedForEvaluationEmailTemplate(candidateName: string, testName: string, adminPanelLink: string, businessName?: string) {
  return {
    subject: `Test Completed: ${candidateName} - ${testName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #10b981; margin-bottom: 10px;">Test Completed</h1>
          ${businessName ? `<p style="color: #6b7280; font-size: 16px;">for ${businessName}</p>` : ''}
        </div>
        
        <p style="font-size: 16px;">A candidate has successfully completed their assessment test and is ready for evaluation:</p>
        
        <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 25px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #065f46; font-size: 18px;">Completion Details</h3>
          <div style="background-color: white; padding: 15px; border-radius: 6px; margin-top: 15px;">
            <p style="margin: 8px 0;"><strong>Candidate:</strong> ${candidateName}</p>
            <p style="margin: 8px 0;"><strong>Test:</strong> ${testName}</p>
            <p style="margin: 8px 0;"><strong>Completed:</strong> ${new Date().toLocaleString()}</p>
            <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">Ready for Evaluation</span></p>
          </div>
        </div>
        
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 30px 0;">
          <p style="margin: 0; font-weight: bold; color: #92400e;">Action Required:</p>
          <p style="color: #92400e; margin: 10px 0;">This candidate's test submission is now available for review and scoring. Please evaluate their responses and provide final results.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="font-size: 16px; margin-bottom: 20px;">Log in to your admin panel to evaluate this submission:</p>
          <a href="${adminPanelLink}" style="background-color: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold;">Evaluate Submission</a>
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; text-align: center;">
          <p>This is an automated notification from ${businessName || 'the HR Assessment Platform'}.</p>
        </div>
      </div>
    `,
    text: `Test Completed: ${candidateName} - ${testName}${businessName ? ` for ${businessName}` : ''}\n\nA candidate has successfully completed their assessment test and is ready for evaluation:\n\nCandidate: ${candidateName}\nTest: ${testName}\nCompleted: ${new Date().toLocaleString()}\nStatus: Ready for Evaluation\n\nAction Required: This candidate's test submission is now available for review and scoring. Please log in to your admin panel to evaluate their responses and provide final results.\n\nAdmin Panel: ${adminPanelLink}`
  };
}

export function createPasswordResetEmailTemplate(adminName: string, resetLink: string, businessName?: string) {
  return {
    subject: `Password Reset Request - ${businessName || 'HR Assessment Platform'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f59e0b; margin-bottom: 10px;">🔐 Password Reset Request</h1>
          ${businessName ? `<p style="color: #6b7280; font-size: 16px;">for ${businessName}</p>` : ''}
        </div>
        
        <p style="font-size: 16px;">Hello ${adminName},</p>
        
        <p style="font-size: 16px;">We received a request to reset your password for your admin account. If you didn't make this request, you can safely ignore this email.</p>
        
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 30px 0;">
          <p style="margin: 0; font-weight: bold; color: #92400e;">Security Notice:</p>
          <p style="color: #92400e; margin: 10px 0;">This password reset link will expire in 1 hour for security reasons. If you need to reset your password after it expires, you'll need to request a new reset link.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="font-size: 16px; margin-bottom: 20px;">Click the button below to reset your password:</p>
          <a href="${resetLink}" style="background-color: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold;">Reset Password</a>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="margin: 10px 0; word-break: break-all; color: #2563eb; font-size: 14px;">${resetLink}</p>
        </div>
        
        <p style="font-size: 16px;">If you did not request a password reset, please contact your system administrator immediately as someone may be trying to access your account.</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; text-align: center;">
          <p>This is an automated security notification from ${businessName || 'the HR Assessment Platform'}.</p>
          <p style="margin-top: 10px;">This link will expire in 1 hour.</p>
        </div>
      </div>
    `,
    text: `Password Reset Request${businessName ? ` for ${businessName}` : ''}\n\nHello ${adminName},\n\nWe received a request to reset your password for your admin account. If you didn't make this request, you can safely ignore this email.\n\nSecurity Notice: This password reset link will expire in 1 hour for security reasons.\n\nTo reset your password, visit this link:\n${resetLink}\n\nIf you did not request a password reset, please contact your system administrator immediately as someone may be trying to access your account.\n\nThis is an automated security notification from ${businessName || 'the HR Assessment Platform'}.\nThis link will expire in 1 hour.`
  };
}

export function createBusinessSignupConfirmationEmailTemplate(adminName: string, businessName: string, businessDisplayName: string, loginLink: string) {
  return {
    subject: `Welcome to HR Assessment Platform - Account Created`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #10b981; margin-bottom: 10px;">🎉 Welcome to HR Assessment Platform!</h1>
          <p style="color: #6b7280; font-size: 16px;">Your business account has been created successfully</p>
        </div>
        
        <p style="font-size: 16px;">Hello ${adminName},</p>
        
        <p style="font-size: 16px;">Congratulations! Your business account has been successfully created on the HR Assessment Platform.</p>
        
        <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 25px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #065f46; font-size: 18px;">Account Details</h3>
          <div style="background-color: white; padding: 15px; border-radius: 6px; margin-top: 15px;">
            <p style="margin: 8px 0;"><strong>Business Name:</strong> ${businessDisplayName}</p>
            <p style="margin: 8px 0;"><strong>Account ID:</strong> ${businessName}</p>
            <p style="margin: 8px 0;"><strong>Admin Username:</strong> ${adminName}</p>
            <p style="margin: 8px 0;"><strong>Created:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
        
        <div style="background-color: #eff6ff; border: 1px solid #2563eb; border-radius: 8px; padding: 20px; margin: 30px 0;">
          <p style="margin: 0; font-weight: bold; color: #1e40af;">Getting Started:</p>
          <ul style="color: #1e40af; margin: 10px 0; padding-left: 20px;">
            <li>Log in to your admin panel to configure your platform</li>
            <li>Create assessment tests for your candidates</li>
            <li>Set up vacancies and start accepting applications</li>
            <li>Manage candidates and review their test submissions</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="font-size: 16px; margin-bottom: 20px;">Ready to get started? Log in to your admin panel:</p>
          <a href="${loginLink}" style="background-color: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold;">Access Admin Panel</a>
        </div>
        
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 30px 0;">
          <p style="margin: 0; font-weight: bold; color: #92400e;">Important Security Information:</p>
          <p style="color: #92400e; margin: 10px 0;">Keep your login credentials secure and do not share them with anyone. If you did not create this account, please contact support immediately.</p>
        </div>
        
        <p style="font-size: 16px;">If you have any questions or need assistance getting started, our support team is here to help.</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; text-align: center;">
          <p>This is an automated confirmation email from the HR Assessment Platform.</p>
          <p style="margin-top: 10px;">Account created on ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `,
    text: `Welcome to HR Assessment Platform!\n\nHello ${adminName},\n\nCongratulations! Your business account has been successfully created on the HR Assessment Platform.\n\nAccount Details:\nBusiness Name: ${businessDisplayName}\nAccount ID: ${businessName}\nAdmin Username: ${adminName}\nCreated: ${new Date().toLocaleDateString()}\n\nGetting Started:\n- Log in to your admin panel to configure your platform\n- Create assessment tests for your candidates\n- Set up vacancies and start accepting applications\n- Manage candidates and review their test submissions\n\nReady to get started? Log in to your admin panel:\n${loginLink}\n\nImportant Security Information:\nKeep your login credentials secure and do not share them with anyone. If you did not create this account, please contact support immediately.\n\nIf you have any questions or need assistance getting started, our support team is here to help.\n\nThis is an automated confirmation email from the HR Assessment Platform.\nAccount created on ${new Date().toLocaleString()}`
  };
}

export function createEmailVerificationTemplate(adminName: string, verificationLink: string, businessDisplayName: string) {
  return {
    subject: `Verify Your Email - ${businessDisplayName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">🎉 Welcome to HR Assessment Platform!</h1>
          <p style="color: #6b7280; font-size: 16px;">Verify your email to get started</p>
        </div>
        
        <p style="font-size: 16px;">Hello ${adminName},</p>
        
        <p style="font-size: 16px;">Thank you for registering your business <strong>${businessDisplayName}</strong> on the HR Assessment Platform!</p>
        
        <p style="font-size: 16px;">To complete your registration and access your admin panel, please verify your email address by clicking the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold;">Verify Email Address</a>
        </div>
        
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 30px 0;">
          <p style="margin: 0; font-weight: bold; color: #92400e;">Important:</p>
          <ul style="color: #92400e; margin: 10px 0; padding-left: 20px;">
            <li>This verification link will expire in 24 hours</li>
            <li>You must verify your email before you can log in</li>
            <li>If you didn't create this account, you can safely ignore this email</li>
          </ul>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="margin: 10px 0; word-break: break-all; color: #2563eb; font-size: 14px;">${verificationLink}</p>
        </div>
        
        <div style="background-color: #eff6ff; border: 1px solid #2563eb; border-radius: 8px; padding: 20px; margin: 30px 0;">
          <p style="margin: 0; font-weight: bold; color: #1e40af;">After Verification:</p>
          <ul style="color: #1e40af; margin: 10px 0; padding-left: 20px;">
            <li>Log in to your admin panel</li>
            <li>Configure your platform settings</li>
            <li>Create assessment tests</li>
            <li>Start accepting candidate applications</li>
          </ul>
        </div>
        
        <p style="font-size: 16px;">If you have any questions or need assistance, our support team is here to help.</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; text-align: center;">
          <p>This is an automated verification email from the HR Assessment Platform.</p>
          <p style="margin-top: 10px;">This link will expire in 24 hours.</p>
        </div>
      </div>
    `,
    text: `Welcome to HR Assessment Platform!\n\nHello ${adminName},\n\nThank you for registering your business ${businessDisplayName} on the HR Assessment Platform!\n\nTo complete your registration and access your admin panel, please verify your email address by visiting this link:\n${verificationLink}\n\nImportant:\n- This verification link will expire in 24 hours\n- You must verify your email before you can log in\n- If you didn't create this account, you can safely ignore this email\n\nAfter Verification:\n- Log in to your admin panel\n- Configure your platform settings\n- Create assessment tests\n- Start accepting candidate applications\n\nIf you have any questions or need assistance, our support team is here to help.\n\nThis is an automated verification email from the HR Assessment Platform.\nThis link will expire in 24 hours.`
  };
}

export function createCandidateConfirmationEmailTemplate(candidateName: string, candidateEmail: string, businessName: string, applicationType: string, applicationDate: Date) {
  return {
    subject: `Application Received - ${businessName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">✅ Application Received</h1>
          <p style="color: #6b7280; font-size: 16px;">Thank you for applying to ${businessName}</p>
        </div>
        
        <p style="font-size: 16px;">Hello ${candidateName},</p>
        
        <p style="font-size: 16px;">We have successfully received your application. This email confirms that your information has been submitted to our HR team for review.</p>
        
        <div style="background-color: #eff6ff; border: 1px solid #2563eb; border-radius: 8px; padding: 25px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e40af; font-size: 18px;">Application Summary</h3>
          <div style="background-color: white; padding: 15px; border-radius: 6px; margin-top: 15px;">
            <p style="margin: 8px 0;"><strong>Applicant Name:</strong> ${candidateName}</p>
            <p style="margin: 8px 0;"><strong>Email:</strong> ${candidateEmail}</p>
            <p style="margin: 8px 0;"><strong>Application Type:</strong> ${applicationType}</p>
            <p style="margin: 8px 0;"><strong>Submitted:</strong> ${applicationDate.toLocaleDateString()} at ${applicationDate.toLocaleTimeString()}</p>
          </div>
        </div>
        
        <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 30px 0;">
          <p style="margin: 0; font-weight: bold; color: #065f46;">What Happens Next?</p>
          <ul style="color: #065f46; margin: 10px 0; padding-left: 20px;">
            <li>Our HR team will review your application carefully</li>
            <li>If your qualifications match our requirements, we'll contact you for the next steps</li>
            <li>You may be invited to complete assessment tests</li>
            <li>We'll keep you updated throughout the process</li>
          </ul>
        </div>
        
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 30px 0;">
          <p style="margin: 0; font-weight: bold; color: #92400e;">Please Note:</p>
          <p style="color: #92400e; margin: 10px 0;">Due to the high volume of applications we receive, we may not be able to respond to every applicant individually. If you are selected to move forward in the hiring process, we will contact you via email or phone.</p>
        </div>
        
        <p style="font-size: 16px;">Thank you for your interest in joining our team. We appreciate the time you took to complete your application.</p>
        
        <p style="font-size: 16px;">Best regards,<br>${businessName} HR Team</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; text-align: center;">
          <p>This is an automated confirmation email from ${businessName}.</p>
          <p style="margin-top: 10px;">Application received on ${applicationDate.toLocaleString()}</p>
        </div>
      </div>
    `,
    text: `Application Received - ${businessName}\n\nHello ${candidateName},\n\nWe have successfully received your application. This email confirms that your information has been submitted to our HR team for review.\n\nApplication Summary:\nApplicant Name: ${candidateName}\nEmail: ${candidateEmail}\nApplication Type: ${applicationType}\nSubmitted: ${applicationDate.toLocaleDateString()} at ${applicationDate.toLocaleTimeString()}\n\nWhat Happens Next?\n- Our HR team will review your application carefully\n- If your qualifications match our requirements, we'll contact you for the next steps\n- You may be invited to complete assessment tests\n- We'll keep you updated throughout the process\n\nPlease Note:\nDue to the high volume of applications we receive, we may not be able to respond to every applicant individually. If you are selected to move forward in the hiring process, we will contact you via email or phone.\n\nThank you for your interest in joining our team. We appreciate the time you took to complete your application.\n\nBest regards,\n${businessName} HR Team\n\nThis is an automated confirmation email from ${businessName}.\nApplication received on ${applicationDate.toLocaleString()}`
  };
}
