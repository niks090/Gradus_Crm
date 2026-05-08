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

    const response = await axios.post(`${BASE_URL}/click_to_call`, {
      agent_number: cleanAgent,
      destination_number: cleanDest,
      caller_id: cleanDid,
      async: 1
    }, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
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
