import { styled } from '@mui/material';

// Components
import { Box, Button } from '@mui/material';

interface InnerRowContainerProps {
	readonly first?: boolean;
}

export const Container = styled(Box)(({ theme }) => ({
	position: 'relative',
	margin: '64px 128px',
}));

export const Message = styled('p')(({ theme }) => ({
	marginTop: '40px',
	textAlign: 'center',
}));

export const ParkingGrid = styled(Box)(({ theme }) => ({
	display: 'grid',
	gridTemplateRows: '80px 100px 80px 80px 100px 80px',
	border: `1px solid ${theme.palette.additionalColors[0]}`,
}));

export const OuterRowContainer = styled(Box)(({ theme }) => ({
	display: 'flex',
	flexWrap: 'nowrap',
	'& > button': {
		height: '80px',
		flex: 1,
	},
	'& > button:not(:last-of-type)': {
		borderRight: '1px solid black',
	},
}));

export const InnerRowContainer = (
	styled(OuterRowContainer, { shouldForwardProp: (prop) => prop !== 'first' })<InnerRowContainerProps>(({ theme, first }) => ({
		'& > button': {
			borderBottom: first ? '1px solid black' : 'none',
		},
		'& > button:first-of-type,  & > button:nth-of-type(14)': {
			borderRight: 'none',
		},
		'& > button:nth-of-type(3)': {
			borderLeft: '1px solid black',
		},
		'& > button:first-of-type,  & > button:nth-of-type(2),  & > button:nth-of-type(14),  & > button:nth-of-type(15)': {
			borderBottom: 'none',
		},
	}))
);

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

export const Entry = styled(Box)(({ theme }) => ({
	position: 'absolute',
	left: 0,
	top: '95px',
	width: '1px',
	height: '50px',
	backgroundColor: theme.palette.background.default,
}));

export const FreeParkingSpacesSignWrapper = styled(
	Box,
	{ shouldForwardProp: (prop) => prop !== 'amount' }
)(({ theme }) => ({
	position: 'absolute',
	left: '-40px',
	top: '145px',
}));