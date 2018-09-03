/**
 * @see https://medium.com/@asimmittal/custom-tooltips-for-google-maps-in-pure-javascript-a8004b8e9458
 * @see https://jsfiddle.net/asimmittal/jm24neys/
 */

// create a global variable that will point to the tooltip in the DOM
let panelEl = null;

// offset along x and y in px
const offset = {
	x: 20,
	y: 20,
};

let coordPropName = null;

export function insertInfoPanel(event, data) {
	if (!panelEl && event) {
		// create the InfoPanel object
		if (typeof data === 'string') {
			panelEl = document.createElement('div');
			panelEl.className = 'custom-info-panel';
			panelEl.innerHTML = data;
		} else if (typeof data === 'object' && 'nodeType' in data && data.nodeType === 1 && data.cloneNode) {
			panelEl = data;
			panelEl.className += ' custom-info-panel';
		}

		// get the property which captures the mouse event
		coordPropName = Object.keys(event).filter(p => event[p] instanceof MouseEvent);

		if (coordPropName[0]) {
			panelEl.style.position = 'absolute';
			panelEl.style.top = `${event[coordPropName[0]].clientY + window.scrollY + offset.y}px`;
			panelEl.style.left = `${event[coordPropName[0]].clientX + window.scrollX + offset.x}px`;

			document.body.appendChild(panelEl);
		}
	}
}

export function moveInfoPanel(event) {
	if (panelEl && event && coordPropName[0]) {
		// position it
		panelEl.style.top = `${event[coordPropName[0]].clientY + window.scrollY + offset.y}px`;
		panelEl.style.left = `${event[coordPropName[0]].clientX + window.scrollX + offset.x}px`;
	}
}

export function deleteInfoPanel() {
	if (panelEl) {
		// delete the tooltip if it exists in the DOM
		document.body.removeChild(panelEl);
		panelEl = null;
	}
}
