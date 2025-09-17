/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
/* eslint-disable n8n-nodes-base/node-class-description-outputs-wrong */
/* eslint-disable n8n-nodes-base/node-class-description-inputs-wrong-regular-node */
import {
	NodeApiError,
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	type JsonObject,
} from 'n8n-workflow';

const API_BASE_URL = 'https://public-api.tubelab.net/v1';

type TubelabResource = 'channels' | 'outliers';
type TubelabOperation = 'search' | 'listRelated';

type AdditionalParameter = {
	key: string;
	value: string;
};

type AdditionalParametersCollection = {
	parameter?: AdditionalParameter[];
};

type TubelabApiCredentials = {
	apiKey: string;
};

export class Tubelab implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Tubelab',
		name: 'tubelab',
		icon: 'file:logo.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Interact with the Tubelab public API. Docs: https://tubelab.net/docs/api',
		defaults: {
			name: 'Tubelab',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'tubelabApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: API_BASE_URL,
			url: '',
			json: true,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Channel',
						value: 'channels',
						description: 'Work with channel insights',
					},
					{
						name: 'Outlier',
						value: 'outliers',
						description: 'Work with outlier video insights',
					},
				],
				default: 'channels',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['channels'],
					},
				},
				options: [
					{
						name: 'Search',
						value: 'search',
						action: 'Search channels',
						description: 'Search for channels that match a keyword',
					},
					{
						name: 'List Related',
						value: 'listRelated',
						action: 'List related channels',
						description: 'List channels related to one or more channel IDs',
					},
				],
				default: 'search',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['outliers'],
					},
				},
				options: [
					{
						name: 'Search',
						value: 'search',
						action: 'Search outliers',
						description: 'Search for outlier videos that match a keyword',
					},
					{
						name: 'List Related',
						value: 'listRelated',
						action: 'List related outliers',
						description: 'List outlier videos related to an outlier ID',
					},
				],
				default: 'search',
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'minecraft',
				description: 'Search term to filter results',
				displayOptions: {
					show: {
						resource: ['channels', 'outliers'],
						operation: ['search'],
					},
				},
			},
			{
				displayName: 'Related Channel IDs',
				name: 'relatedChannelIds',
				type: 'string',
				required: true,
				default: [],
				typeOptions: {
					multipleValues: true,
				},
				placeholder: 'UC0BHO4AbCeBpghWNifMbH5Q',
				description: 'Provide one or more channel IDs to look up related channels',
				displayOptions: {
					show: {
						resource: ['channels'],
						operation: ['listRelated'],
					},
				},
			},
			{
				displayName: 'Outlier ID',
				name: 'outlierId',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'ivZHv3xujNw',
				description: 'Provide the outlier ID to retrieve related results',
				displayOptions: {
					show: {
						resource: ['outliers'],
						operation: ['listRelated'],
					},
				},
			},
			{
				displayName: 'Additional Parameters',
				name: 'additionalParameters',
				type: 'fixedCollection',
				placeholder: 'Add Parameter',
				default: {},
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						resource: ['channels', 'outliers'],
					},
				},
				options: [
					{
						displayName: 'Parameter',
						name: 'parameter',
						values: [
							{
								displayName: 'Key',
								name: 'key',
								type: 'string',
								default: '',
								required: true,
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								required: true,
							},
						],
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = (await this.getCredentials('tubelabApi')) as TubelabApiCredentials;
		const apiKey = credentials?.apiKey;
		if (!apiKey) {
			throw new NodeOperationError(this.getNode(), 'Missing Tubelab API key. Please configure credentials.', {
				itemIndex: 0,
			});
		}

		const headers = {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			Authorization: `Api-Key ${apiKey}`,
		};

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const resource = this.getNodeParameter('resource', itemIndex) as TubelabResource;
				const operation = this.getNodeParameter('operation', itemIndex) as TubelabOperation;

				const qs: IDataObject = {};
				let endpoint = '';

				if (resource === 'channels') {
					if (operation === 'search') {
						const query = this.getNodeParameter('query', itemIndex) as string;
						if (!query) {
							throw new NodeOperationError(this.getNode(), 'Query is required to search channels.', {
								itemIndex,
							});
						}
						qs.query = query;
						endpoint = '/channels';
					} else if (operation === 'listRelated') {
						const relatedChannelIds = this.getNodeParameter('relatedChannelIds', itemIndex) as string | string[];
						const ids = Array.isArray(relatedChannelIds)
							? relatedChannelIds.filter((value) => value)
							: relatedChannelIds
								? [relatedChannelIds]
								: [];

						if (ids.length === 0) {
							throw new NodeOperationError(this.getNode(), 'Provide at least one channel ID.', {
								itemIndex,
							});
						}

						qs.relatedChannelId = ids;
						endpoint = '/channels/related';
					}
				} else if (resource === 'outliers') {
					if (operation === 'search') {
						const query = this.getNodeParameter('query', itemIndex) as string;
						if (!query) {
							throw new NodeOperationError(this.getNode(), 'Query is required to search outliers.', {
								itemIndex,
							});
						}
						qs.query = query;
						endpoint = '/outliers';
					} else if (operation === 'listRelated') {
						const outlierId = this.getNodeParameter('outlierId', itemIndex) as string;
						if (!outlierId) {
							throw new NodeOperationError(this.getNode(), 'Outlier ID is required to list related outliers.', {
								itemIndex,
							});
						}
						qs.outlierId = outlierId;
						endpoint = '/outliers/related';
					}
				}

				if (!endpoint) {
					throw new NodeOperationError(this.getNode(), 'Selected endpoint is not implemented yet.', {
						itemIndex,
					});
				}

				const additionalParameters = this.getNodeParameter('additionalParameters', itemIndex, {}) as AdditionalParametersCollection;

				if (additionalParameters.parameter?.length) {
					additionalParameters.parameter.forEach(({ key, value }) => {
						if (!key) {
							return;
						}
						qs[key] = value;
					});
				}

				const responseData = await this.helpers.httpRequest({
					method: 'GET',
					url: `${API_BASE_URL}${endpoint}`,
					qs,
					headers,
					json: true,
					arrayFormat: 'repeat',
				});

				const normalized =
					responseData !== null && typeof responseData === 'object'
						? (responseData as IDataObject)
						: { data: responseData };

				returnData.push({
					json: normalized,
				});
			} catch (error: unknown) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : 'Unknown error',
						},
						pairedItem: {
							item: itemIndex,
						},
					});
					continue;
				}

				throw new NodeApiError(this.getNode(), error as JsonObject, {
					itemIndex,
				});
			}
		}

		return [returnData];
	}
}
