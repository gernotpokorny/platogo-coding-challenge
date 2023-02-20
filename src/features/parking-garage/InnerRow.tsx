import { useSelector } from 'react-redux';

// components
import { ParkingBox } from './ParkingBox';

// selectors
import { selectParkingSpaces } from './parkingGarageSlice';

// styles
import { InnerRowContainer } from './ParkingGarage.style';

interface InnerRowProps {
	start: number;
	end: number;
	first?: boolean;
}

export const InnerRow: React.FC<InnerRowProps> = ({
	start,
	end,
	first = false,
}) => {
	const parkingSpaces = useSelector(selectParkingSpaces);

	const blank = [0, 1].map((idx) => <button key={idx} style={{ visibility: 'hidden' }} />);

	return (
		<InnerRowContainer first={first}>
			{blank}
			{parkingSpaces.slice(start, end).map((space) => (
				<ParkingBox key={space.spaceNumber} parkingSpace={space} />
			))}
			{blank}
		</InnerRowContainer>
	);
}