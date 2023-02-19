import { styled } from '@mui/material';

// Components
import { Box } from '@mui/material';

interface InnerRowContainerProps {
	readonly first?: boolean;
}

export const Container = styled(Box)(({ theme }) => ({
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
	'& > div': {
		height: '80px',
		flex: 1,
	},
	'& > div:not(:last-of-type)': {
		borderRight: '1px solid black',
	},
}));

export const InnerRowContainer = (
	styled(OuterRowContainer, { shouldForwardProp: (prop) => prop !== 'first' })<InnerRowContainerProps>(({ theme, first }) => ({
		'& > div': {
			borderBottom: first ? '1px solid black' : 'none',
		},
		'& > div:first-of-type,  & > div:nth-of-type(14)': {
			borderRight: 'none',
		},
		'& > div:first-of-type,  & > div:nth-of-type(2),  & > div:nth-of-type(14),  & > div:nth-of-type(15)': {
			borderBottom: 'none',
		},
	}))
);

export const ParkingBoxContainer = styled(Box)(({ theme }) => ({
	display: 'flex',
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
}));