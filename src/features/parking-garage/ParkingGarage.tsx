// actions
import { setIsGoodByeSnackbarOpen } from './parkingGarageSlice';

// components
import { OuterRow } from './OuterRow';
import { InnerRow } from './InnerRow';
import { FreeParkingSpacesSign } from './FreeParkingSpacesSign';

// hooks
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../app/hooks';

// selectors
import { selectAmountOfFreeParkingSpaces, selectIsGoodByeSnackbarOpen } from './parkingGarageSlice';

// styles
import {
	Container,
	ParkingGrid,
	Message,
	Entry,
	Exit,
	FreeParkingSpacesSignWrapper,
	GoodByeSnackbarMessageWrapper,
	StyledSnackbar,
} from './ParkingGarage.style';

export const ParkingGarage = () => {
	const dispatch = useAppDispatch();
	const amountOfFreeParkingSpaces = useSelector(selectAmountOfFreeParkingSpaces);
	const isGoodByeSnackbarOpen = useSelector(selectIsGoodByeSnackbarOpen);

	return (
		<>
			<Container>
				<Entry />
				<FreeParkingSpacesSignWrapper>
					<FreeParkingSpacesSign amountOfFreeParkingSpaces={amountOfFreeParkingSpaces} />
				</FreeParkingSpacesSignWrapper>
				<ParkingGrid>
					<OuterRow start={0} end={16} />
					<div />
					<InnerRow first start={16} end={27} />
					<InnerRow start={27} end={38} />
					<div />
					<OuterRow start={38} end={54} />
				</ParkingGrid>
				<Exit />
				<Message>Please click on a parking place to park or leave.</Message>
			</Container>
			<StyledSnackbar
				open={isGoodByeSnackbarOpen}
				autoHideDuration={2500}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				onClose={() => { dispatch(setIsGoodByeSnackbarOpen(false)); }}
				ContentProps={{
					style: {
						backgroundColor: 'white',
						margin: '10px',
						padding: '10px',
						borderRadius: '10px',
						maxWidth: '30vw',
						color: 'black',
						minWidth: 0,
					},
				}}
				message={
					<GoodByeSnackbarMessageWrapper>
						<p>Thank you, have a nice day!</p>
						<p>Goodbye!</p>
					</GoodByeSnackbarMessageWrapper>
				}
			/>
		</>
	);
};