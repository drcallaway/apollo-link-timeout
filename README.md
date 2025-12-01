# apollo-link-timeout

An [Apollo Link](https://www.apollographql.com/docs/link/) that aborts requests that aren't completed within a specified timeout period. Note that timeouts are enforced for query and mutation operations only (not subscriptions).

## Installation

```bash
npm install apollo-link-timeout
```

or

```bash
yarn add apollo-link-timeout
```

## Usage

```javascript
import ApolloLinkTimeout from 'apollo-link-timeout';
import { createHttpLink } from 'apollo-link-http';
import { ApolloClient } from 'apollo-client';

...

const timeoutLink = new ApolloLinkTimeout(10000); // 10 second timeout

const httpLink = createHttpLink({ uri: "/graphql" });

const timeoutHttpLink = timeoutLink.concat(httpLink);

const apolloClient = new ApolloClient({ link: timeoutHttpLink });

// use timeout-enabled Apollo client...

// Override timeout from any query
<Query
 query={SOME_QUERY}
 variables={{
    someVar1: "foo",
    someVar2: "bar",
   }}
  context={{ timeout: 3000 }}
>
// ...
```

## API

**`new ApolloLinkTimeout(timeout?, statusCode?)`**

Creates a new TimeoutLink instance that aborts requests if the timeout expires before the response is received.

**Parameters:**

- `timeout` (optional): The timeout in milliseconds for the request. Defaults to 15000ms (15 seconds) if omitted.
- `statusCode` (optional): The HTTP status code to return when a timeout occurs. Defaults to 408 (Request Timeout) if omitted.

## Overriding Timeout Per Operation

You can override the default timeout for individual operations by setting a `timeout` value in the operation context:

```javascript
// Override timeout in a query
<Query
  query={SOME_QUERY}
  variables={{
    someVar1: "foo",
    someVar2: "bar",
  }}
  context={{ timeout: 3000 }} // 3 second timeout for this query
>
  // ...
</Query>


// Or when calling the client directly
apolloClient.query({
  query: SOME_QUERY,
  context: { timeout: 5000 } // 5 second timeout
});

// Or via a prior link
const link = new ApolloLink((operation, forward) => {
  operation.setContext({ timeout: 5000 });
});
link.concat(timeoutLink);
```

The timeout resolution follows this priority: operation-level context timeout > link-level timeout > default (15000ms).

## Disabling Timeout

To disable the timeout for a specific operation, set the timeout to a negative value in the operation context:

```javascript
apolloClient.query({
  query: SOME_QUERY,
  context: { timeout: -1 } // Disable timeout for this query
});
```

When a negative timeout is provided, the timeout link will be skipped and the operation will proceed without any timeout enforcement.

See [Apollo documentation](https://www.apollographql.com/client) for information on using the Apollo client.
