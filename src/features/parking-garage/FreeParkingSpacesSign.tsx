// styles
import { DisplayBoard } from './FreeParkingSpacesSign.style';

interface FreeParkingSpacesSignProps {
	amountOfFreeParkingSpaces: number;
}

export const FreeParkingSpacesSign: React.FC<FreeParkingSpacesSignProps> = ({ amountOfFreeParkingSpaces }) => {
	return (
		<DisplayBoard data-testid='free-spaces-display-board'>{amountOfFreeParkingSpaces}</DisplayBoard>
	);
};