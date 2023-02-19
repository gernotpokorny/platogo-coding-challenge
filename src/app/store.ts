import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import parkingGarageReducer from '../features/parking-garage/parkingGarageSlice';

export const store = configureStore({
	reducer: {
		parkingGarage: parkingGarageReducer,
	},
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
	ReturnType,
	RootState,
	unknown,
	Action<string>
>;
