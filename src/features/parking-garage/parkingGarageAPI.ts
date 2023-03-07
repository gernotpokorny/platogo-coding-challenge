
// types
import { Ticket, PaymentMethod } from './parkingGarageSlice';

export interface PayTicketResponseSuccess extends Response {
	paymentDate: number;
}

export const payTicket = (ticket: Ticket, paymentMethod: PaymentMethod) => {
	return fetch('http://localhost:3001/pay-ticket', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			ticket,
			paymentMethod,
		}),
	});
};

export interface GetTicketResponseSuccess extends Response {
	ticket: Ticket;
}

export const getTicket = () => {
	return fetch('http://localhost:3001/get-ticket', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
	});
};

export interface CheckoutSuccessResponseSuccess extends Response {
	success: boolean;
}

export const checkoutSuccess = (ticket: Ticket) => {
	return fetch('http://localhost:3001/checkout-success', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			ticket,
		}),
	});
};