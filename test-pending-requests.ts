import { db } from "~/server/db";

async function testPendingRequests() {
  console.log("Testing pending requests functionality...");

  try {
    // Query for pending submissions
    console.log("\n1. Querying for pending submissions...");
    const pendingSubmissions = await db.submission.findMany({
      where: { status: "PENDING_APPROVAL" },
      include: {
        user: true,
        test: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`Found ${pendingSubmissions.length} pending submissions`);
    
    if (pendingSubmissions.length > 0) {
      pendingSubmissions.forEach((submission, index) => {
        console.log(`Submission ${index + 1}:`, {
          id: submission.id,
          status: submission.status,
          applicantName: `${submission.user.firstName} ${submission.user.lastName}`,
          testName: submission.test.name,
          createdAt: submission.createdAt,
          hasCreatedAt: !!submission.createdAt
        });
      });
    } else {
      console.log("No pending submissions found");
    }

    // Query for all submissions to see what statuses exist
    console.log("\n2. Querying for all submissions...");
    const allSubmissions = await db.submission.findMany({
      select: {
        id: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`Found ${allSubmissions.length} total submissions`);
    allSubmissions.forEach((submission, index) => {
      console.log(`Submission ${index + 1}:`, {
        id: submission.id,
        status: submission.status,
        applicantName: `${submission.user.firstName} ${submission.user.lastName}`,
        createdAt: submission.createdAt
      });
    });

    console.log("\n3. Testing complete!");

  } catch (error) {
    console.error("Test failed:", error);
    throw error;
  }
}

testPendingRequests()
  .then(() => {
    console.log("test-pending-requests.ts complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
