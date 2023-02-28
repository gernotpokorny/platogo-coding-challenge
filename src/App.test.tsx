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

describe('calculatePrice(barcode); and payTicket(barcode, paymentMethod);', () => {
	describe('unpaid ticket', () => {
		test('the calculated price of a newly issued ticket should be 2', async () => {
			renderWithProviders(<App />);
			await act(async () => {
				const barCode = await window.getTicket();
				await new Promise(resolve => setTimeout(resolve, 100));
				const price = window.calculatePrice(barCode);
				expect(price).toBe(2);
			});
		});
		test('Every started hour costs 2 Eur more: 60 min 00 sec passed: price should be 2', async () => {
			renderWithProviders(<App />);
			await act(async () => {
				const dateNowSpyGetTicket = jest.spyOn(Date, 'now')
					.mockImplementation(() => new Date(2020, 2, 10, 1, 0, 0, 0).getTime());
				const barCode = await window.getTicket();
				dateNowSpyGetTicket.mockRestore();
				const dateNowSpyCalculatePrice = jest.spyOn(Date, 'now')
					.mockImplementation(() => new Date(2020, 2, 10, 2, 0, 0, 0).getTime());
				const price = window.calculatePrice(barCode);
				dateNowSpyCalculatePrice.mockRestore();
				expect(price).toBe(2);
			});
		});
		test('Every started hour costs 2 Eur more: 60 min 01 sec passed: price should be 4', async () => {
			renderWithProviders(<App />);
			await act(async () => {
				const dateNowSpyGetTicket = jest.spyOn(Date, 'now')
					.mockImplementation(() => new Date(2020, 2, 10, 1, 0, 0, 0).getTime());
				const barCode = await window.getTicket();
				dateNowSpyGetTicket.mockRestore();
				const dateNowSpyCalculatePrice = jest.spyOn(Date, 'now')
					.mockImplementation(() => new Date(2020, 2, 10, 2, 0, 1, 0).getTime());
				const price = window.calculatePrice(barCode);
				dateNowSpyCalculatePrice.mockRestore();
				expect(price).toBe(4);
			});
		});
	});
	describe('payed ticket', () => {
		describe('<= 15 min have passed since last payment', () => {
			describe('one payment', () => {
				test('15 min 00 sec passed since last payment: the calculated price should be 0 and a payment receipt should be returned',
					async () => {
						renderWithProviders(<App />);
						await act(async () => {
							const dateNowSpyGetTicket = jest.spyOn(Date, 'now')
								.mockImplementation(() => new Date(2020, 2, 10, 0, 0, 0, 0).getTime());
							const barCode = await window.getTicket();
							dateNowSpyGetTicket.mockRestore();
							const dateNowSpyPayTicket = jest.spyOn(Date, 'now')
								.mockImplementation(() => new Date(2020, 2, 10, 3, 0, 0, 0).getTime());
							await window.payTicket(barCode, PaymentMethod.CASH);
							dateNowSpyPayTicket.mockRestore();
							const dateNowSpyCalculatePrice = jest.spyOn(Date, 'now')
								.mockImplementation(() => new Date(2020, 2, 10, 3, 15, 0, 0).getTime());
							const price = window.calculatePrice(barCode);
							dateNowSpyCalculatePrice.mockRestore();
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
			});
			describe('multiple payments', () => {
				test('15 min 00 sec passed since last payment: the calculated price should be 0 and a payment receipt should be returned',
					async () => {
						renderWithProviders(<App />);
						await act(async () => {
							const dateNowSpyGetTicket = jest.spyOn(Date, 'now')
								.mockImplementation(() => new Date(2020, 2, 10, 0, 0, 0, 0).getTime());
							const barCode = await window.getTicket();
							dateNowSpyGetTicket.mockRestore();
							const dateNowSpyPayTicket1 = jest.spyOn(Date, 'now')
								.mockImplementation(() => new Date(2020, 2, 10, 3, 0, 0, 0).getTime());
							await window.payTicket(barCode, PaymentMethod.CASH);
							dateNowSpyPayTicket1.mockRestore();
							const dateNowSpyPayTicket2 = jest.spyOn(Date, 'now')
								.mockImplementation(() => new Date(2020, 2, 10, 4, 0, 0, 0).getTime());
							await window.payTicket(barCode, PaymentMethod.CASH);
							dateNowSpyPayTicket2.mockRestore();
							const dateNowSpyCalculatePrice = jest.spyOn(Date, 'now')
								.mockImplementation(() => new Date(2020, 2, 10, 4, 15, 0, 0).getTime());
							const price = window.calculatePrice(barCode);
							dateNowSpyCalculatePrice.mockRestore();
							expect(Object.prototype.hasOwnProperty.call(price, 'ticketPrice')).toBe(true);
							expect(Object.prototype.hasOwnProperty.call(price, 'paymentReceipt')).toBe(true);
							expect((price as unknown as CalculatePricePaidTicketReturnValue).ticketPrice).toBe(0);
							expect((price as unknown as CalculatePricePaidTicketReturnValue).paymentReceipt).toStrictEqual([
								'Payed: 2€',
								'Payment date: Dienstag, 10. März 2020 um 04:00:00',
								'Payment method: CASH',
							]);
						});
					});
			});
		});
		describe('> 15 min have passed since last payment', () => {
			describe('one payment', () => {
				test('First hour price since the last payment should be 2', async () => {
					renderWithProviders(<App />);
					await act(async () => {
						const dateNowSpyGetTicket = jest.spyOn(Date, 'now')
							.mockImplementation(() => new Date(2020, 2, 10, 0, 0, 0, 0).getTime());
						const barCode = await window.getTicket();
						dateNowSpyGetTicket.mockRestore();
						const dateNowSpyPayTicket = jest.spyOn(Date, 'now')
							.mockImplementation(() => new Date(2020, 2, 10, 3, 0, 0, 0).getTime());
						await window.payTicket(barCode, PaymentMethod.CASH);
						dateNowSpyPayTicket.mockRestore();
						const dateNowSpyCalculatePrice = jest.spyOn(Date, 'now')
							.mockImplementation(() => new Date(2020, 2, 10, 3, 15, 1, 0).getTime());
						const price = window.calculatePrice(barCode);
						dateNowSpyCalculatePrice.mockRestore();
						expect(price).toBe(2);
					});
				});
				test('Every started hour since the last payment costs 2 Eur more: 60 min 00 sec passed', async () => {
					renderWithProviders(<App />);
					await act(async () => {
						const dateNowSpyGetTicket = jest.spyOn(Date, 'now')
							.mockImplementation(() => new Date(2020, 2, 10, 0, 0, 0, 0).getTime());
						const barCode = await window.getTicket();
						dateNowSpyGetTicket.mockRestore();
						const dateNowSpyPayTicket = jest.spyOn(Date, 'now')
							.mockImplementation(() => new Date(2020, 2, 10, 3, 0, 0, 0).getTime());
						await window.payTicket(barCode, PaymentMethod.CASH);
						dateNowSpyPayTicket.mockRestore();
						const dateNowSpyCalculatePrice = jest.spyOn(Date, 'now')
							.mockImplementation(() => new Date(2020, 2, 10, 4, 0, 0, 0).getTime());
						const price = window.calculatePrice(barCode);
						dateNowSpyCalculatePrice.mockRestore();
						expect(price).toBe(2);
					});
				});
				test('Every started hour since the last payment costs 2 Eur more: 60 min 01 sec passed', async () => {
					renderWithProviders(<App />);
					await act(async () => {
						const dateNowSpyGetTicket = jest.spyOn(Date, 'now')
							.mockImplementation(() => new Date(2020, 2, 10, 0, 0, 0, 0).getTime());
						const barCode = await window.getTicket();
						dateNowSpyGetTicket.mockRestore();
						const dateNowSpyPayTicket = jest.spyOn(Date, 'now')
							.mockImplementation(() => new Date(2020, 2, 10, 3, 0, 0, 0).getTime());
						await window.payTicket(barCode, PaymentMethod.CASH);
						dateNowSpyPayTicket.mockRestore();
						const dateNowSpyCalculatePrice = jest.spyOn(Date, 'now')
							.mockImplementation(() => new Date(2020, 2, 10, 4, 0, 1, 0).getTime());
						const price = window.calculatePrice(barCode);
						dateNowSpyCalculatePrice.mockRestore();
						expect(price).toBe(4);
					});
				});
			});
			describe('multiple payments', () => {
				test('First hour price since the last payment should be 2', async () => {
					renderWithProviders(<App />);
					await act(async () => {
						const dateNowSpyGetTicket = jest.spyOn(Date, 'now')
							.mockImplementation(() => new Date(2020, 2, 10, 0, 0, 0, 0).getTime());
						const barCode = await window.getTicket();
						dateNowSpyGetTicket.mockRestore();
						const dateNowSpyPayTicket1 = jest.spyOn(Date, 'now')
							.mockImplementation(() => new Date(2020, 2, 10, 3, 0, 0, 0).getTime());
						await window.payTicket(barCode, PaymentMethod.CASH);
						dateNowSpyPayTicket1.mockRestore();
						const dateNowSpyPayTicket2 = jest.spyOn(Date, 'now')
							.mockImplementation(() => new Date(2020, 2, 10, 5, 0, 0, 0).getTime());
						await window.payTicket(barCode, PaymentMethod.CASH);
						dateNowSpyPayTicket2.mockRestore();
						const dateNowSpyCalculatePrice = jest.spyOn(Date, 'now')
							.mockImplementation(() => new Date(2020, 2, 10, 5, 15, 1, 0).getTime());
						const price = window.calculatePrice(barCode);
						dateNowSpyCalculatePrice.mockRestore();
						expect(price).toBe(2);
					});
				});
				test('Every started hour since the last payment costs 2 Eur more: 60 min 00 sec passed', async () => {
					renderWithProviders(<App />);
					await act(async () => {
						const dateNowSpyGetTicket = jest.spyOn(Date, 'now')
							.mockImplementation(() => new Date(2020, 2, 10, 0, 0, 0, 0).getTime());
						const barCode = await window.getTicket();
						dateNowSpyGetTicket.mockRestore();
						const dateNowSpyPayTicket1 = jest.spyOn(Date, 'now')
							.mockImplementation(() => new Date(2020, 2, 10, 3, 0, 0, 0).getTime());
						await window.payTicket(barCode, PaymentMethod.CASH);
						dateNowSpyPayTicket1.mockRestore();
						const dateNowSpyPayTicket2 = jest.spyOn(Date, 'now')
							.mockImplementation(() => new Date(2020, 2, 10, 5, 0, 0, 0).getTime());
						await window.payTicket(barCode, PaymentMethod.CASH);
						dateNowSpyPayTicket2.mockRestore();
						const dateNowSpyCalculatePrice = jest.spyOn(Date, 'now')
							.mockImplementation(() => new Date(2020, 2, 10, 6, 0, 0, 0).getTime());
						const price = window.calculatePrice(barCode);
						dateNowSpyCalculatePrice.mockRestore();
						expect(price).toBe(2);
					});
				});
				test('Every started hour since the last payment costs 2 Eur more: 60 min 01 sec passed', async () => {
					renderWithProviders(<App />);
					await act(async () => {
						const dateNowSpyGetTicket = jest.spyOn(Date, 'now')
							.mockImplementation(() => new Date(2020, 2, 10, 0, 0, 0, 0).getTime());
						const barCode = await window.getTicket();
						dateNowSpyGetTicket.mockRestore();
						const dateNowSpyPayTicket1 = jest.spyOn(Date, 'now')
							.mockImplementation(() => new Date(2020, 2, 10, 3, 0, 0, 0).getTime());
						await window.payTicket(barCode, PaymentMethod.CASH);
						dateNowSpyPayTicket1.mockRestore();
						const dateNowSpyPayTicket2 = jest.spyOn(Date, 'now')
							.mockImplementation(() => new Date(2020, 2, 10, 5, 0, 0, 0).getTime());
						await window.payTicket(barCode, PaymentMethod.CASH);
						dateNowSpyPayTicket2.mockRestore();
						const dateNowSpyCalculatePrice = jest.spyOn(Date, 'now')
							.mockImplementation(() => new Date(2020, 2, 10, 6, 0, 1, 0).getTime());
						const price = window.calculatePrice(barCode);
						dateNowSpyCalculatePrice.mockRestore();
						expect(price).toBe(4);
					});
				});
			});
		});
	});
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
	describe('one payment', () => {
		test('the ticket state of a paid ticket ticket should be PAID if not more than 15min have passed since the payment',
			async () => {
				renderWithProviders(<App />);
				await act(async () => {
					const barCode = await window.getTicket();
					await window.payTicket(barCode, PaymentMethod.CASH);
					const ticketState = window.getTicketState(barCode);
					expect(ticketState).toBe('PAID');
				});
			});
		test('the ticket state of a paid ticket ticket should be PAID if not more than 15min have passed since the payment: 15 min',
			async () => {
				renderWithProviders(<App />);
				await act(async () => {
					const dateNowSpyGetTicket = jest.spyOn(Date, 'now')
						.mockImplementation(() => new Date(2020, 2, 10, 1, 0, 0, 0).getTime());
					const barCode = await window.getTicket();
					dateNowSpyGetTicket.mockRestore();
					const dateNowSpyPayTicket = jest.spyOn(Date, 'now')
						.mockImplementation(() => new Date(2020, 2, 10, 3, 0, 0, 0).getTime());
					await window.payTicket(barCode, PaymentMethod.CASH);
					dateNowSpyPayTicket.mockRestore();
					const dateNowSpyGetTicketState = jest.spyOn(Date, 'now')
						.mockImplementation(() => new Date(2020, 2, 10, 3, 15, 0, 0).getTime());
					const ticketState = window.getTicketState(barCode);
					dateNowSpyGetTicketState.mockRestore();
					expect(ticketState).toBe('PAID');
				});
			});
		test('the ticket state of a paid ticket ticket should be UNPAID if more than 15min have passed since the payment',
			async () => {
				renderWithProviders(<App />);
				await act(async () => {
					const dateNowSpyGetTicket = jest.spyOn(Date, 'now')
						.mockImplementation(() => new Date(2020, 2, 10, 1, 0, 0, 0).getTime());
					const barCode = await window.getTicket();
					dateNowSpyGetTicket.mockRestore();
					const dateNowSpyPayTicket = jest.spyOn(Date, 'now')
						.mockImplementation(() => new Date(2020, 2, 10, 3, 0, 0, 0).getTime());
					await window.payTicket(barCode, PaymentMethod.CASH);
					dateNowSpyPayTicket.mockRestore();
					const dateNowSpyGetTicketState = jest.spyOn(Date, 'now')
						.mockImplementation(() => new Date(2020, 2, 10, 3, 15, 1, 0).getTime());
					const ticketState = window.getTicketState(barCode);
					dateNowSpyGetTicketState.mockRestore();
					expect(ticketState).toBe('UNPAID');
				});
			});
	});
	describe('multiple payments', () => {
		test('the ticket state of a paid ticket ticket should be PAID if not more than 15min have passed since the payment',
			async () => {
				renderWithProviders(<App />);
				await act(async () => {
					const barCode = await window.getTicket();
					await window.payTicket(barCode, PaymentMethod.CASH);
					await window.payTicket(barCode, PaymentMethod.CASH);
					const ticketState = window.getTicketState(barCode);
					expect(ticketState).toBe('PAID');
				});
			});
		test('the ticket state of a paid ticket ticket should be PAID if not more than 15min have passed since the payment: 15 min',
			async () => {
				renderWithProviders(<App />);
				await act(async () => {
					const dateNowSpyGetTicket = jest.spyOn(Date, 'now')
						.mockImplementation(() => new Date(2020, 2, 10, 1, 0, 0, 0).getTime());
					const barCode = await window.getTicket();
					dateNowSpyGetTicket.mockRestore();
					const dateNowSpyPayTicket1 = jest.spyOn(Date, 'now')
						.mockImplementation(() => new Date(2020, 2, 10, 3, 0, 0, 0).getTime());
					await window.payTicket(barCode, PaymentMethod.CASH);
					dateNowSpyPayTicket1.mockRestore();
					const dateNowSpyPayTicket2 = jest.spyOn(Date, 'now')
						.mockImplementation(() => new Date(2020, 2, 10, 5, 0, 0, 0).getTime());
					await window.payTicket(barCode, PaymentMethod.CASH);
					dateNowSpyPayTicket2.mockRestore();
					const dateNowSpyGetTicketState = jest.spyOn(Date, 'now')
						.mockImplementation(() => new Date(2020, 2, 10, 5, 15, 0, 0).getTime());
					const ticketState = window.getTicketState(barCode);
					dateNowSpyGetTicketState.mockRestore();
					expect(ticketState).toBe('PAID');
				});
			});
		test('the ticket state of a paid ticket ticket should be UNPAID if more than 15min have passed since the payment',
			async () => {
				renderWithProviders(<App />);
				await act(async () => {
					const dateNowSpyGetTicket = jest.spyOn(Date, 'now')
						.mockImplementation(() => new Date(2020, 2, 10, 1, 0, 0, 0).getTime());
					const barCode = await window.getTicket();
					dateNowSpyGetTicket.mockRestore();
					const dateNowSpyPayTicket1 = jest.spyOn(Date, 'now')
						.mockImplementation(() => new Date(2020, 2, 10, 3, 0, 0, 0).getTime());
					await window.payTicket(barCode, PaymentMethod.CASH);
					dateNowSpyPayTicket1.mockRestore();
					const dateNowSpyPayTicket2 = jest.spyOn(Date, 'now')
						.mockImplementation(() => new Date(2020, 2, 10, 5, 0, 0, 0).getTime());
					await window.payTicket(barCode, PaymentMethod.CASH);
					dateNowSpyPayTicket2.mockRestore();
					const dateNowSpyGetTicketState = jest.spyOn(Date, 'now')
						.mockImplementation(() => new Date(2020, 2, 10, 5, 15, 1, 0).getTime());
					const ticketState = window.getTicketState(barCode);
					dateNowSpyGetTicketState.mockRestore();
					expect(ticketState).toBe('UNPAID');
				});
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