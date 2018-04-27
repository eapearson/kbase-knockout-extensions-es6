define([
    'knockout'
], function (
    ko
) {
    'use strict';

    // from: https://github.com/knockout/knockout/issues/914
    ko.subscribable.fn.subscribeChanged = function (callback, context) {
        var savedValue = this.peek();
        return this.subscribe(function (latestValue) {
            var oldValue = savedValue;
            savedValue = latestValue;
            callback.call(context, latestValue, oldValue);
        });
    };

    ko.subscribable.fn.syncWith = function (targetObservable, callbackTarget, event) {
        var sourceObservable = this; 
        sourceObservable(targetObservable());
        sourceObservable.subscribe(function (newValue) { 
            targetObservable(newValue); 
        }, callbackTarget, event); 
        targetObservable.subscribe(function (newValue) { 
            sourceObservable(newValue); 
        }, callbackTarget, event); 
        return sourceObservable; 
    };

    ko.subscribable.fn.syncFrom = function (targetObservable, callbackTarget, event) {
        var sourceObservable = this; 
        sourceObservable(targetObservable());
        targetObservable.subscribe(function (v) { 
            sourceObservable(v); 
        }, callbackTarget, event); 
        return sourceObservable; 
    };

    ko.subscribable.fn.syncTo = function (targetObservable, callbackTarget, event) {
        var sourceObservable = this; 
        targetObservable(sourceObservable());
        sourceObservable.subscribe(function (v) { 
            targetObservable(v); 
        }, callbackTarget, event); 
        return sourceObservable; 
    };
});
