import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: true,
    sidebarCollapsed: false,
    theme: 'dark',
  },
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    toggleSidebarCollapse: (state) => { state.sidebarCollapsed = !state.sidebarCollapsed; },
    setSidebarOpen: (state, action) => { state.sidebarOpen = action.payload; },
  },
});

export const { toggleSidebar, toggleSidebarCollapse, setSidebarOpen } = uiSlice.actions;
export default uiSlice.reducer;
