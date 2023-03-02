import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
	// fix the type error when referencing the Theme object in your styled component
	interface Theme {
		status: {
			freeSpot: React.CSSProperties['color'];
			occupiedSpot: React.CSSProperties['color'];
		};
	}
	// fix the type error when calling `createTheme()` with a custom theme option
	interface ThemeOptions {
		status: {
			freeSpot: React.CSSProperties['color'];
			occupiedSpot: React.CSSProperties['color'];
		};
	}
	interface Palette {
		additionalColors: string[];
		modalBackDrop: { default: string };
	}

	interface PaletteOptions {
		additionalColors: string[];
		modalBackDrop: { default: string };
	}
}

declare module '@mui/material/Button' {
	interface ButtonPropsColorOverrides {
		success: true;
	}
}

declare module '@mui/material/Button' {
	interface ButtonPropsVariantOverrides {
		success: true;
		cancel: true;
		confirm: true;
	}
}

export const theme = createTheme({
	status: {
		freeSpot: '#4caf5033',
		occupiedSpot: '#ff3d0044',
	},
	palette: {
		background: {
			default: '#fff',
		},
		additionalColors: [
			'#31c5ed',
		],
		modalBackDrop: {
			default: '#00000055',
		},
	},
});

theme.components = {
	MuiButton: {
		variants: [
			{
				props: {
					variant: 'success',
				},
				style: {
					color: theme.palette.success.contrastText,
					backgroundColor: theme.palette.success.main,
					':hover': {
						opacity: .8,
						backgroundColor: theme.palette.success.main,
					},
				},
			},
			{
				props: {
					variant: 'cancel',
				},
				style: {
					color: theme.palette.error.contrastText,
					backgroundColor: theme.palette.error.main,
					':hover': {
						opacity: .8,
						backgroundColor: theme.palette.error.main,
					},
				},
			},
			{
				props: {
					variant: 'confirm',
				},
				style: {
					color: theme.palette.info.contrastText,
					backgroundColor: theme.palette.info.main,
					':hover': {
						opacity: .8,
						backgroundColor: theme.palette.info.main,
					},
				},
			},
		],
	},
};