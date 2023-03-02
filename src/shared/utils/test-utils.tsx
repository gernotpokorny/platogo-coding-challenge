import React from 'react';

// components
import { Provider } from 'react-redux';

// theme
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../theme';

// types
import type { PreloadedState } from '@reduxjs/toolkit';
import type { RenderOptions } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import type { AppStore, RootState } from '../../app/store';

// utils
import { render } from '@testing-library/react';
import { setupStore } from '../../app/store';

// As a basic setup, import your same slice reducers

// This type interface extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store.
interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
	preloadedState?: PreloadedState<RootState>
	store?: AppStore
}

export function renderWithProviders(
	ui: React.ReactElement,
	{
		preloadedState = {},
		// Automatically create a store instance if no store was passed in
		store = setupStore(preloadedState),
		...renderOptions
	}: ExtendedRenderOptions = {}
) {
	function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
		return (
			<Provider store={store}>
				<ThemeProvider theme={theme}>
					{children}
				</ThemeProvider>
			</Provider>
		);
	}

	// Return an object with the store and all of RTL's query functions
	return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}