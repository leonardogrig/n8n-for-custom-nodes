import { INodeProperties } from 'n8n-workflow';
import { buildApiProperties, createOperationNotice } from '../common';

export const name = 'creditUsageHistorical';
export const displayName = 'Get historical credit usage';

function createProperties(): INodeProperties[] {
	return [createOperationNotice('Default', name, 'GET')];
}

const { options, properties } = buildApiProperties(name, displayName, createProperties());

options.routing = {
	request: {
		method: 'GET',
		url: '=/team/credit-usage/historical',
	},
};

export { options, properties };
