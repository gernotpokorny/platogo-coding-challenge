import { useDispatch } from 'react-redux';

// actions
import { park, leave } from './parkingGarageSlice';

// styles
import { ParkingBoxContainer } from './ParkingGarage.style';

// types
import { ParkingSpace } from './parkingGarageSlice';

interface ParkingBoxProps {
	parkingSpace: ParkingSpace
}

export const ParkingBox: React.FC<ParkingBoxProps> = ({ parkingSpace }) => {
	const { spaceNumber, ticket } = parkingSpace;
	const dispatch = useDispatch();

	const togglePlace = async () => {
		try {
			ticket ? dispatch(leave(spaceNumber)) : dispatch(park(spaceNumber));
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