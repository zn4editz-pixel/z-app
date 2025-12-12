const axios = require('axios');

// Create axios instance for testing
const axiosInstance = axios.create({
    baseURL: 'http://localhost:5001/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

module.exports = { axiosInstance };