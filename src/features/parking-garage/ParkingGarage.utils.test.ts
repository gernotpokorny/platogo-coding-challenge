import { generateBarCode, calculateTicketPrice } from './ParkingGarage.utils';

test('getTicket()', () => {
	const ticket1 = generateBarCode();
	const ticket2 = generateBarCode();
	expect(ticket1).not.toBe(ticket2);
});

test('calculateTicketPrice() exactly same date', () => {
	const issueDate = new Date(2023, 1, 1, 2, 0, 0);
	const paymentDate = new Date(2023, 1, 1, 2, 0, 0);
	const price = calculateTicketPrice(issueDate, paymentDate);
	expect(price).toBe(0);
});

test('calculateTicketPrice() 1 second same day', () => {
	const issueDate = new Date(2023, 1, 1, 2, 0, 0);
	const paymentDate = new Date(2023, 1, 1, 2, 0, 1);
	const price = calculateTicketPrice(issueDate, paymentDate);
	expect(price).toBe(2);
});

test('calculateTicketPrice() 1 second next day', () => {
	const issueDate = new Date(2023, 1, 1, 23, 59, 59);
	const paymentDate = new Date(2023, 1, 2, 0, 0, 0);
	const price = calculateTicketPrice(issueDate, paymentDate);
	expect(price).toBe(2);
});

test('calculateTicketPrice() exactly one hour same day', () => {
	const issueDate = new Date(2023, 1, 1, 2, 0, 0);
	const paymentDate = new Date(2023, 1, 1, 3, 0, 0);
	const price = calculateTicketPrice(issueDate, paymentDate);
	expect(price).toBe(2);
});

test('calculateTicketPrice() exactly one hour next day', () => {
	const issueDate = new Date(2023, 1, 1, 23, 30, 0);
	const paymentDate = new Date(2023, 1, 2, 0, 30, 0);
	const price = calculateTicketPrice(issueDate, paymentDate);
	expect(price).toBe(2);
});

test('calculateTicketPrice() 59 minutes 59 seconds same day', () => {
	const issueDate = new Date(2023, 1, 1, 2, 0, 0);
	const paymentDate = new Date(2023, 1, 1, 2, 59, 59);
	const price = calculateTicketPrice(issueDate, paymentDate);
	expect(price).toBe(2);
});

test('calculateTicketPrice() 59 minutes 59 seconds next day', () => {
	const issueDate = new Date(2023, 1, 1, 23, 30, 0);
	const paymentDate = new Date(2023, 1, 2, 0, 29, 59);
	const price = calculateTicketPrice(issueDate, paymentDate);
	expect(price).toBe(2);
});