const YOUR_IP_ADDRESS = '192.168.1.130'; 

// --- MODIFICATION: Added /api to the end of the URL ---
const BASE_URL = `http://${YOUR_IP_ADDRESS}:3001/api`;

export const API_URLS = {
  REGISTER: `${BASE_URL}/users/register`,
  LOGIN: `${BASE_URL}/users/login`,
  USER_ME: `${BASE_URL}/users/me`,
  TASKS: `${BASE_URL}/tasks`,
  // Family Endpoints
  FAMILY_INVITE: `${BASE_URL}/family/invite`,
  FAMILY_ADD_CHILD: `${BASE_URL}/family/add-child`,
};