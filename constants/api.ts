// This configuration is for local network testing ONLY.
const LOCAL_IP_ADDRESS = '192.168.1.130'; 
const PORT = 3001;

export const BASE_URL = `http://${LOCAL_IP_ADDRESS}:${PORT}`;

console.log(`[API] Connecting to server at: ${BASE_URL}`);

export const API_URLS = {
  BASE_URL: BASE_URL,
  TASKS: `${BASE_URL}/api/tasks`,
  // --- CORRECTION: Changed 'user' to 'users' ---
  USER_ME: `${BASE_URL}/api/users/me`, 
  FAMILY_INVITE: `${BASE_URL}/family/invite`,
  TASK_COMPLETE: (id: string) => `${BASE_URL}/api/tasks/${id}/complete`,
};