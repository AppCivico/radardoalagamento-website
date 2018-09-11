/* global google */
import { throwIfMissing } from '../helpers';

export default function drawPolygon(coordinates = throwIfMissing()) {
	const points = coordinates.map(coord =>
		coord.map((corner) => {
			const point = {
				lat: corner[1],
				lng: corner[0],
			};
			return point;
		}));

	// Construct the polygon.
	const polygon = new google.maps.Polygon({
		paths: points,
	});

	return polygon;
}
