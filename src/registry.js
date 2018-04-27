define([
    'knockout',
    'moment',
    'uuid'
], function (
    ko,
    moment,
    Uuid
) {
    'use strict';

    class ComponentRegistry {
        constructor() {
            this.installedStylesheets = {};
        }

        installStylesheet(id, stylesheet) {
            if (this.installedStylesheets[id]) {
                return;
            }
            var temp = document.createElement('div');
            temp.innerHTML = stylesheet;
            var style = temp.querySelector('style');
            style.id = 'componentStyle_' + id;
            if (!style) {
                // This means an invalid stylesheet was passed here.
                console.warn('Invalid component stylesheet, no style tag: ', stylesheet);
                return;
            }
            document.head.appendChild(style);
            this.installedStylesheets[id] = stylesheet;
        }

        registerComponent(componentFactory) {
            var name = new Uuid(4).format();
            var component = componentFactory();

            // wrap the view modei in a view model factory so we can always
            // pass the context with no fuss...
            // Note implies the view model is a class, not factory.

            let componentToRegister;
            if (component.viewModelWithContext) {
                let viewModelFactory = function(params, componentInfo) {
                    let context = ko.contextFor(componentInfo.element);
                    return new component.viewModelWithContext(params, context, componentInfo.element, componentInfo);
                };
                componentToRegister = {
                    viewModel: {
                        createViewModel: viewModelFactory
                    },
                    template: component.template
                };
            } else {
                componentToRegister = component;
            }

            ko.components.register(name, componentToRegister);

            if (component.stylesheet) {
                this.installStylesheet(name, component.stylesheet);
            }

            return {
                name: function () {
                    return name;
                },
                quotedName: function () {
                    return '"' + name + '"';
                }
            };
        }
    }

    return new ComponentRegistry();
});
