import { describe, expect, it } from 'vitest';
import type { EntityRecord } from '../../store/slices/entitiesSlice';
import { searchAll } from '../search';

describe('searchAll', () => {
  const entities: Record<string, EntityRecord> = {
    'adsb:ae1234': {
      id: 'adsb:ae1234',
      source_id: 'adsb',
      category: 'aircraft',
      name: 'RCH123',
      latitude: 1,
      longitude: 2,
      altitude: 0,
      timestamp: '',
      metadata: { registration: '05-5140', type: 'C17' }
    },
    'iss:25544': {
      id: 'iss:25544',
      source_id: 'iss',
      category: 'satellite',
      name: 'ISS',
      latitude: 3,
      longitude: 4,
      altitude: 0,
      timestamp: ''
    }
  };

  it('matches names, ids and metadata; needs 2+ characters', () => {
    expect(searchAll('rch', entities, {})[0].id).toBe('adsb:ae1234');
    expect(searchAll('c17', entities, {})[0].id).toBe('adsb:ae1234');
    expect(searchAll('25544', entities, {})[0].title).toBe('ISS');
    expect(searchAll('rch nope', entities, {})).toEqual([]);
    expect(searchAll('x', entities, {})).toEqual([]);
  });
});
