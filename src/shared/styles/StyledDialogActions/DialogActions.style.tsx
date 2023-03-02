import { DialogActions, styled } from '@mui/material';

export const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
	display: 'flex',
	flexDirection: 'column',
	padding: 0,
	'& .MuiButton-root': {
		width: '100%',
		borderRadius: 0,
		margin: 0,
		'& :not(:first-of-type)': {
			margin: 0,
		},
	},
}));
