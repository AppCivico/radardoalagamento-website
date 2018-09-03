/* global google, customDistribution */
import mapStyles from './mapStyles.json';

import * as polygonStyles from './polygonStyles.json';

import * as panel from './customInfoPanel';

import drawPolygon from './drawPolygon';

import apiSources from '../apiSources.json';

import { gradientSteps } from '../helpers';

let map = {};

export default function initMap() {
	const mapElement = document.getElementById('map');

	if (mapElement === null) {
		return false;
	}

	map = new google.maps.Map(mapElement, {
		center: { lat: -23.55, lng: -46.633333 },
		zoom: 10,
		styles: mapStyles,
		mapTypeControl: false,
		streetViewControl: false,
		fullscreenControlOptions: {
			position: google.maps.ControlPosition.TOP_LEFT,
		},
	});

	function getArrayBounds(polyArray) {
		const bounds = new google.maps.LatLngBounds();
		let path = {};
		let paths = {};

		for (let polys = 0; polys < polyArray.length; polys += 1) {
			paths = polyArray[polys].getPaths();
			for (let l = 0; l < paths.getLength(); l += 1) {
				path = paths.getAt(l);

				for (let ii = 0; ii < path.getLength(); ii += 1) {
					bounds.extend(path.getAt(ii));
				}
			}
		}
		return bounds;
	}

	if (mapElement.hasAttribute('data-to-draw')) {
		const toDraw = mapElement.getAttribute('data-to-draw').split(' ');

		const polygonsBounds = apiSources
			.filter(endPoint => toDraw.indexOf(endPoint.jsonRootElement) !== -1)
			.map((endPointData) => {
				const rootElement = endPointData.jsonRootElement;
				const myHeaders = new Headers();
				const myInit = {
					method: 'GET',
					headers: myHeaders.append('Content-Type', 'application/json'),
					mode: 'cors',
					cache: 'default',
				};
				const myRequest = new Request(endPointData.dataDest.replace('./static', ''));

				let panelTemplate = null;
				let previousURLSegments = '';

				if (mapElement.hasAttribute('data-info-panel-for')) {
					const infoPanelFor = mapElement.getAttribute('data-info-panel-for').split(' ');
					if (infoPanelFor.indexOf(rootElement) !== -1) {
						panelTemplate = mapElement.hasAttribute(`data-info-panel-for-${rootElement}`)
							? document.getElementById(mapElement.getAttribute(`data-info-panel-for-${rootElement}`))
							: document.getElementById(`info-panel__${rootElement}`) || null;
					}
				}

				if (mapElement.hasAttribute('data-link-for')) {
					const linkFor = mapElement.getAttribute('data-link-for').split(' ');
					if (linkFor.indexOf(rootElement) !== -1) {
						if (endPointData.contentFolder != null) {
							previousURLSegments = `${endPointData.contentFolder.replace('./content', '')}`;
						}
					}
				}

				return fetch(myRequest, myInit)
					.then((response) => {
						const contentType = response.headers.get('content-type');

						if (contentType && contentType.includes('application/json')) {
							return response.json();
						}

						throw new TypeError("Oops, we haven't got JSON!");
					})
					.then((areasList) => {
						const distributeBy = mapElement.hasAttribute(`data-${rootElement}-distribute-by`)
							? mapElement.getAttribute(`data-${rootElement}-distribute-by`)
							: '';

						let polygonsToDraw = areasList[rootElement];

						let fills = [];

						let minimum = 0;
						let maximum = 0;

						if (mapElement.hasAttribute(`data-${rootElement}-to-draw`)) {
							const areasToDraw = mapElement.getAttribute(`data-${rootElement}-to-draw`).split(' ')
								.map(item => parseInt(item, 10));
							polygonsToDraw = polygonsToDraw.filter(x => areasToDraw.indexOf(x.id) !== -1);
						}

						if (distributeBy !== '') {
							if (!polygonsToDraw[0][distributeBy]) {
								polygonsToDraw = polygonsToDraw.map((item) => {
									const newItem = item;
									newItem[distributeBy] = customDistribution[distributeBy][item.id] || 0;
									return newItem;
								});
							}

							polygonsToDraw.sort((a, b) => a[distributeBy] - b[distributeBy]);

							minimum = parseInt(polygonsToDraw[0][distributeBy], 10);
							maximum = parseInt(polygonsToDraw.slice(-1)[0][distributeBy], 10);

							fills = gradientSteps([255, 144, 68], [255, 83, 66], maximum - minimum - 1);
						}

						const polygons = polygonsToDraw
							.filter(polygon => polygon.geo_json !== null)
							.map((polygon) => {
								const initialStyles = distributeBy !== ''
									? Object.assign(polygonStyles.initial, { fillColor: `rgb(${fills[polygon[distributeBy] - minimum].join(', ')})` })
									: polygonStyles.initial;

								const geoJSON = JSON.parse(polygon.geo_json);
								const drawnPolygon = drawPolygon(geoJSON.coordinates);

								drawnPolygon.setOptions(initialStyles);
								drawnPolygon.initialStyles = initialStyles;
								drawnPolygon.setMap(map);

								if (rootElement === 'cities') {
									drawnPolygon.setOptions(polygonStyles.city);
									if (toDraw.length === 1) {
										drawnPolygon.setOptions({
											strokeOpacity: 0,
											fillOpacity: polygonStyles.initial.fillOpacity,
										});
									}
								} else {
									google.maps.event.addListener(drawnPolygon, 'mouseover', () => {
										const previousStyles = {};

										Object.keys(polygonStyles.toggle)
											.map((styleRule) => {
												previousStyles[styleRule] = drawnPolygon[styleRule];
												return previousStyles[styleRule];
											});

										drawnPolygon.previousStyles = previousStyles;

										drawnPolygon.setOptions(polygonStyles.toggle);
									});

									google.maps.event.addListener(drawnPolygon, 'mouseout', () => {
										drawnPolygon.setOptions(drawnPolygon.previousStyles);
									});
								}

								if (previousURLSegments !== '' || panelTemplate !== null) {
									drawnPolygon.setOptions({ clickable: true });
								}

								if (previousURLSegments !== '') {
									if (polygon.slug != null) {
										google.maps.event.addListener(drawnPolygon, 'click', () => {
											window.location = `${previousURLSegments}/${polygon.slug}`;
										});
									}
								}

								if (panelTemplate !== null) {
									const panelContent = document.createElement('div');
									panelContent.innerHTML = panelTemplate.innerHTML;

									const elsToDataBind = panelContent.querySelectorAll('[data-to-bind]');

									for (let j = elsToDataBind.length - 1; j >= 0; j -= 1) {
										if (polygon[elsToDataBind[j].getAttribute('data-to-bind')] != null) {
											elsToDataBind[j].textContent = polygon[elsToDataBind[j].getAttribute('data-to-bind')];
										}
									}

									drawnPolygon.panelContent = panelContent;

									if (drawnPolygon.panelContent !== null) {
										google.maps.event.addListener(drawnPolygon, 'mouseover', (e) => {
											panel.insertInfoPanel(e, drawnPolygon.panelContent);
										});

										google.maps.event.addListener(drawnPolygon, 'mouseout', () => {
											panel.deleteInfoPanel();
										});

										google.maps.event.addListener(drawnPolygon, 'mousemove', (e) => {
											panel.moveInfoPanel(e);
										});
									}
								}

								return drawnPolygon;
							});

						return getArrayBounds(polygons) || null;
					})
					.catch((error) => {
						throw new TypeError(error);
					});
			});

		Promise.all(polygonsBounds).then((results) => {
			if (results[0]) {
				map.fitBounds(results[0]);
			}

			if (mapElement.getAttribute('data-zoom') === '+1') {
				google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
					map.setZoom(map.getZoom() + 1);
				});
			}
		});
	}

	return map;
}
