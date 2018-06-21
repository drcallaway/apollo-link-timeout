# apollo-link-timeout

An [Apollo Link](https://www.apollographql.com/docs/link/) that aborts a request if it isn't completed within a specified timeout period.

## Installation
```
npm install apollo-link-timeout --save
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
```

See [Apollo documentation](https://www.apollographql.com/client) for information on using the Apollo client.
