import { describe, it, expect } from 'vitest';
import filterReducer, { setGlobeStyle, type FilterState } from '../filterSlice';
import { GLOBE_STYLES } from '../../../components/globeStyles';

describe('filterSlice Reducer', () => {
  const initialState: FilterState = {
    globeStyle: 'tactical'
  };

  it('returns the default initial state', () => {
    expect(filterReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('handles setGlobeStyle for every globe style', () => {
    let state = initialState;
    for (const style of GLOBE_STYLES) {
      state = filterReducer(state, setGlobeStyle(style));
      expect(state.globeStyle).toBe(style);
    }
  });
});
