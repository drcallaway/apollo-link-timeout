import { ApolloLink, Observable, Operation, NextLink } from 'apollo-link';
const DEFAULT_TIMEOUT: number = 15000;

/**
 * Aborts the request if the timeout expires before the response is received. The fetchOptions
 * object this link adds to the context must be included in the config object when instantiating the
 * apollo-link-http component like this:
 *
 * import { createHttpLink } from "apollo-link-http";
 * ...
 * const context = operation.getContext();
 * const fetchOptions = context.fetchOptions;
 * const link = createHttpLink({ uri: "/graphql", fetchOptions });
 */
export default class TimeoutLink extends ApolloLink {
  timeout: number;

  constructor(timeout: number) {
    super();
    this.timeout = timeout;
  }

  request(operation: Operation, forward: NextLink) {
    let controller: AbortController;

    // add abort controller and signal object to fetchOptions if supported by client
    if (typeof AbortController !== 'undefined') {
      const context = operation.getContext();

      controller = new AbortController();

      const fetchOptions = { controller, signal: controller.signal, ...context.fetchOptions };
      context.setContext({ fetchOptions });
    }

    const chainObservable = forward(operation); // observable for remaining link chain

    // create local observable with timeout functionality (unsubscibe from chain observable and
    // return an error if the timeout expires before chain observable resolves)
    const localObservable = new Observable(observer => {
      let timer: number;

      // listen to chainObservable for result and pass to localObservable if received before timeout
      const subscription = chainObservable.subscribe(result => {
        clearTimeout(timer);
        observer.next(result);
        observer.complete();
      });

      // if timeout expires before observable completes, abort call, unsubscribe, and return error
      timer = setTimeout(() => {
        if (controller) {
          controller.abort(); // abort fetch operation
        }

        subscription.unsubscribe();
        observer.error(new Error('Timeout exceeded'));
      }, this.timeout || DEFAULT_TIMEOUT);

      // this function is called when a client unsubscribes from localObservable
      return () => {
        clearTimeout(timer);
        subscription.unsubscribe();
      };
    });

    return localObservable;
  }
}
