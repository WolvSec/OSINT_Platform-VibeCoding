import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { DEFAULT_GLOBE_STYLE, type GlobeStyle } from '../../components/globeStyles';

export interface FilterState {
  /** Base look of the globe itself (set from runtime config). */
  globeStyle: GlobeStyle;
}

const initialState: FilterState = {
  globeStyle: DEFAULT_GLOBE_STYLE
};

export const filterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    setGlobeStyle: (state, action: PayloadAction<GlobeStyle>) => {
      state.globeStyle = action.payload;
    }
  }
});

export const { setGlobeStyle } = filterSlice.actions;
export default filterSlice.reducer;
