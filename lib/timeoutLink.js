var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
import { ApolloLink, Observable } from 'apollo-link';
var DEFAULT_TIMEOUT = 15000;
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
var TimeoutLink = /** @class */ (function (_super) {
    __extends(TimeoutLink, _super);
    function TimeoutLink(timeout) {
        var _this = _super.call(this) || this;
        _this.timeout = timeout;
        return _this;
    }
    TimeoutLink.prototype.request = function (operation, forward) {
        var _this = this;
        var controller;
        // add abort controller and signal object to fetchOptions if they don't already exist
        if (typeof AbortController !== 'undefined') {
            var context = operation.getContext();
            var fetchOptions = context.fetchOptions || {};
            controller = fetchOptions.controller || new AbortController();
            fetchOptions = __assign({}, fetchOptions, { controller: controller, signal: controller.signal });
            operation.setContext({ fetchOptions: fetchOptions });
        }
        var chainObservable = forward(operation); // observable for remaining link chain
        // create local observable with timeout functionality (unsubscibe from chain observable and
        // return an error if the timeout expires before chain observable resolves)
        var localObservable = new Observable(function (observer) {
            var timer;
            // listen to chainObservable for result and pass to localObservable if received before timeout
            var subscription = chainObservable.subscribe(function (result) {
                clearTimeout(timer);
                observer.next(result);
                observer.complete();
            });
            // if timeout expires before observable completes, abort call, unsubscribe, and return error
            timer = setTimeout(function () {
                if (controller) {
                    controller.abort(); // abort fetch operation
                }
                subscription.unsubscribe();
                observer.error(new Error('Timeout exceeded'));
            }, _this.timeout || DEFAULT_TIMEOUT);
            // this function is called when a client unsubscribes from localObservable
            return function () {
                clearTimeout(timer);
                subscription.unsubscribe();
            };
        });
        return localObservable;
    };
    return TimeoutLink;
}(ApolloLink));
export default TimeoutLink;
//# sourceMappingURL=timeoutLink.js.map