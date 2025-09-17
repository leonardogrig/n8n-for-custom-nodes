import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const loadRequest = async () => {
	const requestPath = path.join(dirname, 'request.json');
	const raw = await fs.readFile(requestPath, 'utf8');
	return JSON.parse(raw);
};

const buildHeaders = (inputHeaders = {}) => {
	const headers = { ...inputHeaders };
	const apiKey = process.env.TUBELAB_API_KEY || process.env.API_KEY;
	if (headers.Authorization?.includes('${TUBELAB_API_KEY}')) {
		if (!apiKey) {
			throw new Error('Environment variable TUBELAB_API_KEY or API_KEY is required');
		}
		headers.Authorization = headers.Authorization.replace('${TUBELAB_API_KEY}', apiKey);
	}
	return headers;
};

const buildUrl = (baseUrl, params = {}) => {
	const url = new URL(baseUrl);
	Object.entries(params).forEach(([key, value]) => {
		if (value === undefined || value === null) {
			return;
		}
		if (Array.isArray(value)) {
			value.forEach((item) => {
				if (item !== undefined && item !== null) {
					url.searchParams.append(key, item);
				}
			});
			return;
		}
		url.searchParams.set(key, value);
	});
	return url;
};

const writeResponse = async (data) => {
	const responsePath = path.join(dirname, 'response.json');
	await fs.writeFile(responsePath, JSON.stringify(data, null, 2));
	return responsePath;
};

const main = async () => {
	const requestConfig = await loadRequest();
	const url = buildUrl(requestConfig.url, requestConfig.params);
	const response = await fetch(url, {
		method: requestConfig.method ?? 'GET',
		headers: buildHeaders(requestConfig.headers),
	});
	const text = await response.text();
	let parsed;
	try {
		parsed = JSON.parse(text);
	} catch {
		parsed = text;
	}
	const responsePayload = {
		status: response.status,
		reason: response.statusText,
		headers: Object.fromEntries(response.headers.entries()),
		body: parsed,
	};
	const responsePath = await writeResponse(responsePayload);
	console.log(`Response saved to ${responsePath}`);
};

main().catch((error) => {
	console.error('Request failed:', error);
	process.exit(1);
});
