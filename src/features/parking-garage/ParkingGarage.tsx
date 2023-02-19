// components
import { OuterRow } from './OuterRow';
import { InnerRow } from './InnerRow';

// styles
import { Container, ParkingGrid, Message } from './ParkingGarage.style';

export const ParkingGarage = () => {
	return (
		<Container>
			<ParkingGrid>
				<OuterRow start={0} end={16} />
				<div />
				<InnerRow first start={16} end={27} />
				<InnerRow start={27} end={38} />
				<div />
				<OuterRow start={38} end={54} />
			</ParkingGrid>
			<Message>Please click on a parking place to park or leave.</Message>
		</Container>
	);
}