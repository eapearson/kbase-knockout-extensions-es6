define([
    'knockout',
    '../registry',
    '../lib/generators',    
    'kb_common/html',
    'kb_common/bootstrapUtils'
], function (
    ko,
    reg,
    gen,
    html,
    BS
) {
    'use strict';

    var t = html.tag,
        div = t('div');

    class ViewModel {
        constructor(params) {
            this.info = null;

            var info = ko.unwrap(params.info);
            if (info !== undefined) {
                this.info = BS.buildPresentableJson(info);
            }
            this.source = params.source;
            this.code = params.code;
            this.message = params.message;            
            this.detail = params.detail;
            this.stackTrace = params.stackTrace;            
        }
    }

    function template() {
        return div([
            BS.buildPanel({
                name: 'message',
                class: 'kb-panel-light',
                title: 'Message',
                type: 'danger',
                body: div({
                    dataBind: {
                        text: 'message'
                    }
                })
            }),
            gen.if('source', 
                BS.buildPanel({
                    name: 'source',
                    class: 'kb-panel-light',                
                    title: 'Source',
                    type: 'danger',
                    body: div({
                        dataBind: {
                            text: 'source'
                        }
                    })
                })),
            gen.if('code', 
                BS.buildPanel({
                    name: 'code',
                    class: 'kb-panel-light',
                    title: 'Code',
                    type: 'danger',
                    body: div({
                        dataBind: {
                            text: 'code'
                        }
                    })
                })), 
            gen.if('$data.detail',  
                BS.buildCollapsiblePanel({
                    name: 'detail',
                    title: 'Detail',
                    type: 'danger',
                    classes: ['kb-panel-light'],
                    collapsed: false,
                    hidden: false,
                    body: div({
                        dataBind: {
                            html: 'detail'
                        }
                    })
                })),
            gen.if('$data.info', 
                BS.buildCollapsiblePanel({
                    name: 'info',
                    title: 'Info',
                    type: 'danger',
                    classes: ['kb-panel-light'],
                    collapsed: true,
                    hidden: false,
                    body: div({
                        dataBind: {
                            if: '$data.info'
                        }
                    }, div({
                        dataBind: {
                            html: '$data.info'
                        }
                    }))
                })),
            gen.if('$data.stackTrace', 
                BS.buildCollapsiblePanel({
                    name: 'stackTrace',
                    title: 'Stack Trace',
                    type: 'danger',
                    classes: ['kb-panel-light'],
                    collapsed: true,
                    hidden: false,
                    body: div({
                        dataBind: {
                            foreach: '$data.stackTrace'
                        }
                    }, div({
                        dataBind: {
                            text: '$data'
                        }
                    }))
                }))
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