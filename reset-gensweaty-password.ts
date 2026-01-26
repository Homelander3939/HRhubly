import { db } from "~/server/db";
import { env } from "~/server/env";
import bcrypt from "bcryptjs";

async function resetGensweetyPassword() {
  console.log("🔄 Resetting gensweaty user password...");

  try {
    // Find the demo business
    const demoBusiness = await db.business.findFirst({
      where: { name: 'demo' }
    });

    if (!demoBusiness) {
      console.error("❌ Demo business not found. Please run setup first.");
      process.exit(1);
    }

    console.log(`✓ Found demo business: ${demoBusiness.name} (ID: ${demoBusiness.id})`);

    // Find the gensweaty user
    const gensweetyUser = await db.adminUser.findFirst({
      where: {
        username: "gensweaty",
        businessId: demoBusiness.id
      }
    });

    if (!gensweetyUser) {
      console.error("❌ User 'gensweaty' not found. Please run setup first.");
      process.exit(1);
    }

    console.log(`✓ Found user 'gensweaty' (ID: ${gensweetyUser.id})`);

    // Get the password from environment variables
    const newPassword = process.env.GENSWEATY_PASSWORD || env.ADMIN_PASSWORD;
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the password
    await db.adminUser.update({
      where: { id: gensweetyUser.id },
      data: { passwordHash: hashedPassword }
    });

    console.log(`✅ Password reset successfully for user 'gensweaty'`);
    console.log(`📝 New login credentials:`);
    console.log(`   Business: demo`);
    console.log(`   Username: gensweaty`);
    console.log(`   Password: ${process.env.GENSWEATY_PASSWORD ? '[GENSWEATY_PASSWORD from .env]' : '[ADMIN_PASSWORD from .env]'}`);
    
    if (process.env.GENSWEATY_PASSWORD) {
      console.log(`   ✓ Using GENSWEATY_PASSWORD: ${process.env.GENSWEATY_PASSWORD}`);
    } else {
      console.log(`   ✓ Using ADMIN_PASSWORD: ${env.ADMIN_PASSWORD}`);
    }

    console.log(`\n💡 You can now log in with these credentials.`);

  } catch (error) {
    console.error("❌ Password reset failed:", error);
    throw error;
  }
}

resetGensweetyPassword()
  .then(() => {
    console.log("Password reset complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
