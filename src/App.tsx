// actions
import {
	getTicketAsync,
	calculatePriceAsync,
	payTicketAsync,
	getTicketStateAsync,
	getFreeSpaces,
} from './features/parking-garage/parkingGarageSlice';

// components
import { ParkingGarage } from './features/parking-garage/ParkingGarage';

// constants
import { TicketState } from './features/parking-garage/parkingGarageSlice';

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
		calculatePrice: (barCode: string) => Promise<CalculatePricePaidTicketReturnValue | number>;
		payTicket: (barCode: BarCode, paymentMethod: PaymentMethod) => void;
		getTicketState: (barCode: string) => Promise<TicketState>;
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
		await dispatch(payTicketAsync({ barCode, paymentMethod })).unwrap();
	};

	const calculatePrice = async (barCode: BarCode) => {
		const price = await dispatch(calculatePriceAsync({ barCode })).unwrap();
		if (price.paymentReceipt) {
			return price;
		}
		else {
			return price.ticketPrice;
		}
	};

	const getTicketState = async (barCode: BarCode) => {
		const ticketState = await dispatch(getTicketStateAsync({ barCode })).unwrap();
		return ticketState;
	};

	const boundGetFreeSpaces = useMemo(
		() => bindActionCreators(getFreeSpaces, dispatch),
		[dispatch]
	);

	window.getTicket = getTicket;
	window.calculatePrice = calculatePrice;
	window.payTicket = payTicket;
	window.getTicketState = getTicketState;
	window.getFreeSpaces = boundGetFreeSpaces;

	return (
		<ParkingGarage />
	);
}

export default App;
