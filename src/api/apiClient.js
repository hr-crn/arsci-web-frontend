// src/api/apiClient.js
const API_BASE_URL = "https://7m194xj0ba.execute-api.ap-southeast-1.amazonaws.com/dev";

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }), // attach token if exists
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // If unauthorized/forbidden, clear session and redirect to sign-in
    if (response.status === 401 || response.status === 403) {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } catch (e) {}
      // Avoid infinite redirect loops when already on auth pages
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
        window.location.replace('/auth/sign-in');
      }
    }
    const errorText = await response.text();
    throw new Error(errorText || `API request failed with status ${response.status}`);
  }

  return response.json();
}

export default apiRequest;
export { API_BASE_URL };
