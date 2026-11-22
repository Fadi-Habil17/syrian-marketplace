import { configureStore, createSlice } from '@reduxjs/toolkit';

const ui = createSlice({
  name: 'ui',
  initialState: { navigationOpen: false },
  reducers: {
    closeNavigation: (state) => {
      state.navigationOpen = false;
    },
  },
});

// Create per mounted provider/request; no shared server singleton or token persistence.
export const makeStore = () => configureStore({ reducer: { ui: ui.reducer } });
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
