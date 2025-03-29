const assert = require('node:assert/strict');
const ApolloLinkTimeout = require('apollo-link-timeout');

assert(ApolloLinkTimeout);
const a = new ApolloLinkTimeout();
assert(a);
assert(a.request);
