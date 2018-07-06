define([
    'knockout',
    'kb_common/html',
    '../registry',
    '../lib/clock'
], function(
    ko,
    html,
    reg,
    Clock
) {
    'use strict';

    var t = html.tag,
        span = t('span'),
        div = t('div');

    function niceElapsedTime(dateObj, nowDateObj) {
        var date, now;
        if (typeof dateObj === 'string') {
            date = new Date(dateObj);
        } else if (typeof dateObj === 'number') {
            date = new Date(dateObj);
        } else {
            date = dateObj;
        }
        if (nowDateObj === undefined) {
            now = new Date();
        } else if (typeof nowDateObj === 'string') {
            now = new Date(nowDateObj);
        } else if (typeof nowDateObj === 'number') {
            now = new Date(nowDateObj);
        } else {
            now = nowDateObj;
        }

        var shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        var elapsed = Math.round((now.getTime() - date.getTime()) / 1000);
        var elapsedAbs = Math.abs(elapsed);

        // Within the last 7 days...
        if (elapsedAbs < 60 * 60 * 24 * 7) {
            if (elapsedAbs === 0) {
                return 'now';
            }
            var measure, measureAbs, unit;
            if (elapsedAbs < 60) {
                measure = elapsed;
                measureAbs = elapsedAbs;
                unit = 'second';
            } else if (elapsedAbs < 60 * 60) {
                measure = Math.round(elapsed / 60);
                measureAbs = Math.round(elapsedAbs / 60);
                unit = 'minute';
            } else if (elapsedAbs < 60 * 60 * 24) {
                measure = Math.round(elapsed / 3600);
                measureAbs = Math.round(elapsedAbs / 3600);
                unit = 'hour';
            } else if (elapsedAbs < 60 * 60 * 24 * 7) {
                measure = Math.round(elapsed / (3600 * 24));
                measureAbs = Math.round(elapsedAbs / (3600 * 24));
                unit = 'day';
            }

            if (measureAbs > 1) {
                unit += 's';
            }

            var prefix = null, suffix = null;
            if (measure < 0) {
                prefix = 'in';
            } else if (measure > 0) {
                suffix = 'ago';
            }

            return (prefix ? prefix + ' ' : '') + measureAbs + ' ' + unit + (suffix ? ' ' + suffix : '');
        }
        // otherwise show the actual date, with or without the year.
        if (now.getFullYear() === date.getFullYear()) {
            return shortMonths[date.getMonth()] + ' ' + date.getDate();
        }
        return shortMonths[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
    }

    class ViewModel {
        constructor(params) {
            this.startTime = ko.utils.unwrapObservable(params.startTime);

            this.currentTime = ko.observable();

            this.listener = Clock.globalClock.listen(() => {
                this.currentTime(new Date());
            }, 1);

            this.elapsed = ko.pureComputed(() => {
                if (this.startTime) {
                    return niceElapsedTime(this.startTime, this.currentTime());
                } 
                return 'n/a';
            });
        }
        
        dispose() {
            if (this.listener) {
                Clock.globalClock.forget(this.listener);
            }
        }
    }
    
    function template() {
        return div([
            span({
                dataBind: {
                    text: 'elapsed'
                }
            })
        ]);
    }

    function component() {
        return {
            viewModel: ViewModel,
            template: template()
        };
    }

    return reg.registerComponent(component);
});