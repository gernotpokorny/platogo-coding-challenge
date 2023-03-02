// components
import { ListItem } from '@mui/material';

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