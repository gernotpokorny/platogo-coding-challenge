import { useMemo } from 'react';
import { bindActionCreators } from 'redux';

// actions
import { getTicket, calculatePrice } from './features/parking-garage/parkingGarageSlice';

// components
import { ParkingGarage } from './features/parking-garage/ParkingGarage';

// hooks
import { useAppDispatch } from './app/hooks';

declare global {
	interface Window {
		getTicket: typeof getTicket;
		calculatePrice: typeof calculatePrice;
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

	window.getTicket = boundGetTicket;
	window.calculatePrice = boundCalculatePrice;

	return (
		<ParkingGarage />
	);
}

export default App;
