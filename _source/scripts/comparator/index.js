import apiSources from '../apiSources.json';

export default function initComparison() {
	const comparisonField = document.getElementById('js-districts-comparison__field');
	let comparisonTable = document.getElementById('js-districts-comparison__table');

	if (comparisonField === null || comparisonTable === null) {
		return false;
	}

	const filledComparisonTable = comparisonTable.cloneNode(true);
	const comparisonItems = filledComparisonTable.querySelectorAll('.js-districts-comparison__value');

	if (comparisonItems.length === 0) {
		return false;
	}

	function fillItems() {
		const districtToCompareId = parseInt(comparisonField[comparisonField.selectedIndex].value, 10);
		const districtToCompareName = comparisonField[comparisonField.selectedIndex].textContent;
		const districtValueTemplate = document.getElementById('js-districts-comparison__field-template').innerHTML;

		const myHeaders = new Headers();
		const myInit = {
			method: 'GET',
			headers: myHeaders.append('Content-Type', 'application/json'),
			mode: 'cors',
			cache: 'default',
		};

		const endPointData = apiSources.filter(x => x.jsonRootElement === 'indicators');
		const myRequest = new Request(endPointData[0].dataDest.replace('./static', ''));

		fetch(myRequest, myInit)
			.then((response) => {
				const contentType = response.headers.get('content-type');

				if (contentType && contentType.includes('application/json')) {
					return response.json();
				}

				throw new TypeError("Oops, we haven't got JSON!");
			})
			.then(response => response.indicators)
			.then((indicators) => {
				for (let i = comparisonItems.length - 1; i >= 0; i -= 1) {
					const varId = parseInt(comparisonItems[i].getAttribute('data-to-bind'), 10);

					const comparisonValues = indicators
						.filter(x => x.id === varId)
						.map(x => x.regions.filter(y => y.id === districtToCompareId))
						.map(x => x[0])[0];

					comparisonItems[i].innerHTML = districtValueTemplate;
					comparisonItems[i].querySelector('a').textContent = parseFloat(comparisonValues.value) || 0;
					comparisonItems[i].querySelector('a').href = comparisonValues.url_observatorio;
					comparisonItems[i].querySelector('[data-to-bind="year"]').textContent = comparisonValues.year;
					comparisonItems[i].querySelector('[data-to-bind="source"]').textContent = comparisonValues.sources.join(', ');
					comparisonItems[i].title = districtToCompareName;
				}

				comparisonTable.parentNode.replaceChild(filledComparisonTable, comparisonTable);

				comparisonTable = filledComparisonTable;
			});
	}

	return comparisonField.addEventListener(
		'change',
		fillItems,
		false,
	);
}
