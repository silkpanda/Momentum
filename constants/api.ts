// constants/api.ts

// The app, running through the tunnel, will resolve localhost
// to the machine running the Expo server.
const API_BASE_URL = 'http://localhost:3001/api';

export const API_URLS = {
  TASKS: `${API_BASE_URL}/tasks`,
};