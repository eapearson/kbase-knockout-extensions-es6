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

    ko.bindingHandlers.markdown = {
        init: function (element, valueAccessor) {
            let value = ko.unwrap(valueAccessor());
            element.innerHTML = marked(value);
        },
        update: function (element, valueAccessor) {
            let value = ko.unwrap(valueAccessor());
            element.innerHTML = marked(value);
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

    function niceRelativeTimeRange(startDate, endDate, now) {
        let nowTime = now || new Date.now();
        let date;
        let prefix, suffix;
        if (startDate.getTime() > nowTime) {
            prefix = 'in';
            date = startDate;
        } else if (endDate === null) {
            return 'happening now';
        } else if (endDate.getTime() < nowTime) {
            prefix = 'ended';
            suffix = 'ago';
            date = endDate;
        } else {
            prefix = 'happening now, ending in ';
            date = endDate;
        }

        // today/tomorrow
        // let startDay = startDate.getDay();

        // let todayBegin = new Date(now.getFullYear(), now.getMonth(), now.getDay(), 0, 0, 0, 0);
        // let tomorrowBegin = todayBegin
        // let nowDate = now.getDay();
        // if (startDay)

                        
        // let shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        let elapsed = Math.round((nowTime - date.getTime()) / 1000);
        let elapsedAbs = Math.abs(elapsed);
        let measureAbs;

        // Within the last 7 days...
        //if (elapsedAbs < 60 * 60 * 24 * 7) {

        let measures = [];
        let remaining;

        if (elapsedAbs === 0) {
            return 'now';
        } else if (elapsedAbs < 60) { 
            measures.push([elapsedAbs, 'second']);
        } else if (elapsedAbs < 60 * 60) {
            measureAbs = Math.floor(elapsedAbs / 60);
            measures.push([measureAbs, 'minute']);
            remaining = elapsedAbs - (measureAbs * 60);
            if (remaining > 0) {
                measures.push([remaining, 'second']);
            }
        } else if (elapsedAbs < 60 * 60 * 24) { 
            measureAbs = Math.floor(elapsedAbs / 3600);
            // measures.push([measureAbs, 'hour']);
            // remaining = elapsedAbs - (measureAbs * 3600);
            // if (remaining > 0) {
            //     measures.push([remaining, 'minute']);
            // }
            let remainingSeconds = elapsedAbs - (measureAbs * 3600);
            let remainingMinutes = Math.round(remainingSeconds/60);
            if (remainingMinutes === 60) {
                // if we round up to 24 hours, just considering this another
                // day and don't show hours.
                measureAbs += 1;
                measures.push([measureAbs, 'hour']);
            } else {
                // otherwise, do show the hours
                measures.push([measureAbs, 'hour']);
                if (remainingMinutes > 0) {
                    // unless it rounds down to no hours.
                    measures.push([remainingMinutes, 'minute']);
                }
            }
        } else if (elapsedAbs < 60 * 60 * 24 * 7) {
            measureAbs = Math.floor(elapsedAbs / (3600 * 24));
            let remainingSeconds = elapsedAbs - (measureAbs * 3600 * 24);
            let remainingHours = Math.round(remainingSeconds/3600);
            if (remainingHours === 24) {
                // if we round up to 24 hours, just considering this another
                // day and don't show hours.
                measureAbs += 1;
                measures.push([measureAbs, 'day']);
            } else {
                // otherwise, do show the hours
                measures.push([measureAbs, 'day']);
                if (remainingHours > 0) {
                    // unless it rounds down to no hours.
                    measures.push([remainingHours, 'hour']);
                }
            }
        } else {
            measureAbs = Math.floor(elapsedAbs / (3600 * 24));
            measures.push([measureAbs, 'day']);
        }

        return [
            (prefix ? prefix + ' ' : ''), 
            measures.map(([measure, unit]) => {
                if (measure !== 1) {
                    unit += 's';
                }
                return [measure, unit].join(' ');
            }).join(', '),
            (suffix ? ' ' + suffix : '')
        ].join('');
    }

    // function niceRelativeTimeRange_original(startDate, endDate, now) {
    //     let nowTime = now || new Date.now();
    //     let date;
    //     let prefix, suffix;
    //     if (startDate.getTime() > nowTime) {
    //         prefix = 'in';
    //         date = startDate;
    //     } else if (endDate === null) {
    //         return 'happening now';
    //     } else if (endDate.getTime() < nowTime) {
    //         prefix = 'ended';
    //         suffix = 'ago';
    //         date = endDate;
    //     } else {
    //         prefix = 'happening now, ending in ';
    //         date = endDate;
    //     }

    //     // today/tomorrow
    //     // let startDay = startDate.getDay();

    //     // let todayBegin = new Date(now.getFullYear(), now.getMonth(), now.getDay(), 0, 0, 0, 0);
    //     // let tomorrowBegin = todayBegin
    //     // let nowDate = now.getDay();
    //     // if (startDay)

                        
    //     // let shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    //     let elapsed = Math.round((nowTime - date.getTime()) / 1000);
    //     let elapsedAbs = Math.abs(elapsed);
    //     let measureAbs;

    //     // Within the last 7 days...
    //     //if (elapsedAbs < 60 * 60 * 24 * 7) {

    //     let measures = [];

    //     if (elapsedAbs === 0) {
    //         return 'now';
    //     } else if (elapsedAbs < 60) { 
    //         // var measure = elapsed;
    //         measures.push([elapsedAbs, 'second']);
    //         // measureAbs = elapsedAbs;
    //         // unit = 'second';
    //     } else if (elapsedAbs < 60 * 60) {
    //         // var measure = Math.round(elapsed / 60);
    //         measureAbs = Math.round(elapsedAbs / 60);
    //         if (measureAbs <= 5) {
    //             // at 5 minutes we also show the seconds
    //         }
    //         // unit = 'minute';
    //         measures.push([measureAbs, 'minute']);
    //     } else if (elapsedAbs < 60 * 60 * 24) { 
    //         // var measure = Math.round(elapsed / 3600);
    //         measureAbs = Math.round(elapsedAbs / 3600);
    //         // unit = 'hour';
    //         measures.push([measureAbs, 'hour']);
    //     } else if (elapsedAbs < 60 * 60 * 24 * 7) {
    //         // var measure = Math.round(elapsed / (3600 * 24));
    //         measureAbs = Math.round(elapsedAbs / (3600 * 24));
    //         // unit = 'day';
    //         measures.push([measureAbs, 'day']);
    //     } else {
    //         // var measure = Math.round(elapsed / (3600 * 24));
    //         measureAbs = Math.round(elapsedAbs / (3600 * 24));
    //         // unit = 'day';
    //         measures.push([measureAbs, 'day']);

    //     }

    //     return [
    //         (prefix ? prefix + ' ' : ''), 
    //         measures.map(([measure, unit]) => {
    //             if (measure !== 1) {
    //                 unit += 's';
    //             }
    //             return [measure, unit].join(' ');
    //         }),
    //         (suffix ? ' ' + suffix : '')
    //     ].join('');
    // }
    function niceTime(date) {
        var time;
        var minutes = date.getMinutes();
        if (minutes < 10) {
            minutes = '0' + minutes;
        }
        if (date.getHours() >= 12) {
            if (date.getHours() !== 12) {
                time = (date.getHours() - 12) + ':' + minutes + 'pm';
            } else {
                time = '12:' + minutes + 'pm';
            }
        } else {
            time = date.getHours() + ':' + minutes + 'am';
        }
        return time;
    }

    function niceDate(date, options) {
        var now = new Date();

        var shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
       
        var year = '';
        if (now.getFullYear() !== date.getFullYear()) {
            year = ', ' + date.getFullYear();
        }
        var day = '';
        if (options && options.showDay) {
            day = shortDays[date.getDay()] + ' ';
        }
        var datePart = day + shortMonths[date.getMonth()] + ' ' + date.getDate() + year;
        
        return datePart;
    }

    function niceTimeRange (from, to, options) {
        // same day
        var timePart;
        if (from) {
            if (to) {
                if (from.getDate() === to.getDate()) {
                    if (from.getTime() === to.getTime()) {
                        timePart = ' at ' + niceTime(from);
                    } else {
                        timePart = ' from ' + niceTime(from) + ' to ' + niceTime(to);
                    }
                    return niceDate(from, options) + timePart;
                } else {
                    return 'from ' + niceDate(from, options) + ' at ' + niceTime(from) + ' to ' + niceDate(to, options) + ' at ' + niceTime(to);
                }
            } else {
                return 'from ' + niceDate(from, options) + ' at ' + niceTime(from);
            }
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
            var valueUnwrapped;
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
                valueUnwrapped = ko.unwrap(value.value);
                if (valueUnwrapped === undefined || valueUnwrapped === null) {
                    formatted = missing;
                } else {                    
                    formatted = numeral(valueUnwrapped).format(format);
                }
                break;
            case 'date':
                valueUnwrapped = ko.unwrap(value.value);
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
            case 'date-range':
                var startDate = ko.unwrap(value.value.startDate);
                var endDate = ko.unwrap(value.value.endDate);
                var now;
                if (value.value.now) {
                    now = ko.unwrap(value.value.now);
                } else {
                    now = Date.now();
                }
                if (!startDate || !endDate) {
                    formatted = missing;
                } else {
                    switch (format) {
                    case 'nice-range':
                        formatted = niceTimeRange(moment(startDate).toDate(), moment(endDate).toDate());
                        break;
                    case 'nice-relative-range':
                        formatted = niceRelativeTimeRange(moment(startDate).toDate(), moment(endDate).toDate(), now);
                        break;
                    default: formatted = 'invalid format: ' + format;
                    }
                }
                break;
            case 'bool':
            case 'boolean':
                valueUnwrapped = ko.unwrap(value.value);
                if (valueUnwrapped === undefined || valueUnwrapped === null) {
                    if (defaultValue === undefined) {
                        formatted = missing;
                        break;
                    }
                    valueUnwrapped = defaultValue;
                }

                if (valueUnwrapped) {
                    formatted = 'true';
                } else {
                    formatted = 'false';
                }

                break;
            case 'text':
            case 'string':
            default:
                valueUnwrapped = ko.unwrap(value.value);
                formatted = valueUnwrapped;
            }

            element.innerText = formatted;
        }
    };
});
