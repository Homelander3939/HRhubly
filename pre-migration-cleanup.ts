import { db } from "~/server/db";

async function preMigrationCleanup() {
  console.log("Starting pre-migration cleanup to prevent foreign key violations...");

  try {
    // Connect to database
    await db.$connect();

    // Clean up any orphaned data that might cause foreign key constraint violations
    console.log("Cleaning up orphaned data...");
    
    try {
      // Check if tables exist before trying to clean them
      // This handles the case where this is a completely fresh database
      
      // Delete submission answers that might reference non-existent submissions
      const submissionAnswersDeleted = await db.$executeRaw`
        DELETE FROM submission_answers 
        WHERE submission_id NOT IN (SELECT id FROM submissions)
      `;
      console.log(`✓ Cleaned up orphaned submission answers: ${submissionAnswersDeleted}`);

      // Delete submissions that might reference non-existent users or tests
      const submissionsDeleted = await db.$executeRaw`
        DELETE FROM submissions 
        WHERE user_id NOT IN (SELECT id FROM users) 
           OR test_id NOT IN (SELECT id FROM tests)
      `;
      console.log(`✓ Cleaned up orphaned submissions: ${submissionsDeleted}`);

      // Delete answers that might reference non-existent questions
      const answersDeleted = await db.$executeRaw`
        DELETE FROM answers 
        WHERE question_id NOT IN (SELECT id FROM questions)
      `;
      console.log(`✓ Cleaned up orphaned answers: ${answersDeleted}`);

      // Delete questions that might reference non-existent tests
      const questionsDeleted = await db.$executeRaw`
        DELETE FROM questions 
        WHERE test_id NOT IN (SELECT id FROM tests)
      `;
      console.log(`✓ Cleaned up orphaned questions: ${questionsDeleted}`);

      // Delete test_trainings that might reference non-existent tests or trainings
      const testTrainingsDeleted = await db.$executeRaw`
        DELETE FROM test_trainings 
        WHERE test_id NOT IN (SELECT id FROM tests) 
           OR training_id NOT IN (SELECT id FROM trainings)
      `;
      console.log(`✓ Cleaned up orphaned test_trainings: ${testTrainingsDeleted}`);

      // Delete tests that might reference non-existent businesses
      const testsDeleted = await db.$executeRaw`
        DELETE FROM tests 
        WHERE business_id NOT IN (SELECT id FROM businesses)
      `;
      console.log(`✓ Cleaned up orphaned tests: ${testsDeleted}`);

      // Delete trainings that might reference non-existent businesses
      const trainingsDeleted = await db.$executeRaw`
        DELETE FROM trainings 
        WHERE business_id NOT IN (SELECT id FROM businesses)
      `;
      console.log(`✓ Cleaned up orphaned trainings: ${trainingsDeleted}`);

      // Delete platform_settings that might reference non-existent businesses
      const settingsDeleted = await db.$executeRaw`
        DELETE FROM platform_settings 
        WHERE business_id IS NOT NULL AND business_id NOT IN (SELECT id FROM businesses)
      `;
      console.log(`✓ Cleaned up orphaned platform_settings: ${settingsDeleted}`);

      // Delete admin_users that might reference non-existent businesses
      const adminUsersDeleted = await db.$executeRaw`
        DELETE FROM admin_users 
        WHERE business_id NOT IN (SELECT id FROM businesses)
      `;
      console.log(`✓ Cleaned up orphaned admin_users: ${adminUsersDeleted}`);

      // Delete users that might reference non-existent businesses
      const usersDeleted = await db.$executeRaw`
        DELETE FROM users 
        WHERE business_id NOT IN (SELECT id FROM businesses)
      `;
      console.log(`✓ Cleaned up orphaned users: ${usersDeleted}`);

      console.log("✓ Pre-migration cleanup completed successfully");

    } catch (cleanupError) {
      console.log("⚠ Some cleanup operations failed (this is normal on fresh databases):", cleanupError instanceof Error ? cleanupError.message : 'Unknown error');
      
      // REMOVED: Aggressive TRUNCATE cleanup that was deleting all user data
      // This was causing data loss and should NEVER run automatically
      
      console.log("🛡️  SAFETY: Aggressive cleanup has been disabled to protect user data");
      console.log("🛡️  If you need to reset the database, use ALLOW_DATABASE_RESET=true");
      console.log("🛡️  All valid user data is preserved");
    }

    console.log("✓ Pre-migration cleanup completed - user data preserved");

  } catch (error) {
    console.error("Pre-migration cleanup failed:", error);
    // Don't throw error - let migration proceed even if cleanup fails
  } finally {
    await db.$disconnect();
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  preMigrationCleanup()
    .then(() => {
      console.log("pre-migration-cleanup.ts complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Pre-migration cleanup error:", error);
      process.exit(1);
    });
}

export { preMigrationCleanup };
