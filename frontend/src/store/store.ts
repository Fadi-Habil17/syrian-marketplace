import { configureStore, createSlice } from '@reduxjs/toolkit';

const ui = createSlice({
  name: 'ui',
  initialState: { navigationOpen: false },
  reducers: {
    closeNavigation: (state) => {
      state.navigationOpen = false;
    },
    toggleNavigation: (state) => {
      state.navigationOpen = !state.navigationOpen;
    },
  },
});

export const { closeNavigation, toggleNavigation } = ui.actions;
export const makeStore = () => configureStore({ reducer: { ui: ui.reducer } });
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
