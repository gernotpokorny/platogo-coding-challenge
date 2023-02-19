import { useMemo } from 'react';
import { bindActionCreators } from 'redux';

// actions
import { getTicket, calculatePrice, payTicket } from './features/parking-garage/parkingGarageSlice';

// components
import { ParkingGarage } from './features/parking-garage/ParkingGarage';

// hooks
import { useAppDispatch } from './app/hooks';

declare global {
	interface Window {
		getTicket: typeof getTicket;
		calculatePrice: typeof calculatePrice;
		payTicket: typeof payTicket;
	}
}

function App() {
	const dispatch = useAppDispatch();

	const boundGetTicket = useMemo(
		() => bindActionCreators(getTicket, dispatch),
		[dispatch]
	);

	const boundCalculatePrice = useMemo(
		() => bindActionCreators(calculatePrice, dispatch),
		[dispatch]
	);

	const boundPayTicket = useMemo(
		() => bindActionCreators(payTicket, dispatch),
		[dispatch]
	);

	window.getTicket = boundGetTicket;
	window.calculatePrice = boundCalculatePrice;
	window.payTicket = boundPayTicket;

	return (
		<ParkingGarage />
	);
}

export default App;
