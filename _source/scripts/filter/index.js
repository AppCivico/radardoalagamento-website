import defaultDiacriticsRemovalMap from './diacriticsMap.json';

export default function initFilter() {
	const filterableItems = document.querySelectorAll('.js-filterable__item');
	const filterableField = document.getElementById('js-filterable__field');
	const filterableCounter = document.getElementById('js-filterable__counter');
	const diacriticsMap = {};
	let counter = filterableItems.length;

	if (filterableItems === null || filterableField === null) {
		return false;
	}

	if (filterableField.form !== null) {
		filterableField.form.onsubmit = () => false;
	}

	for (let i = 0; i < defaultDiacriticsRemovalMap.length; i += 1) {
		const { diacritics } = defaultDiacriticsRemovalMap[i];
		for (let j = 0; j < diacritics.length; j += 1) {
			diacriticsMap[diacritics[j]] = defaultDiacriticsRemovalMap[i].letter;
		}
	}

	function removeDiacritics(str) {
		return str.replace(/[^\u0000-\u007E]/g, a => diacriticsMap[a] || a);
	}

	for (let i = filterableItems.length - 1; i >= 0; i -= 1) {
		const normalizedContent = removeDiacritics(filterableItems[i].textContent.toLowerCase().replace(/\s+/g, ' ').trim());

		filterableItems[i].setAttribute('data-normalized-content', normalizedContent);
	}

	function filterBy() {
		const filterTerm = filterableField.value.toLowerCase().trim();

		for (let i = 0; i < filterableItems.length; i += 1) {
			if (filterTerm !== '' && filterableItems[i].getAttribute('data-normalized-content').indexOf(filterTerm) === -1) {
				if (!filterableItems[i].hasAttribute('hidden')) {
					filterableItems[i].setAttribute('hidden', 'hidden');
					counter -= 1;
				}
			} else if (filterableItems[i].hasAttribute('hidden')) {
				filterableItems[i].removeAttribute('hidden');
				counter += 1;
			}
		}

		if (filterableCounter !== null) {
			filterableCounter.textContent = counter;
		}
	}

	return filterableField.addEventListener(
		'input',
		filterBy,
		false,
	);
}
