const axios = require('axios');

const sendGpsData = async () => {
    const gpsData = {
        deviceId: 'your-device-id', // Replace with actual device ID
        latitude: -1.950880,
        longitude: 30.058850,
        speed: 60, // in km/h
        timestamp: new Date().toISOString()
    };

    try {
        const response = await axios.post('http://localhost:5000/api/gps-data', gpsData);
        console.log('GPS data sent successfully:', response.data);
    } catch (error) {
        console.error('Error sending GPS data:', error.response?.data || error.message);
    }
};

// Simulate sending GPS data every 10 seconds
setInterval(sendGpsData, 10000);
