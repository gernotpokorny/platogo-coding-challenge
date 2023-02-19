// utils
import { generateRandomNumber } from '../../shared/utils/randomnessUtils';

export const getTicket = () => {
	return generateRandomNumber(16);
};