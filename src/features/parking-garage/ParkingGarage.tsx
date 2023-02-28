import { useSelector } from 'react-redux';

// components
import { OuterRow } from './OuterRow';
import { InnerRow } from './InnerRow';
import { FreeParkingSpacesSign } from './FreeParkingSpacesSign';

// selectors
import { selectAmountOfFreeParkingSpaces } from './parkingGarageSlice';

// styles
import { Container, ParkingGrid, Message, Entry, Exit, FreeParkingSpacesSignWrapper } from './ParkingGarage.style';

export const ParkingGarage = () => {
	const amountOfFreeParkingSpaces = useSelector(selectAmountOfFreeParkingSpaces);

	return (
		<Container>
			<Entry />
			<FreeParkingSpacesSignWrapper>
				<FreeParkingSpacesSign amountOfFreeParkingSpaces={amountOfFreeParkingSpaces} />
			</FreeParkingSpacesSignWrapper>
			<ParkingGrid>
				<OuterRow start={0} end={16} />
				<div />
				<InnerRow first start={16} end={27} />
				<InnerRow start={27} end={38} />
				<div />
				<OuterRow start={38} end={54} />
			</ParkingGrid>
			<Exit />
			<Message>Please click on a parking place to park or leave.</Message>
		</Container>
	);
}