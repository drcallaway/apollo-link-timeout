import { ApolloLink, Observable, type Operation, type NextLink } from '@apollo/client/core';
import { DefinitionNode } from 'graphql';
import TimeoutError from './TimeoutError';

const DEFAULT_TIMEOUT: number = 15000;

/**
 * Aborts the request if the timeout expires before the response is received.
 */
export default class TimeoutLink extends ApolloLink {
  private timeout: number;
  private statusCode?: number;

  constructor(timeout: number, statusCode?: number) {
    super();
    this.timeout = timeout || DEFAULT_TIMEOUT;
    this.statusCode = statusCode;
  }

  public request(operation: Operation, forward: NextLink) {
    let controller: AbortController;
    let ourController: AbortController;

    // override timeout from query context
    const requestTimeout = operation.getContext().timeout || this.timeout;

    // add abort controller and signal object to fetchOptions if they don't already exist
    if (typeof AbortController !== 'undefined') {
      const context = operation.getContext();
      let fetchOptions = context.fetchOptions || {};

      ourController = new AbortController();
      controller = fetchOptions.controller || ourController;

      fetchOptions = { ...fetchOptions, controller, signal: controller.signal };
      operation.setContext({ fetchOptions });
    }

    const chainObservable = forward(operation); // observable for remaining link chain

    const operationType = (operation.query.definitions as any).find(
      (def: DefinitionNode) => def.kind === 'OperationDefinition'
    ).operation;

    if (requestTimeout <= 0 || operationType === 'subscription') {
      return chainObservable; // skip this link if timeout is zero or it's a subscription request
    }

    // create local observable with timeout functionality (unsubscibe from chain observable and
    // return an error if the timeout expires before chain observable resolves)
    const localObservable = new Observable(observer => {
      let timer: any;

      // listen to chainObservable for result and pass to localObservable if received before timeout
      const subscription = chainObservable.subscribe(
        result => {
          clearTimeout(timer);
          observer.next(result);
          observer.complete();
        },
        error => {
          clearTimeout(timer);
          observer.error(error);
          observer.complete();
        }
      );

      // if timeout expires before observable completes, abort call, unsubscribe, and return error
      timer = setTimeout(() => {
        if (controller) {
          if (controller.signal.aborted) {
            // already aborted from somewhere else
            return;
          }

          controller.abort(); // abort fetch operation

          // if the AbortController in the operation context is one we created,
          // it's now "used up", so we need to remove it to avoid blocking any
          // future retry of the operation.
          const context = operation.getContext();
          const fetchOptions = context.fetchOptions || {};
          if(fetchOptions.controller === ourController && fetchOptions.signal === ourController.signal) {
             operation.setContext({ ...fetchOptions, controller: undefined, signal: undefined });
          }
        }

        observer.error(new TimeoutError('Timeout exceeded', requestTimeout, this.statusCode));
        subscription.unsubscribe();
      }, requestTimeout);

      const cancelTimeout = () => {
        clearTimeout(timer);
        subscription.unsubscribe();
      };

      const ctxRef = operation.getContext().timeoutRef;
      if (ctxRef) {
        ctxRef({ unsubscribe: cancelTimeout });
      }

      // cancel timeout if aborted from somewhere else
      controller.signal.addEventListener("abort", () => {
        cancelTimeout();
      }, { once: true });

      // this function is called when a client unsubscribes from localObservable
      return cancelTimeout;
    });

    return localObservable;
  }
}
