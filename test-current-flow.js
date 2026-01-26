const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5173/api/trpc';

async function testCurrentVacancyFlow() {
  console.log('🧪 Testing Current Vacancy Flow - Detailed Business Context Analysis');
  console.log('='.repeat(70));
  
  try {
    // Step 1: Login as admin to get token and business context
    console.log('1. Admin Login Test');
    console.log('-'.repeat(30));
    const loginResponse = await fetch(`${API_BASE}/adminLogin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          username: 'admin',
          password: 'admin123'
        }
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.result.data.token;
    const businessInfo = loginData.result.data.business;
    
    console.log(`✅ Admin login successful`);
    console.log(`   Business Name: ${businessInfo.name}`);
    console.log(`   Business ID: ${businessInfo.id}`);
    console.log(`   Display Name: ${businessInfo.displayName}`);
    console.log(`   Email: ${businessInfo.email}`);
    
    // Step 2: Create a test vacancy
    console.log('\n2. Vacancy Creation Test');
    console.log('-'.repeat(30));
    const createVacancyResponse = await fetch(`${API_BASE}/createVacancy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          token: token,
          title: 'Test Engineering Position',
          description: 'A test vacancy to verify business context consistency between admin creation and candidate retrieval.'
        }
      })
    });
    
    if (!createVacancyResponse.ok) {
      const errorText = await createVacancyResponse.text();
      throw new Error(`Create vacancy failed: ${createVacancyResponse.status} - ${errorText}`);
    }
    
    const createVacancyData = await createVacancyResponse.json();
    const vacancy = createVacancyData.result.data.vacancy;
    
    console.log(`✅ Vacancy created successfully`);
    console.log(`   Vacancy ID: ${vacancy.id}`);
    console.log(`   Title: ${vacancy.title}`);
    console.log(`   Created under Business ID: ${businessInfo.id} (from admin token)`);
    
    // Step 3: Test candidate retrieval using businessName parameter
    console.log('\n3. Candidate Retrieval Test (businessName parameter)');
    console.log('-'.repeat(50));
    console.log(`   Testing with businessName: "${businessInfo.name}"`);
    
    const getVacancyResponse = await fetch(`${API_BASE}/getVacancyDetails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          vacancyId: vacancy.id,
          businessName: businessInfo.name
        }
      })
    });
    
    console.log(`   Response status: ${getVacancyResponse.status}`);
    
    if (!getVacancyResponse.ok) {
      const errorText = await getVacancyResponse.text();
      console.error(`❌ Vacancy retrieval FAILED`);
      console.error(`   Status: ${getVacancyResponse.status}`);
      console.error(`   Error: ${errorText}`);
      
      // Try to parse the error for more details
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error && errorData.error.message) {
          console.error(`   Detailed error: ${errorData.error.message}`);
        }
      } catch (parseError) {
        // Error text is not JSON, that's fine
      }
      
      console.log('\n🔍 DIAGNOSIS: Business context mismatch detected!');
      console.log(`   - Vacancy was created under business ID: ${businessInfo.id}`);
      console.log(`   - Candidate lookup is trying to resolve business: "${businessInfo.name}"`);
      console.log(`   - The getBusinessContext function may be resolving to a different business ID`);
      
    } else {
      const getVacancyData = await getVacancyResponse.json();
      const retrievedVacancy = getVacancyData.result.data;
      
      console.log(`✅ Vacancy retrieved successfully`);
      console.log(`   Retrieved ID: ${retrievedVacancy.id}`);
      console.log(`   Retrieved Title: ${retrievedVacancy.title}`);
      console.log(`   Business context resolution: WORKING`);
    }
    
    // Step 4: Test public vacancies dropdown
    console.log('\n4. Public Vacancies Dropdown Test');
    console.log('-'.repeat(40));
    
    const getPublicVacanciesResponse = await fetch(`${API_BASE}/getPublicVacancies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          businessName: businessInfo.name
        }
      })
    });
    
    console.log(`   Response status: ${getPublicVacanciesResponse.status}`);
    
    if (!getPublicVacanciesResponse.ok) {
      const errorText = await getPublicVacanciesResponse.text();
      console.error(`❌ Public vacancies retrieval FAILED`);
      console.error(`   Status: ${getPublicVacanciesResponse.status}`);
      console.error(`   Error: ${errorText}`);
    } else {
      const getPublicVacanciesData = await getPublicVacanciesResponse.json();
      const publicVacancies = getPublicVacanciesData.result.data;
      
      console.log(`✅ Public vacancies retrieved: ${publicVacancies.length} total`);
      
      const ourVacancy = publicVacancies.find(v => v.id === vacancy.id);
      if (ourVacancy) {
        console.log(`   ✅ Our test vacancy FOUND in dropdown: "${ourVacancy.title}"`);
      } else {
        console.log(`   ❌ Our test vacancy NOT FOUND in dropdown`);
        console.log(`   Available vacancies in dropdown:`);
        publicVacancies.forEach((v, index) => {
          console.log(`     ${index + 1}. ID: ${v.id}, Title: "${v.title}"`);
        });
      }
    }
    
    // Step 5: Test with different business context methods
    console.log('\n5. Alternative Business Context Tests');
    console.log('-'.repeat(45));
    
    // Test with hostname
    console.log('   5a. Testing with hostname parameter...');
    const hostnameTest = await fetch(`${API_BASE}/getVacancyDetails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          vacancyId: vacancy.id,
          hostname: 'localhost:5173'
        }
      })
    });
    
    if (hostnameTest.ok) {
      console.log(`   ✅ Hostname resolution: WORKING`);
    } else {
      console.log(`   ❌ Hostname resolution: FAILED (${hostnameTest.status})`);
    }
    
    // Test with direct businessId
    console.log('   5b. Testing with direct businessId parameter...');
    const businessIdTest = await fetch(`${API_BASE}/getVacancyDetails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          vacancyId: vacancy.id,
          businessId: businessInfo.id
        }
      })
    });
    
    if (businessIdTest.ok) {
      console.log(`   ✅ Direct businessId resolution: WORKING`);
    } else {
      console.log(`   ❌ Direct businessId resolution: FAILED (${businessIdTest.status})`);
    }
    
    console.log('\n6. Summary & Recommendations');
    console.log('-'.repeat(35));
    console.log(`Business created under ID: ${businessInfo.id} (name: "${businessInfo.name}")`);
    console.log(`Vacancy ID: ${vacancy.id}`);
    
    if (getVacancyResponse.ok) {
      console.log('✅ ISSUE RESOLVED: Vacancy can be retrieved via businessName');
      console.log('✅ Business context resolution is now consistent');
    } else {
      console.log('❌ ISSUE PERSISTS: Business context mismatch still occurring');
      console.log('🔧 Next steps:');
      console.log('   - Check getBusinessContext function in candidate.ts');
      console.log('   - Verify development environment business resolution logic');
      console.log('   - Ensure admin and candidate procedures use same business lookup');
    }
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the comprehensive test
testCurrentVacancyFlow().catch(console.error);
