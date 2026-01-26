import { db } from "~/server/db";
import bcrypt from "bcryptjs";
import { env } from "~/server/env";

interface FixAction {
  type: 'UPDATE_BUSINESS_EMAIL' | 'ADD_ADMIN_EMAIL' | 'CREATE_ADMIN_USER';
  description: string;
  execute: () => Promise<void>;
}

async function fixEmailRouting(dryRun: boolean = true) {
  console.log("🔧 ============================================");
  console.log("🔧 EMAIL ROUTING FIX SCRIPT");
  console.log(`🔧 Mode: ${dryRun ? 'DRY RUN (preview only)' : 'LIVE (will make changes)'}`);
  console.log("🔧 ============================================\n");

  const actions: FixAction[] = [];

  try {
    // 1. Analyze current state
    console.log("📊 STEP 1: Analyzing Current Configuration\n");
    
    const businesses = await db.business.findMany({
      include: {
        adminUsers: true,
      },
      orderBy: { id: 'asc' },
    });

    console.log(`Found ${businesses.length} business(es)\n`);

    // 2. Identify issues and prepare fixes
    console.log("📊 STEP 2: Identifying Issues\n");

    // Issue 1: Businesses with missing or invalid emails
    for (const business of businesses) {
      console.log(`Checking business: "${business.name}"`);
      console.log(`   Current email: ${business.email}`);
      
      // Check if email needs updating
      const needsUpdate = 
        !business.email || 
        business.email === 'admin@example.com' ||
        business.email === env.ADMIN_EMAIL;

      if (needsUpdate) {
        const suggestedEmail = `admin@${business.name}.com`;
        console.log(`   ⚠️  Issue: Email needs to be updated`);
        console.log(`   💡 Suggested: ${suggestedEmail}`);
        
        actions.push({
          type: 'UPDATE_BUSINESS_EMAIL',
          description: `Update business "${business.name}" email from "${business.email}" to "${suggestedEmail}"`,
          execute: async () => {
            await db.business.update({
              where: { id: business.id },
              data: { email: suggestedEmail },
            });
          },
        });
      } else {
        console.log(`   ✅ Email looks good`);
      }

      // Issue 2: Admin users without email addresses
      const adminsWithoutEmail = business.adminUsers.filter(admin => !admin.email);
      if (adminsWithoutEmail.length > 0) {
        console.log(`   ⚠️  Found ${adminsWithoutEmail.length} admin user(s) without email`);
        
        for (const admin of adminsWithoutEmail) {
          const suggestedEmail = `${admin.username}@${business.name}.com`;
          console.log(`      - Username: "${admin.username}" → Suggested email: ${suggestedEmail}`);
          
          actions.push({
            type: 'ADD_ADMIN_EMAIL',
            description: `Add email "${suggestedEmail}" to admin user "${admin.username}" in business "${business.name}"`,
            execute: async () => {
              await db.adminUser.update({
                where: { id: admin.id },
                data: { email: suggestedEmail },
              });
            },
          });
        }
      }

      console.log('');
    }

    // Issue 3: Check if specific emails need to be registered
    console.log("📊 STEP 3: Checking Specific Email Addresses\n");
    
    const targetEmails = [
      { email: 'ananiadevsurashvili@gmail.com', username: 'anania', business: 'demo' },
      { email: 'gensweaty@gmail.com', username: 'gensweaty', business: 'demo' },
      { email: 'anania.devsurashvili@caucasusauto.com', username: 'anania_caucasus', business: 'demo' },
    ];

    for (const target of targetEmails) {
      console.log(`Checking: ${target.email}`);
      
      // Check if this email is registered as an admin user
      const existingAdmin = await db.adminUser.findFirst({
        where: { email: target.email },
        include: { business: true },
      });

      if (existingAdmin) {
        console.log(`   ✅ Already registered in business "${existingAdmin.business.name}"`);
      } else {
        console.log(`   ⚠️  Not registered as admin user`);
        
        // Find the target business
        const targetBusiness = await db.business.findUnique({
          where: { name: target.business.toLowerCase() },
        });

        if (targetBusiness) {
          // Check if username already exists
          const existingUsername = await db.adminUser.findFirst({
            where: {
              businessId: targetBusiness.id,
              username: target.username,
            },
          });

          if (existingUsername) {
            console.log(`   💡 Username "${target.username}" exists, will update email`);
            actions.push({
              type: 'ADD_ADMIN_EMAIL',
              description: `Update admin user "${target.username}" in business "${target.business}" with email "${target.email}"`,
              execute: async () => {
                await db.adminUser.update({
                  where: { id: existingUsername.id },
                  data: { email: target.email },
                });
              },
            });
          } else {
            console.log(`   💡 Will create new admin user "${target.username}" with email "${target.email}"`);
            actions.push({
              type: 'CREATE_ADMIN_USER',
              description: `Create admin user "${target.username}" in business "${target.business}" with email "${target.email}"`,
              execute: async () => {
                // Generate a secure default password
                const defaultPassword = 'ChangeMe123!';
                const passwordHash = await bcrypt.hash(defaultPassword, 10);
                
                await db.adminUser.create({
                  data: {
                    businessId: targetBusiness.id,
                    username: target.username,
                    email: target.email,
                    passwordHash,
                  },
                });
                
                console.log(`   ⚠️  Created admin user with default password: ${defaultPassword}`);
                console.log(`   ⚠️  IMPORTANT: Change this password immediately after first login!`);
              },
            });
          }
        } else {
          console.log(`   ❌ Target business "${target.business}" not found`);
        }
      }

      console.log('');
    }

    // 3. Summary of actions
    console.log("\n📊 STEP 4: Summary of Actions\n");
    
    if (actions.length === 0) {
      console.log("✅ No fixes needed! Email routing is configured correctly.\n");
    } else {
      console.log(`Found ${actions.length} action(s) to perform:\n`);
      
      actions.forEach((action, index) => {
        console.log(`${index + 1}. [${action.type}] ${action.description}`);
      });
      
      console.log('');

      // 4. Execute actions (if not dry run)
      if (!dryRun) {
        console.log("📊 STEP 5: Executing Fixes\n");
        
        for (let i = 0; i < actions.length; i++) {
          const action = actions[i];
          console.log(`Executing ${i + 1}/${actions.length}: ${action.description}`);
          
          try {
            await action.execute();
            console.log(`   ✅ Success\n`);
          } catch (error: any) {
            console.error(`   ❌ Failed: ${error.message}\n`);
          }
        }

        console.log("✅ All fixes applied!\n");
        
        // Show updated configuration
        console.log("📊 STEP 6: Updated Configuration\n");
        
        const updatedBusinesses = await db.business.findMany({
          include: {
            adminUsers: {
              select: {
                username: true,
                email: true,
              },
            },
          },
          orderBy: { id: 'asc' },
        });

        updatedBusinesses.forEach(business => {
          console.log(`Business: "${business.name}"`);
          console.log(`   Business Email: ${business.email}`);
          console.log(`   Admin Users:`);
          business.adminUsers.forEach(admin => {
            console.log(`      - ${admin.username} (${admin.email || 'no email'})`);
          });
          console.log('');
        });
      } else {
        console.log("💡 This was a DRY RUN. No changes were made.\n");
        console.log("To apply these fixes, run the script with --live flag:\n");
        console.log("   npm run fix-email-routing -- --live\n");
      }
    }

    console.log("✅ Fix script complete!\n");
    console.log("🔧 ============================================\n");

  } catch (error) {
    console.error("❌ Fix script failed:", error);
    throw error;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const isLive = args.includes('--live');

fixEmailRouting(!isLive)
  .then(() => {
    console.log("Fix script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fix script failed:", error);
    process.exit(1);
  });
