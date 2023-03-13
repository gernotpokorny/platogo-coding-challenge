import React from 'react';

// components
import App from '../App';

// constants
import { PARKING_CAPACITY, ErrorCode, PaymentMethod } from '../features/parking-garage/parkingGarageSlice';

// types
import { CalculatePricePaidTicketReturnValue } from '../features/parking-garage/parkingGarageSlice';

// utils
import { act, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../shared/utils/test-utils';
import { execSync, exec } from 'child_process';
import { dockerCommand } from 'docker-cli-js';

let isContainerStarted = false;
let containerId: string | null = null;

beforeEach(async () => {
	const imageId = process.env.REACT_APP_E2E_TEST_IMAGE_ID;
	if (imageId !== undefined) {
		exec(`docker run --privileged -p 3001:3001 ${imageId}`);
		while (!isContainerStarted) {
			const data = await dockerCommand('ps', { echo: false });
			for (let i = 0; i < data.containerList.length; i++) {
				const container = data.containerList[i];
				if (imageId.startsWith(container.image)) {
					isContainerStarted = true;
					containerId = container['container id'];
					break;
				}
			}
		}
		await new Promise(r => setTimeout(r, 2000));
	}
	else {
		throw new Error('REACT_APP_E2E_TEST_IMAGE_ID is undefined');
	}
});

afterEach(() => {
	execSync(`docker stop ${containerId}`);
	isContainerStarted = false;
	containerId = null;
});

describe('The functions should be executable from the developer console', () => {
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
					expect(((error || {}) as Error).message).toBe(ErrorCode.FULL_PARKING_GARAGE); // eslint-disable-line jest/no-conditional-expect
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
					const price = await window.calculatePrice(barCode);
					expect(price).toBe(2);
				});
			});
			test('Every started hour costs 2 Eur more: 60 min 00 sec passed: price should be 2', async () => {
				renderWithProviders(<App />);
				await act(async () => {
					execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 01:00:00 CET"`);
					const barCode = await window.getTicket();
					execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 01:59:55 CET"`);
					const price = await window.calculatePrice(barCode);
					expect(price).toBe(2);
				});
			});
			test('Every started hour costs 2 Eur more: 60 min 01 sec passed: price should be 4', async () => {
				renderWithProviders(<App />);
				await act(async () => {
					execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 01:00:00 CET"`);
					const barCode = await window.getTicket();
					execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 02:00:05 CET"`);
					const price = await window.calculatePrice(barCode);
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
								execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 01:00:05 CET"`);
								const barCode = await window.getTicket();
								execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 04:00:00 CET"`);
								await window.payTicket(barCode, PaymentMethod.CASH);
								execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 04:14:55 CET"`);
								const price = await window.calculatePrice(barCode);
								expect(Object.prototype.hasOwnProperty.call(price, 'ticketPrice')).toBe(true);
								expect(Object.prototype.hasOwnProperty.call(price, 'paymentReceipt')).toBe(true);
								expect((price as unknown as CalculatePricePaidTicketReturnValue).ticketPrice).toBe(0);
								expect((price as unknown as CalculatePricePaidTicketReturnValue).paymentReceipt).toBeDefined();
								expect((price as unknown as CalculatePricePaidTicketReturnValue).paymentReceipt![0])
									.toStrictEqual('Paid: 6€');
								expect((price as unknown as CalculatePricePaidTicketReturnValue).paymentReceipt![1])
									.toMatch(/Payment date: Dienstag, 10\. März 2020 um \d\d:\d\d:\d\d/);
								expect((price as unknown as CalculatePricePaidTicketReturnValue).paymentReceipt![2])
									.toStrictEqual('Payment method: CASH');
							});
						}
					);
				});
				describe('multiple payments', () => {
					test('15 min 00 sec passed since last payment: the calculated price should be 0 and a payment receipt should be returned',
						async () => {
							renderWithProviders(<App />);
							await act(async () => {
								execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 01:00:00 CET"`);
								const barCode = await window.getTicket();
								execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 04:00:05 CET"`);
								await window.payTicket(barCode, PaymentMethod.CASH);
								execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 05:00:00 CET"`);
								await window.payTicket(barCode, PaymentMethod.CASH);
								execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 05:14:55 CET"`);
								const price = await window.calculatePrice(barCode);
								expect(Object.prototype.hasOwnProperty.call(price, 'ticketPrice')).toBe(true);
								expect(Object.prototype.hasOwnProperty.call(price, 'paymentReceipt')).toBe(true);
								expect((price as unknown as CalculatePricePaidTicketReturnValue).ticketPrice).toBe(0);
								expect((price as unknown as CalculatePricePaidTicketReturnValue).paymentReceipt).toBeDefined();
								expect((price as unknown as CalculatePricePaidTicketReturnValue).paymentReceipt![0])
									.toStrictEqual('Paid: 2€');
								expect((price as unknown as CalculatePricePaidTicketReturnValue).paymentReceipt![1])
									.toMatch(/Payment date: Dienstag, 10\. März 2020 um \d\d:\d\d:\d\d/);
								expect((price as unknown as CalculatePricePaidTicketReturnValue).paymentReceipt![2])
									.toStrictEqual('Payment method: CASH');
							});
						}
					);
				});
			});
			describe('> 15 min have passed since last payment', () => {
				describe('one payment', () => {
					test('First hour price since the last payment should be 2', async () => {
						renderWithProviders(<App />);
						await act(async () => {
							execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 00:00:00 CET"`);
							const barCode = await window.getTicket();
							execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 03:00:00 CET"`);
							await window.payTicket(barCode, PaymentMethod.CASH);
							execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 03:15:05 CET"`);
							const price = await window.calculatePrice(barCode);
							expect(price).toBe(2);
						});
					});
					test('Every started hour since the last payment costs 2 Eur more: 60 min 00 sec passed', async () => {
						renderWithProviders(<App />);
						await act(async () => {
							execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 00:00:00 CET"`);
							const barCode = await window.getTicket();
							execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 03:00:00 CET"`);
							await window.payTicket(barCode, PaymentMethod.CASH);
							execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 03:59:55 CET"`);
							const price = await window.calculatePrice(barCode);
							expect(price).toBe(2);
						});
					});
					test('Every started hour since the last payment costs 2 Eur more: 60 min 01 sec passed', async () => {
						renderWithProviders(<App />);
						await act(async () => {
							execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 00:00:00 CET"`);
							const barCode = await window.getTicket();
							execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 05:00:00 CET"`);
							await window.payTicket(barCode, PaymentMethod.CASH);
							execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 06:00:05 CET"`);
							const price = await window.calculatePrice(barCode);
							expect(price).toBe(4);
						});
					});
				});
				describe('multiple payments', () => {
					test('First hour price since the last payment should be 2', async () => {
						renderWithProviders(<App />);
						await act(async () => {
							execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 00:00:00 CET"`);
							const barCode = await window.getTicket();
							execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 03:00:00 CET"`);
							await window.payTicket(barCode, PaymentMethod.CASH);
							execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 07:00:00 CET"`);
							await window.payTicket(barCode, PaymentMethod.CASH);
							execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 07:15:05 CET"`);
							const price = await window.calculatePrice(barCode);
							expect(price).toBe(2);
						});
					});
					test('Every started hour since the last payment costs 2 Eur more: 60 min 00 sec passed', async () => {
						renderWithProviders(<App />);
						await act(async () => {
							execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 00:00:00 CET"`);
							const barCode = await window.getTicket();
							execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 03:00:00 CET"`);
							await window.payTicket(barCode, PaymentMethod.CASH);
							execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 07:00:00 CET"`);
							await window.payTicket(barCode, PaymentMethod.CASH);
							execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 07:59:55 CET"`);
							const price = await window.calculatePrice(barCode);
							expect(price).toBe(2);
						});
					});
					test('Every started hour since the last payment costs 2 Eur more: 60 min 01 sec passed', async () => {
						renderWithProviders(<App />);
						await act(async () => {
							execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 00:00:00 CET"`);
							const barCode = await window.getTicket();
							execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 03:00:00 CET"`);
							await window.payTicket(barCode, PaymentMethod.CASH);
							execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 07:00:00 CET"`);
							await window.payTicket(barCode, PaymentMethod.CASH);
							execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 08:00:05 CET"`);
							const price = await window.calculatePrice(barCode);
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
						const ticketState = await window.getTicketState(barCode);
						expect(ticketState).toBe('PAID');
					});
				}
			);
			test('the ticket state of a paid ticket ticket should be PAID if not more than 15min have passed since the payment: 15 min',
				async () => {
					renderWithProviders(<App />);
					await act(async () => {
						execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 01:00:00 CET"`);
						const barCode = await window.getTicket();
						execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 03:00:00 CET"`);
						await window.payTicket(barCode, PaymentMethod.CASH);
						execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 03:14:55 CET"`);
						const ticketState = await window.getTicketState(barCode);
						expect(ticketState).toBe('PAID');
					});
				}
			);
			test('the ticket state of a paid ticket ticket should be UNPAID if more than 15min have passed since the payment',
				async () => {
					renderWithProviders(<App />);
					await act(async () => {
						execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 01:00:00 CET"`);
						const barCode = await window.getTicket();
						execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 03:00:00 CET"`);
						await window.payTicket(barCode, PaymentMethod.CASH);
						execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 03:15:05 CET"`);
						const ticketState = await window.getTicketState(barCode);
						expect(ticketState).toBe('UNPAID');
					});
				}
			);
		});
		describe('multiple payments', () => {
			test('the ticket state of a paid ticket ticket should be PAID if not more than 15min have passed since the payment',
				async () => {
					renderWithProviders(<App />);
					await act(async () => {
						const barCode = await window.getTicket();
						await window.payTicket(barCode, PaymentMethod.CASH);
						await window.payTicket(barCode, PaymentMethod.CASH);
						const ticketState = await window.getTicketState(barCode);
						expect(ticketState).toBe('PAID');
					});
				}
			);
			test('the ticket state of a paid ticket ticket should be PAID if not more than 15min have passed since the payment: 15 min',
				async () => {
					renderWithProviders(<App />);
					await act(async () => {
						execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 01:00:00 CET"`);
						const barCode = await window.getTicket();
						execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 03:00:00 CET"`);
						await window.payTicket(barCode, PaymentMethod.CASH);
						execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 05:00:00 CET"`);
						await window.payTicket(barCode, PaymentMethod.CASH);
						execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 05:14:55 CET"`);
						const ticketState = await window.getTicketState(barCode);
						expect(ticketState).toBe('PAID');
					});
				}
			);
			test('the ticket state of a paid ticket ticket should be UNPAID if more than 15min have passed since the payment',
				async () => {
					renderWithProviders(<App />);
					await act(async () => {
						execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 01:00:00 CET"`);
						const barCode = await window.getTicket();
						execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 03:00:00 CET"`);
						await window.payTicket(barCode, PaymentMethod.CASH);
						execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 05:00:00 CET"`);
						await window.payTicket(barCode, PaymentMethod.CASH);
						execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 05:15:05 CET"`);
						const ticketState = await window.getTicketState(barCode);
						expect(ticketState).toBe('UNPAID');
					});
				}
			);
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
		});
	});
});

describe('Parking Garage', () => {
	it('there should be 54 parking spaces within the parking garage', () => {
		renderWithProviders(
			<App />
		);
		const buttons = screen.getAllByRole('button');
		expect(buttons.length).toBe(54);
	});

	test('Initially all parking spaces should be free', () => {
		renderWithProviders(
			<App />
		);
		const buttons = screen.getAllByRole('button');
		buttons.forEach(button => {
			expect(button.getAttribute('class')?.split(' ')).toContain('free');
		});
	});

	test('Click on parking space (park) -> Cancel', async () => {
		renderWithProviders(
			<App />
		);

		const button = screen.getByRole('button', {
			name: /16/i,
		});
		await act(async () => await userEvent.click(button));

		await screen.findByText('Welcome');
		const cancelButton = await screen.findByRole('button', {
			name: /^Cancel$/,
		});
		await act(async () => await userEvent.click(cancelButton));
		await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('free'));

		const freeSpacesDisplayBoard = screen.getByTestId('free-spaces-display-board');
		expect(freeSpacesDisplayBoard.textContent).toBe('54');
	}
	);

	test('Click on parking space (park) -> Get Ticket', async () => {
		renderWithProviders(
			<App />
		);

		const button = screen.getByRole('button', {
			name: /16/i,
		});
		await act(async () => await userEvent.click(button));

		await screen.findByText('Welcome');
		const getTicketButton = await screen.findByRole('button', {
			name: /^Get Ticket$/,
		});
		await act(async () => await userEvent.click(getTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
		await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

		const freeSpacesDisplayBoard = screen.getByTestId('free-spaces-display-board');
		expect(freeSpacesDisplayBoard.textContent).toBe('53');
	}
	);

	test('Click on parking space (park) -> Get Ticket -> Click on parking space (leave) -> Cancel', async () => {
		renderWithProviders(
			<App />
		);

		const button = screen.getByRole('button', {
			name: /16/i,
		});
		await act(async () => await userEvent.click(button));

		await screen.findByText('Welcome');
		const getTicketButton = await screen.findByRole('button', {
			name: /^Get Ticket$/,
		});
		await act(async () => await userEvent.click(getTicketButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
		await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

		await act(async () => await userEvent.click(button));

		await screen.findByText('Ticket Payment Notice');
		const cancelButton = await screen.findByRole('button', {
			name: /^Cancel$/,
		});
		await act(async () => await userEvent.click(cancelButton));
		await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));
		expect(button.getAttribute('class')?.split(' ')).toContain('occupied');

		const freeSpacesDisplayBoard = screen.getByTestId('free-spaces-display-board');
		expect(freeSpacesDisplayBoard.textContent).toBe('53');
	}
	);

	test('Click on parking space (park) -> Get Ticket -> Click on parking space (leave) -> Pay Ticket -> Confirm Payment Successful -> Leave',
		async () => {
			renderWithProviders(
				<App />
			);

			const button = screen.getByRole('button', {
				name: /16/i,
			});
			await act(async () => await userEvent.click(button));

			await screen.findByText('Welcome');
			const getTicketButton = await screen.findByRole('button', {
				name: /^Get Ticket$/,
			});
			await act(async () => await userEvent.click(getTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
			await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

			await act(async () => await userEvent.click(button));

			await screen.findByText('Ticket Payment Notice');
			const payTicketButton = await screen.findByRole('button', {
				name: /^Pay Ticket$/,
			});
			await act(async () => await userEvent.click(payTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

			await screen.findByText('Payment Successful');
			const paymentSuccessfulConfirmButton = await screen.findByRole('button', {
				name: /^Confirm$/,
			});
			await act(async () => await userEvent.click(paymentSuccessfulConfirmButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Payment Successful'));

			await screen.findByText('Gate Checkout');
			const leaveButton = await screen.findByRole('button', {
				name: /^Leave$/,
			});
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

	test('Click on parking space (park) -> Get Ticket -> Click on parking space (leave) -> Pay Ticket -> Confirm Payment Successful -> Stay',
		async () => {
			renderWithProviders(
				<App />
			);

			const button = screen.getByRole('button', {
				name: /16/i,
			});
			await act(async () => await userEvent.click(button));

			await screen.findByText('Welcome');
			const getTicketButton = await screen.findByRole('button', {
				name: /^Get Ticket$/,
			});
			await act(async () => await userEvent.click(getTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
			await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

			await act(async () => await userEvent.click(button));

			await screen.findByText('Ticket Payment Notice');
			const payTicketButton = await screen.findByRole('button', {
				name: /^Pay Ticket$/,
			});
			await act(async () => await userEvent.click(payTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

			await screen.findByText('Payment Successful');
			const paymentSuccessfulConfirmButton = await screen.findByRole('button', {
				name: /^Confirm$/,
			});
			await act(async () => await userEvent.click(paymentSuccessfulConfirmButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Payment Successful'));

			await screen.findByText('Gate Checkout');
			const stayButton = await screen.findByRole('button', {
				name: /^Stay$/,
			});
			await act(async () => await userEvent.click(stayButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
			expect(button.getAttribute('class')?.split(' ')).toContain('occupied');

			const freeSpacesDisplayBoard = screen.getByTestId('free-spaces-display-board');
			expect(freeSpacesDisplayBoard.textContent).toBe('53');
		},
		10000
	);

	test('Click on parking space (park) -> Get Ticket -> Click on parking space (leave) -> Pay Ticket -> Confirm Payment Successful -> Stay -> Click on parking space (leave) -> Leave',
		async () => {
			renderWithProviders(
				<App />
			);

			const button = screen.getByRole('button', {
				name: /16/i,
			});
			await act(async () => await userEvent.click(button));

			await screen.findByText('Welcome');
			const getTicketButton = await screen.findByRole('button', {
				name: /^Get Ticket$/,
			});
			await act(async () => await userEvent.click(getTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
			await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

			await act(async () => await userEvent.click(button));

			await screen.findByText('Ticket Payment Notice');
			const payTicketButton = await screen.findByRole('button', {
				name: /^Pay Ticket$/,
			});
			await act(async () => await userEvent.click(payTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

			await screen.findByText('Payment Successful');
			const paymentSuccessfulConfirmButton = await screen.findByRole('button', {
				name: /^Confirm$/,
			});
			await act(async () => await userEvent.click(paymentSuccessfulConfirmButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Payment Successful'));

			await screen.findByText('Gate Checkout');
			const stayButton = await screen.findByRole('button', {
				name: /^Stay$/,
			});
			await act(async () => await userEvent.click(stayButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
			expect(button.getAttribute('class')?.split(' ')).toContain('occupied');

			expect(screen.getByTestId('free-spaces-display-board').textContent).toBe('53');

			await act(async () => await userEvent.click(button));

			await screen.findByText('Gate Checkout');
			const leaveButton = await screen.findByRole('button', {
				name: /^Leave$/,
			});
			await act(async () => await userEvent.click(leaveButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
			await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('free'), { timeout: 2000 });

			expect(screen.getByTestId('free-spaces-display-board').textContent).toBe('54');

			await screen.findByText('Goodbye!');
			await waitForElementToBeRemoved(() => screen.queryByText('Goodbye!'), { timeout: 5000 });
		},
		10000
	);

	test('Click on parking space (park) -> Get Ticket -> Click on parking space (leave) -> Pay Ticket -> Confirm Payment Successful -> Leave -> Repeat',
		async () => {
			renderWithProviders(
				<App />
			);
			const button = screen.getByRole('button', {
				name: /16/i,
			});
			await (async () => {
				await act(async () => await userEvent.click(button));

				await screen.findByText('Welcome');
				const getTicketButton = await screen.findByRole('button', {
					name: /^Get Ticket$/,
				});
				await act(async () => await userEvent.click(getTicketButton));
				await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
				await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

				await act(async () => await userEvent.click(button));

				await screen.findByText('Ticket Payment Notice');
				const payTicketButton = await screen.findByRole('button', {
					name: /^Pay Ticket$/,
				});
				await act(async () => await userEvent.click(payTicketButton));
				await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

				await screen.findByText('Payment Successful');
				const paymentSuccessfulConfirmButton = await screen.findByRole('button', {
					name: /^Confirm$/,
				});
				await act(async () => await userEvent.click(paymentSuccessfulConfirmButton));
				await waitForElementToBeRemoved(() => screen.queryByText('Payment Successful'));

				await screen.findByText('Gate Checkout');
				const leaveButton = await screen.findByRole('button', {
					name: /^Leave$/,
				});
				await act(async () => await userEvent.click(leaveButton));
				await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
				await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('free'), { timeout: 2000 });

				const freeSpacesDisplayBoard = screen.getByTestId('free-spaces-display-board');
				expect(freeSpacesDisplayBoard.textContent).toBe('54');

				await screen.findByText('Goodbye!');
				await waitForElementToBeRemoved(() => screen.queryByText('Goodbye!'), { timeout: 5000 });
			})();
			await (async () => {
				await act(async () => await userEvent.click(button));

				await screen.findByText('Welcome');
				const getTicketButton = await screen.findByRole('button', {
					name: /^Get Ticket$/,
				});
				await act(async () => await userEvent.click(getTicketButton));
				await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
				await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

				await act(async () => await userEvent.click(button));

				await screen.findByText('Ticket Payment Notice');
				const payTicketButton = await screen.findByRole('button', {
					name: /^Pay Ticket$/,
				});
				await act(async () => await userEvent.click(payTicketButton));
				await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

				await screen.findByText('Payment Successful');
				const paymentSuccessfulConfirmButton = await screen.findByRole('button', {
					name: /^Confirm$/,
				});
				await act(async () => await userEvent.click(paymentSuccessfulConfirmButton));
				await waitForElementToBeRemoved(() => screen.queryByText('Payment Successful'));

				await screen.findByText('Gate Checkout');
				const leaveButton = await screen.findByRole('button', {
					name: /^Leave$/,
				});
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

	test('Click on parking space (park) -> Get Ticket -> Click on parking space (leave): Ticket price',
		async () => {
			renderWithProviders(
				<App />
			);

			const button = screen.getByRole('button', {
				name: /16/i,
			});
			await act(async () => await userEvent.click(button));

			await screen.findByText('Welcome');
			const getTicketButton = await screen.findByRole('button', {
				name: /^Get Ticket$/,
			});
			await act(async () => await userEvent.click(getTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
			await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

			await act(async () => await userEvent.click(button));

			await screen.findByText('Ticket Payment Notice');
			await screen.findByText('Ticket price: 2 €');
		}
	);

	test('Click on parking space (park) -> Get Ticket -> Click on parking space (leave) -> Pay Ticket -> Confirm Payment Successful: Payment receipt',
		async () => {
			renderWithProviders(
				<App />
			);

			const button = screen.getByRole('button', {
				name: /16/i,
			});
			await act(async () => await userEvent.click(button));

			await screen.findByText('Welcome');
			const getTicketButton = await screen.findByRole('button', {
				name: /^Get Ticket$/,
			});
			await act(async () => await userEvent.click(getTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
			await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

			await act(async () => await userEvent.click(button));

			await screen.findByText('Ticket Payment Notice');
			const payTicketButton = await screen.findByRole('button', {
				name: /^Pay Ticket$/,
			});
			await act(async () => await userEvent.click(payTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

			await screen.findByText('Payment Successful');
			await screen.findByText('Payment receipt:');
			await screen.findByText('Paid: 2€');
			await screen.findByText(/^.*, \d\d\.\s.*\s\d\d\d\d\sum\s\d\d:\d\d:\d\d$/);
			await screen.findByText('Payment method: CASH');
		}
	);

	test('Click on parking space (park) -> Get Ticket -> Click on parking space after 60 min 00 sec (leave): Ticket price (2€)',
		async () => {
			renderWithProviders(
				<App />
			);

			const button = screen.getByRole('button', {
				name: /16/i,
			});
			await act(async () => await userEvent.click(button));

			await screen.findByText('Welcome');
			const getTicketButton = await screen.findByRole('button', {
				name: /^Get Ticket$/,
			});
			execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 01:00:00 CET"`);
			await act(async () => await userEvent.click(getTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
			await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

			execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 01:59:55 CET"`);
			await act(async () => await userEvent.click(button));

			await screen.findByText('Ticket Payment Notice');
			await screen.findByText('Ticket price: 2 €');
		}
	);

	test('Click on parking space (park) -> Get Ticket -> Click on parking space after 60 min 01 sec (leave): Ticket price (4€)',
		async () => {
			renderWithProviders(
				<App />
			);

			const button = screen.getByRole('button', {
				name: /16/i,
			});
			await act(async () => await userEvent.click(button));

			await screen.findByText('Welcome');
			const getTicketButton = await screen.findByRole('button', {
				name: /^Get Ticket$/,
			});
			execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 01:00:00 CET"`);
			await act(async () => await userEvent.click(getTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
			await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

			execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 02:00:05 CET"`);
			await act(async () => await userEvent.click(button));

			await screen.findByText('Ticket Payment Notice');
			await screen.findByText('Ticket price: 4 €');
		}
	);

	test('Click on parking space (park) -> Get Ticket -> Click on parking space (leave) -> Pay Ticket after 60 min 00 sec -> Confirm Payment Successful: Payment receipt',
		async () => {
			renderWithProviders(
				<App />
			);

			const button = screen.getByRole('button', {
				name: /16/i,
			});
			await act(async () => await userEvent.click(button));

			await screen.findByText('Welcome');
			const getTicketButton = await screen.findByRole('button', {
				name: /^Get Ticket$/,
			});
			execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 01:00:00 CET"`);
			await act(async () => await userEvent.click(getTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
			await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

			await act(async () => await userEvent.click(button));

			await screen.findByText('Ticket Payment Notice');
			const payTicketButton = await screen.findByRole('button', {
				name: /^Pay Ticket$/,
			});

			execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 01:59:55 CET"`);
			await act(async () => await userEvent.click(payTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

			await screen.findByText('Payment Successful');
			await screen.findByText('Payment receipt:');
			await screen.findByText('Paid: 2€');
			await screen.findByText(/Payment date: Dienstag, 10\. März 2020 um \d\d:\d\d:\d\d/);
			await screen.findByText('Payment method: CASH');
		}
	);

	test('Click on parking space (park) -> Get Ticket -> Click on parking space (leave) -> Pay Ticket after 60 min 01 sec -> Confirm Payment Successful: Payment receipt',
		async () => {
			renderWithProviders(
				<App />
			);

			const button = screen.getByRole('button', {
				name: /16/i,
			});
			await act(async () => await userEvent.click(button));

			await screen.findByText('Welcome');
			const getTicketButton = await screen.findByRole('button', {
				name: /^Get Ticket$/,
			});
			execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 01:00:00 CET"`);
			await act(async () => await userEvent.click(getTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
			await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

			await act(async () => await userEvent.click(button));

			await screen.findByText('Ticket Payment Notice');
			const payTicketButton = await screen.findByRole('button', {
				name: /^Pay Ticket$/,
			});

			execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 02:00:05 CET"`);
			await act(async () => await userEvent.click(payTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

			await screen.findByText('Payment Successful');
			await screen.findByText('Payment receipt:');
			await screen.findByText('Paid: 4€');
			await screen.findByText(/Payment date: Dienstag, 10\. März 2020 um 02:00:0\d/);
			await screen.findByText('Payment method: CASH');
		}
	);

	test('Click on parking space (park) -> Get Ticket -> Click on parking space (leave) -> Pay Ticket -> Confirm Payment Successful -> Stay -> Click on parking space (leave) 15 min 00 sec after payment -> Leave',
		async () => {
			renderWithProviders(
				<App />
			);

			const button = screen.getByRole('button', {
				name: /16/i,
			});
			await act(async () => await userEvent.click(button));

			await screen.findByText('Welcome');
			const getTicketButton = await screen.findByRole('button', {
				name: /^Get Ticket$/,
			});
			execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 01:00:00 CET"`);
			await act(async () => await userEvent.click(getTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
			await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

			await act(async () => await userEvent.click(button));

			await screen.findByText('Ticket Payment Notice');
			const payTicketButton = await screen.findByRole('button', {
				name: /^Pay Ticket$/,
			});
			execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 01:05:00 CET"`);
			await act(async () => await userEvent.click(payTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

			await screen.findByText('Payment Successful');
			const paymentSuccessfulConfirmButton = await screen.findByRole('button', {
				name: /^Confirm$/,
			});
			await act(async () => await userEvent.click(paymentSuccessfulConfirmButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Payment Successful'));

			await screen.findByText('Gate Checkout');
			const stayButton = await screen.findByRole('button', {
				name: /^Stay$/,
			});
			await act(async () => await userEvent.click(stayButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
			expect(button.getAttribute('class')?.split(' ')).toContain('occupied');

			expect(screen.getByTestId('free-spaces-display-board').textContent).toBe('53');

			execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 01:19:55 CET"`);
			await act(async () => await userEvent.click(button));

			await screen.findByText('Gate Checkout');
			const leaveButton = await screen.findByRole('button', {
				name: /^Leave$/,
			});
			await act(async () => await userEvent.click(leaveButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
			await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('free'), { timeout: 2000 });

			expect(screen.getByTestId('free-spaces-display-board').textContent).toBe('54');

			await screen.findByText('Goodbye!');
			await waitForElementToBeRemoved(() => screen.queryByText('Goodbye!'), { timeout: 5000 });
		},
		12000
	);

	test('Click on parking space (park) -> Get Ticket -> Click on parking space (leave) -> Pay Ticket -> Confirm Payment Successful -> Stay -> Click on parking space (leave) 15 min 01 sec after payment -> Pay Ticket (2€) -> Confirm Payment Successful -> Leave',
		async () => {
			renderWithProviders(
				<App />
			);

			const button = screen.getByRole('button', {
				name: /16/i,
			});
			await act(async () => await userEvent.click(button));

			await screen.findByText('Welcome');
			const getTicketButton = await screen.findByRole('button', {
				name: /^Get Ticket$/,
			});
			execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 01:00:00 CET"`);
			await act(async () => await userEvent.click(getTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
			await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

			await act(async () => await userEvent.click(button));

			await screen.findByText('Ticket Payment Notice');
			const payTicketButton = await screen.findByRole('button', {
				name: /^Pay Ticket$/,
			});
			execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 01:05:00 CET"`);
			await act(async () => await userEvent.click(payTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

			await screen.findByText('Payment Successful');
			const paymentSuccessfulConfirmButton = await screen.findByRole('button', {
				name: /^Confirm$/,
			});
			await act(async () => await userEvent.click(paymentSuccessfulConfirmButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Payment Successful'));

			await screen.findByText('Gate Checkout');
			const stayButton = await screen.findByRole('button', {
				name: /^Stay$/,
			});
			await act(async () => await userEvent.click(stayButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
			expect(button.getAttribute('class')?.split(' ')).toContain('occupied');

			expect(screen.getByTestId('free-spaces-display-board').textContent).toBe('53');

			execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 01:20:05 CET"`);
			await act(async () => await userEvent.click(button));

			await screen.findByText('Ticket Payment Notice');
			await screen.findByText('Ticket price: 2 €');
			await screen.findByText('15 minutes have passed since your last payment.');
			const payTicketButton1 = await screen.findByRole('button', {
				name: /^Pay Ticket$/,
			});
			await act(async () => await userEvent.click(payTicketButton1));
			await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

			await screen.findByText('Payment Successful');
			const paymentSuccessfulConfirmButton1 = await screen.findByRole('button', {
				name: /^Confirm$/,
			});
			await act(async () => await userEvent.click(paymentSuccessfulConfirmButton1));
			await waitForElementToBeRemoved(() => screen.queryByText('Payment Successful'));

			await screen.findByText('Gate Checkout');
			const leaveButton = await screen.findByRole('button', {
				name: /^Leave$/,
			});
			await act(async () => await userEvent.click(leaveButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
			await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('free'), { timeout: 2000 });

			expect(screen.getByTestId('free-spaces-display-board').textContent).toBe('54');

			await screen.findByText('Goodbye!');
			await waitForElementToBeRemoved(() => screen.queryByText('Goodbye!'), { timeout: 5000 });
		},
		12000
	);

	test('Click on parking space (park) -> Get Ticket -> Click on parking space (leave) -> Pay Ticket -> Confirm Payment Successful -> Stay -> Click on parking space (leave) 60 min 00 sec after payment -> Pay Ticket (2€) -> Confirm Payment Successful -> Leave',
		async () => {
			renderWithProviders(
				<App />
			);

			const button = screen.getByRole('button', {
				name: /16/i,
			});
			await act(async () => await userEvent.click(button));

			await screen.findByText('Welcome');
			const getTicketButton = await screen.findByRole('button', {
				name: /^Get Ticket$/,
			});
			execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 01:00:00 CET"`);
			await act(async () => await userEvent.click(getTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
			await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

			await act(async () => await userEvent.click(button));

			await screen.findByText('Ticket Payment Notice');
			const payTicketButton = await screen.findByRole('button', {
				name: /^Pay Ticket$/,
			});
			execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 01:05:00 CET"`);
			await act(async () => await userEvent.click(payTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

			await screen.findByText('Payment Successful');
			const paymentSuccessfulConfirmButton = await screen.findByRole('button', {
				name: /^Confirm$/,
			});
			await act(async () => await userEvent.click(paymentSuccessfulConfirmButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Payment Successful'));

			await screen.findByText('Gate Checkout');
			const stayButton = await screen.findByRole('button', {
				name: /^Stay$/,
			});
			await act(async () => await userEvent.click(stayButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
			expect(button.getAttribute('class')?.split(' ')).toContain('occupied');

			expect(screen.getByTestId('free-spaces-display-board').textContent).toBe('53');

			execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 02:04:55 CET"`);
			await act(async () => await userEvent.click(button));

			await screen.findByText('Ticket Payment Notice');
			await screen.findByText('Ticket price: 2 €');
			await screen.findByText('15 minutes have passed since your last payment.');
			const payTicketButton1 = await screen.findByRole('button', {
				name: /^Pay Ticket$/,
			});
			await act(async () => await userEvent.click(payTicketButton1));
			await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

			await screen.findByText('Payment Successful');
			const paymentSuccessfulConfirmButton1 = await screen.findByRole('button', {
				name: /^Confirm$/,
			});
			await act(async () => await userEvent.click(paymentSuccessfulConfirmButton1));
			await waitForElementToBeRemoved(() => screen.queryByText('Payment Successful'));

			await screen.findByText('Gate Checkout');
			const leaveButton = await screen.findByRole('button', {
				name: /^Leave$/,
			});
			await act(async () => await userEvent.click(leaveButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
			await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('free'), { timeout: 2000 });

			expect(screen.getByTestId('free-spaces-display-board').textContent).toBe('54');

			await screen.findByText('Goodbye!');
			await waitForElementToBeRemoved(() => screen.queryByText('Goodbye!'), { timeout: 5000 });
		},
		12000
	);

	test('Click on parking space (park) -> Get Ticket -> Click on parking space (leave) -> Pay Ticket -> Confirm Payment Successful -> Stay -> Click on parking space (leave) 60 min 01 sec after payment -> Pay Ticket (4€) -> Confirm Payment Successful -> Leave',
		async () => {
			renderWithProviders(
				<App />
			);

			const button = screen.getByRole('button', {
				name: /16/i,
			});
			await act(async () => await userEvent.click(button));

			await screen.findByText('Welcome');
			const getTicketButton = await screen.findByRole('button', {
				name: /^Get Ticket$/,
			});
			execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 01:00:00 CET"`);
			await act(async () => await userEvent.click(getTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
			await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

			await act(async () => await userEvent.click(button));

			await screen.findByText('Ticket Payment Notice');
			const payTicketButton = await screen.findByRole('button', {
				name: /^Pay Ticket$/,
			});
			execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 01:05:00 CET"`);
			await act(async () => await userEvent.click(payTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

			await screen.findByText('Payment Successful');
			const paymentSuccessfulConfirmButton = await screen.findByRole('button', {
				name: /^Confirm$/,
			});
			await act(async () => await userEvent.click(paymentSuccessfulConfirmButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Payment Successful'));

			await screen.findByText('Gate Checkout');
			const stayButton = await screen.findByRole('button', {
				name: /^Stay$/,
			});
			await act(async () => await userEvent.click(stayButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
			expect(button.getAttribute('class')?.split(' ')).toContain('occupied');

			expect(screen.getByTestId('free-spaces-display-board').textContent).toBe('53');

			execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 02:05:05 CET"`);
			await act(async () => await userEvent.click(button));

			await screen.findByText('Ticket Payment Notice');
			await screen.findByText('Ticket price: 4 €');
			await screen.findByText('15 minutes have passed since your last payment.');
			const payTicketButton1 = await screen.findByRole('button', {
				name: /^Pay Ticket$/,
			});
			await act(async () => await userEvent.click(payTicketButton1));
			await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

			await screen.findByText('Payment Successful');
			const paymentSuccessfulConfirmButton1 = await screen.findByRole('button', {
				name: /^Confirm$/,
			});
			await act(async () => await userEvent.click(paymentSuccessfulConfirmButton1));
			await waitForElementToBeRemoved(() => screen.queryByText('Payment Successful'));

			await screen.findByText('Gate Checkout');
			const leaveButton = await screen.findByRole('button', {
				name: /^Leave$/,
			});
			await act(async () => await userEvent.click(leaveButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
			await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('free'), { timeout: 2000 });

			expect(screen.getByTestId('free-spaces-display-board').textContent).toBe('54');

			await screen.findByText('Goodbye!');
			await waitForElementToBeRemoved(() => screen.queryByText('Goodbye!'), { timeout: 5000 });
		},
		12000
	);

	test('Click on parking space (park) -> Get Ticket -> Click on parking space (leave) -> Pay Ticket -> Confirm Payment Successful -> Wait more then 15 min -> Leave: "Not Paid Enough" Dialog should appear',
		async () => {
			renderWithProviders(
				<App />
			);

			const button = screen.getByRole('button', {
				name: /16/i,
			});
			await act(async () => await userEvent.click(button));

			await screen.findByText('Welcome');
			const getTicketButton = await screen.findByRole('button', {
				name: /^Get Ticket$/,
			});
			execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 01:00:00 CET"`);
			await act(async () => await userEvent.click(getTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
			await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

			await act(async () => await userEvent.click(button));

			await screen.findByText('Ticket Payment Notice');
			const payTicketButton = await screen.findByRole('button', {
				name: /^Pay Ticket$/,
			});
			execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 02:00:00 CET"`);
			await act(async () => await userEvent.click(payTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

			await screen.findByText('Payment Successful');
			const paymentSuccessfulConfirmButton = await screen.findByRole('button', {
				name: /^Confirm$/,
			});
			await act(async () => await userEvent.click(paymentSuccessfulConfirmButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Payment Successful'));

			await screen.findByText('Gate Checkout');
			const leaveButton = await screen.findByRole('button', {
				name: /^Leave$/,
			});
			execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 02:15:05 CET"`);
			await act(async () => await userEvent.click(leaveButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
			await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'), { timeout: 2000 });

			const freeSpacesDisplayBoard = screen.getByTestId('free-spaces-display-board');
			expect(freeSpacesDisplayBoard.textContent).toBe('53');

			await screen.findByText('Not Paid Enough');
			const notPayedEnoughConfirmButton = await screen.findByRole('button', {
				name: /^Confirm$/,
			});
			await act(async () => await userEvent.click(notPayedEnoughConfirmButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Not Paid Enough'));
		},
		10000
	);

	test('Click on parking space (park) -> Get Ticket -> Click on parking space (leave) -> Pay Ticket -> Confirm Payment Successful -> Stay -> Click on parking space (leave) 15 min 00 sec after payment -> Leave 15 min 01 sec after payment',
		async () => {
			renderWithProviders(
				<App />
			);

			const button = screen.getByRole('button', {
				name: /16/i,
			});
			await act(async () => await userEvent.click(button));

			await screen.findByText('Welcome');
			const getTicketButton = await screen.findByRole('button', {
				name: /^Get Ticket$/,
			});
			execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 01:00:00 CET"`);
			await act(async () => await userEvent.click(getTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Welcome'));
			await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));

			await act(async () => await userEvent.click(button));

			await screen.findByText('Ticket Payment Notice');
			const payTicketButton = await screen.findByRole('button', {
				name: /^Pay Ticket$/,
			});
			execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 01:05:00 CET"`);
			await act(async () => await userEvent.click(payTicketButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Ticket Payment Notice'));

			await screen.findByText('Payment Successful');
			const paymentSuccessfulConfirmButton = await screen.findByRole('button', {
				name: /^Confirm$/,
			});
			await act(async () => await userEvent.click(paymentSuccessfulConfirmButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Payment Successful'));

			await screen.findByText('Gate Checkout');
			const stayButton = await screen.findByRole('button', {
				name: /^Stay$/,
			});
			await act(async () => await userEvent.click(stayButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
			expect(button.getAttribute('class')?.split(' ')).toContain('occupied');

			expect(screen.getByTestId('free-spaces-display-board').textContent).toBe('53');

			execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 01:19:55 CET"`);
			await act(async () => await userEvent.click(button));

			await screen.findByText('Gate Checkout');
			const leaveButton = await screen.findByRole('button', {
				name: /^Leave$/,
			});
			execSync(`docker exec -i ${containerId} date "+%Y-%m-%d %H-%M-%S %Z" -s "2020-03-10 01:20:05 CET"`);
			await act(async () => await userEvent.click(leaveButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Gate Checkout'));
			await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'), { timeout: 2000 });

			const freeSpacesDisplayBoard = screen.getByTestId('free-spaces-display-board');
			expect(freeSpacesDisplayBoard.textContent).toBe('53');

			await screen.findByText('Not Paid Enough');
			const notPayedEnoughConfirmButton = await screen.findByRole('button', {
				name: /^Confirm$/,
			});
			await act(async () => await userEvent.click(notPayedEnoughConfirmButton));
			await waitForElementToBeRemoved(() => screen.queryByText('Not Paid Enough'));
		},
		12000
	);
});