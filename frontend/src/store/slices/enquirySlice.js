import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchEnquiries = createAsyncThunk('enquiry/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const res = await api.get('/enquiries', { params });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const fetchDashboardStats = createAsyncThunk('enquiry/dashboardStats', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/enquiries/dashboard');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const createEnquiry = createAsyncThunk('enquiry/create', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/enquiries', data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const updateEnquiry = createAsyncThunk('enquiry/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/enquiries/${id}`, data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const deleteEnquiry = createAsyncThunk('enquiry/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/enquiries/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

const enquirySlice = createSlice({
  name: 'enquiry',
  initialState: {
    enquiries: [],
    pagination: null,
    stats: null,
    loading: false,
    error: null,
    selectedEnquiry: null,
  },
  reducers: {
    addEnquiryRealtime: (state, action) => {
      state.enquiries.unshift(action.payload);
    },
    updateEnquiryRealtime: (state, action) => {
      const idx = state.enquiries.findIndex(e => e._id === action.payload._id);
      if (idx !== -1) state.enquiries[idx] = action.payload;
    },
    setSelectedEnquiry: (state, action) => {
      state.selectedEnquiry = action.payload;
    },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEnquiries.pending, (state) => { state.loading = true; })
      .addCase(fetchEnquiries.fulfilled, (state, action) => {
        state.loading = false;
        state.enquiries = action.payload.enquiries;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchEnquiries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.stats = action.payload.stats;
      })
      .addCase(createEnquiry.fulfilled, (state, action) => {
        state.enquiries.unshift(action.payload.enquiry);
      })
      .addCase(updateEnquiry.fulfilled, (state, action) => {
        const idx = state.enquiries.findIndex(e => e._id === action.payload.enquiry._id);
        if (idx !== -1) state.enquiries[idx] = action.payload.enquiry;
      })
      .addCase(deleteEnquiry.fulfilled, (state, action) => {
        state.enquiries = state.enquiries.filter(e => e._id !== action.payload);
      });
  },
});

export const { addEnquiryRealtime, updateEnquiryRealtime, setSelectedEnquiry, clearError } = enquirySlice.actions;
export default enquirySlice.reducer;
