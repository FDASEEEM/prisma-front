// Script para simular lo que hace el adminPanelPage
const axios = require('axios');

async function testDashboard() {
  try {
    // Login
    const loginRes = await axios.post('http://localhost:3010/api/auth/login', {
      email: 'devmode@prisma.local',
      password: 'devmode1',
    });
    const token = loginRes.data.access_token;
    console.log('Login OK, token length:', token.length);

    // Get dashboard
    const dashboardRes = await axios.get('http://localhost:3010/api/admin/dashboard/summary', {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Dashboard response:');
    console.log(JSON.stringify(dashboardRes.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testDashboard();
