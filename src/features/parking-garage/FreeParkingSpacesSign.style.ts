import { styled } from '@mui/material';

// Components
import { Box } from '@mui/material';

export const DisplayBoard = styled(Box)(({ theme }) => ({
	display: 'flex',
	width: '30px',
	height: '30px',
	backgroundColor: theme.palette.additionalColors[0],
	border: `2px solid ${theme.palette.additionalColors[0]}`,
	alignItems: 'center',
    justifyContent: 'center',
	color: theme.palette.primary.contrastText,
}));