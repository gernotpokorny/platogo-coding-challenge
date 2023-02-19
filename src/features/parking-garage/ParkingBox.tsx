// actions
import { park, leave } from './parkingGarageSlice';

// hooks
import { useAppDispatch } from '../../app/hooks';

// styles
import { ParkingBoxContainer } from './ParkingGarage.style';

// types
import { ParkingSpace } from './parkingGarageSlice';

interface ParkingBoxProps {
	parkingSpace: ParkingSpace
}

export const ParkingBox: React.FC<ParkingBoxProps> = ({ parkingSpace }) => {
	const { spaceNumber, ticket } = parkingSpace;
	const dispatch = useAppDispatch();

	const togglePlace = async () => {
		try {
			ticket
				? dispatch(leave(spaceNumber))
				: dispatch(park(spaceNumber));
			console.log(ticket ? 'Goodbye!' : 'Welcome!');
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<ParkingBoxContainer
			className={ticket ? 'occupied' : 'free'}
			onClick={togglePlace}
		>
			{spaceNumber + 1}
		</ParkingBoxContainer>
	);
}