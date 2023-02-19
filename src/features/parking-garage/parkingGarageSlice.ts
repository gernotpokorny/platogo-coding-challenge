import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// types
import { RootState, AppThunk } from '../../app/store';
import { SetNonNullable } from 'type-fest';

// utils
import { generateBarCode, calculateTicketPrice } from './ParkingGarage.utils';

const PARKING_CAPACITY = 54;

type BarCode = string;

interface Ticket {
	barCode: BarCode;
	dateOfIssuance: number;
}

export interface ParkingSpace {
	spaceNumber: number;
	ticket: Ticket | null;
}

export interface ParkingGarageState {
	parkingSpaces: ParkingSpace[];
	currentlyIssuedTickets: Record<BarCode, Ticket>;
	status: 'idle' | 'loading' | 'failed';
}

export const initialState: ParkingGarageState = {
	parkingSpaces: [...Array(PARKING_CAPACITY)].map((_, index: number) => ({
		spaceNumber: index,
		ticket: null,
	})),
	currentlyIssuedTickets: {},
	status: 'idle',
};

export const ParkingGarageSlice = createSlice({
	name: 'parkingGarage',
	initialState,
	// The `reducers` field lets us define reducers and generate associated actions
	reducers: {
		// Use the PayloadAction type to declare the contents of `action.payload`
		occupyParkingBox: (state, action: PayloadAction<SetNonNullable<ParkingSpace, 'ticket'>>) => {
			// Redux Toolkit allows us to write "mutating" logic in reducers. It
			// doesn't actually mutate the state because it uses the Immer library,
			// which detects changes to a "draft state" and produces a brand new
			// immutable state based off those changes
			state.parkingSpaces[action.payload.spaceNumber].ticket = action.payload.ticket;
		},
		leaveParkingBox: (state, action: PayloadAction<number>) => {
			state.parkingSpaces[action.payload].ticket = null;
		},
		issueNewTicket: (state, action: PayloadAction<Ticket>) => {
			state.currentlyIssuedTickets[action.payload.barCode] = action.payload;
		},
		payTicket: (state, action: PayloadAction<Ticket>) => {
			delete state.currentlyIssuedTickets[action.payload.barCode];
		},
	},
});

const { occupyParkingBox, leaveParkingBox, issueNewTicket, payTicket } = ParkingGarageSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.ParkingGarage.value)`
export const selectParkingSpaces = (state: RootState) => state.parkingGarage.parkingSpaces;
export const selectTicketWithBarCode = (barCode: BarCode) => (state: RootState) =>
	state.parkingGarage.currentlyIssuedTickets[barCode]
		? state.parkingGarage.currentlyIssuedTickets[barCode]
		: null;
export const selectTicketOfParkingBox = (spaceNumber: number) => (state: RootState) =>
	state.parkingGarage.parkingSpaces[spaceNumber].ticket
		? state.parkingGarage.parkingSpaces[spaceNumber].ticket
		: null;

// We can also write thunks by hand, which may contain both sync and async logic.
// Here's an example of conditionally dispatching actions based on current state.
export const getTicket = (): AppThunk<BarCode> =>
	(dispatch, getState) => {
		const barCode = generateBarCode();
		const ticket = {
			barCode,
			dateOfIssuance: Date.now(),
		};
		dispatch(issueNewTicket(ticket));
		return barCode;
	};

export const park = (spaceNumber: number): AppThunk =>
	(dispatch, getState) => {
		const barCode = dispatch(getTicket());
		const ticket = selectTicketWithBarCode(barCode)(getState());
		if (ticket) {
			dispatch(occupyParkingBox({
				spaceNumber,
				ticket: {
					barCode,
					dateOfIssuance: Date.now(),
				},
			}))
		}
	};

export const leave = (spaceNumber: number): AppThunk =>
	(dispatch, getState) => {
		const ticket = selectTicketOfParkingBox(spaceNumber)(getState());
		if (ticket) {
			const ticketPrice = dispatch(calculatePrice(ticket.barCode));
			console.log('ticketPrice', ticketPrice);
			dispatch(leaveParkingBox(spaceNumber));
		}
		else {
			throw new Error('Parking slot is occupied, but has no ticket!');
		}
	};

export const calculatePrice = (barCode: BarCode): AppThunk<number | void> =>
	(dispatch, getState) => {
		const ticket = selectTicketWithBarCode(barCode)(getState());
		if (ticket) {
			const issueDate = new Date(ticket.dateOfIssuance);
			const paymentDate = new Date();
			const ticketPrice = calculateTicketPrice(issueDate, paymentDate);
			return ticketPrice;
		}
		else {
			throw new Error('Ticket cannot be found!');
		}
	};

export default ParkingGarageSlice.reducer;
