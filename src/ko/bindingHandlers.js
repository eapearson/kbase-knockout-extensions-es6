define([
    'knockout',
    'numeral',
    'moment',
    'marked',
    'kb_common/utils'
], function (
    ko,
    numeral,
    moment,
    marked,
    Utils
) {
    'use strict';

    ko.bindingHandlers.htmlMarkdown = {
        update: function (element, valueAccessor) {
            var markdown = marked(valueAccessor());
            element.innerHTML = markdown;
        }
    };

    ko.bindingHandlers.numberText = {
        update: function (element, valueAccessor, allBindings) {
            var value = valueAccessor();
            var valueUnwrapped = ko.unwrap(value);
            var format = allBindings.get('numberFormat') || '';
            var formatted = numeral(valueUnwrapped).format(format);
            element.innerText = formatted;
        }
    };

    function niceDuration(value, options) {
        options = options || {};
        var minimized = [];
        var units = [{
            unit: 'millisecond',
            short: 'ms',
            single: 'm',
            size: 1000
        }, {
            unit: 'second',
            short: 'sec',
            single: 's',
            size: 60
        }, {
            unit: 'minute',
            short: 'min',
            single: 'm',
            size: 60
        }, {
            unit: 'hour',
            short: 'hr',
            single: 'h',
            size: 24
        }, {
            unit: 'day',
            short: 'day',
            single: 'd',
            size: 30
        }];
        var temp = Math.abs(value);
        var parts = units
            .map(function (unit) {
                // Get the remainder of the current value
                // sans unit size of it composing the next
                // measure.
                var unitValue = temp % unit.size;
                // Recompute the measure in terms of the next unit size.
                temp = (temp - unitValue) / unit.size;
                return {
                    name: unit.single,
                    unit: unit.unit,
                    value: unitValue
                };
            }).reverse();

        parts.pop();

        // We skip over large units which have not value until we
        // hit the first unit with value. This effectively trims off
        // zeros from the end.
        // We also can limit the resolution with options.resolution
        var keep = false;
        for (var i = 0; i < parts.length; i += 1) {
            if (!keep) {
                if (parts[i].value > 0) {
                    keep = true;
                    minimized.push(parts[i]);
                }
            } else {
                minimized.push(parts[i]);
                if (options.resolution &&
                    options.resolution === parts[i].unit) {
                    break;
                }
            }
        }

        if (minimized.length === 0) {
            // This means that there is are no time measurements > 1 second.
            return '<1s';
        } else {
            // Skip seconds if we are into the hours...
            // if (minimized.length > 2) {
            //     minimized.pop();
            // }
            return minimized.map(function (item) {
                return String(item.value) + item.name;
            })
                .join(' ');
        }
    }

    ko.bindingHandlers.focus = {
        init: function (element, valueAccessor) {
            let focusser = valueAccessor().focusser;
            focusser.setElement(element);
        }
    };

    ko.bindingHandlers.typedText = {
        update: function (element, valueAccessor) {
            var value = valueAccessor();
            var valueUnwrapped = ko.unwrap(value.value);
            var format = value.format;
            var type = value.type;
            var missing = value.missing || '';
            var defaultValue = value.default;
            // var format = allBindings.get('type') || '';
            // var format = allBindings.get('numberFormat') || '';
            var formatted;

            switch (type) {
            case 'number':
                numeral.nullFormat('');
                if (valueUnwrapped === undefined || valueUnwrapped === null) {
                    formatted = missing;
                } else {                    
                    formatted = numeral(valueUnwrapped).format(format);
                }
                break;
            case 'date':
                if (valueUnwrapped === undefined || valueUnwrapped === null) {
                    formatted = missing;
                } else {
                    switch (format) {
                    case 'elapsed':
                    case 'nice-elapsed':
                        formatted = Utils.niceElapsedTime(moment(valueUnwrapped).toDate());
                        break;
                    case 'duration':
                        // formatted = Utils.niceElapsedTime(moment(valueUnwrapped).toDate());
                        formatted = niceDuration(valueUnwrapped);
                        break;
                    default: formatted = moment(valueUnwrapped).format(format);
                    }
                }
                break;
            case 'bool':
            case 'boolean':
                if (valueUnwrapped === undefined || valueUnwrapped === null) {
                    if (defaultValue === undefined) {
                        formatted = missing;
                        break;
                    }
                    valueUnwrapped = defaultValue;
                }
            
                if (valueUnwrapped) {
                    formatted = 'true';
                }
                formatted = 'false';

                break;
            case 'text':
            case 'string':
            default:
                formatted = valueUnwrapped;
            }

            element.innerText = formatted;
        }
    };
});
