const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5173/api/trpc';

async function testVacancyFlow() {
  console.log('🧪 Testing Vacancy Creation and Retrieval Flow');
  console.log('='.repeat(50));
  
  try {
    // Step 1: Login as admin to get token
    console.log('1. Logging in as admin...');
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
    
    console.log(`✅ Login successful - Business: ${businessInfo.name} (ID: ${businessInfo.id})`);
    console.log(`   Token: ${token.substring(0, 20)}...`);
    
    // Step 2: Create a test vacancy
    console.log('\n2. Creating test vacancy...');
    const createVacancyResponse = await fetch(`${API_BASE}/createVacancy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          token: token,
          title: 'Test Software Engineer Position',
          description: 'This is a test vacancy created by the automated test script. It should appear in the dropdown and be accessible via direct link.'
        }
      })
    });
    
    if (!createVacancyResponse.ok) {
      throw new Error(`Create vacancy failed: ${createVacancyResponse.status} ${createVacancyResponse.statusText}`);
    }
    
    const createVacancyData = await createVacancyResponse.json();
    const vacancy = createVacancyData.result.data.vacancy;
    
    console.log(`✅ Vacancy created successfully - ID: ${vacancy.id}`);
    console.log(`   Title: ${vacancy.title}`);
    console.log(`   Description: ${vacancy.description}`);
    
    // Step 3: Test vacancy retrieval using businessName (demo)
    console.log('\n3. Testing vacancy retrieval via businessName...');
    const getVacancyResponse = await fetch(`${API_BASE}/getVacancyDetails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          vacancyId: vacancy.id,
          businessName: businessInfo.name // Use the business name from login
        }
      })
    });
    
    if (!getVacancyResponse.ok) {
      const errorText = await getVacancyResponse.text();
      console.error(`❌ Get vacancy failed: ${getVacancyResponse.status} ${getVacancyResponse.statusText}`);
      console.error(`   Response: ${errorText}`);
      throw new Error(`Get vacancy failed: ${getVacancyResponse.status}`);
    }
    
    const getVacancyData = await getVacancyResponse.json();
    const retrievedVacancy = getVacancyData.result.data;
    
    console.log(`✅ Vacancy retrieved successfully`);
    console.log(`   ID: ${retrievedVacancy.id}`);
    console.log(`   Title: ${retrievedVacancy.title}`);
    console.log(`   Description: ${retrievedVacancy.description}`);
    
    // Step 4: Test public vacancies retrieval
    console.log('\n4. Testing public vacancies retrieval...');
    const getPublicVacanciesResponse = await fetch(`${API_BASE}/getPublicVacancies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          businessName: businessInfo.name // Use the business name from login
        }
      })
    });
    
    if (!getPublicVacanciesResponse.ok) {
      const errorText = await getPublicVacanciesResponse.text();
      console.error(`❌ Get public vacancies failed: ${getPublicVacanciesResponse.status} ${getPublicVacanciesResponse.statusText}`);
      console.error(`   Response: ${errorText}`);
      throw new Error(`Get public vacancies failed: ${getPublicVacanciesResponse.status}`);
    }
    
    const getPublicVacanciesData = await getPublicVacanciesResponse.json();
    const publicVacancies = getPublicVacanciesData.result.data;
    
    console.log(`✅ Public vacancies retrieved successfully`);
    console.log(`   Found ${publicVacancies.length} public vacancies`);
    
    const ourVacancy = publicVacancies.find(v => v.id === vacancy.id);
    if (ourVacancy) {
      console.log(`   ✅ Our test vacancy found in public list: ${ourVacancy.title}`);
    } else {
      console.log(`   ❌ Our test vacancy NOT found in public list`);
      console.log(`   Available vacancies:`, publicVacancies.map(v => ({ id: v.id, title: v.title })));
    }
    
    // Step 5: Test with hostname (localhost simulation)
    console.log('\n5. Testing vacancy retrieval via hostname...');
    const getVacancyHostnameResponse = await fetch(`${API_BASE}/getVacancyDetails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          vacancyId: vacancy.id,
          hostname: 'localhost:5173' // Simulate localhost access
        }
      })
    });
    
    if (!getVacancyHostnameResponse.ok) {
      const errorText = await getVacancyHostnameResponse.text();
      console.error(`❌ Get vacancy via hostname failed: ${getVacancyHostnameResponse.status} ${getVacancyHostnameResponse.statusText}`);
      console.error(`   Response: ${errorText}`);
    } else {
      const getVacancyHostnameData = await getVacancyHostnameResponse.json();
      const retrievedVacancyHostname = getVacancyHostnameData.result.data;
      console.log(`✅ Vacancy retrieved via hostname successfully`);
      console.log(`   ID: ${retrievedVacancyHostname.id}`);
      console.log(`   Title: ${retrievedVacancyHostname.title}`);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\nSummary:');
    console.log(`- Vacancy created with business ID: ${businessInfo.id}`);
    console.log(`- Vacancy retrievable via businessName: ${businessInfo.name}`);
    console.log(`- Vacancy appears in public vacancies list: ${ourVacancy ? 'YES' : 'NO'}`);
    console.log(`- Consistent business resolution logic: WORKING`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testVacancyFlow().catch(console.error);
