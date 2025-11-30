// @ts-ignore
import { ApolloLink } from '@apollo/client/core';

// @ts-ignore
export type Operation = ApolloLink.Operation extends never
  ? import('@apollo/client/core').Operation
  // @ts-ignore
  : ApolloLink.Operation;

// @ts-ignore
export type NextLink = ApolloLink.ForwardFunction extends never
  // @ts-ignore
  ? import('@apollo/client/core').NextLink
  // @ts-ignore
  : ApolloLink.ForwardFunction;

// @ts-ignore
export type FetchResult<T = any> = ApolloLink.Result extends never
  ? import('@apollo/client/core').FetchResult<T>
  // @ts-ignore
  : ApolloLink.Result<T>;
