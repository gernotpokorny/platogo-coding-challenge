import { useMemo } from 'react';
import { bindActionCreators } from 'redux';

// actions
import {
	getTicketAsync,
	calculatePrice,
	payTicketAsync,
	getTicketState,
	getFreeSpaces,
} from './features/parking-garage/parkingGarageSlice';

// components
import { ParkingGarage } from './features/parking-garage/ParkingGarage';

// hooks
import { useAppDispatch } from './app/hooks';

// types
import { BarCode, PaymentMethod } from './features/parking-garage/parkingGarageSlice';

declare global {
	interface Window {
		getTicket: () => void;
		calculatePrice: typeof calculatePrice;
		payTicket: (barCode: BarCode, paymentMethod: PaymentMethod) => void;
		getTicketState: typeof getTicketState;
		getFreeSpaces: typeof getFreeSpaces;
	}
}

function App() {
	const dispatch = useAppDispatch();

	const getTicket = async () => {
		const ticket = await dispatch(getTicketAsync()).unwrap();
		return ticket.barCode;
	};

	const boundCalculatePrice = useMemo(
		() => bindActionCreators(calculatePrice, dispatch),
		[dispatch]
	);

	const payTicket = async (barCode: BarCode, paymentMethod: PaymentMethod) => {
		await dispatch(payTicketAsync({ barCode, paymentMethod }));
	};

	const boundGetTicketState = useMemo(
		() => bindActionCreators(getTicketState, dispatch),
		[dispatch]
	);

	const boundGetFreeSpaces = useMemo(
		() => bindActionCreators(getFreeSpaces, dispatch),
		[dispatch]
	);

	window.getTicket = getTicket;
	window.calculatePrice = boundCalculatePrice;
	window.payTicket = payTicket;
	window.getTicketState = boundGetTicketState;
	window.getFreeSpaces = boundGetFreeSpaces;

	return (
		<ParkingGarage />
	);
}

export default App;
