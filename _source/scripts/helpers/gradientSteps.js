export default function gradientSteps(firstColor, lastColor, steps = 1) {
	const r = [firstColor];

	let cMax = 0;
	let cMin = 0;
	let j = 1;

	while (j <= steps) {
		const c = [];
		let i = 0;

		while (i < firstColor.length) {
			cMax = Math.max(firstColor[i], lastColor[i]);
			cMin = Math.min(firstColor[i], lastColor[i]);
			c.push(Math.round((((cMax - cMin) / (steps + 1)) * j) + cMin));
			i += 1;
		}

		r.push(c);
		j += 1;
	}

	r.push(lastColor);

	return r;
}
