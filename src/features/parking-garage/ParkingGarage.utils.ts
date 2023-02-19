// utils
import { generateRandomNumber } from '../../shared/utils/randomnessUtils';

export const generateBarCode = () => {
	return generateRandomNumber(16);
};

export const calculateTicketPrice = (issueDate: Date, paymentDate: Date) => {
	const hours = Math.abs(paymentDate.getTime() - issueDate.getTime()) / 36e5; // 36e5 is the scientific notation for 60*60*1000, dividing by which converts the milliseconds difference into hours.
	const billedHours = Math.ceil(hours);
	const HOURLY_RATE = 2;
	return billedHours * HOURLY_RATE;
};

export const getFormattedPaymentDate = (paymentDate: Date) => {
	return paymentDate.toLocaleDateString('de-DE', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	})
};