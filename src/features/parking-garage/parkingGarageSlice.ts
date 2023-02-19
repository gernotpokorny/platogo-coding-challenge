import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// types
import { RootState } from '../../app/store';
import { SetNonNullable } from 'type-fest';

const PARKING_CAPACITY = 54;

interface Ticket {
	barCode: string;
	dateOfIssuance: number;
}

export interface ParkingSpace {
	spaceNumber: number;
	ticket: Ticket | null;
}

export interface ParkingGarageState {
	parkingSpaces: ParkingSpace[];
	status: 'idle' | 'loading' | 'failed';
}

const initialState: ParkingGarageState = {
	parkingSpaces: [...Array(PARKING_CAPACITY)].map((_, index: number) => ({
		spaceNumber: index,
		ticket: null,
	})),
	status: 'idle',
};

export const ParkingGarageSlice = createSlice({
	name: 'ParkingGarage',
	initialState,
	// The `reducers` field lets us define reducers and generate associated actions
	reducers: {
		// Use the PayloadAction type to declare the contents of `action.payload`
		park: (state, action: PayloadAction<SetNonNullable<ParkingSpace, 'ticket'>>) => {
			// Redux Toolkit allows us to write "mutating" logic in reducers. It
			// doesn't actually mutate the state because it uses the Immer library,
			// which detects changes to a "draft state" and produces a brand new
			// immutable state based off those changes
			const { spaceNumber, ticket } = action.payload;
			state.parkingSpaces[spaceNumber].ticket = ticket;
		},
		leave: (state, action: PayloadAction<number>) => {
			state.parkingSpaces[action.payload].ticket = null;
		},
	},
});

export const { park, leave } = ParkingGarageSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.ParkingGarage.value)`
export const selectParkingSpaces = (state: RootState) => state.parkingGarage.parkingSpaces;

export default ParkingGarageSlice.reducer;
