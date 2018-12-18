# apollo-link-timeout

An [Apollo Link](https://www.apollographql.com/docs/link/) that aborts requests that aren't completed within a specified timeout period. Note that timeouts are enforced for query and mutation operations only (not subscriptions).

## Installation
```
npm install apollo-link-timeout
```
or
```
yarn add apollo-link-timeout
```

## Usage
```
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

See [Apollo documentation](https://www.apollographql.com/client) for information on using the Apollo client.
