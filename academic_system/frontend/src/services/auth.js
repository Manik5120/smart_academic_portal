import { api, clearAuthSession } from '../lib/api';

export const authService = {
  login: async (email, password) => {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return data;
  },

  register: async (userData) => {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return data;
  },

  logout: async () => {
    clearAuthSession();
  },

  getCurrentUser: async () => {
    return await api('/auth/me');
  },

  changePassword: async (currentPassword, newPassword) => {
    return await api('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  },

  forgotPassword: async (email) => {
    const data = await api('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return data;
  },

  verifyOtp: async (email, otp) => {
    const data = await api('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
    return data;
  },

  resetPassword: async (email, otp, newPassword) => {
    const data = await api('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, new_password: newPassword }),
    });
    return data;
  },

  sendRegistrationOtp: async (email) => {
    const data = await api('/auth/registration/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return data;
  },

  verifyRegistrationOtp: async (email, otp) => {
    const data = await api('/auth/registration/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
    return data;
  },
};
