import axios from 'axios';

const API_TOKEN = import.meta.env.VITE_SMARTFLO_API_TOKEN;
const BASE_URL = 'https://api-smartflo.tatateleservices.com/v1';

/**
 * Initiates a Click-to-Call request via Tata SmartFlo
 * @param {string} agentNumber - The BDM's agent number/extension
 * @param {string} destinationNumber - The customer's mobile number
 * @param {string} did - The caller ID (DID) to be used
 */
export const initiateCall = async (agentNumber, destinationNumber, did) => {
  if (!API_TOKEN) {
    throw new Error('SmartFlo API Token is missing. Please check your .env file.');
  }

  if (!agentNumber || !did) {
    throw new Error('Your Agent Number or DID is not configured in your profile.');
  }

  try {
    // Clean numbers (remove spaces, plus, etc.)
    const cleanDest = destinationNumber.replace(/\D/g, '');
    const cleanAgent = agentNumber.replace(/\D/g, '');
    const cleanDid = did.replace(/\D/g, '');

    // Note: If running locally in Vite without proxy, /api/click-to-call will 404 unless we use Vite proxy
    // But since this is primarily for Vercel deployment, we use the absolute path.
    // For local testing, we can use the full Vercel URL or set up Vite proxy.
    const apiUrl = import.meta.env.DEV ? 'http://localhost:5174/api/click-to-call' : '/api/click-to-call';

    const response = await axios.post(apiUrl, {
      agent_number: cleanAgent,
      destination_number: cleanDest,
      caller_id: cleanDid
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Telephony Error:', error.response?.data || error.message);
    const errorMsg = error.response?.data?.message || error.message;
    throw new Error(`Call Failed: ${errorMsg}`);
  }
};

export const telephonyService = {
  initiateCall
};
