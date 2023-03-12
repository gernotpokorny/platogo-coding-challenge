import React from 'react';

// components
import App from './App';

// constants
import { PaymentMethod, PARKING_CAPACITY, ErrorCode, TicketState } from './features/parking-garage/parkingGarageSlice';

// mocks
import { rest } from 'msw';
import { setupServer } from 'msw/node';

// types
import { CalculatePricePaidTicketReturnValue } from './features/parking-garage/parkingGarageSlice';

// utils
import { act } from 'react-dom/test-utils';
import { renderWithProviders } from './shared/utils/test-utils';

let currentBarCode = 1223352031944154;

describe('getTicket();', () => {
	const handlers = [
		rest.post('http://localhost:3001/get-ticket', (req, res, ctx) => {
			currentBarCode++;
			return res(
				ctx.json({
					ticket: {
						barCode: currentBarCode.toString(),
						dateOfIssuance: (new Date()).getTime(),
					},
				}),
				ctx.delay(10)
			);
		}),
	];

	const server = setupServer(...handlers);

	// Enable API mocking before tests.
	beforeAll(() => server.listen());

	// Reset any runtime request handlers we may add during the tests.
	afterEach(() => server.resetHandlers());

	// Disable API mocking after the tests are done.
	afterAll(() => server.close());

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
		const handlers = [
			rest.post('http://localhost:3001/get-ticket', (req, res, ctx) => {
				currentBarCode++;
				return res(
					ctx.json({
						ticket: {
							barCode: currentBarCode.toString(),
							dateOfIssuance: new Date(2020, 2, 10, 1, 0, 0, 0).getTime(),
						},
					}),
					ctx.delay(10)
				);
			}),
			rest.post('http://localhost:3001/get-ticket-state', (req, res, ctx) => {
				return res(
					ctx.json({
						ticketState: TicketState.UNPAID,
					}),
					ctx.delay(10)
				);
			}),
			rest.post('http://localhost:3001/calculate-ticket-price', (req, res, ctx) => {
				return res(
					ctx.json({
						ticketPrice: 2,
					}),
					ctx.delay(10)
				);
			}),
		];

		const server = setupServer(...handlers);

		// Enable API mocking before tests.
		beforeAll(() => server.listen());

		// Reset any runtime request handlers we may add during the tests.
		afterEach(() => server.resetHandlers());

		// Disable API mocking after the tests are done.
		afterAll(() => server.close());

		test('the calculated price of a newly issued ticket should be 2', async () => {
			server.use(
				rest.post('http://localhost:3001/get-ticket', (req, res, ctx) => {
					currentBarCode++;
					return res(
						ctx.json({
							ticket: {
								barCode: currentBarCode.toString(),
								dateOfIssuance: (new Date()).getTime(),
							},
						}),
						ctx.delay(10)
					);
				})
			);
			renderWithProviders(<App />);
			await act(async () => {
				const barCode = await window.getTicket();
				const price = await window.calculatePrice(barCode);
				expect(price).toBe(2);
			});
		});
		test('Every started hour costs 2 Eur more: 60 min 00 sec passed: price should be 2', async () => {
			renderWithProviders(<App />);
			await act(async () => {
				const barCode = await window.getTicket();
				const price = await window.calculatePrice(barCode);
				expect(price).toBe(2);
			});
		});
		test('Every started hour costs 2 Eur more: 60 min 01 sec passed: price should be 4', async () => {
			renderWithProviders(<App />);
			await act(async () => {
				const barCode = await window.getTicket();
				server.use(
					rest.post('http://localhost:3001/calculate-ticket-price', (req, res, ctx) => {
						return res(
							ctx.json({
								ticketPrice: 4,
							}),
							ctx.delay(10)
						);
					})
				);
				const price = await window.calculatePrice(barCode);
				expect(price).toBe(4);
			});
		});
	});
	describe('payed ticket', () => {
		const handlers = [
			rest.post('http://localhost:3001/get-ticket', (req, res, ctx) => {
				currentBarCode++;
				return res(
					ctx.json({
						ticket: {
							barCode: currentBarCode.toString(),
							dateOfIssuance: (new Date(2020, 2, 10, 0, 0, 0, 0)).getTime(),
						},
					}),
					ctx.delay(10)
				);
			}),
			rest.post('http://localhost:3001/pay-ticket', (req, res, ctx) => {
				return res(
					ctx.json({
						paymentDate: (new Date(2020, 2, 10, 3, 0, 0, 0)).getTime(),
					}),
					ctx.delay(10)
				);
			}),
			rest.post('http://localhost:3001/calculate-ticket-price', (req, res, ctx) => {
				return res(
					ctx.json({
						ticketPrice: 2,
					}),
					ctx.delay(10)
				);
			}),
		];

		const server = setupServer(...handlers);

		// Enable API mocking before tests.
		beforeAll(() => server.listen());

		// Reset any runtime request handlers we may add during the tests.
		afterEach(() => server.resetHandlers());

		// Disable API mocking after the tests are done.
		afterAll(() => server.close());

		describe('<= 15 min have passed since last payment', () => {
			describe('one payment', () => {
				test('15 min 00 sec passed since last payment: the calculated price should be 0 and a payment receipt should be returned',
					async () => {
						renderWithProviders(<App />);
						await act(async () => {
							const barCode = await window.getTicket();
							await window.payTicket(barCode, PaymentMethod.CASH);
							server.use(
								rest.post('http://localhost:3001/get-ticket-state', (req, res, ctx) => {
									return res(
										ctx.json({
											ticketState: TicketState.PAID,
										}),
										ctx.delay(10)
									);
								})
							);
							server.use(
								rest.post('http://localhost:3001/calculate-ticket-price', (req, res, ctx) => {
									return res(
										ctx.json({
											ticketPrice: 0,
											paymentReceipt: [
												'Paid: 6€',
												'Payment date: Dienstag, 10. März 2020 um 03:00:00',
												'Payment method: CASH',
											],
										}),
										ctx.delay(10)
									);
								})
							);
							const price = await window.calculatePrice(barCode);
							expect(Object.prototype.hasOwnProperty.call(price, 'ticketPrice')).toBe(true);
							expect(Object.prototype.hasOwnProperty.call(price, 'paymentReceipt')).toBe(true);
							expect((price as unknown as CalculatePricePaidTicketReturnValue).ticketPrice).toBe(0);
							expect((price as unknown as CalculatePricePaidTicketReturnValue).paymentReceipt).toStrictEqual([
								'Paid: 6€',
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
							const barCode = await window.getTicket();
							await window.payTicket(barCode, PaymentMethod.CASH);
							server.use(
								rest.post('http://localhost:3001/pay-ticket', (req, res, ctx) => {
									return res(
										ctx.json({
											paymentDate: (new Date(2020, 2, 10, 4, 0, 0, 0)).getTime(),
										}),
										ctx.delay(10)
									);
								})
							);
							await window.payTicket(barCode, PaymentMethod.CASH);
							server.use(
								rest.post('http://localhost:3001/get-ticket-state', (req, res, ctx) => {
									return res(
										ctx.json({
											ticketState: TicketState.PAID,
										}),
										ctx.delay(10)
									);
								})
							);
							server.use(
								rest.post('http://localhost:3001/calculate-ticket-price', (req, res, ctx) => {
									return res(
										ctx.json({
											ticketPrice: 0,
											paymentReceipt: [
												'Paid: 2€',
												'Payment date: Dienstag, 10. März 2020 um 04:00:00',
												'Payment method: CASH',
											],
										}),
										ctx.delay(10)
									);
								})
							);
							const price = await window.calculatePrice(barCode);
							expect(Object.prototype.hasOwnProperty.call(price, 'ticketPrice')).toBe(true);
							expect(Object.prototype.hasOwnProperty.call(price, 'paymentReceipt')).toBe(true);
							expect((price as unknown as CalculatePricePaidTicketReturnValue).ticketPrice).toBe(0);
							expect((price as unknown as CalculatePricePaidTicketReturnValue).paymentReceipt).toStrictEqual([
								'Paid: 2€',
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
						const barCode = await window.getTicket();
						await window.payTicket(barCode, PaymentMethod.CASH);
						server.use(
							rest.post('http://localhost:3001/get-ticket-state', (req, res, ctx) => {
								return res(
									ctx.json({
										ticketState: TicketState.UNPAID,
									}),
									ctx.delay(10)
								);
							})
						);
						const price = await window.calculatePrice(barCode);
						expect(price).toBe(2);
					});
				});
				test('Every started hour since the last payment costs 2 Eur more: 60 min 00 sec passed', async () => {
					renderWithProviders(<App />);
					await act(async () => {
						const barCode = await window.getTicket();
						await window.payTicket(barCode, PaymentMethod.CASH);
						server.use(
							rest.post('http://localhost:3001/get-ticket-state', (req, res, ctx) => {
								return res(
									ctx.json({
										ticketState: TicketState.UNPAID,
									}),
									ctx.delay(10)
								);
							})
						);
						const price = await window.calculatePrice(barCode);
						expect(price).toBe(2);
					});
				});
				test('Every started hour since the last payment costs 2 Eur more: 60 min 01 sec passed', async () => {
					renderWithProviders(<App />);
					await act(async () => {
						const barCode = await window.getTicket();
						await window.payTicket(barCode, PaymentMethod.CASH);
						server.use(
							rest.post('http://localhost:3001/get-ticket-state', (req, res, ctx) => {
								return res(
									ctx.json({
										ticketState: TicketState.UNPAID,
									}),
									ctx.delay(10)
								);
							})
						);
						server.use(
							rest.post('http://localhost:3001/calculate-ticket-price', (req, res, ctx) => {
								return res(
									ctx.json({
										ticketPrice: 4,
									}),
									ctx.delay(10)
								);
							})
						);
						const price = await window.calculatePrice(barCode);
						expect(price).toBe(4);
					});
				});
			});
			describe('multiple payments', () => {
				test('First hour price since the last payment should be 2', async () => {
					renderWithProviders(<App />);
					await act(async () => {
						const barCode = await window.getTicket();
						await window.payTicket(barCode, PaymentMethod.CASH);
						server.use(
							rest.post('http://localhost:3001/pay-ticket', (req, res, ctx) => {
								return res(
									ctx.json({
										paymentDate: (new Date(2020, 2, 10, 5, 0, 0, 0)).getTime(),
									}),
									ctx.delay(10)
								);
							})
						);
						await window.payTicket(barCode, PaymentMethod.CASH);
						server.use(
							rest.post('http://localhost:3001/get-ticket-state', (req, res, ctx) => {
								return res(
									ctx.json({
										ticketState: TicketState.UNPAID,
									}),
									ctx.delay(10)
								);
							})
						);
						const price = await window.calculatePrice(barCode);
						expect(price).toBe(2);
					});
				});
				test('Every started hour since the last payment costs 2 Eur more: 60 min 00 sec passed', async () => {
					renderWithProviders(<App />);
					await act(async () => {
						const barCode = await window.getTicket();
						await window.payTicket(barCode, PaymentMethod.CASH);
						server.use(
							rest.post('http://localhost:3001/pay-ticket', (req, res, ctx) => {
								return res(
									ctx.json({
										paymentDate: (new Date(2020, 2, 10, 5, 0, 0, 0)).getTime(),
									}),
									ctx.delay(10)
								);
							})
						);
						await window.payTicket(barCode, PaymentMethod.CASH);
						server.use(
							rest.post('http://localhost:3001/get-ticket-state', (req, res, ctx) => {
								return res(
									ctx.json({
										ticketState: TicketState.UNPAID,
									}),
									ctx.delay(10)
								);
							})
						);
						const price = await window.calculatePrice(barCode);
						expect(price).toBe(2);
					});
				});
				test('Every started hour since the last payment costs 2 Eur more: 60 min 01 sec passed', async () => {
					renderWithProviders(<App />);
					await act(async () => {
						const barCode = await window.getTicket();
						await window.payTicket(barCode, PaymentMethod.CASH);
						server.use(
							rest.post('http://localhost:3001/pay-ticket', (req, res, ctx) => {
								return res(
									ctx.json({
										paymentDate: (new Date(2020, 2, 10, 5, 0, 0, 0)).getTime(),
									}),
									ctx.delay(10)
								);
							})
						);
						await window.payTicket(barCode, PaymentMethod.CASH);
						server.use(
							rest.post('http://localhost:3001/get-ticket-state', (req, res, ctx) => {
								return res(
									ctx.json({
										ticketState: TicketState.UNPAID,
									}),
									ctx.delay(10)
								);
							})
						);
						server.use(
							rest.post('http://localhost:3001/calculate-ticket-price', (req, res, ctx) => {
								return res(
									ctx.json({
										ticketPrice: 4,
									}),
									ctx.delay(10)
								);
							})
						);
						const price = await window.calculatePrice(barCode);
						expect(price).toBe(4);
					});
				});
			});
		});
	});
});

describe('getTicketState(barcode); and payTicket(barcode, paymentMethod);', () => {
	const handlers = [
		rest.post('http://localhost:3001/get-ticket', (req, res, ctx) => {
			currentBarCode++;
			return res(
				ctx.json({
					ticket: {
						barCode: currentBarCode.toString(),
						dateOfIssuance: (new Date()).getTime(),
					},
				}),
				ctx.delay(10)
			);
		}),
		rest.post('http://localhost:3001/pay-ticket', (req, res, ctx) => {
			return res(
				ctx.json({
					paymentDate: (new Date()).getTime(),
				}),
				ctx.delay(10)
			);
		}),
	];

	const server = setupServer(...handlers);

	// Enable API mocking before tests.
	beforeAll(() => server.listen());

	// Reset any runtime request handlers we may add during the tests.
	afterEach(() => server.resetHandlers());

	// Disable API mocking after the tests are done.
	afterAll(() => server.close());

	test('the ticket state of a newly issued ticket should be UNPAID', async () => {
		renderWithProviders(<App />);
		await act(async () => {
			const barCode = await window.getTicket();
			server.use(
				rest.post('http://localhost:3001/get-ticket-state', (req, res, ctx) => {
					return res(
						ctx.json({
							ticketState: TicketState.UNPAID,
						}),
						ctx.delay(10)
					);
				})
			);
			const ticketState = await window.getTicketState(barCode);
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
					server.use(
						rest.post('http://localhost:3001/get-ticket-state', (req, res, ctx) => {
							return res(
								ctx.json({
									ticketState: TicketState.PAID,
								}),
								ctx.delay(10)
							);
						})
					);
					const ticketState = await window.getTicketState(barCode);
					expect(ticketState).toBe('PAID');
				});
			});
		test('the ticket state of a paid ticket ticket should be PAID if not more than 15min have passed since the payment: 15 min',
			async () => {
				renderWithProviders(<App />);
				await act(async () => {
					server.use(
						rest.post('http://localhost:3001/get-ticket', (req, res, ctx) => {
							currentBarCode++;
							return res(
								ctx.json({
									ticket: {
										barCode: currentBarCode.toString(),
										dateOfIssuance: (new Date(2020, 2, 10, 1, 0, 0, 0)).getTime(),
									},
								}),
								ctx.delay(10)
							);
						})
					);
					const barCode = await window.getTicket();
					server.use(
						rest.post('http://localhost:3001/pay-ticket', (req, res, ctx) => {
							return res(
								ctx.json({
									paymentDate: (new Date(2020, 2, 10, 3, 0, 0, 0)).getTime(),
								}),
								ctx.delay(10)
							);
						})
					);
					await window.payTicket(barCode, PaymentMethod.CASH);
					server.use(
						rest.post('http://localhost:3001/get-ticket-state', (req, res, ctx) => {
							return res(
								ctx.json({
									ticketState: TicketState.PAID,
								}),
								ctx.delay(10)
							);
						})
					);
					const ticketState = await window.getTicketState(barCode);
					expect(ticketState).toBe('PAID');
				});
			});
		test('the ticket state of a paid ticket ticket should be UNPAID if more than 15min have passed since the payment',
			async () => {
				renderWithProviders(<App />);
				await act(async () => {
					server.use(
						rest.post('http://localhost:3001/get-ticket', (req, res, ctx) => {
							currentBarCode++;
							return res(
								ctx.json({
									ticket: {
										barCode: currentBarCode.toString(),
										dateOfIssuance: (new Date(2020, 2, 10, 1, 0, 0, 0)).getTime(),
									},
								}),
								ctx.delay(10)
							);
						})
					);
					const barCode = await window.getTicket();
					server.use(
						rest.post('http://localhost:3001/pay-ticket', (req, res, ctx) => {
							return res(
								ctx.json({
									paymentDate: (new Date(2020, 2, 10, 3, 0, 0, 0)).getTime(),
								}),
								ctx.delay(10)
							);
						})
					);
					await window.payTicket(barCode, PaymentMethod.CASH);
					server.use(
						rest.post('http://localhost:3001/get-ticket-state', (req, res, ctx) => {
							return res(
								ctx.json({
									ticketState: TicketState.UNPAID,
								}),
								ctx.delay(10)
							);
						})
					);
					const ticketState = await window.getTicketState(barCode);
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
					server.use(
						rest.post('http://localhost:3001/get-ticket-state', (req, res, ctx) => {
							return res(
								ctx.json({
									ticketState: TicketState.PAID,
								}),
								ctx.delay(10)
							);
						})
					);
					const ticketState = await window.getTicketState(barCode);
					expect(ticketState).toBe('PAID');
				});
			});
		test('the ticket state of a paid ticket ticket should be PAID if not more than 15min have passed since the payment: 15 min',
			async () => {
				renderWithProviders(<App />);
				await act(async () => {
					server.use(
						rest.post('http://localhost:3001/get-ticket', (req, res, ctx) => {
							currentBarCode++;
							return res(
								ctx.json({
									ticket: {
										barCode: currentBarCode.toString(),
										dateOfIssuance: (new Date(2020, 2, 10, 1, 0, 0, 0)).getTime(),
									},
								}),
								ctx.delay(10)
							);
						})
					);
					const barCode = await window.getTicket();
					server.use(
						rest.post('http://localhost:3001/pay-ticket', (req, res, ctx) => {
							return res(
								ctx.json({
									paymentDate: (new Date(2020, 2, 10, 3, 0, 0, 0)).getTime(),
								}),
								ctx.delay(10)
							);
						})
					);
					await window.payTicket(barCode, PaymentMethod.CASH);
					server.use(
						rest.post('http://localhost:3001/pay-ticket', (req, res, ctx) => {
							return res(
								ctx.json({
									paymentDate: (new Date(2020, 2, 10, 5, 0, 0, 0)).getTime(),
								}),
								ctx.delay(10)
							);
						})
					);
					await window.payTicket(barCode, PaymentMethod.CASH);
					server.use(
						rest.post('http://localhost:3001/get-ticket-state', (req, res, ctx) => {
							return res(
								ctx.json({
									ticketState: TicketState.PAID,
								}),
								ctx.delay(10)
							);
						})
					);
					const ticketState = await window.getTicketState(barCode);
					expect(ticketState).toBe('PAID');
				});
			});
		test('the ticket state of a paid ticket ticket should be UNPAID if more than 15min have passed since the payment',
			async () => {
				renderWithProviders(<App />);
				await act(async () => {
					server.use(
						rest.post('http://localhost:3001/get-ticket', (req, res, ctx) => {
							currentBarCode++;
							return res(
								ctx.json({
									ticket: {
										barCode: currentBarCode.toString(),
										dateOfIssuance: (new Date(2020, 2, 10, 1, 0, 0, 0)).getTime(),
									},
								}),
								ctx.delay(10)
							);
						})
					);
					const barCode = await window.getTicket();
					server.use(
						rest.post('http://localhost:3001/pay-ticket', (req, res, ctx) => {
							return res(
								ctx.json({
									paymentDate: (new Date(2020, 2, 10, 3, 0, 0, 0)).getTime(),
								}),
								ctx.delay(10)
							);
						})
					);
					await window.payTicket(barCode, PaymentMethod.CASH);
					server.use(
						rest.post('http://localhost:3001/pay-ticket', (req, res, ctx) => {
							return res(
								ctx.json({
									paymentDate: (new Date(2020, 2, 10, 5, 0, 0, 0)).getTime(),
								}),
								ctx.delay(10)
							);
						})
					);
					await window.payTicket(barCode, PaymentMethod.CASH);
					server.use(
						rest.post('http://localhost:3001/get-ticket-state', (req, res, ctx) => {
							return res(
								ctx.json({
									ticketState: TicketState.UNPAID,
								}),
								ctx.delay(10)
							);
						})
					);
					const ticketState = await window.getTicketState(barCode);
					expect(ticketState).toBe('UNPAID');
				});
			});
	});
});

describe('getFreeSpaces();', () => {
	const handlers = [
		rest.post('http://localhost:3001/get-ticket', (req, res, ctx) => {
			currentBarCode++;
			return res(
				ctx.json({
					ticket: {
						barCode: currentBarCode.toString(),
						dateOfIssuance: (new Date()).getTime(),
					},
				}),
				ctx.delay(10)
			);
		}),
	];

	const server = setupServer(...handlers);

	// Enable API mocking before tests.
	beforeAll(() => server.listen());

	// Reset any runtime request handlers we may add during the tests.
	afterEach(() => server.resetHandlers());

	// Disable API mocking after the tests are done.
	afterAll(() => server.close());

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
	});
});