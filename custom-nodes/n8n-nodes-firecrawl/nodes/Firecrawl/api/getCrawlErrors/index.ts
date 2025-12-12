import { INodeProperties } from 'n8n-workflow';
import { buildApiProperties, createOperationNotice } from '../common';

export const name = 'getCrawlErrors';
export const displayName = 'Get crawl errors';

function createCrawlIdProperty(): INodeProperties {
	return {
		displayName: 'Crawl ID',
		name: 'crawlId',
		type: 'string',
		required: true,
		default: '',
		description: 'ID of the crawl job',
		routing: {
			request: {
				url: '=/crawl/{{$value}}/errors',
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
	return [createOperationNotice('Default', name, 'GET'), createCrawlIdProperty()];
}

const { options, properties } = buildApiProperties(name, displayName, createProperties());

options.routing = {
	request: {
		method: 'GET',
	},
};

export { options, properties };
