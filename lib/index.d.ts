import { ApolloLink, Observable, Operation, NextLink } from 'apollo-link';
/**
 * Aborts the request if the timeout expires before the response is received. The fetchOptions
 * object that this link adds to the context must be included in the config object when
 * instantiating the apollo-link-http component like this:
 *
 * import { createHttpLink } from "apollo-link-http";
 * ...
 * const context = operation.getContext();
 * const fetchOptions = context.fetchOptions;
 * const link = createHttpLink({ uri: "/graphql", fetchOptions });
 */
export default class TimeoutLink extends ApolloLink {
    private timeout;
    constructor(timeout: number);
    request(operation: Operation, forward: NextLink): Observable<{}>;
}
