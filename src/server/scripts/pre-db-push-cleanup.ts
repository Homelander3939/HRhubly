import { Client } from 'pg';

async function preDbPushCleanup() {
  console.log("Starting pre-db-push cleanup to prevent foreign key violations...");

  // Create direct PostgreSQL connection
  const client = new Client({
    host: 'postgres',
    port: 5432,
    database: 'app',
    user: 'postgres',
    password: 'postgres',
  });

  try {
    await client.connect();
    console.log("✓ Connected to PostgreSQL");

    // Check if tables exist before trying to clean them
    const tablesExistQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'businesses', 'admin_users', 'tests', 'submissions', 'questions', 'answers', 'submission_answers', 'test_trainings', 'trainings', 'platform_settings')
    `;
    
    const tablesResult = await client.query(tablesExistQuery);
    const existingTables = tablesResult.rows.map(row => row.table_name);
    
    if (existingTables.length === 0) {
      console.log("✓ No tables exist yet, skipping cleanup");
      return;
    }

    console.log(`✓ Found existing tables: ${existingTables.join(', ')}`);

    // Clean up orphaned data in dependency order
    if (existingTables.includes('submission_answers')) {
      try {
        const result1 = await client.query(`
          DELETE FROM submission_answers 
          WHERE submission_id NOT IN (SELECT id FROM submissions WHERE id IS NOT NULL)
        `);
        console.log(`✓ Cleaned up ${result1.rowCount} orphaned submission_answers`);
      } catch (e) {
        console.log("⚠ Could not clean submission_answers:", e instanceof Error ? e.message : 'Unknown error');
      }
    }

    if (existingTables.includes('submissions')) {
      try {
        const result2 = await client.query(`
          DELETE FROM submissions 
          WHERE user_id NOT IN (SELECT id FROM users WHERE id IS NOT NULL)
             OR test_id NOT IN (SELECT id FROM tests WHERE id IS NOT NULL)
        `);
        console.log(`✓ Cleaned up ${result2.rowCount} orphaned submissions`);
      } catch (e) {
        console.log("⚠ Could not clean submissions:", e instanceof Error ? e.message : 'Unknown error');
      }
    }

    if (existingTables.includes('answers')) {
      try {
        const result3 = await client.query(`
          DELETE FROM answers 
          WHERE question_id NOT IN (SELECT id FROM questions WHERE id IS NOT NULL)
        `);
        console.log(`✓ Cleaned up ${result3.rowCount} orphaned answers`);
      } catch (e) {
        console.log("⚠ Could not clean answers:", e instanceof Error ? e.message : 'Unknown error');
      }
    }

    if (existingTables.includes('questions')) {
      try {
        const result4 = await client.query(`
          DELETE FROM questions 
          WHERE test_id NOT IN (SELECT id FROM tests WHERE id IS NOT NULL)
        `);
        console.log(`✓ Cleaned up ${result4.rowCount} orphaned questions`);
      } catch (e) {
        console.log("⚠ Could not clean questions:", e instanceof Error ? e.message : 'Unknown error');
      }
    }

    if (existingTables.includes('test_trainings')) {
      try {
        const result5 = await client.query(`
          DELETE FROM test_trainings 
          WHERE test_id NOT IN (SELECT id FROM tests WHERE id IS NOT NULL)
             OR training_id NOT IN (SELECT id FROM trainings WHERE id IS NOT NULL)
        `);
        console.log(`✓ Cleaned up ${result5.rowCount} orphaned test_trainings`);
      } catch (e) {
        console.log("⚠ Could not clean test_trainings:", e instanceof Error ? e.message : 'Unknown error');
      }
    }

    if (existingTables.includes('tests')) {
      try {
        const result6 = await client.query(`
          DELETE FROM tests 
          WHERE business_id NOT IN (SELECT id FROM businesses WHERE id IS NOT NULL)
        `);
        console.log(`✓ Cleaned up ${result6.rowCount} orphaned tests`);
      } catch (e) {
        console.log("⚠ Could not clean tests:", e instanceof Error ? e.message : 'Unknown error');
      }
    }

    if (existingTables.includes('trainings')) {
      try {
        const result7 = await client.query(`
          DELETE FROM trainings 
          WHERE business_id NOT IN (SELECT id FROM businesses WHERE id IS NOT NULL)
        `);
        console.log(`✓ Cleaned up ${result7.rowCount} orphaned trainings`);
      } catch (e) {
        console.log("⚠ Could not clean trainings:", e instanceof Error ? e.message : 'Unknown error');
      }
    }

    if (existingTables.includes('platform_settings')) {
      try {
        const result8 = await client.query(`
          DELETE FROM platform_settings 
          WHERE business_id IS NOT NULL AND business_id NOT IN (SELECT id FROM businesses WHERE id IS NOT NULL)
        `);
        console.log(`✓ Cleaned up ${result8.rowCount} orphaned platform_settings`);
      } catch (e) {
        console.log("⚠ Could not clean platform_settings:", e instanceof Error ? e.message : 'Unknown error');
      }
    }

    if (existingTables.includes('admin_users')) {
      try {
        const result9 = await client.query(`
          DELETE FROM admin_users 
          WHERE business_id NOT IN (SELECT id FROM businesses WHERE id IS NOT NULL)
        `);
        console.log(`✓ Cleaned up ${result9.rowCount} orphaned admin_users`);
      } catch (e) {
        console.log("⚠ Could not clean admin_users:", e instanceof Error ? e.message : 'Unknown error');
      }
    }

    // This is the critical one - users that reference non-existent businesses
    if (existingTables.includes('users')) {
      try {
        const result10 = await client.query(`
          DELETE FROM users 
          WHERE business_id NOT IN (SELECT id FROM businesses WHERE id IS NOT NULL)
        `);
        console.log(`✓ Cleaned up ${result10.rowCount} orphaned users`);
      } catch (e) {
        console.log("⚠ Could not clean users:", e instanceof Error ? e.message : 'Unknown error');
      }
    }

    // REMOVED: Aggressive cleanup that was using TRUNCATE TABLE CASCADE
    // This was causing data loss and should NEVER run automatically
    
    console.log("✅ Selective cleanup completed");
    console.log("🛡️  SAFETY: Aggressive cleanup has been disabled to protect user data");
    console.log("🛡️  Only orphaned records (invalid foreign keys) are cleaned up");
    console.log("🛡️  All valid user data is preserved");

    console.log("✓ Pre-db-push cleanup completed");

  } catch (error) {
    console.error("Pre-db-push cleanup failed:", error);
    // Don't throw error - let the process continue even if cleanup fails
  } finally {
    await client.end();
  }
}

// Run cleanup if this script is executed directly
if (process.argv[1]?.endsWith('pre-db-push-cleanup.ts') || process.argv[1]?.endsWith('pre-db-push-cleanup.js')) {
  preDbPushCleanup()
    .then(() => {
      console.log("pre-db-push-cleanup.ts complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Pre-db-push cleanup error:", error);
      process.exit(1);
    });
}

export { preDbPushCleanup };
