
// constants
import { TicketState } from './parkingGarageSlice';

// types
import { Ticket, PaymentMethod } from './parkingGarageSlice';

// utils
import { generateBarCode, calculateTicketState } from './ParkingGarage.utils';

interface PayTicketResponseSuccess {
	ok: true;
	paymentDate: number;
}

interface PayTicketResponseFailure {
	ok: false;
	statusText: string;
}

type PayTicketResponse = PayTicketResponseSuccess | PayTicketResponseFailure;

// A mock function to mimic making an async request for data
export const payTicket = (ticket: Ticket, paymentMethod: PaymentMethod) => {
	return new Promise<PayTicketResponse>((resolve) => {
		setTimeout(() => {
			resolve({
				ok: true,
				paymentDate: Date.now(),
			});
		}, 500);
	});
};

interface GetTicketResponseSuccess {
	ok: true;
	ticket: Ticket;
}

interface GetTicketResponseFailure {
	ok: false;
	statusText: string;
}

type GetTicketResponse = GetTicketResponseSuccess | GetTicketResponseFailure;

// A mock function to mimic making an async request for data
export const getTicket = () => {
	return new Promise<GetTicketResponse>((resolve) => {
		const barCode = generateBarCode();
		const ticket = {
			barCode,
			dateOfIssuance: Date.now(),
		};
		setTimeout(() => {
			resolve({
				ok: true,
				ticket,
			});
		}, 500);
	});
};

interface GateCheckoutResponseSuccess {
	ok: true;
	success: boolean;
}

interface GateCheckoutResponseFailure {
	ok: false;
	statusText: string;
}

type GateCheckoutResponse = GateCheckoutResponseSuccess | GateCheckoutResponseFailure;

// A mock function to mimic making an async request for data
export const gateCheckout = (ticket: Ticket) => {
	return new Promise<GateCheckoutResponse>((resolve) => {
		const currentDate = new Date();
		const ticketState = calculateTicketState(ticket, currentDate);
		setTimeout(() => {
			resolve({
				ok: true,
				success: ticketState === TicketState.PAID ? true : false,
			});
		}, 500);
	});
};