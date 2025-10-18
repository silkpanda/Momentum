const YOUR_IP_ADDRESS = '192.168.1.130'; 
const BASE_URL = `http://${YOUR_IP_ADDRESS}:3001/api`;

console.log(`[API] Connecting to server at: ${BASE_URL}`);

export const API_URLS = {
  // User
  REGISTER: `${BASE_URL}/users/register`,
  LOGIN: `${BASE_URL}/users/login`,
  USER_ME: `${BASE_URL}/users/me`,
  
  // Tasks
  TASKS: `${BASE_URL}/tasks`,
  TASK_REQUEST_APPROVAL: (id: string) => `${BASE_URL}/tasks/${id}/request-approval`,
  TASK_COMPLETE: (id: string) => `${BASE_URL}/tasks/${id}/complete`,

  // Family
  FAMILY_INVITE: `${BASE_URL}/family/invite`,
  FAMILY_ADD_CHILD: `${BASE_URL}/family/add-child`,
  FAMILY_MEMBERS: `${BASE_URL}/family/members`, // <-- ADDED

  // Rewards
  REWARDS: `${BASE_URL}/rewards`,
  REWARD_BY_ID: (id: string) => `${BASE_URL}/rewards/${id}`,
  REWARD_REDEEM: (id: string) => `${BASE_URL}/rewards/${id}/redeem`,
};