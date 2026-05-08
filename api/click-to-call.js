import axios from 'axios';

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle OPTIONS method (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { agent_number, destination_number, caller_id } = req.body;
  const token = process.env.VITE_SMARTFLO_API_TOKEN || process.env.SMARTFLO_API_TOKEN;

  if (!token) {
    return res.status(500).json({ message: 'SmartFlo API Token is missing on the server.' });
  }

  try {
    const response = await axios.post(
      'https://api-smartflo.tatateleservices.com/v1/click_to_call',
      {
        agent_number,
        destination_number,
        caller_id,
        async: 1
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Telephony Error:', error.response?.data || error.message);
    const errorMsg = error.response?.data?.message || error.message;
    return res.status(error.response?.status || 500).json({ message: errorMsg, details: error.response?.data });
  }
}
