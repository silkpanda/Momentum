// This configuration is for local network testing ONLY.
const LOCAL_IP_ADDRESS = '192.168.86.33'; 
const PORT = 3001;

const BASE_URL = `http://${LOCAL_IP_ADDRESS}:${PORT}`;

export const API_URLS = {
  TASKS: `${BASE_URL}/api/tasks`,
};