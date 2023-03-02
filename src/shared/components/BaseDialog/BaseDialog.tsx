// styles
import { StyledDialog } from '../../styles/StyledDialog';

// types
import { ReactNode } from 'react';
import { DialogProps } from '@mui/material/Dialog';

export type BaseDialogProps = DialogProps & {
	children?: ReactNode;
	disableBackdropClick?: boolean; // If `true`, clicking the backdrop will not fire the `onClose` callback.
	showRedBackgroundIfNonCancelable?: boolean;
};

/**
 * Dialogs inform users about a task and can contain critical information, require decisions, or involve multiple tasks.
 * 
 * Note: Fixes shortcomings in the `@mui/material/Dialog` API.
 * 
 * Note: Hosts common Logic across various types of Dialogs (eg. we want `showRedBackgroundIfNonCancelable` in `SimpleDialog` and `AlertDialog` and it makes sense to therefore implement this here in `BaseDialog`).
 */
export const BaseDialog: React.FC<BaseDialogProps> = (props) => {
	const { disableBackdropClick = false, showRedBackgroundIfNonCancelable = true, ...dialogProps } = props;

	const getIsNonCancelable = () => {
		return dialogProps.disableEscapeKeyDown !== undefined ? dialogProps.disableEscapeKeyDown && disableBackdropClick : false;
	};

	/**
	 * Callback fired when the component requests to be closed.
	 * 
	 * Note: We need to know here in `BaseDialog` if the backdrop was clicked, because there is no `disableBackdropClick` prop in `Dialog` and therefore `disableBackdropClick``gets implented here in `BaseDialog`.
	 */
	const onClose = (event: object, reason: 'backdropClick' | 'escapeKeyDown') => {
		if (reason === 'backdropClick' && disableBackdropClick) {
			return;
		}
		if (dialogProps.onClose) {
			dialogProps.onClose(event, reason);
		}
	};

	return (
		<StyledDialog
			{...dialogProps}
			onClose={onClose}
			showRedBackgroundIfNonCancelable={showRedBackgroundIfNonCancelable}
			isNonCancelable={getIsNonCancelable()}
		/>
	);
};