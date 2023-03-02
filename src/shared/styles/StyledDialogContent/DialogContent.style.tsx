import { DialogContent, styled } from '@mui/material';

export const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
	padding: '1.6vw 1.12vw 2.29vw 1.12vw',
	paddingTop: '1.6vw !important', /* MuiDialogTitle overrides MuiDialogContent (via + css selector) and mui lib seem to not care about fixing it */
	'& .MuiInput-root': {
		margin: '1.25vw 0',
	},
}));
