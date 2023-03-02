// actions
import { setIsGoodByeSnackbarOpen, setError } from './parkingGarageSlice';

// components
import { OuterRow } from './OuterRow';
import { InnerRow } from './InnerRow';
import { FreeParkingSpacesSign } from './FreeParkingSpacesSign';
import { AlertDialog } from '../../shared/components/AlertDialog';
import { Typography } from '@mui/material';

// hooks
import { useAppDispatch, useAppSelector } from '../../app/hooks';

// selectors
import { selectAmountOfFreeParkingSpaces, selectIsGoodByeSnackbarOpen, selectError } from './parkingGarageSlice';

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
	const amountOfFreeParkingSpaces = useAppSelector(selectAmountOfFreeParkingSpaces);
	const isGoodByeSnackbarOpen = useAppSelector(selectIsGoodByeSnackbarOpen);
	const error = useAppSelector(selectError);

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
						<Typography variant='body1'>Thank you, have a nice day!</Typography>
						<Typography variant='body1'>Goodbye!</Typography>
					</GoodByeSnackbarMessageWrapper>
				}
			/>
			{error && (
				<AlertDialog
					title='Error'
					content={
						<>
							<Typography variant='body1'>{error.message}</Typography>
							<Typography variant='body1'>Please contact the support.</Typography>
						</>
					}
					successButtonText='Confirm'
					showCancelButton={false}
					successButtonVariant='confirm'
					open={Boolean(error)}
					onSuccess={() => dispatch(setError(null))}
				/>
			)}
		</>
	);
};