define([
    'knockout',

    // load 3rd party extensions    
    'knockout-mapping',
    'knockout-arraytransforms',
    'knockout-validation',
    'knockout-switch-case',

    // This one we have tweaked.
    './ko/knockout-es6-collections',

    // load our extensions
    './ko/bindingHandlers',
    './ko/componentLoaders',
    './ko/extenders',
    './ko/subscribables'
], function (
    ko
) {
    'use strict';
    
    return ko;
});
