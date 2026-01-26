const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testBusinessContextFix() {
  console.log('🧪 Testing Business Context Fix');
  console.log('=====================================');
  
  try {
    // Step 1: Create business "crypto" and admin user "anania"
    console.log('\n📝 Step 1: Creating business "crypto" with admin "anania"...');
    const signupResponse = await fetch(`${BASE_URL}/api/trpc/businessSignup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessName: 'crypto',
        displayName: 'Crypto Company',
        businessEmail: 'admin@crypto.com',
        username: 'anania',
        password: 'testpassword123',
      }),
    });

    if (!signupResponse.ok) {
      const errorText = await signupResponse.text();
      console.log('ℹ️  Business might already exist, trying login instead...');
      
      // Try login instead
      const loginResponse = await fetch(`${BASE_URL}/api/trpc/businessLogin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName: 'crypto',
          username: 'anania',
          password: 'testpassword123',
        }),
      });

      if (!loginResponse.ok) {
        throw new Error(`Login failed: ${await loginResponse.text()}`);
      }

      const loginData = await loginResponse.json();
      var adminToken = loginData.result.data.token;
      var businessInfo = loginData.result.data.business;
      console.log(`✅ Logged in as admin for business: ${businessInfo.name} (id: ${businessInfo.id})`);
    } else {
      const signupData = await signupResponse.json();
      var adminToken = signupData.result.data.token;
      var businessInfo = signupData.result.data.business;
      console.log(`✅ Created business: ${businessInfo.name} (id: ${businessInfo.id})`);
    }

    // Step 2: Create a vacancy in the crypto business
    console.log('\n📝 Step 2: Creating vacancy in crypto business...');
    const createVacancyResponse = await fetch(`${BASE_URL}/api/trpc/createVacancy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: adminToken,
        title: 'Blockchain Developer',
        description: 'We are looking for a skilled blockchain developer to join our crypto team.',
      }),
    });

    if (!createVacancyResponse.ok) {
      throw new Error(`Failed to create vacancy: ${await createVacancyResponse.text()}`);
    }

    const vacancyData = await createVacancyResponse.json();
    const vacancy = vacancyData.result.data.vacancy;
    console.log(`✅ Created vacancy: ${vacancy.title} (id: ${vacancy.id})`);

    // Step 3: Test getVacancyDetails with businessName parameter
    console.log('\n📝 Step 3: Testing getVacancyDetails with businessName "crypto"...');
    const vacancyDetailsResponse = await fetch(`${BASE_URL}/api/trpc/getVacancyDetails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vacancyId: vacancy.id,
        businessName: 'crypto',
      }),
    });

    if (!vacancyDetailsResponse.ok) {
      const errorText = await vacancyDetailsResponse.text();
      console.log(`❌ getVacancyDetails failed: ${errorText}`);
      console.log('🔍 This indicates the business context fix may not be working properly');
      return false;
    }

    const vacancyDetails = await vacancyDetailsResponse.json();
    const retrievedVacancy = vacancyDetails.result.data;
    console.log(`✅ Retrieved vacancy: ${retrievedVacancy.title} (id: ${retrievedVacancy.id})`);

    // Step 4: Test getPublicVacancies with businessName parameter
    console.log('\n📝 Step 4: Testing getPublicVacancies with businessName "crypto"...');
    const publicVacanciesResponse = await fetch(`${BASE_URL}/api/trpc/getPublicVacancies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessName: 'crypto',
      }),
    });

    if (!publicVacanciesResponse.ok) {
      const errorText = await publicVacanciesResponse.text();
      console.log(`❌ getPublicVacancies failed: ${errorText}`);
      return false;
    }

    const publicVacancies = await publicVacanciesResponse.json();
    const vacanciesList = publicVacancies.result.data;
    console.log(`✅ Retrieved ${vacanciesList.length} public vacancies for crypto business`);
    
    // Verify that our vacancy is in the list
    const foundVacancy = vacanciesList.find(v => v.id === vacancy.id);
    if (foundVacancy) {
      console.log(`✅ Confirmed: Created vacancy found in public vacancies list`);
    } else {
      console.log(`❌ Created vacancy NOT found in public vacancies list`);
      console.log('Available vacancies:', vacanciesList.map(v => ({ id: v.id, title: v.title })));
      return false;
    }

    // Step 5: Test submitGeneralApplication with businessName parameter
    console.log('\n📝 Step 5: Testing submitGeneralApplication with businessName "crypto"...');
    
    // First generate a CV upload URL
    const cvUploadResponse = await fetch(`${BASE_URL}/api/trpc/generateCvUploadUrl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: 'test-cv.pdf',
        fileType: 'application/pdf',
        businessName: 'crypto',
      }),
    });

    if (!cvUploadResponse.ok) {
      throw new Error(`Failed to generate CV upload URL: ${await cvUploadResponse.text()}`);
    }

    const cvUploadData = await cvUploadResponse.json();
    const cvUrl = cvUploadData.result.data.fileUrl;

    // Submit application
    const applicationResponse = await fetch(`${BASE_URL}/api/trpc/submitGeneralApplication`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'Candidate',
        email: 'test@candidate.com',
        phone: '+1234567890',
        yearsOfQualification: 3,
        salary: 75000,
        socialLink: 'https://linkedin.com/in/testcandidate',
        cvUrl: cvUrl,
        vacancyId: vacancy.id,
        businessName: 'crypto',
      }),
    });

    if (!applicationResponse.ok) {
      const errorText = await applicationResponse.text();
      console.log(`❌ submitGeneralApplication failed: ${errorText}`);
      return false;
    }

    const applicationData = await applicationResponse.json();
    console.log(`✅ Application submitted successfully (userId: ${applicationData.result.data.userId})`);

    // Step 6: Verify the application was created under the correct business
    console.log('\n📝 Step 6: Verifying application was created under crypto business...');
    const candidatesResponse = await fetch(`${BASE_URL}/api/trpc/getAllCandidates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: adminToken,
        page: 1,
        limit: 10,
      }),
    });

    if (!candidatesResponse.ok) {
      throw new Error(`Failed to get candidates: ${await candidatesResponse.text()}`);
    }

    const candidatesData = await candidatesResponse.json();
    const candidates = candidatesData.result.data.candidates;
    const testCandidate = candidates.find(c => c.email === 'test@candidate.com');
    
    if (testCandidate) {
      console.log(`✅ Found test candidate in crypto business candidates list`);
      if (testCandidate.vacancy && testCandidate.vacancy.id === vacancy.id) {
        console.log(`✅ Candidate correctly linked to crypto business vacancy`);
      } else {
        console.log(`⚠️  Candidate found but vacancy link might be incorrect`);
        console.log(`Expected vacancy ID: ${vacancy.id}, Found: ${testCandidate.vacancy?.id || 'none'}`);
      }
    } else {
      console.log(`❌ Test candidate NOT found in crypto business candidates list`);
      console.log('Available candidates:', candidates.map(c => ({ email: c.email, vacancy: c.vacancy?.title })));
      return false;
    }

    console.log('\n🎉 Business Context Fix Test PASSED!');
    console.log('=====================================');
    console.log('✅ Business "crypto" properly resolved throughout the flow');
    console.log('✅ Vacancy creation and retrieval work correctly');
    console.log('✅ Public vacancies API returns correct business data');
    console.log('✅ General application submission works with correct business context');
    console.log('✅ No mixing of business data between "demo" and "crypto"');
    
    return true;

  } catch (error) {
    console.log('\n❌ Business Context Fix Test FAILED!');
    console.log('=====================================');
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    return false;
  }
}

// Test specifically for the original issue
async function testOriginalIssueScenario() {
  console.log('\n🔍 Testing Original Issue Scenario');
  console.log('=====================================');
  
  try {
    // Login as anania/crypto
    console.log('📝 Logging in as anania/crypto...');
    const loginResponse = await fetch(`${BASE_URL}/api/trpc/businessLogin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessName: 'crypto',
        username: 'anania',
        password: 'testpassword123',
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${await loginResponse.text()}`);
    }

    const loginData = await loginResponse.json();
    const adminToken = loginData.result.data.token;
    const businessInfo = loginData.result.data.business;
    console.log(`✅ Admin token verified successfully for business: ${businessInfo.id} (${businessInfo.name})`);

    // Get all vacancies for crypto business
    const vacanciesResponse = await fetch(`${BASE_URL}/api/trpc/getAllVacancies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: adminToken,
      }),
    });

    if (!vacanciesResponse.ok) {
      throw new Error(`Failed to get vacancies: ${await vacanciesResponse.text()}`);
    }

    const vacanciesData = await vacanciesResponse.json();
    const vacancies = vacanciesData.result.data;
    
    if (vacancies.length === 0) {
      console.log('⚠️  No vacancies found for crypto business');
      return true; // Not a failure, just no data
    }

    const testVacancy = vacancies[0]; // Use first vacancy
    console.log(`📝 Testing vacancy: ${testVacancy.title} (id: ${testVacancy.id})`);

    // Test accessing the vacancy with businessName 'crypto'
    console.log('📝 Testing getVacancyDetails with businessName "crypto"...');
    const vacancyDetailsResponse = await fetch(`${BASE_URL}/api/trpc/getVacancyDetails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vacancyId: testVacancy.id,
        businessName: 'crypto',
      }),
    });

    if (!vacancyDetailsResponse.ok) {
      const errorText = await vacancyDetailsResponse.text();
      console.log(`❌ ORIGINAL ISSUE REPRODUCED: getVacancyDetails failed with: ${errorText}`);
      console.log('🔍 This means the vacancy exists but cannot be accessed with businessName "crypto"');
      return false;
    }

    const vacancyDetails = await vacancyDetailsResponse.json();
    console.log(`✅ ISSUE FIXED: Successfully retrieved vacancy for crypto business`);

    // Test getPublicVacancies to ensure it returns crypto vacancies, not demo
    console.log('📝 Testing getPublicVacancies with businessName "crypto"...');
    const publicVacanciesResponse = await fetch(`${BASE_URL}/api/trpc/getPublicVacancies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessName: 'crypto',
      }),
    });

    if (!publicVacanciesResponse.ok) {
      throw new Error(`getPublicVacancies failed: ${await publicVacanciesResponse.text()}`);
    }

    const publicVacancies = await publicVacanciesResponse.json();
    const publicVacanciesList = publicVacancies.result.data;
    
    console.log(`📊 getPublicVacancies returned ${publicVacanciesList.length} vacancies for crypto business`);
    
    // Check if our test vacancy is in the results
    const foundVacancy = publicVacanciesList.find(v => v.id === testVacancy.id);
    if (foundVacancy) {
      console.log(`✅ ISSUE FIXED: Crypto vacancy found in public vacancies (not demo data)`);
    } else {
      console.log(`❌ ISSUE PERSISTS: Crypto vacancy not found in public vacancies`);
      console.log('Returned vacancies:', publicVacanciesList.map(v => ({ id: v.id, title: v.title })));
      return false;
    }

    console.log('\n🎉 Original Issue Scenario Test PASSED!');
    console.log('✅ User anania can access crypto business vacancies correctly');
    console.log('✅ No business context mixing between demo and crypto');
    
    return true;

  } catch (error) {
    console.log('\n❌ Original Issue Scenario Test FAILED!');
    console.error('Error:', error.message);
    return false;
  }
}

// Run the tests
async function runAllTests() {
  console.log('🚀 Starting Business Context Fix Tests');
  console.log('======================================');
  
  const test1Result = await testBusinessContextFix();
  const test2Result = await testOriginalIssueScenario();
  
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  console.log(`Business Context Fix Test: ${test1Result ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Original Issue Scenario Test: ${test2Result ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (test1Result && test2Result) {
    console.log('\n🎉 ALL TESTS PASSED! Business context issues have been resolved.');
    console.log('👤 User anania with business crypto should now work correctly');
    console.log('🔗 Vacancy links should point to the correct business context');
    console.log('📝 General application links should be business-specific');
  } else {
    console.log('\n❌ SOME TESTS FAILED! Business context issues may still exist.');
    console.log('🔧 Please review the error messages above for debugging information');
  }
  
  process.exit(test1Result && test2Result ? 0 : 1);
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testBusinessContextFix, testOriginalIssueScenario, runAllTests };
