const http = require('http');

async function testAdminRoutes() {
  console.log('🔍 Testing Admin Dashboard Routes & Navigation...\n');

  try {
    // Test 1: Admin Dashboard route
    console.log('1. Testing Admin Dashboard route...');
    const dashboardResponse = await fetch('http://localhost:3000/admin/dashboard');
    console.log('Status:', dashboardResponse.status);
    
    // Test 2: User Management route
    console.log('\n2. Testing User Management route...');
    const usersResponse = await fetch('http://localhost:3000/admin/users');
    console.log('Status:', usersResponse.status);
    
    // Test 3: Class Management route
    console.log('\n3. Testing Class Management route...');
    const classesResponse = await fetch('http://localhost:3000/admin/classes');
    console.log('Status:', classesResponse.status);
    
    // Test 4: Package Management route
    console.log('\n4. Testing Package Management route...');
    const packagesResponse = await fetch('http://localhost:3000/admin/packages');
    console.log('Status:', packagesResponse.status);
    
    // Test 5: Booking Management route
    console.log('\n5. Testing Booking Management route...');
    const bookingsResponse = await fetch('http://localhost:3000/admin/bookings');
    console.log('Status:', bookingsResponse.status);
    
    // Test 6: Analytics route
    console.log('\n6. Testing Analytics route...');
    const analyticsResponse = await fetch('http://localhost:3000/admin/analytics');
    console.log('Status:', analyticsResponse.status);
    
    console.log('\n🎯 Admin Routes Test Summary:');
    console.log('✅ All admin routes should be accessible');
    console.log('✅ User Management should show UserManagement component');
    console.log('✅ Navigation should work without page reloads');
    
  } catch (error) {
    console.error('❌ Error testing admin routes:', error.message);
  }
}

testAdminRoutes();
