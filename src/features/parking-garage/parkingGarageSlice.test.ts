import parkingGarageReducer, { initialState } from './parkingGarageSlice';

describe('parkingGarage reducer', () => {
	it('should handle initial state', () => {
		expect(parkingGarageReducer(undefined, { type: 'unknown' })).toEqual(initialState);
	});
});