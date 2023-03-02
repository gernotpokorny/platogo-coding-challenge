// actions
import { parkAsync, leaveAsync, calculatePrice, getTicketState } from './parkingGarageSlice';

// components
import { AlertDialog } from '../../shared/components/AlertDialog';

// constants
import { PaymentMethod, TicketState } from './parkingGarageSlice';

// hooks
import { useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import useAwaitableComponent from '../../shared/hooks/useAwaitableComponent';

// selectors
import { selectTicketWithBarCode } from './parkingGarageSlice';

// styles
import { ParkingBoxContainer } from './ParkingGarage.style';

// types
import { ParkingSpace } from './parkingGarageSlice';
import { CalculatePricePaidTicketReturnValue } from './parkingGarageSlice';

interface ParkingBoxProps {
	parkingSpace: ParkingSpace
}

export const ParkingBox: React.FC<ParkingBoxProps> = ({ parkingSpace }) => {
	const { spaceNumber, barCode } = parkingSpace;
	const dispatch = useAppDispatch();
	const ticketWithBarCode = useAppSelector(selectTicketWithBarCode(barCode));
	const buttonRef = useRef<HTMLButtonElement>(null);
	const [
		statusWelcomeDialog,
		executeWelcomeDialog,
		resolveWelcomeDialog,
		rejectWelcomeDialog, // eslint-disable-line @typescript-eslint/no-unused-vars
		resetWelcomeDialog,
	] = useAwaitableComponent<boolean>();
	const isWelcomeDialogOpen = statusWelcomeDialog === 'awaiting';
	const [
		statusPayTicketDialog,
		executePayTicketDialog,
		resolvePayTicketDialog,
		rejectPayTicketDialog, // eslint-disable-line @typescript-eslint/no-unused-vars
		resetPayTicketDialog,
	] = useAwaitableComponent<boolean>();
	const isPayTicketDialogOpen = statusPayTicketDialog === 'awaiting';
	const [
		statusPaymentSuccessfulDialog,
		executePaymentSuccessfulDialog,
		resolvePaymentSuccessfulDialog,
		rejectPaymentSuccessfulDialog, // eslint-disable-line @typescript-eslint/no-unused-vars
		resetPaymentSuccessfulDialog,
	] = useAwaitableComponent<boolean>();
	const isPaymentSuccessfulDialogOpen = statusPaymentSuccessfulDialog === 'awaiting';
	const [
		statusGateCheckoutDialog,
		executeGateCheckoutDialog,
		resolveGateCheckoutDialog,
		rejectGateCheckoutDialog, // eslint-disable-line @typescript-eslint/no-unused-vars
		resetGateCheckoutDialog,
	] = useAwaitableComponent<boolean>();
	const isGateCheckoutDialogOpen = statusGateCheckoutDialog === 'awaiting';
	const [
		statusNotPayedEnoughDialog,
		executeNotPayedEnoughDialog,
		resolveNotPayedEnoughDialog,
		rejectNotPayedEnoughDialog, // eslint-disable-line @typescript-eslint/no-unused-vars
		resetNotPayedEnoughDialog,
	] = useAwaitableComponent<boolean>();
	const isNotPayedEnoughDialogOpen = statusNotPayedEnoughDialog === 'awaiting';

	const togglePlace = async () => {
		buttonRef.current?.setAttribute('disabled', 'disabled');
		try {
			if (barCode) {
				await dispatch(leaveAsync({
					spaceNumber,
					paymentMethod: PaymentMethod.CASH,
					barCode,
					executePayTicketDialog,
					resetPayTicketDialog,
					executePaymentSuccessfulDialog,
					resetPaymentSuccessfulDialog,
					executeGateCheckoutDialog,
					resetGateCheckoutDialog,
					executeNotPayedEnoughDialog,
					resetNotPayedEnoughDialog,
				})).unwrap();
			}
			else {
				await dispatch(parkAsync({ spaceNumber, executeWelcomeDialog, resetWelcomeDialog })).unwrap();
			}
		} catch (error) {
			console.log('error', error);
		}
		buttonRef.current?.removeAttribute('disabled');
	};

	const getTicketPrice = () => {
		if (ticketWithBarCode) {
			return dispatch(calculatePrice(ticketWithBarCode.barCode));
		}
		else {
			return null;
		}
	};

	const ticketPrice = getTicketPrice();
	const ticketState = (() => {
		if (ticketWithBarCode) {
			return dispatch(getTicketState(ticketWithBarCode.barCode));
		}
		else {
			return null;
		}
	})();

	return (
		<>
			<ParkingBoxContainer
				className={barCode ? 'occupied' : 'free'}
				onClick={togglePlace}
				ref={buttonRef}
				disableRipple
			>
				{spaceNumber + 1}
			</ParkingBoxContainer>
			<AlertDialog
				title='Welcome'
				content={'Press "Get Ticket" in order to get a parking ticket.'}
				successButtonText='Get Ticket'
				cancelButtonText='Cancel'
				open={isWelcomeDialogOpen}
				onSuccess={resolveWelcomeDialog}
				onCancel={() => { resolveWelcomeDialog(false); }}
				disableEscapeKeyDown={false}
				disableBackdropClick={false}
				onClose={() => { resolveWelcomeDialog(false); }}
			/>
			<AlertDialog
				title='Ticket Payment Notice'
				content={
					<>
						{ticketWithBarCode && ticketState === TicketState.UNPAID && ticketWithBarCode.payments && (
							<p>15 minutes have passed since your last payment.</p>
						)}
						<p>The ticket must be payed at the cash-machine in order to leave the parking garage.</p>
						<p>Ticket price: {`${ticketPrice}`} €</p>
					</>
				}
				successButtonText='Pay Ticket'
				cancelButtonText='Cancel'
				open={isPayTicketDialogOpen}
				onSuccess={resolvePayTicketDialog}
				onCancel={() => { resolvePayTicketDialog(false); }}
				disableEscapeKeyDown={false}
				disableBackdropClick={false}
				onClose={() => { resolvePayTicketDialog(false); }}
			/>
			<AlertDialog
				title='Payment Successful'
				content={
					<>
						<p>The payment was successful.</p>
						{
							ticketPrice
							&& Object.prototype.hasOwnProperty.call(ticketPrice, 'ticketPrice')
							&& Object.prototype.hasOwnProperty.call(ticketPrice, 'paymentReceipt')
							&& (
								<>
									<p>Payment receipt:</p>
									<ul>
										{(ticketPrice as CalculatePricePaidTicketReturnValue).paymentReceipt.map((line, index) => (
											<li key={index}>{line}</li> // Note: I know it's bad practice to set the index as a key, but it doesn't matter here.
										))}
									</ul>
								</>
							)
						}
						<p>
							You have 15 minutes to leave the parking garage.
							If you don't leave within 15 minutes, then you have to pay the addtional parking time.
						</p>
					</>
				}
				successButtonText='Confirm'
				showCancelButton={false}
				successButtonVariant='confirm'
				open={isPaymentSuccessfulDialogOpen}
				onSuccess={resolvePaymentSuccessfulDialog}
				onCancel={() => { resolvePaymentSuccessfulDialog(false); }}
			/>
			<AlertDialog
				title='Gate Checkout'
				content={
					<>
						<p>Do you want to drive to the gate and leave the parking garage?</p>
						<p>
							Note: If you do not leave within 15 minutes, then you have to pay the addional parking time.
						</p>
					</>
				}
				successButtonText='Leave'
				cancelButtonText='Stay'
				open={isGateCheckoutDialogOpen}
				onSuccess={resolveGateCheckoutDialog}
				onCancel={() => { resolveGateCheckoutDialog(false); }}
			/>
			<AlertDialog
				title='Not Paid Enough'
				content={
					<>
						<p>The ticket is not payed enough.</p>
						<p>15 minutes have already passed since the payment was made.</p>
						<p>Please make another payment.</p>
					</>
				}
				successButtonText='Confirm'
				showCancelButton={false}
				successButtonVariant='confirm'
				open={isNotPayedEnoughDialogOpen}
				onSuccess={resolveNotPayedEnoughDialog}
				onCancel={() => { resolveNotPayedEnoughDialog(false); }}
			/>
		</>
	);
};