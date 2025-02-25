"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpBin = void 0;
const HttpVerbDescription_1 = require("./HttpVerbDescription");
class HttpBin {
    constructor() {
        this.description = {
            displayName: 'HttpBin',
            name: 'httpBin',
            icon: 'file:httpbin.svg',
            group: ['transform'],
            version: 1,
            subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
            description: 'Interact with HttpBin API',
            defaults: {
                name: 'HttpBin',
            },
            inputs: ['main'],
            outputs: ['main'],
            requestDefaults: {
                baseURL: 'https://httpbin.org',
                url: '',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            },
            /**
             * In the properties array we have two mandatory options objects required
             *
             * [Resource & Operation]
             *
             * https://docs.n8n.io/integrations/creating-nodes/code/create-first-node/#resources-and-operations
             *
             * In our example, the operations are separated into their own file (HTTPVerbDescription.ts)
             * to keep this class easy to read.
             *
             */
            properties: [
                {
                    displayName: 'Resource',
                    name: 'resource',
                    type: 'options',
                    noDataExpression: true,
                    options: [
                        {
                            name: 'HTTP Verb',
                            value: 'httpVerb',
                        },
                    ],
                    default: 'httpVerb',
                },
                ...HttpVerbDescription_1.httpVerbOperations,
                ...HttpVerbDescription_1.httpVerbFields,
            ],
        };
    }
}
exports.HttpBin = HttpBin;
