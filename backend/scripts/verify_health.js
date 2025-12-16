
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5002'; // Default backend port

async function checkHealth() {
    try {
        console.log(`Checking backend health at ${BACKEND_URL}/health/ping...`);
        const response = await axios.get(`${BACKEND_URL}/health/ping`);
        console.log('✅ Backend Health Check Passed:', response.data);
    } catch (error) {
        console.error('❌ Backend Health Check Failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('⚠️ Make sure the backend server is running on port 5002.');
        }
    }
}

checkHealth();
