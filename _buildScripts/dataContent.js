
const https = require('https');
const fs = require('fs');
const { versionCompare } = require('./versionCompare.js');
const { slugify } = require('./slugify.js');

const sourcesAndDests = require('../_source/scripts/apiSources.json');

let DOMAIN;

DOMAIN = 'https://dtupa.eokoe.com';


function savePages(fileData) {
	const fileContent = fs.readFileSync(fileData.dataDest, 'utf-8');
	const jsonElements = JSON.parse(fileContent)[fileData.jsonRootElement];
	const pageList = [];

	if (typeof (jsonElements) === 'undefined' || jsonElements === null) {
		throw new Error(`error on parse ${fileData.dataDest}: ${fileData.jsonRootElement}`);
	}

	jsonElements.forEach((page) => {
		const filename = `${fileData.contentFolder}/${slugify(page.name)}.md`;

		if (pageList.indexOf(filename) !== -1) {
			throw new Error(`${filename} already exists.`);
		}

		const contentFile = fs.createWriteStream(filename, { flags: 'w' });

		contentFile.on('open', () => {
			console.log(`Writing ${filename}`); // eslint-disable-line no-console
		});


		contentFile.on('error', (err) => { // Handle errors
			fs.unlink(filename); // Delete the file async. (But we don't check the result)
			throw new Error(`error on writing ${filename}. ${err.message}`);
		});

		contentFile.on('finish', () => {
			contentFile.close();
		});

		contentFile.on('close', () => {
			console.log(`${filename} saved.`); // eslint-disable-line no-console
		});

		let frontMatter = `---
date: ${new Date().toISOString()}
draft: false
title: "${page.name || page.title}"
id: ${page.id}
`;

		Object.keys(page).forEach(key => {
			if (page[key] !== 'date'
				&& page[key] !== 'name'
				&& page[key] !== 'title'
				&& page[key] !== 'id'
				&& page[key] !== fileData.contentField

			) {
			 	if (typeof page[key] !== 'object') {
					frontMatter += `${key}: '${page[key]}'
`;
				} else if (page[key] !== null && page[key] !== undefined) {
					frontMatter += `${key}:
`;
					Object.keys(page[key]).forEach(innerKey => {
						if (typeof page[key][innerKey] !== 'object'){
							frontMatter += `  ${innerKey}: "${page[key][innerKey]}"
`;
						} else {
							frontMatter += `  -
`;

							Object.keys(page[key][innerKey]).forEach(element => {
								frontMatter += `    ${element}: "${page[key][innerKey][element]}"
`;
							});
						}
					});
				}
			}
		});

		frontMatter += `---
		`;

		contentFile.write(frontMatter);

		if (fileData.contentField && page[fileData.contentField]){
			contentFile.write(page[fileData.contentField]);
		}


		pageList[pageList.length] = filename;
	});


	if (fileData.jsonRootElement === 'action_lines') {
		console.log('Saving sorted action lines'); // eslint-disable-line no-console
		jsonElements.sort((a, b) => versionCompare(a.id, b.id));
		const orderedJSON = {};
		orderedJSON[fileData.jsonRootElement] = jsonElements;

		fs.writeFile(fileData.dataDest, JSON.stringify(orderedJSON), 'utf8', (err) => {
			if (err) throw new Error(`error on writing ${fileData.dataDest}. ${err.message}`);
			console.log('Sorted action lines saved!'); // eslint-disable-line no-console
		});
	}
}

function download(url, fileData, cb) {
	const file = fs.createWriteStream(fileData.dataDest);

	const request = https.get(url, (response) => {
		// check if response is success
		if (response.statusCode !== 200) {
			throw new Error(`Response status was ${response.statusCode} for url ${url}`);
		}

		response.pipe(file);

		file.on('finish', () => {
			file.close(() => {
				if (fileData.contentFolder != null) {
					cb(fileData);
				}
			}); // close() is async, call cb after close completes.
			console.log(`${url} saved as ${fileData.dataDest}`); // eslint-disable-line no-console
		});
	});

	request.on('error', (err) => { // Handle errors
		fs.unlink(fileData.dataDest); // Delete the file async. (But we don't check the result)
		throw new Error(err.message);
	});

	file.on('error', (err) => { // Handle errors
		fs.unlink(fileData.dataDest); // Delete the file async. (But we don't check the result)
		throw new Error(err.message);
	});
}

sourcesAndDests.forEach((file) => {
	const fileData = file;

	download(`${DOMAIN}${file.url}`, fileData, savePages);
});
