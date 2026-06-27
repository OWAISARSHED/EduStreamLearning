const BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('edustream_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${endpoint}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}

export const auth = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/auth/me'),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token, password) => request(`/auth/reset-password/${token}`, { method: 'POST', body: JSON.stringify({ password }) }),
};

export const resources = {
  list: (params) => request(`/resources?${new URLSearchParams(params)}`),
  get: (id) => request(`/resources/${id}`),
  create: (data) => request('/resources', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/resources/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/resources/${id}`, { method: 'DELETE' }),
  logAccess: (id, action) => request(`/resources/${id}/access`, { method: 'POST', body: JSON.stringify({ action }) }),
  accessLogs: (params) => request(`/resources/access-logs?${new URLSearchParams(params)}`),
  versions: (id) => request(`/resources/${id}/versions`),
};

export const forum = {
  threads: (params) => request(`/forum/threads?${new URLSearchParams(params)}`),
  thread: (id) => request(`/forum/threads/${id}`),
  createThread: (data) => request('/forum/threads', { method: 'POST', body: JSON.stringify(data) }),
  updateThread: (id, data) => request(`/forum/threads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteThread: (id) => request(`/forum/threads/${id}`, { method: 'DELETE' }),
  verifyThread: (id) => request(`/forum/threads/${id}/verify`, { method: 'POST' }),
  postReply: (id, body) => request(`/forum/threads/${id}/replies`, { method: 'POST', body: JSON.stringify({ body }) }),
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('edustream_token');
    return fetch('/api/forum/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(r => r.json());
  },
};

export const ai = {
  translate: (text, target_language) => request('/ai/translate', { method: 'POST', body: JSON.stringify({ text, target_language }) }),
  summarize: (text) => request('/ai/summarize', { method: 'POST', body: JSON.stringify({ text }) }),
  suggestTags: (resource_id) => request('/ai/suggest-tags', { method: 'POST', body: JSON.stringify({ resource_id }) }),
  approveTags: (resource_id) => request('/ai/approve-tags', { method: 'POST', body: JSON.stringify({ resource_id }) }),
  summaries: () => request('/ai/summaries'),
  analytics: () => request('/ai/analytics'),
  chat: (message, history) => request('/ai/chat', { method: 'POST', body: JSON.stringify({ message, history }) }),
};

export const users = {
  list: (params) => request(`/users?${new URLSearchParams(params)}`),
  update: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  create: (data) => request('/users/create', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => request(`/users/${id}`, { method: 'DELETE' }),
};

export const milestones = {
  list: (params) => request(`/milestones?${new URLSearchParams(params)}`),
  create: (data) => request('/milestones', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/milestones/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const courses = {
  create: (data) => request('/courses', { method: 'POST', body: JSON.stringify(data) }),
  list: (params) => request(`/courses?${new URLSearchParams(params)}`),
  get: (id) => request(`/courses/${id}`),
  update: (id, data) => request(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/courses/${id}`, { method: 'DELETE' }),
  pending: () => request('/courses/pending'),
  submit: (id) => request(`/courses/${id}/submit`, { method: 'POST' }),
  approve: (id) => request(`/courses/${id}/approve`, { method: 'POST' }),
  reject: (id, reason) => request(`/courses/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  enroll: (id) => request(`/courses/${id}/enroll`, { method: 'POST' }),
  students: (id) => request(`/courses/${id}/students`),
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('edustream_token');
    return fetch('/api/courses/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(r => r.json());
  },
  addResource: (courseId, data) => request(`/courses/${courseId}/resources`, { method: 'POST', body: JSON.stringify(data) }),
  deleteResource: (resourceId) => request(`/courses/resources/${resourceId}`, { method: 'DELETE' }),
  addAssignment: (courseId, data) => request(`/courses/${courseId}/assignments`, { method: 'POST', body: JSON.stringify(data) }),
  updateAssignment: (id, data) => request(`/courses/assignments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAssignment: (id) => request(`/courses/assignments/${id}`, { method: 'DELETE' }),
  gradeSubmission: (id, data) => request(`/courses/assignments/${id}/grade`, { method: 'POST', body: JSON.stringify(data) }),
  addQuiz: (courseId, data) => request(`/courses/${courseId}/quizzes`, { method: 'POST', body: JSON.stringify(data) }),
  updateQuiz: (id, data) => request(`/courses/quizzes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteQuiz: (id) => request(`/courses/quizzes/${id}`, { method: 'DELETE' }),
  submitQuiz: (id, answers) => request(`/courses/quizzes/${id}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),
};

export const notifications = {
  list: () => request('/notifications'),
  markRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => request('/notifications/read-all', { method: 'PUT' }),
};
