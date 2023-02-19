import { getTicket } from './ParkingGarage.utils';

test('getTicket()', () => {
	const ticket1 = getTicket();
	const ticket2 = getTicket();
	expect(ticket1).not.toBe(ticket2);
});