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
	const { spaceNumber, barCode } = parkingSpace;
	const dispatch = useAppDispatch();
	const buttonRef = useRef<HTMLButtonElement>(null);

	const togglePlace = async () => {
		buttonRef.current?.setAttribute('disabled', 'disabled')
		try {
			if (barCode) {
				await dispatch(leaveAsync({ spaceNumber, paymentMethod: PaymentMethod.CASH, barCode })).unwrap();		
			}
			else {
				await dispatch(parkAsync({ spaceNumber })).unwrap();
			}
		} catch (error) {
			console.log(error);
		}
		buttonRef.current?.removeAttribute('disabled');
	};

	return (
		<ParkingBoxContainer
			className={barCode ? 'occupied' : 'free'}
			onClick={togglePlace}
			ref={buttonRef}
			disableRipple
		>
			{spaceNumber + 1}
		</ParkingBoxContainer>
	);
}