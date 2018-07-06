define([
    'knockout',
    '../registry',
    '../lib/viewModelBase',
    '../lib/generators',
    'kb_common/html'
], function (
    ko,
    reg,
    ViewModelBase,
    gen,
    html
) {
    'use strict';

    var t = html.tag,
        ul = t('ul'),
        li = t('li'),
        a = t('a'),
        span = t('span'),
        div = t('div');

    class viewModel extends ViewModelBase  {
        constructor (params) {
            super(params);

            this.tabsetId = html.genId();
            this.tabs = ko.observableArray();
            this.tabClasses = ko.observableArray(['nav', 'nav-tabs']);
            this.activeTab = ko.observable();

            // Bus -- ??!!
            // TODO: provide the bus on the top level of the params...
            this.parentBus.on('add-tab', (message) => {
                this.addTab(message.tab);
            });
            this.parentBus.on('select-tab', (message) => {
                if (typeof message === 'number') {
                    this.doSelectTab(this.tabs()[message]);
                }
            });

            // Initialize Tabs

            if (params.tabs) {
                params.tabs.forEach((tab) => {
                    this.tabs.push(this.makeTab(tab));
                });
            }

            if (!('active' in params)) {
                if (this.tabs().length > 0) {
                    this.tabs()[0].active(true);
                    this.activeTab(this.tabs()[0]);
                }
            }

            this.parentBus.send('ready');
        }

        doCloseTab(tab) {
            let index = this.tabs.indexOf(tab);
            this.tabs.remove(tab);
            if (index === 0) {
                return;
            }
            // if not the selected tab, nothing else to do.
            if (tab !== this.activeTab()) {
                return;
            }

            // If no closable tabs, we go back to the first tab.
            let currentTab;
            let totalTabs = this.tabs().length;
            let closableTabs = this.tabs().reduce((closableCount, tab) => {
                return closableCount + (tab.closable() ? 1 : 0);
            }, 0);
            let nonclosableTabs = totalTabs - closableTabs;
            if (closableTabs > 0) {
                // avoid opening up the last unclosable tab if there are closables left.
                if (index === nonclosableTabs) {
                    currentTab = this.tabs()[index + 1];
                } else {
                    currentTab = this.tabs()[index - 1];
                }
            } else {
                currentTab = this.tabs()[0];
            }

            this.activateTab(currentTab);
            currentTab.active(true);
        }

        // bootstrap tabs implemeneted in knockout. tricky...
        makeTab(params) {
            // if (!params.panel.component.params) {
            //     params.panel.component.params = {};
            // }
            // params.component.params = params;
            return {
                id: params.id,
                tab: {
                    label: params.tab.label,
                    component: params.tab.component
                },
                // label: params.tab.label,
                panel: {
                    component: params.panel.component, 
                    content: params.panel.content
                },
                // component: params.component,
                content: params.content,
                active: ko.observable(false),
                closable: ko.observable(params.closable || false)
            };
        }

        addTab(tab, activate) {
            var newTab = this.makeTab(tab);
            this.tabs.push(newTab);
            if (activate) {
                this.deactivateCurrentTab();
                this.activateTab(newTab);
            }
        }

        activateTab(tab) {
            tab.active(true);
            this.activeTab(tab);
        }

        deactivateCurrentTab() {
            if (this.activeTab()) {
                this.activeTab().active(false);
            }
        }

        doSelectTab(tab) {
            this.deactivateCurrentTab();
            this.activateTab(tab);
        }

        
    }

    function buildTab() {
        return li({
            role: 'presentation',
            class: styles.classes.tab,
            dataBind: {
                css: {
                    active: 'active'
                }
            }
        }, [
            a({
                dataBind: {
                    click: 'function (d, e) {$component.doSelectTab.call($component, d, e);}',
                    // with: 'tab',
                    attr: {
                        'data-k-b-testhook-tab': 'id'
                    },
                    class: 'active() ? "' + styles.classes.tabLinkActive + '": ""'
                    
                },
                role: 'tab',
                class: styles.classes.tabLink
            }, [                
                span({
                    dataBind: {
                        text: 'tab.label'
                    }
                }),
                gen.koIf('tab.component', 
                    span({
                        dataBind: {
                            component: {
                                name: 'tab.component.name',
                                params: 'tab.component.params'
                            }
                        },
                        dataKBTesthookButton: 'tab'
                    })),
                gen.koIf('$parent.closable', 
                    span({
                        class: styles.classes.tabButton,
                        dataBind: {
                            click: '$component.doCloseTab'
                        }
                    }, span({
                        class: 'fa fa-times',
                    })))
            ]),
        ]);
    }

    function buildTabPanel() {
        return gen.koIf('active', 
            div({
                dataBind: {
                    attr: {
                        active: 'active'
                    },
                    css: { 
                        in: 'active',
                        active: 'active'
                    },
                    with: 'panel'
                },
                class: [styles.classes.tabPane, 'fade'],
                role: 'tabpanel'
            }, gen.koIf('$data.component', 
                div({
                    style: {
                        flex: '1 1 0px',
                        display: 'flex',
                        flexDirection: 'column'
                    },
                    dataBind: {
                        component: {
                            name: 'component.name',
                            params: 'component.params'
                        }
                    }
                }),
                gen.koIf('$data.content', 
                    div({
                        style: {
                            flex: '1 1 0px',
                            display: 'flex',
                            flexDirection: 'column'
                        },
                        dataBind: {
                            html: '$data.content'
                        }
                    }),
                    div('** NO CONTENT **')))));
    }

    let styles = html.makeStyles({
        component: {
            css: {
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column'
            }
        },
        tabSet: {
            css: {
                borderBottom: '1px solid #ddd',
                flex: '0 0 50px',
                paddingLeft: '0',
                marginBottom: '0',
                listStyle: 'none'
            },
            pseudoClasses: {
                after: {
                    display: 'table',
                    content: ' ',
                    clear: 'both'
                }
            }
        },
        tab: {
            css: {
                float: 'left',
                marginBottom:' -1px',
                position: 'relative',
                display: 'block',
                userSelect: 'none',
                '-webkit-user-select': 'none',
                '-moz-user-select': 'none',
                '-ms-user-select': 'none',
            }
        },
        tabLink: {
            css: {
                display: 'inline-block',
                marginRight: '2px',
                lineHeight: '1.42857143',
                border: '1px solid transparent',
                borderRadius:' 4px 4px 0 0',
                position: 'relative',
                padding: '10px 15px',
                cursor: 'pointer'
            },
            pseudo: {
                hover: {
                    borderColor: '#eee #eee #ddd',
                    textCecoration: 'none',
                    backgroundColor: '#eee',
                    outline: 0
                },
                active: {
                    textCecoration: 'none',
                    backgroundColor: '#eee',
                    outline: 0
                }
            }
        },
        tabLinkActive: {
            css: {
                color: '#555',
                cursor: 'default',
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderBottomColor: 'transparent'
            },
            pseudo: {
                hover: {
                    textDecoration: 'none',
                    backgroundColor: '#fff',
                    borderColor: '#ddd #ddd #ddd',
                    borderBottomColor: 'transparent'
                }
            }
        },
        tabButton: {
            css: {
                padding: '0 4px',
                marginLeft: '8px',
                color: '#000',
                cursor: 'pointer',
                textDecoration: 'none'
            },
            pseudoElement: {
                before: {
                    color: '#888'
                }
            }
        },
        tabContent: {
            css: {
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto'
            }
        },
        tabPane: {
            css: {
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column'
            }
        }
    });

    function template() {
        return div({
            class: styles.classes.component,
            dataKBTesthookComponent: 'tabset'
        }, [
            ul({
                dataBind: {
                    attr: {
                        id: 'tabsetId'
                    },
                    foreach: 'tabs'
                },
                class: styles.classes.tabSet,
                role: 'tablist'
            }, buildTab()),
            div({
                class: styles.classes.tabContent,
                style: {
                    position: 'relative'
                },
                dataBind: {
                    foreach: 'tabs'
                }
            },  buildTabPanel())
        ]);
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template(),
            stylesheet: styles.sheet
        };
    }
    return reg.registerComponent(component);
});