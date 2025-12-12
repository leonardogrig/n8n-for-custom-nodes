import { INodeProperties } from 'n8n-workflow';
import { buildApiProperties, createOperationNotice, createUrlProperty } from '../common';

export const name = 'crawlParamsPreview';
export const displayName = 'Preview crawl params from prompt';

function createPromptProperty(): INodeProperties {
	return {
		displayName: 'Prompt',
		name: 'prompt',
		type: 'string',
		default: '',
		required: true,
		description: 'Natural language prompt describing crawl behavior',
		routing: {
			request: {
				body: {
					prompt: '={{ $value }}',
				},
			},
		},
		displayOptions: {
			show: {
				resource: ['Default'],
				operation: [name],
			},
		},
	};
}

function createProperties(): INodeProperties[] {
	return [createOperationNotice('Default', name), createUrlProperty(name), createPromptProperty()];
}

const { options, properties } = buildApiProperties(name, displayName, createProperties());

options.routing = {
	request: {
		url: '=/crawl/params-preview',
	},
};

export { options, properties };
