// components
import { ListItem, Button } from '@mui/material';

// utils
import { styled } from '@mui/material';

export const StyledListItem = styled(ListItem)(({ theme }) => ({
	display: 'list-item',
	width: 'auto',
	paddingTop: '0.25vw',
	paddingBottom: '0.25vw',
	'& > div': {
		margin: 0,
	},
}));

export const ParkingBoxContainer = styled(Button)(({ theme }) => ({
	justifyContent: 'center',
	alignItems: 'center',
	fontSize: '16px',
	cursor: 'pointer',
	'&.free': {
		background: theme.status.freeSpot,
	},
	'&.occupied': {
		background: theme.status.occupiedSpot,
	},
	color: 'inherit',
	borderRadius: 0,
	padding: 0,
	minWidth: '0',
}));