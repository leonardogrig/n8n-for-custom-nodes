import { INodeProperties } from 'n8n-workflow';
import { buildApiProperties, createOperationNotice } from '../common';

export const name = 'teamTokenUsageHistorical';
export const displayName = 'Get historical token usage';

function createProperties(): INodeProperties[] {
	return [createOperationNotice('Default', name, 'GET')];
}

const { options, properties } = buildApiProperties(name, displayName, createProperties());

options.routing = {
	request: {
		method: 'GET',
		url: '=/team/token-usage/historical',
	},
};

export { options, properties };
