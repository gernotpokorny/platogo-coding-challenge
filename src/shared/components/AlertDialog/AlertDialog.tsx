// components
import { BaseDialog } from '../BaseDialog';

// styles
import { StyledDialogActions } from '../../styles/StyledDialogActions';
import { StyledDialogContent } from '../../styles/StyledDialogContent';
import { StyledDialogTitle } from '../../styles/StyledDialogTitle';
import { StyledButton } from '../../styles/StyledButton';

// types
import { BaseDialogProps } from '../BaseDialog';
import { ButtonProps } from '@mui/material/Button';
import { ReactNode } from 'react';

export type AlertDialogProps = BaseDialogProps & {
	title: string;
	content: string | ReactNode;
	onSuccess: () => void;
	onCancel: () => void;
	successButtonText?: string;
	cancelButtonText?: string;
	showSuccessButton?: boolean;
	showCancelButton?: boolean;
	successButtonVariant?: 'success' | 'confirm' | ButtonProps['variant'];
	cancelButtonVariant?: 'cancel' | ButtonProps['variant'];
};

export const AlertDialog: React.FC<AlertDialogProps> = ({
	title,
	content,
	onSuccess,
	onCancel,
	successButtonText = 'Agree',
	cancelButtonText = 'Disagree',
	showSuccessButton = true,
	showCancelButton = true,
	successButtonVariant = 'success',
	cancelButtonVariant = 'cancel',
	disableEscapeKeyDown = true,
	disableBackdropClick = true,
	...dialogProps
}) => {

	return (
		<BaseDialog {...dialogProps} disableEscapeKeyDown={disableEscapeKeyDown} disableBackdropClick={disableBackdropClick}>
			<StyledDialogTitle>{title}</StyledDialogTitle>
			<StyledDialogContent>
				{content}
			</StyledDialogContent>
			<StyledDialogActions>
				{showCancelButton && (
					<StyledButton onClick={onCancel} variant={cancelButtonVariant}>
						{cancelButtonText}
					</StyledButton>)}
				{showSuccessButton && (
					<StyledButton onClick={onSuccess} variant={successButtonVariant} autoFocus>
						{successButtonText}
					</StyledButton>
				)}
			</StyledDialogActions>
		</BaseDialog>
	);
};