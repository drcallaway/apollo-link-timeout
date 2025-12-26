import TimeoutLink from '../src/timeoutLink';
import { ApolloClient, ApolloLink, execute, type GraphQLRequest, HttpLink, InMemoryCache, Observable, } from '@apollo/client/core';
import gql from 'graphql-tag';

const TEST_TIMEOUT = 100;

const timeoutLink: TimeoutLink = new TimeoutLink(TEST_TIMEOUT);

const [nodeMajor] = process.versions.node.split(".").map(Number);

const query = gql`
{
  foo {
    bar
  }
}`;

let called: number;
let delay: number;

const mockLink = new ApolloLink(() => {
  called++;
  return new Observable(observer => {
    setTimeout(() => {
      observer.next({});
      observer.complete();
    }, delay);
  });
});

const link = timeoutLink.concat(mockLink);

const client = new ApolloClient({
  link,
  cache: new InMemoryCache(),
});

let apolloClientInstance: ApolloClient | null = null;
const executeWrapper = (link: ApolloLink, operation: GraphQLRequest) => {
  if (execute.length === 3 && !apolloClientInstance) {
    const httpLink = new HttpLink({ uri: "/graphql" });
    const timeoutHttpLink = timeoutLink.concat(httpLink);
    apolloClientInstance = new ApolloClient({
      link: timeoutHttpLink,
      cache: new InMemoryCache(),
    });
  }
  return execute.length === 3
    // @ts-ignore
    ? execute(link, operation, { client: apolloClientInstance })
        // @ts-ignore
    : execute(link, operation);
};

beforeEach(() => {
  called = 0;
});

test('short request does not timeout', done => {
  delay = 50;

  executeWrapper(link, { query }).subscribe({
    next() {
      expect(called).toBe(1);
      done();
    },
    error() {
      expect('error called').toBeFalsy();
      done();
    }
  });
});

test('long request times out', done => {
  delay = 200;

  executeWrapper(link, { query }).subscribe({
    next() {
      expect('next called').toBeFalsy();
      done();
    },
    error(error) {
      expect(error.message).toEqual('Timeout exceeded');
      expect(error.timeout).toEqual(100);
      expect(error.statusCode).toEqual(408);
      done();
    }
  });
});

test('configured value through context does not time out', done => {
  delay = 200;
  const configured = 500;

  executeWrapper(link, { query, context: { timeout: configured } }).subscribe({
    next() {
      expect(called).toBe(1);
      done();
    },
    error() {
      expect('error called').toBeFalsy();
      done();
    }
  });
});

test('configured short value through context time out', done => {
  delay = 200;
  const configured = 100;

  executeWrapper(link, { query, context: { timeout: configured } }).subscribe({
    next() {
      expect('next called').toBeFalsy();
      done();
    },
    error(error) {
      expect(error.message).toEqual('Timeout exceeded');
      expect(error.timeout).toEqual(configured);
      expect(error.statusCode).toEqual(408);
      done();
    }
  });
});

test('configured value through prior link does not time out', done => {
  delay = 200;
  const configured = 500;

  const configLink = new ApolloLink((operation, forward) => {
    operation.setContext({ timeout: configured });
    return forward(operation);
  });

  const testLink = configLink.concat(timeoutLink).concat(mockLink);

  executeWrapper(testLink, { query }).subscribe({
    next() {
      expect(called).toBe(1);
      done();
    },
    error() {
      expect('error called').toBeFalsy();
      done();
    }
  });
});

test('configured short value through prior link time out', done => {
  delay = 200;
  const configured = 100;

  const configLink = new ApolloLink((operation, forward) => {
    operation.setContext({ timeout: configured });
    return forward(operation);
  });

  const testLink = configLink.concat(timeoutLink).concat(mockLink);

  executeWrapper(testLink, { query }).subscribe({
    next() {
      expect('next called').toBeFalsy();
      done();
    },
    error(error) {
      expect(error.message).toEqual('Timeout exceeded');
      expect(error.timeout).toEqual(configured);
      expect(error.statusCode).toEqual(408);
      done();
    }
  });
});

test('aborted request does not timeout', done => {
  delay = 200;

  const controller = new AbortController();
  const fetchOptions = { controller, signal: controller.signal }

  controller.abort();

  executeWrapper(link, { query, context: { fetchOptions } }).subscribe({
    next() {
      expect(called).toBe(1);
      done();
    },
    error() {
      expect('error called').toBeFalsy();
      done();
    }
  });
});

test('negative timeout via constructor disables timeout', done => {
  delay = 150;

  const testLink = new TimeoutLink(-1).concat(mockLink);

  executeWrapper(testLink, { query }).subscribe({
    next() {
      expect(called).toBe(1);
      done();
    },
    error() {
      expect('error called').toBeFalsy();
      done();
    }
  });
});

test('negative timeout via context disables timeout', done => {
  delay = 150;

  executeWrapper(link, { query, context: { timeout: -1 } }).subscribe({
    next() {
      expect(called).toBe(1);
      done();
    },
    error() {
      expect('error called').toBeFalsy();
      done();
    }
  });
});

if (nodeMajor >= 20) {
  test("HTTP multipart subscription stops when unsubscribed", (done) => {
    const subscription = gql`
      subscription {
        chunk
      }
    `;

    const Transform: typeof TransformStream =
      require("node:stream/web").TransformStream;
    const encoder = new TextEncoder();
    const stream = new Transform({
      transform(chunk, controller) {
        controller.enqueue(
          encoder.encode(chunk.trimLeft().replace(/\n/g, "\r\n"))
        );
      },
    });
    let finalSignal: AbortSignal | undefined;
    const terminalLink = timeoutLink.concat(
      new HttpLink({
      uri: "https://example.com/graphql",
        // @ts-ignore
        fetch: (_, { signal }) => {
          finalSignal = signal;
          return Promise.resolve(
            new Response(stream.readable, {
              status: 200,
              headers: { "content-type": "multipart/mixed" },
            })
          );
        },
      })
    );

    let events: Array<
      | { type: "next"; result: unknown }
      | { type: "done" }
      | { type: "error"; error: unknown }
    > = [];
    const subsciption = executeWrapper(terminalLink, {
        query: subscription,
      }).subscribe({
      next: (result) => events.push({ type: "next", result }),
      error: (error) => events.push({ type: "error", error }),
      complete: () => events.push({ type: "done" }),
    });

    const writer = stream.writable.getWriter();

    writer.write(`
---
Content-Type: application/json

{"data":{"chunk": "first"}}
---
    `.trim());

    setTimeout(() => {
      expect(events).toStrictEqual([
        { type: "next", result: { data: { chunk: "first" } } },
      ]);
      subsciption.unsubscribe();

      setTimeout(() => {
        expect(finalSignal?.aborted).toBeTruthy();
        done();
      });
    }, 10);
  });
}
