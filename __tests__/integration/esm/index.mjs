import assert from 'node:assert/strict';
import ApolloLinkTimeout from 'apollo-link-timeout';

assert(ApolloLinkTimeout);
const a = new ApolloLinkTimeout();
assert(a);
assert(a.request);
