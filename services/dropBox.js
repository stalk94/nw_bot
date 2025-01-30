require('dotenv').config();
const axios = require('axios');
const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=xrdzuatekl74xl5&response_type=code&redirect_uri=http://localhost:3000`;


const redirectUri = 'http://localhost:3000';
const clientId = 'xrdzuatekl74xl5';
const clientSecret = 'g92pahusjum52mu';
let requesAcessToken;


const refreshAccessToken = async(refreshToken)=> {
    try {
        const response = await axios.post('https://api.dropboxapi.com/oauth2/token', null, {
            params: {
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: clientId,
                client_secret: clientSecret
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        // Новый access token
        const newAccessToken = response.data.access_token;

        console.log('New Access Token:', newAccessToken);
        return newAccessToken;
    } 
    catch (error) {
        console.error('Error refreshing access token:', error);
        return null;
    }
}

// Пример функции, которая будет вызывать API Dropbox с новым access token
const makeApiRequest = async(accessToken)=> {
    try {
        const response = await axios.post(
            'https://api.dropboxapi.com/2/files/list_folder', // Пример запроса
            JSON.stringify({ path: '' }), // Параметры запроса
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log('API Response:', response.data);
    } 
    catch(error) {
        if (error.response && error.response.status === 401) {
            console.log('Access token expired, refreshing...');

            const newAccessToken = await refreshAccessToken();
            if(newAccessToken) {
                await makeApiRequest(newAccessToken);
            }
        } else {
            console.error('API request error:', error);
        }
    }
}

const getTokens = async(authorizationCode)=> {
    try {
        const response = await axios.post('https://api.dropboxapi.com/oauth2/token', null, {
            params: {
                code: authorizationCode,
                grant_type: 'authorization_code',
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        console.log('Access Token:', response.data.access_token);
        console.log('Refresh Token:', response.data.refresh_token);

    } catch (error) {
        console.error('Error getting tokens:', error.response?.data || error);
    }
}
getTokens('eXh2K2dhbMAAAAAAAAAAreTPh4aOy0-4xYyjFEVh_eI')

//makeApiRequest(initialAccessToken);