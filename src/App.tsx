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
import { useMemo } from 'react';

// types
import { BarCode, PaymentMethod, CalculatePricePaidTicketReturnValue } from './features/parking-garage/parkingGarageSlice';

// utils
import { bindActionCreators } from 'redux';

declare global {
	interface Window {
		getTicket: () => Promise<string>;
		calculatePrice: (barCode: string) => CalculatePricePaidTicketReturnValue | number;
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
	window.calculatePrice = (barCode: string) => {
		const price = dispatch(calculatePrice(barCode));
		if (price.paymentReceipt) {
			return price;
		}
		else {
			return price.ticketPrice;
		}
	};
	window.payTicket = payTicket;
	window.getTicketState = boundGetTicketState;
	window.getFreeSpaces = boundGetFreeSpaces;

	return (
		<ParkingGarage />
	);
}

export default App;
