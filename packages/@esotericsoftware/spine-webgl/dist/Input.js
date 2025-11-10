/******************************************************************************
 * Spine Runtimes License Agreement
 * Last updated January 1, 2020. Replaces all prior versions.
 *
 * Copyright (c) 2013-2020, Esoteric Software LLC
 *
 * Integration of the Spine Runtimes into software or otherwise creating
 * derivative works of the Spine Runtimes is permitted under the terms and
 * conditions of Section 2 of the Spine Editor License Agreement:
 * http://esotericsoftware.com/spine-editor-license
 *
 * Otherwise, it is permitted to integrate the Spine Runtimes into software
 * or otherwise create derivative works of the Spine Runtimes (collectively,
 * "Products"), provided that each user of the Products must obtain their own
 * Spine Editor license and redistribution of the Products in any form must
 * include this license and copyright notice.
 *
 * THE SPINE RUNTIMES ARE PROVIDED BY ESOTERIC SOFTWARE LLC "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL ESOTERIC SOFTWARE LLC BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES,
 * BUSINESS INTERRUPTION, OR LOSS OF USE, DATA, OR PROFITS) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THE SPINE RUNTIMES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *****************************************************************************/
export class Input {
    constructor(element) {
        this.mouseX = 0;
        this.mouseY = 0;
        this.buttonDown = false;
        this.touch0 = null;
        this.touch1 = null;
        this.initialPinchDistance = 0;
        this.listeners = new Array();
        this.eventListeners = [];
        this.element = element;
        this.setupCallbacks(element);
    }
    setupCallbacks(element) {
        let mouseDown = (ev) => {
            if (ev instanceof MouseEvent) {
                let rect = element.getBoundingClientRect();
                this.mouseX = ev.clientX - rect.left;
                ;
                this.mouseY = ev.clientY - rect.top;
                this.buttonDown = true;
                this.listeners.map((listener) => { if (listener.down)
                    listener.down(this.mouseX, this.mouseY); });
                document.addEventListener("mousemove", mouseMove);
                document.addEventListener("mouseup", mouseUp);
            }
        };
        let mouseMove = (ev) => {
            if (ev instanceof MouseEvent) {
                let rect = element.getBoundingClientRect();
                this.mouseX = ev.clientX - rect.left;
                ;
                this.mouseY = ev.clientY - rect.top;
                this.listeners.map((listener) => {
                    if (this.buttonDown) {
                        if (listener.dragged)
                            listener.dragged(this.mouseX, this.mouseY);
                    }
                    else {
                        if (listener.moved)
                            listener.moved(this.mouseX, this.mouseY);
                    }
                });
            }
        };
        let mouseUp = (ev) => {
            if (ev instanceof MouseEvent) {
                let rect = element.getBoundingClientRect();
                this.mouseX = ev.clientX - rect.left;
                ;
                this.mouseY = ev.clientY - rect.top;
                this.buttonDown = false;
                this.listeners.map((listener) => { if (listener.up)
                    listener.up(this.mouseX, this.mouseY); });
                document.removeEventListener("mousemove", mouseMove);
                document.removeEventListener("mouseup", mouseUp);
            }
        };
        let mouseWheel = (e) => {
            e.preventDefault();
            let deltaY = e.deltaY;
            if (e.deltaMode == WheelEvent.DOM_DELTA_LINE)
                deltaY *= 8;
            if (e.deltaMode == WheelEvent.DOM_DELTA_PAGE)
                deltaY *= 24;
            this.listeners.map((listener) => { if (listener.wheel)
                listener.wheel(e.deltaY); });
        };
        element.addEventListener("mousedown", mouseDown, true);
        element.addEventListener("mousemove", mouseMove, true);
        element.addEventListener("mouseup", mouseUp, true);
        element.addEventListener("wheel", mouseWheel, true);
        element.addEventListener("touchstart", (ev) => {
            if (!this.touch0 || !this.touch1) {
                var touches = ev.changedTouches;
                let nativeTouch = touches.item(0);
                let rect = element.getBoundingClientRect();
                let x = nativeTouch.clientX - rect.left;
                let y = nativeTouch.clientY - rect.top;
                let touch = new Touch(nativeTouch.identifier, x, y);
                this.mouseX = x;
                this.mouseY = y;
                this.buttonDown = true;
                if (!this.touch0) {
                    this.touch0 = touch;
                    this.listeners.map((listener) => { if (listener.down)
                        listener.down(touch.x, touch.y); });
                }
                else if (!this.touch1) {
                    this.touch1 = touch;
                    let dx = this.touch1.x - this.touch0.x;
                    let dy = this.touch1.x - this.touch0.x;
                    this.initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
                    this.listeners.map((listener) => { if (listener.zoom)
                        listener.zoom(this.initialPinchDistance, this.initialPinchDistance); });
                }
            }
            ev.preventDefault();
        }, false);
        element.addEventListener("touchmove", (ev) => {
            if (this.touch0) {
                var touches = ev.changedTouches;
                let rect = element.getBoundingClientRect();
                for (var i = 0; i < touches.length; i++) {
                    var nativeTouch = touches[i];
                    let x = nativeTouch.clientX - rect.left;
                    let y = nativeTouch.clientY - rect.top;
                    if (this.touch0.identifier === nativeTouch.identifier) {
                        this.touch0.x = this.mouseX = x;
                        this.touch0.y = this.mouseY = y;
                        this.listeners.map((listener) => { if (listener.dragged)
                            listener.dragged(x, y); });
                    }
                    if (this.touch1 && this.touch1.identifier === nativeTouch.identifier) {
                        this.touch1.x = this.mouseX = x;
                        this.touch1.y = this.mouseY = y;
                    }
                }
                if (this.touch0 && this.touch1) {
                    let dx = this.touch1.x - this.touch0.x;
                    let dy = this.touch1.x - this.touch0.x;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    this.listeners.map((listener) => { if (listener.zoom)
                        listener.zoom(this.initialPinchDistance, distance); });
                }
            }
            ev.preventDefault();
        }, false);
        let touchEnd = (ev) => {
            if (this.touch0) {
                var touches = ev.changedTouches;
                let rect = element.getBoundingClientRect();
                for (var i = 0; i < touches.length; i++) {
                    var nativeTouch = touches[i];
                    let x = nativeTouch.clientX - rect.left;
                    let y = nativeTouch.clientY - rect.top;
                    if (this.touch0.identifier === nativeTouch.identifier) {
                        this.touch0 = null;
                        this.mouseX = x;
                        this.mouseY = y;
                        this.listeners.map((listener) => { if (listener.up)
                            listener.up(x, y); });
                        if (!this.touch1) {
                            this.buttonDown = false;
                            break;
                        }
                        else {
                            this.touch0 = this.touch1;
                            this.touch1 = null;
                            this.mouseX = this.touch0.x;
                            this.mouseX = this.touch0.x;
                            this.buttonDown = true;
                            this.listeners.map((listener) => { if (listener.down)
                                listener.down(this.touch0.x, this.touch0.y); });
                        }
                    }
                    if (this.touch1 && this.touch1.identifier) {
                        this.touch1 = null;
                    }
                }
            }
            ev.preventDefault();
        };
        element.addEventListener("touchend", touchEnd, false);
        element.addEventListener("touchcancel", touchEnd);
    }
    addListener(listener) {
        this.listeners.push(listener);
    }
    removeListener(listener) {
        let idx = this.listeners.indexOf(listener);
        if (idx > -1) {
            this.listeners.splice(idx, 1);
        }
    }
}
export class Touch {
    constructor(identifier, x, y) {
        this.identifier = identifier;
        this.x = x;
        this.y = y;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW5wdXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvSW5wdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsrRUEyQitFO0FBRS9FLE1BQU0sT0FBTyxLQUFLO0lBV2pCLFlBQWEsT0FBb0I7UUFUakMsV0FBTSxHQUFHLENBQUMsQ0FBQztRQUNYLFdBQU0sR0FBRyxDQUFDLENBQUM7UUFDWCxlQUFVLEdBQUcsS0FBSyxDQUFDO1FBQ25CLFdBQU0sR0FBVSxJQUFJLENBQUM7UUFDckIsV0FBTSxHQUFVLElBQUksQ0FBQztRQUNyQix5QkFBb0IsR0FBRyxDQUFDLENBQUM7UUFDakIsY0FBUyxHQUFHLElBQUksS0FBSyxFQUFpQixDQUFDO1FBQ3ZDLG1CQUFjLEdBQWtELEVBQUUsQ0FBQztRQUcxRSxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFFTyxjQUFjLENBQUUsT0FBb0I7UUFDM0MsSUFBSSxTQUFTLEdBQUcsQ0FBQyxFQUFXLEVBQUUsRUFBRTtZQUMvQixJQUFJLEVBQUUsWUFBWSxVQUFVLEVBQUU7Z0JBQzdCLElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2dCQUMzQyxJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztnQkFBQSxDQUFDO2dCQUN0QyxJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztnQkFDcEMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7Z0JBQ3ZCLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsR0FBRyxJQUFJLFFBQVEsQ0FBQyxJQUFJO29CQUFFLFFB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