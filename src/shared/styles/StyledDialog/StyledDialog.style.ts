import { Dialog, styled } from '@mui/material';

interface StyledDialogProps {
	showRedBackgroundIfNonCancelable: boolean;
	isNonCancelable: boolean;
}

export const StyledDialog = styled(
	Dialog,
	{
		shouldForwardProp: (prop) => prop !== 'showRedBackgroundIfNonCancelable' && prop !== 'isNonCancelable',
	})<StyledDialogProps>(({ theme, showRedBackgroundIfNonCancelable, isNonCancelable }) => ({
		'& .MuiBackdrop-root': {
			background: (() => {
				if (showRedBackgroundIfNonCancelable && isNonCancelable) {
					return `repeating-linear-gradient(
						135deg,
						${theme.palette.modalBackDrop.default},
						${theme.palette.modalBackDrop.default} 1.5vw,
						${theme.palette.error.light}88 1.5vw,
						${theme.palette.error.light}88 1.8vw
						)`;
				}
				else {
					return undefined;
				}
			})(),
			backgroundColor: 'rgba(0, 0, 0, 0.5)',
			cursor: 'not-allowed',
		},
		'.MuiPaper-root': {
			width: '30vw',
			height: 'fit-content',
			maxHeight: '100vh',
			outline: 'none',
			overflow: 'auto',
			'@media (max-width: 1600px)': {
				width: '35vw',
			},
			'@media (max-width: 1280px)': {
				width: '40vw',
			},
			'@media (max-width: 1024px)': {
				width: '50vw',
			},
			'@media (max-width: 800px)': {
				width: '62vw',
			},
		},
	}));
