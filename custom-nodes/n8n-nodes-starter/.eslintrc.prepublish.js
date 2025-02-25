/**
 * @type {import('@types/eslint').ESLint.ConfigData}
 */
module.exports = {
	extends: './.eslintrc.js',

	overrides: [
		// Rules for package.json (Remove the project requirement)
		{
			files: ['package.json'],
			plugins: ['eslint-plugin-n8n-nodes-base'],
			parserOptions: {
				project: null, // Disable TypeScript project requirement for package.json
			},
			rules: {
				'n8n-nodes-base/community-package-json-name-still-default': 'error',
			},
		},
		// Rules for TypeScript files in the nodes folder
		{
			files: ['nodes/**/*.ts'],
			plugins: ['eslint-plugin-n8n-nodes-base'],
			parserOptions: {
				project: './tsconfig.json', // Ensure TypeScript files use the correct project
			},
			rules: {
				// Disable credential-related checks (not relevant for this project)
				'n8n-nodes-base/cred-class-field-documentation-url-missing': 'off',
				'n8n-nodes-base/cred-class-field-documentation-url-miscased': 'off',

				// Disable operation-related checks
				'n8n-nodes-base/node-param-operation-option-without-action': 'off',
			},
		},
	],
};
