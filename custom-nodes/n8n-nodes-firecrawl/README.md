# n8n-nodes-firecrawl 🔥

This is an n8n community node. It lets you use **[Firecrawl](https://firecrawl.dev)** in your n8n workflows.

> 🔥 Turn entire websites into LLM-ready markdown or structured data. Scrape, crawl and extract with a single API.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Resources](#resources)  
[Version history](#version-history)  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

The **Firecrawl** node supports the following operations:

### Search
- Search and optionally scrape search results

### Map
- Input a website and get all the website urls

### Scrape
- Scrapes a URL and get its content in LLM-ready format (markdown, structured data via LLM Extract, screenshot, html)

### Crawl
- Scrapes all the URLs of a web page and return content in LLM-ready format

### Batch Scrape
- Start a batch job to scrape multiple URLs at once

### Batch Scrape Status
- Get the status/result of a batch scrape job by ID

### Batch Scrape Errors
- Retrieve errors for a batch scrape job by ID

### Crawl Active
- List all currently active crawl jobs for your team

### Crawl Params Preview
- Preview crawl parameters generated from a natural-language prompt

### Cancel Crawl
- Cancel a running crawl job by ID

### Get Crawl Errors
- Retrieve errors for a crawl job by ID

### Get Crawl Status
- Check the current status of a crawl job

### Extract Data
- Get structured data from single page, multiple pages or entire websites with AI

### Get Extract Status
- Get the current status of an extraction job

### Team Token Usage
- Get remaining and plan tokens for the authenticated team

### Team Credit Usage
- Get remaining and plan credits for the authenticated team

### Historical Credit Usage
- Get historical credit usage for your team

### Historical Token Usage
- Get historical token usage for your team

### Team Queue Status
- Get your team’s current queue load (waiting, active, max concurrency)

## Credentials

To use the Firecrawl node, you need to:

1. Sign up for a Firecrawl account at [https://firecrawl.dev](https://firecrawl.dev)
2. Get your API key from the Firecrawl dashboard
3. In n8n, add your Firecrawl API key to the node's credentials

> [!CAUTION]  
> The API key should be kept secure and never shared publicly

## Compatibility

- Minimum n8n version: 1.0.0
- Tested against n8n versions: 1.0.0, 1.1.0, 1.2.0
- Node.js version: 18 or higher

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
* [Firecrawl Documentation](https://firecrawl.dev/docs)
* [Firecrawl API Reference](https://docs.firecrawl.dev/api-reference/introduction)

## Version history

### 1.0.6
- Add support for additional Firecrawl endpoints:
  - Batch Scrape (start/status/errors)
  - Crawl Active
  - Crawl Params Preview
  - Cancel Crawl 
  - Get Crawl Errors
  - Team Token Usage
  - Team Credit Usage
  - Historical Credit Usage
  - Historical Token Usage
  - Team Queue Status
- Wire new operations into the node and align with Firecrawl API v2

### 1.0.5
- API version updated to [/v2](https://docs.firecrawl.dev/migrate-to-v2)
- Unified sitemap configuration parameters in Map operation
- Replaced `ignoreSitemap` and `sitemapOnly` with unified `sitemap` parameter
- `sitemap` parameter now accepts: "include" (default), "only", or "skip"

### 1.0.4
- Add additional fields property for custom data in Firecrawl API nodes

### 1.0.2
- Add integration parameter in all endpoint calls

### 1.0.1
- Support for Search operation

### 1.0.0
- Initial release
- Support for all basic Firecrawl operations:
  - Map URLs
  - Scrape URL
  - Crawl Website
  - Get Crawl Status
  - Extract Data
  - Get Extract Status
- Basic error handling and response processing
- Support for custom body options

## More information

Refer to our [documentation on creating nodes](https://docs.n8n.io/integrations/creating-nodes/) for detailed information on building your own nodes.

## License

[MIT](https://github.com/n8n-io/n8n-nodes-starter/blob/master/LICENSE.md)
