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
	}

	interface PaletteOptions {
		additionalColors: string[];
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
	},
});
