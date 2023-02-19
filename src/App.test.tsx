import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from './app/store';
import App from './App';

// theme
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './theme';

test('renders learn react link', () => {
	const { getByText } = render(
		<Provider store={store}>
			<ThemeProvider theme={theme}>
				<App />
			</ThemeProvider>
		</Provider>
	);

	expect(getByText('Please click on a parking place to park or leave.')).toBeInTheDocument();
});
