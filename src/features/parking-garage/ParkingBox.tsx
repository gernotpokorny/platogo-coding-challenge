import { useRef } from 'react';

// actions
import { parkAsync, leaveAsync } from './parkingGarageSlice';

// constants
import { PaymentMethod } from './parkingGarageSlice';

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
	const buttonRef = useRef<HTMLButtonElement>(null);

	const togglePlace = async () => {
		buttonRef.current?.setAttribute('disabled', 'disabled')
		try {
			if (ticket) {
				await dispatch(leaveAsync({ spaceNumber, paymentMethod: PaymentMethod.CASH })).unwrap();
				console.log('Goodbye!');
			}
			else {
				await dispatch(parkAsync({ spaceNumber })).unwrap();
				console.log('Welcome!');
			}
		} catch (error) {
			console.log(error);
		}
		buttonRef.current?.removeAttribute('disabled');
	};

	return (
		<ParkingBoxContainer
			className={ticket ? 'occupied' : 'free'}
			onClick={togglePlace}
			ref={buttonRef}
			disableRipple
		>
			{spaceNumber + 1}
		</ParkingBoxContainer>
	);
}