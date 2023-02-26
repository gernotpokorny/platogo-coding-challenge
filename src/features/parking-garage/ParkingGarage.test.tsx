import { screen, waitFor } from '@testing-library/react';
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
		expect(button.getAttribute('class')?.split(' ')).toContain('free')
	});
});

test('park', async () => {
	renderWithProviders(
		<ParkingGarage />
	);
	const button = screen.getByRole('button', {
		name: /16/i,
	});
	await userEvent.click(button);
	await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));
	const freeSpacesDisplayBoard = screen.getByTestId('free-spaces-display-board');
	expect(freeSpacesDisplayBoard.textContent).toBe('53');
});

test('park -> leave', async () => {
	renderWithProviders(
		<ParkingGarage />
	);
	const button = screen.getByRole('button', {
		name: /16/i,
	});
	await userEvent.click(button);
	await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('occupied'));
	await userEvent.click(button);
	await waitFor(() => expect(button.getAttribute('class')?.split(' ')).toContain('free'), { timeout: 2000 });
	const freeSpacesDisplayBoard = screen.getByTestId('free-spaces-display-board');
	expect(freeSpacesDisplayBoard.textContent).toBe('54');
});