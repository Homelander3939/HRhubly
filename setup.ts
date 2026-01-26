import { db } from "~/server/db";
import { env } from "~/server/env";
import bcrypt from "bcryptjs";
import { minioClient } from "~/server/minio";

// Use a consistent UUID for the sample test
const SAMPLE_TEST_ID = "550e8400-e29b-41d4-a716-446655440000";

async function setup() {
  console.log("Starting HR Assessment Platform setup...");
  console.log("🛡️  SAFE MODE: This script will ONLY create missing default data");
  console.log("🛡️  SAFE MODE: Existing user data will NEVER be deleted");

  try {
    // Check if database reset is explicitly allowed (should NEVER be true in production)
    const allowReset = process.env.ALLOW_DATABASE_RESET === 'true';
    
    if (allowReset) {
      console.warn("⚠️  WARNING: ALLOW_DATABASE_RESET is enabled!");
      console.warn("⚠️  This should NEVER be enabled in production!");
      console.warn("⚠️  Proceeding with extreme caution...");
    }

    // Count existing data to understand the database state
    const existingBusinessCount = await db.business.count();
    const existingUserCount = await db.user.count();
    const existingAdminCount = await db.adminUser.count();
    const existingTestCount = await db.test.count();
    const existingSubmissionCount = await db.submission.count();

    console.log("📊 Current database state:");
    console.log(`   - Businesses: ${existingBusinessCount}`);
    console.log(`   - Candidates (Users): ${existingUserCount}`);
    console.log(`   - Admin Users: ${existingAdminCount}`);
    console.log(`   - Tests: ${existingTestCount}`);
    console.log(`   - Submissions: ${existingSubmissionCount}`);

    // SAFETY CHECK: Never delete data unless explicitly allowed AND database is truly empty
    const isDatabaseEmpty = existingBusinessCount === 0 && 
                           existingUserCount === 0 && 
                           existingAdminCount === 0 && 
                           existingTestCount === 0 && 
                           existingSubmissionCount === 0;

    if (!isDatabaseEmpty) {
      console.log("✅ Database contains user data - preserving all existing data");
      console.log("✅ Will only create missing default/demo entries if needed");
    } else if (allowReset && isDatabaseEmpty) {
      console.log("ℹ️  Database is empty and reset is allowed - will create initial data");
    } else {
      console.log("ℹ️  Database is empty - will create initial demo data");
    }

    // REMOVED: All deleteMany operations that were deleting user data
    // REMOVED: All cleanup logic that could delete existing businesses, users, tests, etc.
    
    // Create or verify default business (ID = 1 for 'demo')
    let defaultBusiness = await db.business.findUnique({
      where: { id: 1 }
    });

    if (!defaultBusiness) {
      // Check if 'demo' business exists with a different ID
      defaultBusiness = await db.business.findUnique({
        where: { name: 'demo' }
      });

      if (!defaultBusiness) {
        console.log("Creating default 'demo' business...");
        try {
          // Try to create with ID=1
          await db.$executeRaw`INSERT INTO businesses (id, name, "displayName", email, created_at, updated_at) 
                               VALUES (1, 'demo', 'Demo Company', 'admin@demo-company.com', NOW(), NOW()) 
                               ON CONFLICT (id) DO NOTHING`;
          
          // Update sequence to prevent conflicts
          await db.$executeRaw`SELECT setval('businesses_id_seq', GREATEST(1, (SELECT COALESCE(MAX(id), 0) FROM businesses)))`;
          
          defaultBusiness = await db.business.findUnique({ where: { id: 1 } });
          
          if (!defaultBusiness) {
            throw new Error("Failed to create default business with ID=1");
          }
          
          console.log(`✅ Created default business: ${defaultBusiness.name} (ID: ${defaultBusiness.id})`);
        } catch (error) {
          console.log("⚠️  Could not create business with ID=1, creating with auto-increment...");
          defaultBusiness = await db.business.create({
            data: {
              name: 'demo',
              displayName: 'Demo Company',
              email: 'admin@demo-company.com',
            },
          });
          console.log(`✅ Created default business: ${defaultBusiness.name} (ID: ${defaultBusiness.id})`);
        }
      } else {
        console.log(`✅ Demo business exists: ${defaultBusiness.name} (ID: ${defaultBusiness.id})`);
      }
    } else {
      console.log(`✅ Default business exists: ${defaultBusiness.name} (ID: ${defaultBusiness.id})`);
    }

    // Create default admin user if it doesn't exist
    const existingAdmin = await db.adminUser.findFirst({
      where: { 
        username: "admin",
        businessId: defaultBusiness.id 
      }
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
      await db.adminUser.create({
        data: {
          username: "admin",
          email: env.ADMIN_EMAIL || "admin@demo-company.com",
          passwordHash: hashedPassword,
          businessId: defaultBusiness.id,
        },
      });
      console.log(`✅ Created default admin user for business ID: ${defaultBusiness.id}`);
    } else {
      console.log(`✅ Admin user already exists for business ID: ${defaultBusiness.id}`);
    }

    // Create gensweaty demo user if it doesn't exist
    const existingGensweaty = await db.adminUser.findFirst({
      where: { 
        username: "gensweaty",
        businessId: defaultBusiness.id 
      }
    });

    if (!existingGensweaty) {
      const gensweetyPassword = process.env.GENSWEATY_PASSWORD || env.ADMIN_PASSWORD;
      const hashedGenswetyPassword = await bcrypt.hash(gensweetyPassword, 12);
      await db.adminUser.create({
        data: {
          username: "gensweaty",
          email: process.env.GENSWEATY_EMAIL || "gensweaty@demo-company.com",
          passwordHash: hashedGenswetyPassword,
          businessId: defaultBusiness.id,
        },
      });
      console.log(`✅ Created demo user 'gensweaty' for business ID: ${defaultBusiness.id}`);
    } else {
      console.log(`✅ Demo user 'gensweaty' already exists for business ID: ${defaultBusiness.id}`);
    }

    // Create default platform settings (terms and conditions)
    const defaultTerms = `
# Terms and Conditions

## HR Assessment Platform Terms of Use

By accessing and using this HR Assessment Platform, you agree to the following terms and conditions:

### 1. Purpose
This platform is designed for conducting professional assessments and evaluations for employment purposes.

### 2. Data Collection
- We collect personal information including your name, email, and phone number
- Test responses and performance data are recorded for evaluation purposes
- All data is handled in accordance with applicable privacy laws

### 3. Test Integrity
- You must complete the assessment independently without assistance
- Any attempt to cheat or circumvent the system may result in disqualification
- Test sessions are monitored for security purposes

### 4. Results
- Assessment results are confidential and shared only with authorized personnel
- Results may be used for employment decisions and candidate evaluation

### 5. Technical Requirements
- Ensure stable internet connection throughout the assessment
- Use a supported browser and device
- Do not close the browser or navigate away during the test

### 6. Contact
For questions or technical support, please contact our HR department.

By proceeding, you acknowledge that you have read, understood, and agree to these terms and conditions.
    `.trim();

    // Upsert terms and conditions
    await db.platformSetting.upsert({
      where: { 
        businessId_settingKey: {
          businessId: defaultBusiness.id,
          settingKey: "TERMS_AND_CONDITIONS"
        }
      },
      update: { settingValue: defaultTerms },
      create: {
        businessId: defaultBusiness.id,
        settingKey: "TERMS_AND_CONDITIONS",
        settingValue: defaultTerms,
      },
    });
    console.log("✅ Terms and conditions initialized");

    // Create sample test if it doesn't exist
    const existingTest = await db.test.findUnique({
      where: { id: SAMPLE_TEST_ID }
    });

    if (!existingTest) {
      const sampleTest = await db.test.create({
        data: {
          id: SAMPLE_TEST_ID,
          name: "Sample Assessment Test",
          description: "A demonstration test to showcase the platform functionality",
          type: "EXTERNAL",
          durationMinutes: 30,
          passThresholdPercent: 70.00,
          showResultsToCandidate: true,
          businessId: defaultBusiness.id,
        },
      });

      // Add sample questions
      await db.question.createMany({
        data: [
          {
            testId: sampleTest.id,
            title: "What is the primary purpose of a job interview?",
            type: "SINGLE_CHOICE_TEXT",
            maxScore: 1,
            orderIndex: 1,
          },
          {
            testId: sampleTest.id,
            title: "Which of the following are important soft skills in the workplace? (Select all that apply)",
            type: "MULTIPLE_CHOICE_TEXT",
            maxScore: 1,
            orderIndex: 2,
          },
          {
            testId: sampleTest.id,
            title: "Describe your ideal work environment and explain why it would help you be most productive.",
            type: "OPEN_TEXT",
            maxScore: 5,
            orderIndex: 3,
          },
        ],
      });

      // Get the created questions to add answers
      const createdQuestions = await db.question.findMany({
        where: { testId: sampleTest.id },
        orderBy: { orderIndex: "asc" },
      });

      // Add answers for question 1 (single choice)
      await db.answer.createMany({
        data: [
          {
            questionId: createdQuestions[0]!.id,
            answerText: "To assess the candidate's qualifications and fit for the role",
            isCorrect: true,
            orderIndex: 1,
          },
          {
            questionId: createdQuestions[0]!.id,
            answerText: "To negotiate salary and benefits",
            isCorrect: false,
            orderIndex: 2,
          },
          {
            questionId: createdQuestions[0]!.id,
            answerText: "To showcase the company's office space",
            isCorrect: false,
            orderIndex: 3,
          },
        ],
      });

      // Add answers for question 2 (multiple choice)
      await db.answer.createMany({
        data: [
          {
            questionId: createdQuestions[1]!.id,
            answerText: "Communication skills",
            isCorrect: true,
            orderIndex: 1,
          },
          {
            questionId: createdQuestions[1]!.id,
            answerText: "Teamwork and collaboration",
            isCorrect: true,
            orderIndex: 2,
          },
          {
            questionId: createdQuestions[1]!.id,
            answerText: "Problem-solving abilities",
            isCorrect: true,
            orderIndex: 3,
          },
          {
            questionId: createdQuestions[1]!.id,
            answerText: "Physical strength",
            isCorrect: false,
            orderIndex: 4,
          },
        ],
      });

      console.log("✅ Sample test created with questions and answers");
      console.log(`✅ Sample test ID: ${SAMPLE_TEST_ID}`);
    } else {
      console.log("✅ Sample test already exists");
      console.log(`✅ Sample test ID: ${SAMPLE_TEST_ID}`);
    }

    // Create sample candidates ONLY if database is empty (no existing users)
    // This ensures we don't create duplicate demo data if real users exist
    if (existingUserCount === 0) {
      console.log("Creating sample candidates for demo business (database has no users yet)...");
      
      // Sample candidate 1 - Completed test with good score
      const candidate1 = await db.user.create({
        data: {
          businessId: defaultBusiness.id,
          firstName: "Alice",
          lastName: "Johnson",
          email: "alice.johnson@example.com",
          phoneNumber: "+1 (555) 123-4567",
          yearsOfQualification: 5,
          salary: 75000,
          cvUrl: "https://example.com/cv/alice-johnson.pdf",
          socialLink: "https://linkedin.com/in/alice-johnson",
          applicationStatus: "TEST_ASSIGNED",
        },
      });

      // Create a completed submission for candidate 1
      await db.submission.create({
        data: {
          userId: candidate1.id,
          testId: SAMPLE_TEST_ID,
          status: "EVALUATED",
          startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000),
          finalRawScore: 6,
          finalPercentScore: 85.71,
          finalResult: "PASS",
        },
      });

      // Sample candidate 2 - Submitted application, no test yet
      await db.user.create({
        data: {
          businessId: defaultBusiness.id,
          firstName: "Bob",
          lastName: "Martinez",
          email: "bob.martinez@example.com",
          phoneNumber: "+1 (555) 234-5678",
          yearsOfQualification: 3,
          salary: 65000,
          cvUrl: "https://example.com/cv/bob-martinez.pdf",
          socialLink: "https://linkedin.com/in/bob-martinez",
          applicationStatus: "SUBMITTED",
        },
      });

      // Sample candidate 3 - Under review
      await db.user.create({
        data: {
          businessId: defaultBusiness.id,
          firstName: "Carol",
          lastName: "Williams",
          email: "carol.williams@example.com",
          phoneNumber: "+1 (555) 345-6789",
          yearsOfQualification: 7,
          salary: 85000,
          cvUrl: "https://example.com/cv/carol-williams.pdf",
          socialLink: "https://linkedin.com/in/carol-williams",
          applicationStatus: "UNDER_REVIEW",
        },
      });

      // Sample candidate 4 - Completed test with lower score
      const candidate4 = await db.user.create({
        data: {
          businessId: defaultBusiness.id,
          firstName: "David",
          lastName: "Chen",
          email: "david.chen@example.com",
          phoneNumber: "+1 (555) 456-7890",
          yearsOfQualification: 2,
          salary: 55000,
          cvUrl: "https://example.com/cv/david-chen.pdf",
          applicationStatus: "TEST_ASSIGNED",
        },
      });

      // Create a completed submission for candidate 4 with lower score
      await db.submission.create({
        data: {
          userId: candidate4.id,
          testId: SAMPLE_TEST_ID,
          status: "EVALUATED",
          startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 28 * 60 * 1000),
          finalRawScore: 4,
          finalPercentScore: 57.14,
          finalResult: "FAIL",
        },
      });

      // Sample candidate 5 - Test in progress
      const candidate5 = await db.user.create({
        data: {
          businessId: defaultBusiness.id,
          firstName: "Emma",
          lastName: "Taylor",
          email: "emma.taylor@example.com",
          phoneNumber: "+1 (555) 567-8901",
          yearsOfQualification: 4,
          salary: 70000,
          cvUrl: "https://example.com/cv/emma-taylor.pdf",
          socialLink: "https://github.com/emma-taylor",
          applicationStatus: "TEST_ASSIGNED",
        },
      });

      // Create an in-progress submission for candidate 5
      await db.submission.create({
        data: {
          userId: candidate5.id,
          testId: SAMPLE_TEST_ID,
          status: "IN_PROGRESS",
          startTime: new Date(Date.now() - 10 * 60 * 1000),
        },
      });

      console.log(`✅ Created 5 sample candidates for demo business`);
      console.log(`✅ Created 3 sample submissions (2 completed, 1 in progress)`);
    } else {
      console.log(`✅ Preserving ${existingUserCount} existing users - skipping sample candidate creation`);
    }

    // Setup MinIO bucket for CV uploads
    const bucketName = 'cvs';
    const bucketExists = await minioClient.bucketExists(bucketName);
    
    if (!bucketExists) {
      await minioClient.makeBucket(bucketName);
      
      // Set bucket policy to allow public read access to CVs
      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${bucketName}/*`]
          }
        ]
      };
      
      await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
      console.log("✅ MinIO bucket 'cvs' created with public read policy");
    } else {
      console.log("✅ MinIO bucket 'cvs' already exists");
    }

    // Setup MinIO bucket for test assets (images)
    const testAssetsBucketName = 'test-assets';
    const testAssetsBucketExists = await minioClient.bucketExists(testAssetsBucketName);
    
    if (!testAssetsBucketExists) {
      await minioClient.makeBucket(testAssetsBucketName);
      
      // Set bucket policy to allow public read access to test assets
      const testAssetsPolicy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${testAssetsBucketName}/*`]
          }
        ]
      };
      
      await minioClient.setBucketPolicy(testAssetsBucketName, JSON.stringify(testAssetsPolicy));
      console.log("✅ MinIO bucket 'test-assets' created with public read policy");
    } else {
      console.log("✅ MinIO bucket 'test-assets' already exists");
    }

    console.log("");
    console.log("🎉 HR Assessment Platform setup completed successfully!");
    console.log("✅ All existing user data has been preserved");
    console.log("✅ Default/demo entries created where needed");
    console.log("");
    console.log("📊 Final database state:");
    const finalBusinessCount = await db.business.count();
    const finalUserCount = await db.user.count();
    const finalAdminCount = await db.adminUser.count();
    const finalTestCount = await db.test.count();
    const finalSubmissionCount = await db.submission.count();
    console.log(`   - Businesses: ${finalBusinessCount}`);
    console.log(`   - Candidates (Users): ${finalUserCount}`);
    console.log(`   - Admin Users: ${finalAdminCount}`);
    console.log(`   - Tests: ${finalTestCount}`);
    console.log(`   - Submissions: ${finalSubmissionCount}`);

  } catch (error) {
    console.error("❌ Setup failed:", error);
    throw error;
  }
}

setup()
  .then(() => {
    console.log("setup.ts complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
