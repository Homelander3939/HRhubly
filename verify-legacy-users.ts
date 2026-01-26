import { db } from "~/server/db";

async function verifyLegacyUsers(dryRun: boolean = true) {
  console.log("✉️  ============================================");
  console.log("✉️  LEGACY USER VERIFICATION SCRIPT");
  console.log(`✉️  Mode: ${dryRun ? 'DRY RUN (preview only)' : 'LIVE (will make changes)'}`);
  console.log("✉️  ============================================\n");

  try {
    // Define the 2 legacy users who need verification
    // These users registered before email verification was implemented
    const legacyUserEmails = [
      'ananiadevsurashvili@gmail.com',
      'gensweaty@gmail.com',
    ];

    console.log("📊 STEP 1: Identifying Legacy Users\n");
    console.log(`Looking for ${legacyUserEmails.length} legacy users:\n`);

    const usersToVerify = [];

    for (const email of legacyUserEmails) {
      console.log(`Checking: ${email}`);
      
      // Find admin user by email
      const adminUser = await db.adminUser.findFirst({
        where: {
          email: email,
        },
        include: {
          business: true,
        },
      });

      if (!adminUser) {
        console.log(`   ❌ User not found with email: ${email}`);
        console.log(`   💡 This user may not exist or may use a different email\n`);
        continue;
      }

      console.log(`   ✅ Found user: ${adminUser.username}`);
      console.log(`   📧 Email: ${adminUser.email}`);
      console.log(`   🏢 Business: ${adminUser.business.name} (${adminUser.business.displayName})`);
      console.log(`   ✉️  Current verified status: ${adminUser.isVerified}`);
      
      if (adminUser.isVerified) {
        console.log(`   ℹ️  User is already verified - no action needed\n`);
      } else {
        console.log(`   ⚠️  User needs verification\n`);
        usersToVerify.push(adminUser);
      }
    }

    console.log("\n📊 STEP 2: Summary\n");
    
    if (usersToVerify.length === 0) {
      console.log("✅ All legacy users are already verified! No changes needed.\n");
    } else {
      console.log(`Found ${usersToVerify.length} user(s) to verify:\n`);
      
      usersToVerify.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username} (${user.email}) in business "${user.business.name}"`);
      });
      
      console.log('');

      // Execute verification (if not dry run)
      if (!dryRun) {
        console.log("📊 STEP 3: Verifying Users\n");
        
        for (let i = 0; i < usersToVerify.length; i++) {
          const user = usersToVerify[i];
          console.log(`Verifying ${i + 1}/${usersToVerify.length}: ${user.username} (${user.email})`);
          
          try {
            await db.adminUser.update({
              where: { id: user.id },
              data: {
                isVerified: true,
                verificationToken: null,
                verificationTokenExpiresAt: null,
              },
            });
            console.log(`   ✅ Successfully verified\n`);
          } catch (error: any) {
            console.error(`   ❌ Failed: ${error.message}\n`);
          }
        }

        console.log("✅ Verification complete!\n");
        
        // Show updated status
        console.log("📊 STEP 4: Updated Status\n");
        
        for (const email of legacyUserEmails) {
          const updatedUser = await db.adminUser.findFirst({
            where: { email: email },
            select: {
              username: true,
              email: true,
              isVerified: true,
              business: {
                select: {
                  name: true,
                  displayName: true,
                },
              },
            },
          });

          if (updatedUser) {
            console.log(`User: ${updatedUser.username}`);
            console.log(`   Email: ${updatedUser.email}`);
            console.log(`   Business: ${updatedUser.business.name}`);
            console.log(`   Verified: ${updatedUser.isVerified ? '✅ YES' : '❌ NO'}\n`);
          }
        }
      } else {
        console.log("💡 This was a DRY RUN. No changes were made.\n");
        console.log("To apply these changes, run the script with --live flag:\n");
        console.log("   npm run verify-legacy-users -- --live\n");
      }
    }

    console.log("✅ Script complete!\n");
    console.log("✉️  ============================================\n");

  } catch (error) {
    console.error("❌ Script failed:", error);
    throw error;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const isLive = args.includes('--live');

verifyLegacyUsers(!isLive)
  .then(() => {
    console.log("Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
