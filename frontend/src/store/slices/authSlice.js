import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const user = JSON.parse(localStorage.getItem('uems_user') || 'null');
const token = localStorage.getItem('uems_token');

// Thunks
export const loginOrg = createAsyncThunk('auth/loginOrg', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: 'Login failed' });
  }
});

export const loginAdmin = createAsyncThunk('auth/loginAdmin', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/admin/login', data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: 'Login failed' });
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: user,
    token: token,
    isAuthenticated: !!token && !!user,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('uems_token');
      localStorage.removeItem('uems_user');
      localStorage.removeItem('uems_refresh_token');
    },
    updateUser: (state, action) => {
      // Deep-merge organization sub-object if present
      if (action.payload.organization && state.user?.organization) {
        state.user = {
          ...state.user,
          organization: { ...state.user.organization, ...action.payload.organization },
        };
      } else {
        state.user = { ...state.user, ...action.payload };
      }
      localStorage.setItem('uems_user', JSON.stringify(state.user));
    },
    setToken: (state, action) => {
      state.token = action.payload;
      localStorage.setItem('uems_token', action.payload);
    },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    const handlePending = (state) => { state.loading = true; state.error = null; };
    const handleFulfilled = (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user || action.payload.organization;
      localStorage.setItem('uems_token', action.payload.token);
      localStorage.setItem('uems_user', JSON.stringify(state.user));
      if (action.payload.refreshToken) {
        localStorage.setItem('uems_refresh_token', action.payload.refreshToken);
      }
    };
    const handleRejected = (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || 'An error occurred';
    };

    builder
      .addCase(loginOrg.pending, handlePending)
      .addCase(loginOrg.fulfilled, handleFulfilled)
      .addCase(loginOrg.rejected, handleRejected)
      .addCase(loginAdmin.pending, handlePending)
      .addCase(loginAdmin.fulfilled, handleFulfilled)
      .addCase(loginAdmin.rejected, handleRejected);
  },
});

export const { logout, updateUser, setToken, clearError } = authSlice.actions;
export default authSlice.reducer;
