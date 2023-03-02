import { act, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// components
import { ParkingGarage } from './ParkingGarage';

// utils
import { renderWithProviders } from '../../shared/utils/test-utils';

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
	}
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