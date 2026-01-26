import { db } from "~/server/db";
import bcrypt from "bcryptjs";

async function diagnoseLogin() {
  console.log("🔍 ============================================");
  console.log("🔍 EMAIL & LOGIN DIAGNOSTIC TOOL");
  console.log("🔍 ============================================\n");

  try {
    // 1. List all businesses with their email addresses
    console.log("📊 STEP 1: Business Email Configuration (for admin notifications)\n");
    const businesses = await db.business.findMany({
      include: {
        _count: {
          select: { 
            adminUsers: true,
            users: true,
            tests: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    console.log(`Found ${businesses.length} business(es):\n`);
    businesses.forEach((business, index) => {
      console.log(`${index + 1}. Business: "${business.name}"`);
      console.log(`   ID: ${business.id}`);
      console.log(`   Display Name: ${business.displayName}`);
      console.log(`   📧 Business Email (receives admin notifications): ${business.email}`);
      console.log(`   👥 Admin Users: ${business._count.adminUsers}`);
      console.log(`   📝 Candidates: ${business._count.users}`);
      console.log(`   📋 Tests: ${business._count.tests}`);
      console.log(`   Created: ${business.createdAt}`);
      console.log('');
    });

    // Identify the issue with business emails
    const uniqueBusinessEmails = new Set(businesses.map(b => b.email));
    console.log(`📧 BUSINESS EMAIL ANALYSIS:`);
    console.log(`   Total businesses: ${businesses.length}`);
    console.log(`   Unique business emails: ${uniqueBusinessEmails.size}`);
    if (uniqueBusinessEmails.size === 1 && businesses.length > 1) {
      console.log(`   ⚠️  WARNING: All businesses share the same email address!`);
      console.log(`   This means all admin notifications go to: ${Array.from(uniqueBusinessEmails)[0]}`);
    }
    console.log('');

    // 2. List all admin users for each business
    console.log("\n📊 STEP 2: Admin User Email Configuration (for password reset)\n");
    
    let totalAdminsWithEmail = 0;
    let totalAdminsWithoutEmail = 0;
    const allAdminEmails = new Set<string>();

    for (const business of businesses) {
      const adminUsers = await db.adminUser.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: 'asc' },
      });

      console.log(`Business: "${business.name}" (${business.displayName})`);
      console.log(`Admin Users: ${adminUsers.length}\n`);

      if (adminUsers.length === 0) {
        console.log(`   ⚠️  NO ADMIN USERS FOUND FOR THIS BUSINESS!\n`);
      } else {
        adminUsers.forEach((user, index) => {
          const hasEmail = !!user.email;
          if (hasEmail) {
            totalAdminsWithEmail++;
            allAdminEmails.add(user.email!);
          } else {
            totalAdminsWithoutEmail++;
          }

          console.log(`   ${index + 1}. Username: "${user.username}"`);
          console.log(`      📧 Email: ${user.email || '❌ NULL (password reset will fail!)'}`);
          console.log(`      User ID: ${user.id}`);
          console.log(`      Created: ${user.createdAt}`);
          if (!hasEmail) {
            console.log(`      ⚠️  This user cannot receive password reset emails!`);
          }
          console.log('');
        });
      }
    }

    console.log(`📧 ADMIN USER EMAIL ANALYSIS:`);
    console.log(`   Total admin users: ${totalAdminsWithEmail + totalAdminsWithoutEmail}`);
    console.log(`   Admin users WITH email: ${totalAdminsWithEmail}`);
    console.log(`   Admin users WITHOUT email: ${totalAdminsWithoutEmail}`);
    console.log(`   Unique admin emails that can receive password resets: ${allAdminEmails.size}`);
    if (allAdminEmails.size > 0) {
      console.log(`   These emails can receive password reset notifications:`);
      Array.from(allAdminEmails).forEach(email => {
        console.log(`      - ${email}`);
      });
    }
    console.log('');

    // 3. Test specific emails the user mentioned
    console.log("\n📊 STEP 3: Testing Specific Email Addresses\n");
    
    const testEmails = [
      'ananiadevsurashvili@gmail.com',
      'gensweaty@gmail.com',
      'anania.devsurashvili@caucasusauto.com',
    ];

    for (const testEmail of testEmails) {
      console.log(`Testing: ${testEmail}`);
      
      // Check if it's a business email
      const businessWithEmail = businesses.find(b => b.email === testEmail);
      if (businessWithEmail) {
        console.log(`   ✅ This is the business email for: "${businessWithEmail.name}"`);
        console.log(`   ✅ Will receive: New applications, test requests, test completions`);
      } else {
        console.log(`   ❌ Not configured as any business email`);
        console.log(`   ❌ Will NOT receive: New applications, test requests, test completions`);
      }

      // Check if it's an admin user email
      const adminWithEmail = await db.adminUser.findFirst({
        where: { email: testEmail },
        include: { business: true },
      });
      
      if (adminWithEmail) {
        console.log(`   ✅ Registered as admin user in business: "${adminWithEmail.business.name}"`);
        console.log(`   ✅ Will receive: Password reset emails`);
        console.log(`   👤 Username: ${adminWithEmail.username}`);
      } else {
        console.log(`   ❌ Not registered as an admin user in any business`);
        console.log(`   ❌ Will NOT receive: Password reset emails`);
      }
      
      console.log('');
    }

    // 4. Environment variable check
    console.log("\n📊 STEP 4: Environment Configuration\n");
    console.log(`EMAIL_FROM: ${process.env.EMAIL_FROM || 'NOT SET'}`);
    console.log(`ADMIN_EMAIL: ${process.env.ADMIN_EMAIL || 'NOT SET'}`);
    console.log(`RESEND_API_KEY: ${process.env.RESEND_API_KEY ? 'SET (' + process.env.RESEND_API_KEY.substring(0, 10) + '...)' : 'NOT SET'}`);
    console.log('');

    // 5. Summary and specific recommendations
    console.log("\n📊 STEP 5: DIAGNOSIS & RECOMMENDATIONS\n");
    
    console.log("🔍 CURRENT EMAIL ROUTING:\n");
    
    // Show which email receives what
    const emailRecipients = new Map<string, string[]>();
    
    for (const business of businesses) {
      if (!emailRecipients.has(business.email)) {
        emailRecipients.set(business.email, []);
      }
      emailRecipients.get(business.email)!.push(
        `Admin notifications for business "${business.name}" (applications, test requests, completions)`
      );
    }

    for (const [email, notifications] of emailRecipients) {
      console.log(`📧 ${email} receives:`);
      notifications.forEach(n => console.log(`   - ${n}`));
      console.log('');
    }

    console.log(`📧 Password reset emails can be sent to:`);
    if (allAdminEmails.size === 0) {
      console.log(`   ❌ NO ADMIN USERS HAVE EMAIL ADDRESSES SET!`);
    } else {
      Array.from(allAdminEmails).forEach(email => {
        const admins = await db.adminUser.findMany({
          where: { email },
          include: { business: true },
        });
        admins.forEach(admin => {
          console.log(`   - ${email} (username: "${admin.username}" in business "${admin.business.name}")`);
        });
      });
    }
    console.log('');

    // Specific recommendations
    console.log("💡 RECOMMENDATIONS TO FIX EMAIL ISSUES:\n");
    
    let issueCount = 0;

    // Issue 1: Business emails all the same
    if (uniqueBusinessEmails.size === 1 && businesses.length > 1) {
      issueCount++;
      console.log(`${issueCount}. UPDATE BUSINESS EMAILS:`);
      console.log(`   Problem: All businesses share the same email (${Array.from(uniqueBusinessEmails)[0]})`);
      console.log(`   Solution: Update each business to have its own admin email`);
      console.log(`   SQL Commands:`);
      businesses.forEach(b => {
        console.log(`      UPDATE businesses SET email = 'admin@${b.name}.com' WHERE id = ${b.id};`);
      });
      console.log('');
    }

    // Issue 2: Admin users without email
    if (totalAdminsWithoutEmail > 0) {
      issueCount++;
      console.log(`${issueCount}. ADD EMAIL ADDRESSES TO ADMIN USERS:`);
      console.log(`   Problem: ${totalAdminsWithoutEmail} admin user(s) have no email address`);
      console.log(`   Solution: Add email addresses to these admin users`);
      console.log(`   SQL Commands:`);
      const adminsWithoutEmail = await db.adminUser.findMany({
        where: { email: null },
        include: { business: true },
      });
      adminsWithoutEmail.forEach(admin => {
        console.log(`      UPDATE admin_users SET email = '${admin.username}@${admin.business.name}.com' WHERE id = '${admin.id}';`);
      });
      console.log('');
    }

    // Issue 3: Specific emails not registered
    const unregisteredEmails = testEmails.filter(email => {
      const isBusiness = businesses.some(b => b.email === email);
      const isAdmin = allAdminEmails.has(email);
      return !isBusiness && !isAdmin;
    });

    if (unregisteredEmails.length > 0) {
      issueCount++;
      console.log(`${issueCount}. REGISTER MISSING EMAIL ADDRESSES:`);
      console.log(`   Problem: These emails are not registered in the system:`);
      unregisteredEmails.forEach(email => console.log(`      - ${email}`));
      console.log(`   Solution: Either:`);
      console.log(`      a) Add them as admin users to the appropriate business, OR`);
      console.log(`      b) Update the business email to one of these addresses`);
      console.log('');
    }

    if (issueCount === 0) {
      console.log("✅ No critical issues found! Email routing should work correctly.\n");
    } else {
      console.log(`⚠️  Found ${issueCount} issue(s) that need to be fixed.\n`);
    }

    // Test login if credentials provided
    const TEST_BUSINESS = process.env.TEST_LOGIN_BUSINESS;
    const TEST_USERNAME = process.env.TEST_LOGIN_USERNAME;
    const TEST_PASSWORD = process.env.TEST_LOGIN_PASSWORD;

    if (TEST_BUSINESS && TEST_USERNAME && TEST_PASSWORD) {
      console.log("\n📊 STEP 6: Testing Specific Login Credentials\n");
      console.log(`Business: "${TEST_BUSINESS}"`);
      console.log(`Username: "${TEST_USERNAME}"`);
      console.log(`Password: ${TEST_PASSWORD.length} characters\n`);

      const business = await db.business.findUnique({
        where: { name: TEST_BUSINESS.toLowerCase() },
      });

      if (!business) {
        console.log(`❌ Business "${TEST_BUSINESS}" not found!\n`);
      } else {
        console.log(`✅ Business found: ${business.name} (id: ${business.id})\n`);

        const admin = await db.adminUser.findFirst({
          where: {
            businessId: business.id,
            OR: [
              { email: TEST_USERNAME },
              { username: TEST_USERNAME },
            ],
          },
        });

        if (!admin) {
          console.log(`❌ User "${TEST_USERNAME}" not found in business "${TEST_BUSINESS}"!\n`);
          
          const availableUsers = await db.adminUser.findMany({
            where: { businessId: business.id },
            select: { username: true, email: true },
          });
          
          console.log(`Available users in this business:`);
          availableUsers.forEach((u, i) => {
            console.log(`   ${i + 1}. Username: "${u.username}", Email: "${u.email || 'NULL'}"`);
          });
          console.log('');
        } else {
          console.log(`✅ User found: ${admin.username} (${admin.email || 'no email'})\n`);

          const isValid = await bcrypt.compare(TEST_PASSWORD, admin.passwordHash);
          
          if (isValid) {
            console.log(`✅ ✅ ✅ PASSWORD IS CORRECT! ✅ ✅ ✅\n`);
            console.log(`You can log in with:`);
            console.log(`   Business: ${TEST_BUSINESS}`);
            console.log(`   Username: ${TEST_USERNAME}`);
            console.log(`   Password: ${TEST_PASSWORD}\n`);
          } else {
            console.log(`❌ ❌ ❌ PASSWORD IS INCORRECT! ❌ ❌ ❌\n`);
          }
        }
      }
    }

    console.log("\n✅ Diagnostic complete!\n");
    console.log("🔍 ============================================\n");

  } catch (error) {
    console.error("❌ Diagnostic failed:", error);
    throw error;
  }
}

diagnoseLogin()
  .then(() => {
    console.log("Diagnostic script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Diagnostic script failed:", error);
    process.exit(1);
  });
