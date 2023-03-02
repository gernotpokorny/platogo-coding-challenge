import React from 'react';

// components
import App from './App';
import CssBaseline from '@mui/material/CssBaseline';
import { Provider } from 'react-redux';

// persist
import { persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';

// theme
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './theme';

// utils
import { createRoot } from 'react-dom/client';
import { setupStore } from './app/store';
import reportWebVitals from './reportWebVitals';

const container = document.getElementById('root')!;
const root = createRoot(container);

const store = setupStore();
const persistor = persistStore(store);

root.render(
	<React.StrictMode>
		<Provider store={store}>
			<PersistGate loading={null} persistor={persistor}>
				<ThemeProvider theme={theme}>
					<CssBaseline />
					<App />
				</ThemeProvider>
			</PersistGate>
		</Provider>
	</React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
