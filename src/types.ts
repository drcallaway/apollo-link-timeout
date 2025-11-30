import { ApolloLink } from '@apollo/client/core';

// Check if the new namespace types exist
export type Operation = ApolloLink.Operation extends never
  ? import('@apollo/client/core').Operation
  : ApolloLink.Operation;

export type NextLink = ApolloLink.ForwardFunction extends never
  // @ts-ignore
  ? import('@apollo/client/core').NextLink
  : ApolloLink.ForwardFunction;

export type FetchResult<T = any> = ApolloLink.Result extends never
  ? import('@apollo/client/core').FetchResult<T>
  : ApolloLink.Result<T>;
