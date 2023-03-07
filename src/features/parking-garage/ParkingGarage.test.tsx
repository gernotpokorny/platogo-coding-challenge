import { act, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// components
import { ParkingGarage } from './ParkingGarage';

// mocks
import { rest } from 'msw';
import { setupServer } from 'msw/node';

// utils
import { renderWithProviders } from '../../shared/utils/test-utils';

let currentBarCode = 1223352031944154;

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
	rest.post('http://localhost:3001/checkout-success', (req, res, ctx) => {
		return res(
			ctx.json({
				success: true,
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

it('there should be 54 parking spaces within the parking garage', () => {
	renderWithProviders(
		<ParkingGarage />
	);
	const buttons = screen.getAllByRole('button');
	expect(buttons.length).toBe(54);
});

test('Initially all parking spaces should be free', () => {
	renderWithProviders(
		<ParkingGarage />
	);
	const buttons = screen.getAllByRole('button');
	buttons.forEach(button => {
		expect(button.getAttribute('class')?.split(' ')).toContain('free');
	});
});

test(
	'Click on parking space (park) -> Cancel',
	async () => {
		renderWithProviders(
			<ParkingGarage />
		);

		const button = screen.getByRole('button', {
			name: /16/i,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Welcome');
		const cancelButton = await screen.findByRole('button', {
			name: /^Cancel$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(cancelButton));
		await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('free'));

		const freeSpacesDisplayBoard = screen.getByTestId('free-spaces-display-board');
		expect(freeSpacesDisplayBoard.textContent).toBe('54');
	}
);

test(
	'Click on parking space (park) -> Get Ticket',
	async () => {
		renderWithProviders(
			<ParkingGarage />
		);

		const button = screen.getByRole('button', {
			name: /16/i,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Welcome');
		const getTicketButton = await screen.findByRole('button', {
			name: /^Get Ticket$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(getTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
		await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

		const freeSpacesDisplayBoard = screen.getByTestId('free-spaces-display-board');
		expect(freeSpacesDisplayBoard.textContent).toBe('53');
	}
);

test(
	'Click on parking space (park) -> Get Ticket -> Click on parking space (leave) -> Cancel',
	async () => {
		renderWithProviders(
			<ParkingGarage />
		);

		const button = screen.getByRole('button', {
			name: /16/i,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Welcome');
		const getTicketButton = await screen.findByRole('button', {
			name: /^Get Ticket$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(getTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
		await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Ticket Payment Notice');
		const cancelButton = await screen.findByRole('button', {
			name: /^Cancel$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(cancelButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));
		expect(button.getAttribute('class')?.split(' ')).toContain('occupied');

		const freeSpacesDisplayBoard = screen.getByTestId('free-spaces-display-board');
		expect(freeSpacesDisplayBoard.textContent).toBe('53');
	}
);

test(
	'Click on parking space (park) -> Get Ticket -> Click on parking space (leave) -> Pay Ticket -> Confirm Payment Successful -> Leave',
	async () => {
		renderWithProviders(
			<ParkingGarage />
		);

		const button = screen.getByRole('button', {
			name: /16/i,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Welcome');
		const getTicketButton = await screen.findByRole('button', {
			name: /^Get Ticket$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(getTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
		await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Ticket Payment Notice');
		const payTicketButton = await screen.findByRole('button', {
			name: /^Pay Ticket$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(payTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

		await screen.findByText('Payment Successful');
		const paymentSuccessfulConfirmButton = await screen.findByRole('button', {
			name: /^Confirm$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(paymentSuccessfulConfirmButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Payment Successful'));

		await screen.findByText('Gate Checkout');
		const leaveButton = await screen.findByRole('button', {
			name: /^Leave$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(leaveButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
		await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('free'), { timeout: 2000 });

		const freeSpacesDisplayBoard = screen.getByTestId('free-spaces-display-board');
		expect(freeSpacesDisplayBoard.textContent).toBe('54');

		await screen.findByText('Goodbye!');
		await waitForElementToBeRemoved(() => screen.queryByText('Goodbye!'), { timeout: 5000 });
	},
	10000
);

test(
	'Click on parking space (park) -> Get Ticket -> Click on parking space (leave) -> Pay Ticket -> Confirm Payment Successful -> Stay',
	async () => {
		renderWithProviders(
			<ParkingGarage />
		);

		const button = screen.getByRole('button', {
			name: /16/i,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Welcome');
		const getTicketButton = await screen.findByRole('button', {
			name: /^Get Ticket$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(getTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
		await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Ticket Payment Notice');
		const payTicketButton = await screen.findByRole('button', {
			name: /^Pay Ticket$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(payTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

		await screen.findByText('Payment Successful');
		const paymentSuccessfulConfirmButton = await screen.findByRole('button', {
			name: /^Confirm$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(paymentSuccessfulConfirmButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Payment Successful'));

		await screen.findByText('Gate Checkout');
		const stayButton = await screen.findByRole('button', {
			name: /^Stay$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(stayButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
		expect(button.getAttribute('class')?.split(' ')).toContain('occupied');

		const freeSpacesDisplayBoard = screen.getByTestId('free-spaces-display-board');
		expect(freeSpacesDisplayBoard.textContent).toBe('53');
	},
	10000
);

test(
	`Click on parking space (park) -> Get Ticket -> Click on parking space (leave) -> Pay Ticket -> Confirm Payment Successful -> Stay -> 
	Click on parking space (leave) -> Leave`,
	async () => {
		renderWithProviders(
			<ParkingGarage />
		);

		const button = screen.getByRole('button', {
			name: /16/i,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Welcome');
		const getTicketButton = await screen.findByRole('button', {
			name: /^Get Ticket$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(getTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
		await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Ticket Payment Notice');
		const payTicketButton = await screen.findByRole('button', {
			name: /^Pay Ticket$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(payTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

		await screen.findByText('Payment Successful');
		const paymentSuccessfulConfirmButton = await screen.findByRole('button', {
			name: /^Confirm$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(paymentSuccessfulConfirmButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Payment Successful'));

		await screen.findByText('Gate Checkout');
		const stayButton = await screen.findByRole('button', {
			name: /^Stay$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(stayButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
		expect(button.getAttribute('class')?.split(' ')).toContain('occupied');

		expect(screen.getByTestId('free-spaces-display-board').textContent).toBe('53');

		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Gate Checkout');
		const leaveButton = await screen.findByRole('button', {
			name: /^Leave$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(leaveButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
		await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('free'), { timeout: 2000 });

		expect(screen.getByTestId('free-spaces-display-board').textContent).toBe('54');

		await screen.findByText('Goodbye!');
		await waitForElementToBeRemoved(() => screen.queryByText('Goodbye!'), { timeout: 5000 });
	},
	10000
);

test(
	`Click on parking space (park) -> Get Ticket -> Click on parking space (leave) -> Pay Ticket -> Confirm Payment Successful -> Leave -> 
	Repeat`,
	async () => {
		renderWithProviders(
			<ParkingGarage />
		);
		const button = screen.getByRole('button', {
			name: /16/i,
		});
		await (async () => {
			// eslint-disable-next-line testing-library/no-unnecessary-act
			await act(async () => await userEvent.click(button));

			await screen.findByText('Welcome');
			const getTicketButton = await screen.findByRole('button', {
				name: /^Get Ticket$/,
			});
			// eslint-disable-next-line testing-library/no-unnecessary-act
			await act(async () => await userEvent.click(getTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
			await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

			// eslint-disable-next-line testing-library/no-unnecessary-act
			await act(async () => await userEvent.click(button));

			await screen.findByText('Ticket Payment Notice');
			const payTicketButton = await screen.findByRole('button', {
				name: /^Pay Ticket$/,
			});
			// eslint-disable-next-line testing-library/no-unnecessary-act
			await act(async () => await userEvent.click(payTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

			await screen.findByText('Payment Successful');
			const paymentSuccessfulConfirmButton = await screen.findByRole('button', {
				name: /^Confirm$/,
			});
			// eslint-disable-next-line testing-library/no-unnecessary-act
			await act(async () => await userEvent.click(paymentSuccessfulConfirmButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Payment Successful'));

			await screen.findByText('Gate Checkout');
			const leaveButton = await screen.findByRole('button', {
				name: /^Leave$/,
			});
			// eslint-disable-next-line testing-library/no-unnecessary-act
			await act(async () => await userEvent.click(leaveButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
			await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('free'), { timeout: 2000 });

			const freeSpacesDisplayBoard = screen.getByTestId('free-spaces-display-board');
			expect(freeSpacesDisplayBoard.textContent).toBe('54');

			await screen.findByText('Goodbye!');
			await waitForElementToBeRemoved(() => screen.queryByText('Goodbye!'), { timeout: 5000 });
		})();
		await (async () => {
			// eslint-disable-next-line testing-library/no-unnecessary-act
			await act(async () => await userEvent.click(button));

			await screen.findByText('Welcome');
			const getTicketButton = await screen.findByRole('button', {
				name: /^Get Ticket$/,
			});
			// eslint-disable-next-line testing-library/no-unnecessary-act
			await act(async () => await userEvent.click(getTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
			await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

			// eslint-disable-next-line testing-library/no-unnecessary-act
			await act(async () => await userEvent.click(button));

			await screen.findByText('Ticket Payment Notice');
			const payTicketButton = await screen.findByRole('button', {
				name: /^Pay Ticket$/,
			});
			// eslint-disable-next-line testing-library/no-unnecessary-act
			await act(async () => await userEvent.click(payTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

			await screen.findByText('Payment Successful');
			const paymentSuccessfulConfirmButton = await screen.findByRole('button', {
				name: /^Confirm$/,
			});
			// eslint-disable-next-line testing-library/no-unnecessary-act
			await act(async () => await userEvent.click(paymentSuccessfulConfirmButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Payment Successful'));

			await screen.findByText('Gate Checkout');
			const leaveButton = await screen.findByRole('button', {
				name: /^Leave$/,
			});
			// eslint-disable-next-line testing-library/no-unnecessary-act
			await act(async () => await userEvent.click(leaveButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
			await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('free'), { timeout: 2000 });

			const freeSpacesDisplayBoard = screen.getByTestId('free-spaces-display-board');
			expect(freeSpacesDisplayBoard.textContent).toBe('54');

			await screen.findByText('Goodbye!');
			await waitForElementToBeRemoved(() => screen.queryByText('Goodbye!'), { timeout: 5000 });
		})();
	},
	20000
);

test(
	'Click on parking space (park) -> Get Ticket -> Click on parking space (leave): Ticket price',
	async () => {
		renderWithProviders(
			<ParkingGarage />
		);

		const button = screen.getByRole('button', {
			name: /16/i,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Welcome');
		const getTicketButton = await screen.findByRole('button', {
			name: /^Get Ticket$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(getTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
		await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Ticket Payment Notice');
		await screen.findByText('Ticket price: 2 €');
	}
);

test(
	`Click on parking space (park) -> Get Ticket -> Click on parking space (leave) -> Pay Ticket -> 
	Confirm Payment Successful: Payment receipt`,
	async () => {
		renderWithProviders(
			<ParkingGarage />
		);

		const button = screen.getByRole('button', {
			name: /16/i,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Welcome');
		const getTicketButton = await screen.findByRole('button', {
			name: /^Get Ticket$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(getTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
		await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Ticket Payment Notice');
		const payTicketButton = await screen.findByRole('button', {
			name: /^Pay Ticket$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(payTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

		await screen.findByText('Payment Successful');
		await screen.findByText('Payment receipt:');
		await screen.findByText('Paid: 2€');
		await screen.findByText(/^.*, \d\d\.\s.*\s\d\d\d\d\sum\s\d\d:\d\d:\d\d$/);
		await screen.findByText('Payment method: CASH');
	}
);

test(
	'Click on parking space (park) -> Get Ticket -> Click on parking space after 60 min 00 sec (leave): Ticket price (2€)',
	async () => {
		renderWithProviders(
			<ParkingGarage />
		);

		const button = screen.getByRole('button', {
			name: /16/i,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Welcome');
		const getTicketButton = await screen.findByRole('button', {
			name: /^Get Ticket$/,
		});
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
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(getTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
		await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

		const dateNowSpy = jest.spyOn(Date, 'now')
			.mockImplementation(() => new Date(2020, 2, 10, 2, 0, 0, 0).getTime());
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));
		dateNowSpy.mockRestore();

		await screen.findByText('Ticket Payment Notice');
		await screen.findByText('Ticket price: 2 €');
	}
);

test(
	'Click on parking space (park) -> Get Ticket -> Click on parking space after 60 min 01 sec (leave): Ticket price (4€)',
	async () => {
		renderWithProviders(
			<ParkingGarage />
		);

		const button = screen.getByRole('button', {
			name: /16/i,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Welcome');
		const getTicketButton = await screen.findByRole('button', {
			name: /^Get Ticket$/,
		});
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
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(getTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
		await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

		const dateNowSpy = jest.spyOn(Date, 'now')
			.mockImplementation(() => new Date(2020, 2, 10, 2, 0, 1, 0).getTime());
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));
		dateNowSpy.mockRestore();

		await screen.findByText('Ticket Payment Notice');
		await screen.findByText('Ticket price: 4 €');
	}
);

test(
	`Click on parking space (park) -> Get Ticket -> Click on parking space (leave) -> Pay Ticket after 60 min 00 sec -> 
	Confirm Payment Successful: Payment receipt`,
	async () => {
		renderWithProviders(
			<ParkingGarage />
		);

		const button = screen.getByRole('button', {
			name: /16/i,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Welcome');
		const getTicketButton = await screen.findByRole('button', {
			name: /^Get Ticket$/,
		});
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
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(getTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
		await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Ticket Payment Notice');
		const payTicketButton = await screen.findByRole('button', {
			name: /^Pay Ticket$/,
		});

		server.use(
			rest.post('http://localhost:3001/pay-ticket', (req, res, ctx) => {
				return res(
					ctx.json({
						paymentDate: (new Date(2020, 2, 10, 2, 0, 0, 0)).getTime(),
					}),
					ctx.delay(10)
				);
			})
		);
		const dateNowSpyCalculatePrice = jest.spyOn(Date, 'now')
			.mockImplementation(() => new Date(2020, 2, 10, 2, 0, 1, 0).getTime());
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(payTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

		await screen.findByText('Payment Successful');
		await screen.findByText('Payment receipt:');
		await screen.findByText('Paid: 2€');
		await screen.findByText('Payment date: Dienstag, 10. März 2020 um 02:00:00');
		await screen.findByText('Payment method: CASH');
		dateNowSpyCalculatePrice.mockRestore();
	}
);

test(
	`Click on parking space (park) -> Get Ticket -> Click on parking space (leave) -> Pay Ticket after 60 min 01 sec -> 
	Confirm Payment Successful: Payment receipt`,
	async () => {
		renderWithProviders(
			<ParkingGarage />
		);

		const button = screen.getByRole('button', {
			name: /16/i,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Welcome');
		const getTicketButton = await screen.findByRole('button', {
			name: /^Get Ticket$/,
		});
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
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(getTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
		await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Ticket Payment Notice');
		const payTicketButton = await screen.findByRole('button', {
			name: /^Pay Ticket$/,
		});

		server.use(
			rest.post('http://localhost:3001/pay-ticket', (req, res, ctx) => {
				return res(
					ctx.json({
						paymentDate: (new Date(2020, 2, 10, 2, 0, 1, 0)).getTime(),
					}),
					ctx.delay(10)
				);
			})
		);
		const dateNowSpyCalculatePrice = jest.spyOn(Date, 'now')
			.mockImplementation(() => new Date(2020, 2, 10, 2, 0, 2, 0).getTime());
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(payTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

		await screen.findByText('Payment Successful');
		await screen.findByText('Payment receipt:');
		await screen.findByText('Paid: 4€');
		await screen.findByText('Payment date: Dienstag, 10. März 2020 um 02:00:01');
		await screen.findByText('Payment method: CASH');
		dateNowSpyCalculatePrice.mockRestore();
	}
);

test(
	`Click on parking space (park) -> Get Ticket -> Click on parking space (leave) -> Pay Ticket -> Confirm Payment Successful -> Stay -> 
	Click on parking space (leave) 15 min 00 sec after payment -> Leave`,
	async () => {
		renderWithProviders(
			<ParkingGarage />
		);

		const button = screen.getByRole('button', {
			name: /16/i,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Welcome');
		const getTicketButton = await screen.findByRole('button', {
			name: /^Get Ticket$/,
		});
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
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(getTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
		await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Ticket Payment Notice');
		const payTicketButton = await screen.findByRole('button', {
			name: /^Pay Ticket$/,
		});
		server.use(
			rest.post('http://localhost:3001/pay-ticket', (req, res, ctx) => {
				return res(
					ctx.json({
						paymentDate: (new Date(2020, 2, 10, 1, 5, 0, 0)).getTime(),
					}),
					ctx.delay(10)
				);
			})
		);
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(payTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

		await screen.findByText('Payment Successful');
		const paymentSuccessfulConfirmButton = await screen.findByRole('button', {
			name: /^Confirm$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(paymentSuccessfulConfirmButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Payment Successful'));

		await screen.findByText('Gate Checkout');
		const stayButton = await screen.findByRole('button', {
			name: /^Stay$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(stayButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
		expect(button.getAttribute('class')?.split(' ')).toContain('occupied');

		expect(screen.getByTestId('free-spaces-display-board').textContent).toBe('53');

		// eslint-disable-next-line testing-library/no-unnecessary-act
		const dateNowSpyLeave = jest.spyOn(Date, 'now')
			.mockImplementation(() => new Date(2020, 2, 10, 1, 20, 0, 0).getTime());
		await act(async () => await userEvent.click(button));
		dateNowSpyLeave.mockRestore();

		await screen.findByText('Gate Checkout');
		const leaveButton = await screen.findByRole('button', {
			name: /^Leave$/,
		});
		const dateNowSpyAfterLeaveClicked = jest.spyOn(Date, 'now')
			.mockImplementation(() => new Date(2020, 2, 10, 1, 20, 0, 0).getTime());
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(leaveButton));
		dateNowSpyAfterLeaveClicked.mockRestore();
		await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
		await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('free'), { timeout: 2000 });

		expect(screen.getByTestId('free-spaces-display-board').textContent).toBe('54');

		await screen.findByText('Goodbye!');
		await waitForElementToBeRemoved(() => screen.queryByText('Goodbye!'), { timeout: 5000 });
	},
	12000
);

test(
	`Click on parking space (park) -> Get Ticket -> Click on parking space (leave) -> Pay Ticket -> Confirm Payment Successful -> Stay -> 
	Click on parking space (leave) 15 min 01 sec after payment -> Pay Ticket (2€) -> Confirm Payment Successful -> Leave`,
	async () => {
		renderWithProviders(
			<ParkingGarage />
		);

		const button = screen.getByRole('button', {
			name: /16/i,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Welcome');
		const getTicketButton = await screen.findByRole('button', {
			name: /^Get Ticket$/,
		});
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
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(getTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
		await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Ticket Payment Notice');
		const payTicketButton = await screen.findByRole('button', {
			name: /^Pay Ticket$/,
		});
		server.use(
			rest.post('http://localhost:3001/pay-ticket', (req, res, ctx) => {
				return res(
					ctx.json({
						paymentDate: (new Date(2020, 2, 10, 1, 5, 0, 0)).getTime(),
					}),
					ctx.delay(10)
				);
			})
		);
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(payTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

		await screen.findByText('Payment Successful');
		const paymentSuccessfulConfirmButton = await screen.findByRole('button', {
			name: /^Confirm$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(paymentSuccessfulConfirmButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Payment Successful'));

		await screen.findByText('Gate Checkout');
		const stayButton = await screen.findByRole('button', {
			name: /^Stay$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(stayButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
		expect(button.getAttribute('class')?.split(' ')).toContain('occupied');

		expect(screen.getByTestId('free-spaces-display-board').textContent).toBe('53');

		// eslint-disable-next-line testing-library/no-unnecessary-act
		const dateNowSpyLeave = jest.spyOn(Date, 'now')
			.mockImplementation(() => new Date(2020, 2, 10, 1, 20, 1, 0).getTime());
		await act(async () => await userEvent.click(button));
		dateNowSpyLeave.mockRestore();

		await screen.findByText('Ticket Payment Notice');
		await screen.findByText('Ticket price: 2 €');
		await screen.findByText('15 minutes have passed since your last payment.');
		server.use(
			rest.post('http://localhost:3001/pay-ticket', (req, res, ctx) => {
				return res(
					ctx.json({
						paymentDate: (new Date(2020, 2, 10, 1, 20, 1, 0)).getTime(),
					}),
					ctx.delay(10)
				);
			})
		);
		const payTicketButton1 = await screen.findByRole('button', {
			name: /^Pay Ticket$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(payTicketButton1));
		await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

		await screen.findByText('Payment Successful');
		const paymentSuccessfulConfirmButton1 = await screen.findByRole('button', {
			name: /^Confirm$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(paymentSuccessfulConfirmButton1));
		await waitForElementToBeRemoved(() => screen.queryByText('Payment Successful'));

		await screen.findByText('Gate Checkout');
		const leaveButton = await screen.findByRole('button', {
			name: /^Leave$/,
		});
		const dateNowSpyAfterLeaveClicked = jest.spyOn(Date, 'now')
			.mockImplementation(() => new Date(2020, 2, 10, 1, 20, 1, 0).getTime());
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(leaveButton));
		dateNowSpyAfterLeaveClicked.mockRestore();
		await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
		await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('free'), { timeout: 2000 });

		expect(screen.getByTestId('free-spaces-display-board').textContent).toBe('54');

		await screen.findByText('Goodbye!');
		await waitForElementToBeRemoved(() => screen.queryByText('Goodbye!'), { timeout: 5000 });
	},
	12000
);

test(
	`Click on parking space (park) -> Get Ticket -> Click on parking space (leave) -> Pay Ticket -> Confirm Payment Successful -> Stay -> 
	Click on parking space (leave) 60 min 00 sec after payment -> Pay Ticket (2€) -> Confirm Payment Successful -> Leave`,
	async () => {
		renderWithProviders(
			<ParkingGarage />
		);

		const button = screen.getByRole('button', {
			name: /16/i,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Welcome');
		const getTicketButton = await screen.findByRole('button', {
			name: /^Get Ticket$/,
		});
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
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(getTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
		await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Ticket Payment Notice');
		const payTicketButton = await screen.findByRole('button', {
			name: /^Pay Ticket$/,
		});
		server.use(
			rest.post('http://localhost:3001/pay-ticket', (req, res, ctx) => {
				return res(
					ctx.json({
						paymentDate: (new Date(2020, 2, 10, 1, 5, 0, 0)).getTime(),
					}),
					ctx.delay(10)
				);
			})
		);
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(payTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

		await screen.findByText('Payment Successful');
		const paymentSuccessfulConfirmButton = await screen.findByRole('button', {
			name: /^Confirm$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(paymentSuccessfulConfirmButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Payment Successful'));

		await screen.findByText('Gate Checkout');
		const stayButton = await screen.findByRole('button', {
			name: /^Stay$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(stayButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
		expect(button.getAttribute('class')?.split(' ')).toContain('occupied');

		expect(screen.getByTestId('free-spaces-display-board').textContent).toBe('53');

		// eslint-disable-next-line testing-library/no-unnecessary-act
		const dateNowSpyLeave = jest.spyOn(Date, 'now')
			.mockImplementation(() => new Date(2020, 2, 10, 2, 5, 0, 0).getTime());
		await act(async () => await userEvent.click(button));
		dateNowSpyLeave.mockRestore();

		await screen.findByText('Ticket Payment Notice');
		await screen.findByText('Ticket price: 2 €');
		await screen.findByText('15 minutes have passed since your last payment.');
		server.use(
			rest.post('http://localhost:3001/pay-ticket', (req, res, ctx) => {
				return res(
					ctx.json({
						paymentDate: (new Date(2020, 2, 10, 2, 5, 0, 0)).getTime(),
					}),
					ctx.delay(10)
				);
			})
		);
		const payTicketButton1 = await screen.findByRole('button', {
			name: /^Pay Ticket$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(payTicketButton1));
		await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

		await screen.findByText('Payment Successful');
		const paymentSuccessfulConfirmButton1 = await screen.findByRole('button', {
			name: /^Confirm$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(paymentSuccessfulConfirmButton1));
		await waitForElementToBeRemoved(() => screen.queryByText('Payment Successful'));

		await screen.findByText('Gate Checkout');
		const leaveButton = await screen.findByRole('button', {
			name: /^Leave$/,
		});
		const dateNowSpyAfterLeaveClicked = jest.spyOn(Date, 'now')
			.mockImplementation(() => new Date(2020, 2, 10, 2, 5, 0, 0).getTime());
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(leaveButton));
		dateNowSpyAfterLeaveClicked.mockRestore();
		await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
		await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('free'), { timeout: 2000 });

		expect(screen.getByTestId('free-spaces-display-board').textContent).toBe('54');

		await screen.findByText('Goodbye!');
		await waitForElementToBeRemoved(() => screen.queryByText('Goodbye!'), { timeout: 5000 });
	},
	12000
);

test(
	`Click on parking space (park) -> Get Ticket -> Click on parking space (leave) -> Pay Ticket -> Confirm Payment Successful -> Stay -> 
	Click on parking space (leave) 60 min 01 sec after payment -> Pay Ticket (4€) -> Confirm Payment Successful -> Leave`,
	async () => {
		renderWithProviders(
			<ParkingGarage />
		);

		const button = screen.getByRole('button', {
			name: /16/i,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Welcome');
		const getTicketButton = await screen.findByRole('button', {
			name: /^Get Ticket$/,
		});
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
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(getTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
		await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Ticket Payment Notice');
		const payTicketButton = await screen.findByRole('button', {
			name: /^Pay Ticket$/,
		});
		server.use(
			rest.post('http://localhost:3001/pay-ticket', (req, res, ctx) => {
				return res(
					ctx.json({
						paymentDate: (new Date(2020, 2, 10, 1, 5, 0, 0)).getTime(),
					}),
					ctx.delay(10)
				);
			})
		);
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(payTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

		await screen.findByText('Payment Successful');
		const paymentSuccessfulConfirmButton = await screen.findByRole('button', {
			name: /^Confirm$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(paymentSuccessfulConfirmButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Payment Successful'));

		await screen.findByText('Gate Checkout');
		const stayButton = await screen.findByRole('button', {
			name: /^Stay$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(stayButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
		expect(button.getAttribute('class')?.split(' ')).toContain('occupied');

		expect(screen.getByTestId('free-spaces-display-board').textContent).toBe('53');

		// eslint-disable-next-line testing-library/no-unnecessary-act
		const dateNowSpyLeave = jest.spyOn(Date, 'now')
			.mockImplementation(() => new Date(2020, 2, 10, 2, 5, 1, 0).getTime());
		await act(async () => await userEvent.click(button));
		dateNowSpyLeave.mockRestore();

		await screen.findByText('Ticket Payment Notice');
		await screen.findByText('Ticket price: 4 €');
		await screen.findByText('15 minutes have passed since your last payment.');
		server.use(
			rest.post('http://localhost:3001/pay-ticket', (req, res, ctx) => {
				return res(
					ctx.json({
						paymentDate: (new Date(2020, 2, 10, 2, 5, 1, 0)).getTime(),
					}),
					ctx.delay(10)
				);
			})
		);
		const payTicketButton1 = await screen.findByRole('button', {
			name: /^Pay Ticket$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(payTicketButton1));
		await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

		await screen.findByText('Payment Successful');
		const paymentSuccessfulConfirmButton1 = await screen.findByRole('button', {
			name: /^Confirm$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(paymentSuccessfulConfirmButton1));
		await waitForElementToBeRemoved(() => screen.queryByText('Payment Successful'));

		await screen.findByText('Gate Checkout');
		const leaveButton = await screen.findByRole('button', {
			name: /^Leave$/,
		});
		const dateNowSpyAfterLeaveClicked = jest.spyOn(Date, 'now')
			.mockImplementation(() => new Date(2020, 2, 10, 2, 5, 1, 0).getTime());
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(leaveButton));
		dateNowSpyAfterLeaveClicked.mockRestore();
		await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
		await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('free'), { timeout: 2000 });

		expect(screen.getByTestId('free-spaces-display-board').textContent).toBe('54');

		await screen.findByText('Goodbye!');
		await waitForElementToBeRemoved(() => screen.queryByText('Goodbye!'), { timeout: 5000 });
	},
	12000
);

test(
	`Click on parking space (park) -> Get Ticket -> Click on parking space (leave) -> Pay Ticket -> Confirm Payment Successful ->
	Wait more then 15 min -> Leave: "Not Paid Enough" Dialog should appear`,
	async () => {
		renderWithProviders(
			<ParkingGarage />
		);

		const button = screen.getByRole('button', {
			name: /16/i,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Welcome');
		const getTicketButton = await screen.findByRole('button', {
			name: /^Get Ticket$/,
		});
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
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(getTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
		await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Ticket Payment Notice');
		const payTicketButton = await screen.findByRole('button', {
			name: /^Pay Ticket$/,
		});
		server.use(
			rest.post('http://localhost:3001/pay-ticket', (req, res, ctx) => {
				return res(
					ctx.json({
						paymentDate: (new Date(2020, 2, 10, 2, 0, 0, 0)).getTime(),
					}),
					ctx.delay(10)
				);
			})
		);
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(payTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

		await screen.findByText('Payment Successful');
		const paymentSuccessfulConfirmButton = await screen.findByRole('button', {
			name: /^Confirm$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(paymentSuccessfulConfirmButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Payment Successful'));

		await screen.findByText('Gate Checkout');
		const leaveButton = await screen.findByRole('button', {
			name: /^Leave$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		const dateNowSpyLeave = jest.spyOn(Date, 'now')
			.mockImplementation(() => new Date(2020, 2, 10, 2, 15, 1, 0).getTime());
		await act(async () => await userEvent.click(leaveButton));
		dateNowSpyLeave.mockRestore();
		await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
		await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'), { timeout: 2000 });

		const freeSpacesDisplayBoard = screen.getByTestId('free-spaces-display-board');
		expect(freeSpacesDisplayBoard.textContent).toBe('53');

		await screen.findByText('Not Paid Enough');
		const notPayedEnoughConfirmButton = await screen.findByRole('button', {
			name: /^Confirm$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(notPayedEnoughConfirmButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Not Paid Enough'));
	},
	10000
);

test(
	`Click on parking space (park) -> Get Ticket -> Click on parking space (leave) -> Pay Ticket -> Confirm Payment Successful -> Stay -> 
	Click on parking space (leave) 15 min 00 sec after payment -> Leave 15 min 01 sec after payment`,
	async () => {
		renderWithProviders(
			<ParkingGarage />
		);

		const button = screen.getByRole('button', {
			name: /16/i,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Welcome');
		const getTicketButton = await screen.findByRole('button', {
			name: /^Get Ticket$/,
		});
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
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(getTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
		await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(button));

		await screen.findByText('Ticket Payment Notice');
		const payTicketButton = await screen.findByRole('button', {
			name: /^Pay Ticket$/,
		});
		server.use(
			rest.post('http://localhost:3001/pay-ticket', (req, res, ctx) => {
				return res(
					ctx.json({
						paymentDate: (new Date(2020, 2, 10, 1, 5, 0, 0)).getTime(),
					}),
					ctx.delay(10)
				);
			})
		);
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(payTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

		await screen.findByText('Payment Successful');
		const paymentSuccessfulConfirmButton = await screen.findByRole('button', {
			name: /^Confirm$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(paymentSuccessfulConfirmButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Payment Successful'));

		await screen.findByText('Gate Checkout');
		const stayButton = await screen.findByRole('button', {
			name: /^Stay$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(stayButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
		expect(button.getAttribute('class')?.split(' ')).toContain('occupied');

		expect(screen.getByTestId('free-spaces-display-board').textContent).toBe('53');

		// eslint-disable-next-line testing-library/no-unnecessary-act
		const dateNowSpyLeave = jest.spyOn(Date, 'now')
			.mockImplementation(() => new Date(2020, 2, 10, 1, 20, 0, 0).getTime());
		await act(async () => await userEvent.click(button));
		dateNowSpyLeave.mockRestore();

		await screen.findByText('Gate Checkout');
		const leaveButton = await screen.findByRole('button', {
			name: /^Leave$/,
		});
		const dateNowSpyAfterLeaveClicked = jest.spyOn(Date, 'now')
			.mockImplementation(() => new Date(2020, 2, 10, 1, 20, 1, 0).getTime());
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(leaveButton));
		dateNowSpyAfterLeaveClicked.mockRestore();
		await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
		await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'), { timeout: 2000 });

		const freeSpacesDisplayBoard = screen.getByTestId('free-spaces-display-board');
		expect(freeSpacesDisplayBoard.textContent).toBe('53');

		await screen.findByText('Not Paid Enough');
		const notPayedEnoughConfirmButton = await screen.findByRole('button', {
			name: /^Confirm$/,
		});
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => await userEvent.click(notPayedEnoughConfirmButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Not Paid Enough'));
	},
	12000
);