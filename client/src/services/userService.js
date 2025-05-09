import axiosInstance from '../api/axios';

// Add a new user
export const addUser = async (userData) => {
  try {
    const response = await axiosInstance.post('/users/add', userData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

// Get all users
export const getAllUsers = async () => {
  try {
    const response = await axiosInstance.get('/users');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

// Get a user by ID
export const getUserById = async (id) => {
  try {
    const response = await axiosInstance.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

// Update a user
export const updateUser = async (id, userData) => {
  try {
    const response = await axiosInstance.put(`/users/${id}`, userData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

// Delete a user
export const deleteUser = async (id) => {
  try {
    const response = await axiosInstance.delete(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};