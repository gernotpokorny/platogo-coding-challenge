import React from 'react';

// components
import App from './App';

// constants
import { PaymentMethod, PARKING_CAPACITY, ErrorCode } from './features/parking-garage/parkingGarageSlice';

// types
import { CalculatePricePaidTicketReturnValue } from './features/parking-garage/parkingGarageSlice';

// utils
import { act } from 'react-dom/test-utils';
import { renderWithProviders } from './shared/utils/test-utils';

describe('getTicket();', () => {
	test('await getTicket(); return a new barcode', async () => {
		renderWithProviders(<App />);
		await act(async () => {
			const barCode = await window.getTicket();
			expect(barCode).toMatch(/^\d{16}$/);
		});
	});
	test('await getTicket(); return a new barcode different then the previous one', async () => {
		renderWithProviders(<App />);
		await act(async () => {
			const barCode1 = await window.getTicket();
			const barCode2 = await window.getTicket();
			expect(barCode1).not.toBe(barCode2);
		});
	});
	test('Make sure that there can’t be more cars in the parking lot than available parking spaces.', async () => {
		renderWithProviders(<App />);
		await act(async () => {
			for (let i = 0; i < PARKING_CAPACITY; i++) {
				await window.getTicket();
			}
			try {
				await window.getTicket();
				throw new Error('There are more tickets issued then parking spaces available in the parking garage.');
			} catch (error) {
				// eslint-disable-next-line jest/no-conditional-expect
				expect(((error || {}) as Error).message).toBe(ErrorCode.FULL_PARKING_GARAGE);
			}
		});
	}, 120000);
});

describe('calculatePrice(barcode);', () => {
	test('the calculated price of a newly issued ticket should be 2', async () => {
		renderWithProviders(<App />);
		await act(async () => {
			const barCode = await window.getTicket();
			await new Promise(resolve => setTimeout(resolve, 100));
			const price = window.calculatePrice(barCode);
			expect(price).toBe(2);
		});
	});
	test('Every started hour costs 2 Eur more: 59 min 59 sec passed', async () => {
		renderWithProviders(<App />);
		await act(async () => {
			const barCode = await window.getTicket();
			const currentDate = Date.now();
			const dateNowSpyCalculatePrice = jest.spyOn(Date, 'now').mockImplementation(() => currentDate + (60 * 60 * 1000) - 1000);
			const price = window.calculatePrice(barCode);
			expect(price).toBe(2);
			dateNowSpyCalculatePrice.mockRestore();
		});
	});
	test('Every started hour costs 2 Eur more: 60 min passed', async () => {
		renderWithProviders(<App />);
		await act(async () => {
			const barCode = await window.getTicket();
			const currentDate = Date.now();
			const dateNowSpyCalculatePrice = jest.spyOn(Date, 'now').mockImplementation(() => currentDate + 60 * 60 * 1000);
			const price = window.calculatePrice(barCode);
			expect(price).toBe(4);
			dateNowSpyCalculatePrice.mockRestore();
		});
	});
	test('the calculated price of a PAID ticket should be 0 and a payment receipt should be returned', async () => {
		renderWithProviders(<App />);
		await act(async () => {
			const dateNowSpyGetTicket = jest.spyOn(Date, 'now').mockImplementation(() => new Date(2020, 2, 10, 0, 0, 0, 0).getTime());
			const barCode = await window.getTicket();
			dateNowSpyGetTicket.mockRestore();
			const dateNowSpyPayTicket = jest.spyOn(Date, 'now').mockImplementation(() => new Date(2020, 2, 10, 3, 0, 0, 0).getTime());
			await window.payTicket(barCode, PaymentMethod.CASH);
			dateNowSpyPayTicket.mockRestore();
			const price = window.calculatePrice(barCode);
			expect(Object.prototype.hasOwnProperty.call(price, 'ticketPrice')).toBe(true);
			expect(Object.prototype.hasOwnProperty.call(price, 'paymentReceipt')).toBe(true);
			expect((price as unknown as CalculatePricePaidTicketReturnValue).ticketPrice).toBe(0);
			expect((price as unknown as CalculatePricePaidTicketReturnValue).paymentReceipt).toStrictEqual([
				'Payed: 6€',
				'Payment date: Dienstag, 10. März 2020 um 03:00:00',
				'Payment method: CASH',
			]);
		});
	});
	describe('Already payed ticket where 15 min have passed already', () => {
		test.skip('First hour price after reset should be 2', async () => {
			//TODO: paymentDate should be a number[]
			//TODO: calculatePrice() must take the current ticket state into account
			renderWithProviders(<App />);
			await act(async () => {
				const barCode = await window.getTicket();
				const currentDate = Date.now();
				const dateNowSpyPayTicket = jest.spyOn(Date, 'now').mockImplementation(() => currentDate + (15 * 60 * 1000) + 1000);
				await window.payTicket(barCode, PaymentMethod.CASH);
				dateNowSpyPayTicket.mockRestore();
				const price = window.calculatePrice(barCode);
				expect(price).toBe(2);
			});
		});
		test.todo('First hour price after reset: 59 min 59 sec');
		test.todo('Every started hour costs 2 Eur more');
		test.todo('the calculated price of a PAID ticket should be 0 and a payment receipt should be returned');
	})
});

describe('getTicketState(barcode); and payTicket(barcode, paymentMethod);', () => {
	test('the ticket state of a newly issued ticket should be UNPAID', async () => {
		renderWithProviders(<App />);
		await act(async () => {
			const barCode = await window.getTicket();
			const ticketState = window.getTicketState(barCode);
			expect(ticketState).toBe('UNPAID');
		});
	});
	test('the ticket state of a paid ticket ticket should be PAID if not more than 15min have passed since the payment', async () => {
		renderWithProviders(<App />);
		await act(async () => {
			const barCode = await window.getTicket();
			await window.payTicket(barCode, PaymentMethod.CASH);
			const ticketState = window.getTicketState(barCode);
			expect(ticketState).toBe('PAID');
		});
	});
	test(
		'the ticket state of a paid ticket ticket should be PAID if not more than 15min have passed since the payment: 14 min 59 sec',
		async () => {
			renderWithProviders(<App />);
			await act(async () => {
				const barCode = await window.getTicket();
				const currentDate = Date.now();
				const dateNowSpyPayTicket = jest.spyOn(Date, 'now').mockImplementation(() => currentDate + (15 * 60 * 1000) - 1);
				await window.payTicket(barCode, PaymentMethod.CASH);
				const dateNowSpyGetTicketState = jest.spyOn(Date, 'now').mockImplementation(() => currentDate);
				const ticketState = window.getTicketState(barCode);
				expect(ticketState).toBe('PAID');
				dateNowSpyPayTicket.mockRestore();
				dateNowSpyGetTicketState.mockRestore();
			});
		});
	test('the ticket state of a paid ticket ticket should be UNPAID if more than 15min have passed since the payment', async () => {
		renderWithProviders(<App />);
		await act(async () => {
			const barCode = await window.getTicket();
			const currentDate = Date.now();
			const dateNowSpyPayTicket = jest.spyOn(Date, 'now').mockImplementation(() => currentDate + 15 * 60 * 1000);
			await window.payTicket(barCode, PaymentMethod.CASH);
			const dateNowSpyGetTicketState = jest.spyOn(Date, 'now').mockImplementation(() => currentDate);
			const ticketState = window.getTicketState(barCode);
			expect(ticketState).toBe('UNPAID');
			dateNowSpyPayTicket.mockRestore();
			dateNowSpyGetTicketState.mockRestore();
		});
	});
});

describe('getFreeSpaces();', () => {
	test('there should be PARKING_CAPACITY free spaces initially', () => {
		renderWithProviders(<App />);
		act(() => {
			const freeSpaces = window.getFreeSpaces();
			expect(freeSpaces).toBe(PARKING_CAPACITY);
		});
	});
	test('each newly issued ticket should decrease the capacity by 1: One issued ticket', async () => {
		renderWithProviders(<App />);
		await act(async () => {
			await window.getTicket();
			const freeSpaces = window.getFreeSpaces();
			expect(freeSpaces).toBe(PARKING_CAPACITY - 1);
		});
	});
	test('each newly issued ticket should decrease the capacity by 1: Two issued tickets', async () => {
		renderWithProviders(<App />);
		await act(async () => {
			await window.getTicket();
			await window.getTicket();
			const freeSpaces = window.getFreeSpaces();
			expect(freeSpaces).toBe(PARKING_CAPACITY - 2);
		});
	});
	test('should return 0 if PARKING_CAPACITY number of tickets are issued', async () => {
		renderWithProviders(<App />);
		await act(async () => {
			for (let i = 0; i < PARKING_CAPACITY; i++) {
				await window.getTicket();
			}
			const freeSpaces = window.getFreeSpaces();
			expect(freeSpaces).toBe(0);
		});
	}, 120000);
});