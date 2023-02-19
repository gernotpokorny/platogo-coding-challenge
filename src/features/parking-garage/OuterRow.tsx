import { useSelector } from 'react-redux';

// components
import { ParkingBox } from './ParkingBox';

// selectors
import { selectParkingSpaces } from './parkingGarageSlice';

// styles
import { OuterRowContainer } from './ParkingGarage.style';

export const OuterRow = ({ start, end }: { start: number; end: number }) => {
	const parkingSpaces = useSelector(selectParkingSpaces);
	return (
		<OuterRowContainer>
			{parkingSpaces.slice(start, end).map((space) => (
				<ParkingBox key={space.spaceNumber} parkingSpace={space} />
			))}
		</OuterRowContainer>
	);
}