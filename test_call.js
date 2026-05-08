import axios from 'axios';

const testCall = async () => {
  const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI3MjIyMjEiLCJjciI6ZmFsc2UsImlzcyI6Imh0dHBzOi8vY2xvdWRwaG9uZS50YXRhdGVsZXNlcnZpY2VzLmNvbS90b2tlbi9nZW5lcmF0ZSIsImlhdCI6MTc3ODIzODU5OCwiZXhwIjoyMDc4MjM4NTk4LCJuYmYiOjE3NzgyMzg1OTgsImp0aSI6IlZxSmhGY1hIVHRWbnVza3gifQ.2Ai2kzhb1O3ObQhc4TIZkmhBI7HSdY0pZxYAY6DWRZ0'; // From user's previous message
  try {
    const res = await axios.post('https://api-smartflo.tatateleservices.com/v1/click_to_call', {
      agent_number: '101',
      destination_number: '9999999999',
      caller_id: '918065909570',
      async: 1
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log(res.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
};

testCall();
