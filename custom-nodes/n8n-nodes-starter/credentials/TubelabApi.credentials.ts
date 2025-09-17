import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class TubelabApi implements ICredentialType {
	name = 'tubelabApi';

	displayName = 'Tubelab API';

	documentationUrl = 'https://public-api.tubelab.net';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'You can create keys in the Tubelab dashboard',
			placeholder: 'tlp_xxxxxxxxxxxxxxxxxxxxx',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: 'Api-Key {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://public-api.tubelab.net/v1',
			url: '/channels',
			method: 'GET',
			qs: {
				query: 'minecraft',
			},
		},
	};
}
