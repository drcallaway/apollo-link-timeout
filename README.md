# apollo-link-timeout

An [Apollo Link](https://www.apollographql.com/docs/link/) that aborts a request if it isn't completed within a specified timeout period.

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
import { InMemoryCache } from 'apollo-cache-inmemory';
...
const TIMEOUT_IN_MS = 10000; // 10 second timeout
const timeoutLink = new ApolloLinkTimeout(TIMEOUT_IN_MS);

const httpLink = createHttpLink({ uri: "/graphql" });

const linkChain = timeoutLink.concat(httpLink);

const apolloClient = new ApolloClient( {
  link: linkChain,
  cache: new InMemoryCache()
});
```
