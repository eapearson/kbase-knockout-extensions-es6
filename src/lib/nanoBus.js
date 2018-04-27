define([], function () {
    'use strict';
    
    const READY = Symbol();
    const STOPPED = Symbol();
    const SCHEDULED = Symbol();

    class NanoBus {
        constructor() {
            this.queue = [];
            this.runInterval = 0;
            this.messageReceivers = {};
            
            this.state = READY;
        }

        processQueue() {
            let processing = this.queue;
            this.queue = [];
            processing.forEach((message) => {
                let receivers = this.messageReceivers[message.id];
                if (!receivers) {
                    return;
                }
                receivers.forEach((receiver) => {
                    try {
                        receiver(message.payload);
                    } catch (ex) {
                        console.error('Error processing message: ' + ex.message, ex);
                    }
                });
            });
        }

        run() {
            if (this.state === SCHEDULED) {
                return;
            }
            if (this.queue.length === 0) {
                return;
            }
            window.requestAnimationFrame(() => {
                if (this.state === STOPPED) {
                    return;
                }
                this.state = READY;
                this.processQueue();
                // just in case any new messages crept in.
                if (this.queue.length > 0) {
                    this.run();
                }
            });
            this.state = SCHEDULED;
        }

        send(id, payload) {
            if (this.state === STOPPED) {
                return;
            }
            this.queue.push({
                id: id,
                payload: payload
            });
            this.run();
        }

        on(id, handler) {
            if (!this.messageReceivers[id]) {
                this.messageReceivers[id] = [];
            }
            this.messageReceivers[id].push(handler);
        }

        stop() {
            this.queue = [];
            this.state = STOPPED;
        }
    }

    return NanoBus;
});
