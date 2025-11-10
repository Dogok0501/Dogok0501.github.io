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
import { AnimationState, AnimationStateData, AtlasAttachmentLoader, Color, MathUtils, MixBlend, MixDirection, Skeleton, SkeletonBinary, SkeletonJson, TextureFilter, TimeKeeper, Vector2 } from "@esotericsoftware/spine-core";
import { AssetManager, Input, LoadingScreen, ManagedWebGLRenderingContext, ResizeMode, SceneRenderer, Vector3 } from "@esotericsoftware/spine-webgl";
export class SpinePlayer {
    constructor(parent, config) {
        this.config = config;
        this.bg = new Color();
        this.bgFullscreen = new Color();
        this.playTime = 0;
        this.cancelId = 0;
        this.paused = true;
        this.speed = 1;
        this.time = new TimeKeeper();
        this.stopRequestAnimationFrame = false;
        this.disposed = false;
        this.viewport = {};
        this.viewportTransitionStart = 0;
        this.eventListeners = [];
        this.parent = typeof parent === "string" ? document.getElementById(parent) : parent;
        if (!this.parent)
            throw new Error("SpinePlayer parent not found: " + parent);
        if (config.showControls === void 0)
            config.showControls = true;
        let controls = config.showControls ? /*html*/ `
<div class="spine-player-controls spine-player-popup-parent spine-player-controls-hidden">
<div class="spine-player-timeline"></div>
<div class="spine-player-buttons">
<button class="spine-player-button spine-player-button-icon-pause"></button>
<div class="spine-player-button-spacer"></div>
<button class="spine-player-button spine-player-button-icon-speed"></button>
<button class="spine-player-button spine-player-button-icon-animations"></button>
<button class="spine-player-button spine-player-button-icon-skins"></button>
<button class="spine-player-button spine-player-button-icon-settings"></button>
<button class="spine-player-button spine-player-button-icon-fullscreen"></button>
<img class="spine-player-button-icon-spine-logo" src="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20104%2031.16%22%3E%3Cpath%20d%3D%22M104%2012.68a1.31%201.31%200%200%201-.37%201%201.28%201.28%200%200%201-.85.31H91.57a10.51%2010.51%200%200%200%20.29%202.55%204.92%204.92%200%200%200%201%202%204.27%204.27%200%200%200%201.64%201.26%206.89%206.89%200%200%200%202.6.44%2010.66%2010.66%200%200%200%202.17-.2%2012.81%2012.81%200%200%200%201.64-.44q.69-.25%201.14-.44a1.87%201.87%200%200%201%20.68-.2.44.44%200%200%201%20.27.04.43.43%200%200%201%20.16.2%201.38%201.38%200%200%201%20.09.37%204.89%204.89%200%200%201%200%20.58%204.14%204.14%200%200%201%200%20.43v.32a.83.83%200%200%201-.09.26%201.1%201.1%200%200%201-.17.22%202.77%202.77%200%200%201-.61.34%208.94%208.94%200%200%201-1.32.46%2018.54%2018.54%200%200%201-1.88.41%2013.78%2013.78%200%200%201-2.28.18%2010.55%2010.55%200%200%201-3.68-.59%206.82%206.82%200%200%201-2.66-1.74%207.44%207.44%200%200%201-1.63-2.89%2013.48%2013.48%200%200%201-.55-4%2012.76%2012.76%200%200%201%20.57-3.94%208.35%208.35%200%200%201%201.64-3%207.15%207.15%200%200%201%202.58-1.87%208.47%208.47%200%200%201%203.39-.65%208.19%208.19%200%200%201%203.41.64%206.46%206.46%200%200%201%202.32%201.73%207%207%200%200%201%201.3%202.54%2011.17%2011.17%200%200%201%20.43%203.13zm-3.14-.93a5.69%205.69%200%200%200-1.09-3.86%204.17%204.17%200%200%200-3.42-1.4%204.52%204.52%200%200%200-2%20.44%204.41%204.41%200%200%200-1.47%201.15A5.29%205.29%200%200%200%2092%209.75a7%207%200%200%200-.36%202zM80.68%2021.94a.42.42%200%200%201-.08.26.59.59%200%200%201-.25.18%201.74%201.74%200%200%201-.47.11%206.31%206.31%200%200%201-.76%200%206.5%206.5%200%200%201-.78%200%201.74%201.74%200%200%201-.47-.11.59.59%200%200%201-.25-.18.42.42%200%200%201-.08-.26V12a9.8%209.8%200%200%200-.23-2.35%204.86%204.86%200%200%200-.66-1.53%202.88%202.88%200%200%200-1.13-1%203.57%203.57%200%200%200-1.6-.34%204%204%200%200%200-2.35.83A12.71%2012.71%200%200%200%2069.11%2010v11.9a.42.42%200%200%201-.08.26.59.59%200%200%201-.25.18%201.74%201.74%200%200%201-.47.11%206.51%206.51%200%200%201-.78%200%206.31%206.31%200%200%201-.76%200%201.88%201.88%200%200%201-.48-.11.52.52%200%200%201-.25-.18.46.46%200%200%201-.07-.26v-17a.53.53%200%200%201%20.03-.21.5.5%200%200%201%20.23-.19%201.28%201.28%200%200%201%20.44-.11%208.53%208.53%200%200%201%201.39%200%201.12%201.12%200%200%201%20.43.11.6.6%200%200%201%20.22.19.47.47%200%200%201%20.07.26V7.2a10.46%2010.46%200%200%201%202.87-2.36%206.17%206.17%200%200%201%202.88-.75%206.41%206.41%200%200%201%202.87.58%205.16%205.16%200%200%201%201.88%201.54%206.15%206.15%200%200%201%201%202.26%2013.46%2013.46%200%200%201%20.31%203.11z%22%20fill%3D%22%23fff%22%2F%3E%3Cpath%20d%3D%22M43.35%202.86c.09%202.6%201.89%204%205.48%204.61%203%20.48%205.79.24%206.69-2.37%201.75-5.09-2.4-3.82-6-4.39s-6.31-2.03-6.17%202.15zm1.08%2010.69c.33%201.94%202.14%203.06%204.91%203s4.84-1.16%205.13-3.25c.53-3.88-2.53-2.38-5.3-2.3s-5.4-1.26-4.74%202.55zM48%2022.44c.55%201.45%202.06%202.06%204.1%201.63s3.45-1.11%203.33-2.76c-.21-3.06-2.22-2.1-4.26-1.66S47%2019.6%2048%2022.44zm1.78%206.78c.16%201.22%201.22%202%202.88%201.93s2.92-.67%203.13-2c.4-2.43-1.46-1.53-3.12-1.51s-3.17-.82-2.89%201.58z%22%20fill%3D%22%23ff4000%22%2F%3E%3Cpath%20d%3D%22M35.28%2013.16a15.33%2015.33%200%200%201-.48%204%208.75%208.75%200%200%201-1.42%203%206.35%206.35%200%200%201-2.32%201.91%207.14%207.14%200%200%201-3.16.67%206.1%206.1%200%200%201-1.4-.15%205.34%205.34%200%200%201-1.26-.47%207.29%207.29%200%200%201-1.24-.81q-.61-.49-1.29-1.15v8.51a.47.47%200%200%201-.08.26.56.56%200%200%201-.25.19%201.74%201.74%200%200%201-.47.11%206.47%206.47%200%200%201-.78%200%206.26%206.26%200%200%201-.76%200%201.89%201.89%200%200%201-.48-.11.49.49%200%200%201-.25-.19.51.51%200%200%201-.07-.26V4.91a.57.57%200%200%201%20.06-.27.46.46%200%200%201%20.23-.18%201.47%201.47%200%200%201%20.44-.1%207.41%207.41%200%200%201%201.3%200%201.45%201.45%200%200%201%20.43.1.52.52%200%200%201%20.24.18.51.51%200%200%201%20.07.27V7.2a18.06%2018.06%200%200%201%201.49-1.38%209%209%200%200%201%201.45-1%206.82%206.82%200%200%201%201.49-.59%207.09%207.09%200%200%201%204.78.52%206%206%200%200%201%202.13%202%208.79%208.79%200%200%201%201.2%202.9%2015.72%2015.72%200%200%201%20.4%203.51zm-3.28.36a15.64%2015.64%200%200%200-.2-2.53%207.32%207.32%200%200%200-.69-2.17%204.06%204.06%200%200%200-1.3-1.51%203.49%203.49%200%200%200-2-.57%204.1%204.1%200%200%200-1.2.18%204.92%204.92%200%200%200-1.2.57%208.54%208.54%200%200%200-1.28%201A15.77%2015.77%200%200%200%2022.76%2010v6.77a13.53%2013.53%200%200%200%202.46%202.4%204.12%204.12%200%200%200%202.44.83%203.56%203.56%200%200%200%202-.57A4.28%204.28%200%200%200%2031%2018a7.58%207.58%200%200%200%20.77-2.12%2011.43%2011.43%200%200%200%20.23-2.36zM12%2017.3a5.39%205.39%200%200%201-.48%202.33%204.73%204.73%200%200%201-1.37%201.72%206.19%206.19%200%200%201-2.12%201.06%209.62%209.62%200%200%201-2.71.36%2010.38%2010.38%200%200%201-3.21-.5A7.63%207.63%200%200%201%201%2021.82a3.25%203.25%200%200%201-.66-.43%201.09%201.09%200%200%201-.3-.53%203.59%203.59%200%200%201-.04-.93%204.06%204.06%200%200%201%200-.61%202%202%200%200%201%20.09-.4.42.42%200%200%201%20.16-.22.43.43%200%200%201%20.24-.07%201.35%201.35%200%200%201%20.61.26q.41.26%201%20.56a9.22%209.22%200%200%200%201.41.55%206.25%206.25%200%200%200%201.87.26%205.62%205.62%200%200%200%201.44-.17%203.48%203.48%200%200%200%201.12-.5%202.23%202.23%200%200%200%20.73-.84%202.68%202.68%200%200%200%20.26-1.21%202%202%200%200%200-.37-1.21%203.55%203.55%200%200%200-1-.87%208.09%208.09%200%200%200-1.36-.66l-1.56-.61a16%2016%200%200%201-1.57-.73%206%206%200%200%201-1.37-1%204.52%204.52%200%200%201-1-1.4%204.69%204.69%200%200%201-.37-2%204.88%204.88%200%200%201%20.39-1.87%204.46%204.46%200%200%201%201.16-1.61%205.83%205.83%200%200%201%201.94-1.11A8.06%208.06%200%200%201%206.53%204a8.28%208.28%200%200%201%201.36.11%209.36%209.36%200%200%201%201.23.28%205.92%205.92%200%200%201%20.94.37%204.09%204.09%200%200%201%20.59.35%201%201%200%200%201%20.26.26.83.83%200%200%201%20.09.26%201.32%201.32%200%200%200%20.06.35%203.87%203.87%200%200%201%200%20.51%204.76%204.76%200%200%201%200%20.56%201.39%201.39%200%200%201-.09.39.5.5%200%200%201-.16.22.35.35%200%200%201-.21.07%201%201%200%200%201-.49-.21%207%207%200%200%200-.83-.44%209.26%209.26%200%200%200-1.2-.44%205.49%205.49%200%200%200-1.58-.16%204.93%204.93%200%200%200-1.4.18%202.69%202.69%200%200%200-1%20.51%202.16%202.16%200%200%200-.59.83%202.43%202.43%200%200%200-.2%201%202%202%200%200%200%20.38%201.24%203.6%203.6%200%200%200%201%20.88%208.25%208.25%200%200%200%201.38.68l1.58.62q.8.32%201.59.72a6%206%200%200%201%201.39%201%204.37%204.37%200%200%201%201%201.36%204.46%204.46%200%200%201%20.37%201.8z%22%20fill%3D%22%23fff%22%2F%3E%3C%2Fsvg%3E">
</div></div>` : "";
        this.parent.appendChild(this.dom = createElement(
        /*html*/ `<div class="spine-player" style="position:relative;height:100%"><canvas class="spine-player-canvas" style="display:block;width:100%;height:100%"></canvas>${controls}</div>`));
        try {
            this.validateConfig(config);
        }
        catch (e) {
            this.showError(e.message, e);
        }
        this.initialize();
        // Register a global resize handler to redraw, avoiding flicker.
        this.addEventListener(window, "resize", () => this.drawFrame(false));
        // Start the rendering loop.
        requestAnimationFrame(() => this.drawFrame());
    }
    dispose() {
        this.sceneRenderer.dispose();
        if (this.loadingScreen)
            this.loadingScreen.dispose();
        this.assetManager.dispose();
        for (var i = 0; i < this.eventListeners.length; i++) {
            var eventListener = this.eventListeners[i];
            eventListener.target.removeEventListener(eventListener.event, eventListener.func);
        }
        this.parent.removeChild(this.dom);
        this.disposed = true;
    }
    addEventListener(target, event, func) {
        this.eventListeners.push({ target: target, event: event, func: func });
        target.addEventListener(event, func);
    }
    validateConfig(config) {
        if (!config)
            throw new Error("A configuration object must be passed to to new SpinePlayer().");
        if (config.skelUrl)
            config.binaryUrl = config.skelUrl;
        if (!config.jsonUrl && !config.binaryUrl)
            throw new Error("A URL must be specified for the skeleton JSON or binary file.");
        if (!config.atlasUrl)
            throw new Error("A URL must be specified for the atlas file.");
        if (!config.backgroundColor)
            config.backgroundColor = config.alpha ? "00000000" : "000000";
        if (!config.fullScreenBackgroundColor)
            config.fullScreenBackgroundColor = config.backgroundColor;
        if (config.backgroundImage && !config.backgroundImage.url)
            config.backgroundImage = null;
        if (config.premultipliedAlpha === void 0)
            config.premultipliedAlpha = true;
        if (config.preserveDrawingBuffer === void 0)
            config.preserveDrawingBuffer = false;
        if (config.mipmaps === void 0)
            config.mipmaps = true;
        if (!config.debug)
            config.debug = {};
        if (config.animations && config.animation && config.animations.indexOf(config.animation) < 0)
            throw new Error("Animation '" + config.animation + "' is not in the config animation list: " + toString(config.animations));
        if (config.skins && config.skin && config.skins.indexOf(config.skin) < 0)
            throw new Error("Default skin '" + config.skin + "' is not in the config skins list: " + toString(config.skins));
        if (!config.viewport)
            config.viewport = {};
        if (!config.viewport.animations)
            config.viewport.animations = {};
        if (config.viewport.debugRender === void 0)
            config.viewport.debugRender = false;
        if (config.viewport.transitionTime === void 0)
            config.viewport.transitionTime = 0.25;
        if (!config.controlBones)
            config.controlBones = [];
        if (config.showLoading === void 0)
            config.showLoading = true;
        if (config.defaultMix === void 0)
            config.defaultMix = 0.25;
    }
    initialize() {
        let config = this.config;
        let dom = this.dom;
        if (!config.alpha) { // Prevents a flash before the first frame is drawn.
            let hex = config.backgroundColor;
            this.dom.style.backgroundColor = (hex.charAt(0) == '#' ? hex : "#" + hex).substr(0, 7);
        }
        try {
            // Setup the OpenGL context.
            this.canvas = findWithClass(dom, "spine-player-canvas");
            this.context = new ManagedWebGLRenderingContext(this.canvas, { alpha: config.alpha, preserveDrawingBuffer: config.preserveDrawingBuffer });
            // Setup the scene renderer and loading screen.
            this.sceneRenderer = new SceneRenderer(this.canvas, this.context, true);
            if (config.showLoading)
                this.loadingScreen = new LoadingScreen(this.sceneRenderer);
        }
        catch (e) {
            this.showError("Sorry, your browser does not support \nPlease use the latest version of Firefox, Chrome, Edge, or Safari.", e);
        }
        // Load the assets.
        this.assetManager = new AssetManager(this.context, "", config.downloader);
        if (config.rawDataURIs) {
            for (let path in config.rawDataURIs)
                this.assetManager.setRawDataURI(path, config.rawDataURIs[path]);
        }
        if (config.jsonUrl)
            this.assetManager.loadJson(config.jsonUrl);
        else
            this.assetManager.loadBinary(config.binaryUrl);
        this.assetManager.loadTextureAtlas(config.atlasUrl);
        if (config.backgroundImage)
            this.assetManager.loadTexture(config.backgroundImage.url);
        // Setup the UI elements.
        this.bg.setFromString(config.backgroundColor);
        this.bgFullscreen.setFromString(config.fullScreenBackgroundColor);
        if (config.showControls) {
            this.playerControls = dom.children[1];
            let controls = this.playerControls.children;
            let timeline = controls[0];
            let buttons = controls[1].children;
            this.playButton = buttons[0];
            let speedButton = buttons[2];
            this.animationButton = buttons[3];
            this.skinButton = buttons[4];
            let settingsButton = buttons[5];
            let fullscreenButton = buttons[6];
            let logoButton = buttons[7];
            this.timelineSlider = new Slider();
            timeline.appendChild(this.timelineSlider.create());
            this.timelineSlider.change = (percentage) => {
                this.pause();
                let animationDuration = this.animationState.getCurrent(0).animation.duration;
                let time = animationDuration * percentage;
                this.animationState.update(time - this.playTime);
                this.animationState.apply(this.skeleton);
                this.skeleton.updateWorldTransform();
                this.playTime = time;
            };
            this.playButton.onclick = () => (this.paused ? this.play() : this.pause());
            speedButton.onclick = () => this.showSpeedDialog(speedButton);
            this.animationButton.onclick = () => this.showAnimationsDialog(this.animationButton);
            this.skinButton.onclick = () => this.showSkinsDialog(this.skinButton);
            settingsButton.onclick = () => this.showSettingsDialog(settingsButton);
            let oldWidth = this.canvas.clientWidth, oldHeight = this.canvas.clientHeight;
            let oldStyleWidth = this.canvas.style.width, oldStyleHeight = this.canvas.style.height;
            let isFullscreen = false;
            fullscreenButton.onclick = () => {
                let fullscreenChanged = () => {
                    isFullscreen = !isFullscreen;
                    if (!isFullscreen) {
                        this.canvas.style.width = oldWidth + "px";
                        this.canvas.style.height = oldHeight + "px";
                        this.drawFrame(false);
                        // Got to reset the style to whatever the user set after the next layouting.
                        requestAnimationFrame(() => {
                            this.canvas.style.width = oldStyleWidth;
                            this.canvas.style.height = oldStyleHeight;
                        });
                    }
                };
                let player = dom;
                player.onfullscreenchange = fullscreenChanged;
                player.onwebkitfullscreenchange = fullscreenChanged;
                let doc = document;
                if (doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement) {
                    if (doc.exitFullscreen)
                        doc.exitFullscreen();
                    else if (doc.mozCancelFullScreen)
                        doc.mozCancelFullScreen();
                    else if (doc.webkitExitFullscreen)
                        doc.webkitExitFullscreen();
                    else if (doc.msExitFullscreen)
                        doc.msExitFullscreen();
                }
                else {
                    oldWidth = this.canvas.clientWidth;
                    oldHeight = this.canvas.clientHeight;
                    oldStyleWidth = this.canvas.style.width;
                    oldStyleHeight = this.canvas.style.height;
                    if (player.requestFullscreen)
                        player.requestFullscreen();
                    else if (player.webkitRequestFullScreen)
                        player.webkitRequestFullScreen();
                    else if (player.mozRequestFullScreen)
                        player.mozRequestFullScreen();
                    else if (player.msRequestFullscreen)
                        player.msRequestFullscreen();
                }
            };
            logoButton.onclick = () => window.open("http://esotericsoftware.com");
        }
        return dom;
    }
    loadSkeleton() {
        if (this.error)
            return;
        if (this.assetManager.hasErrors())
            this.showError("Error: Assets could not be loaded.\n" + toString(this.assetManager.getErrors()));
        let config = this.config;
        // Configure filtering, don't use mipmaps in WebGL1 if the atlas page is non-POT
        let atlas = this.assetManager.require(config.atlasUrl);
        let gl = this.context.gl, anisotropic = gl.getExtension("EXT_texture_filter_anisotropic");
        let isWebGL1 = gl.getParameter(gl.VERSION).indexOf("WebGL 1.0") != -1;
        for (let page of atlas.pages) {
            let minFilter = page.minFilter;
            var useMipMaps = config.mipmaps;
            var isPOT = MathUtils.isPowerOfTwo(page.width) && MathUtils.isPowerOfTwo(page.height);
            if (isWebGL1 && !isPOT)
                useMipMaps = false;
            if (useMipMaps) {
                if (anisotropic) {
                    gl.texParameterf(gl.TEXTURE_2D, anisotropic.TEXTURE_MAX_ANISOTROPY_EXT, 8);
                    minFilter = TextureFilter.MipMapLinearLinear;
                }
                else
                    minFilter = TextureFilter.Linear; // Don't use mipmaps without anisotropic.
                page.texture.setFilters(minFilter, TextureFilter.Nearest);
            }
            if (minFilter != TextureFilter.Nearest && minFilter != TextureFilter.Linear)
                page.texture.update(true);
        }
        // Load skeleton data.
        let skeletonData;
        if (config.jsonUrl) {
            try {
                let jsonData = this.assetManager.remove(config.jsonUrl);
                if (!jsonData)
                    throw new Error("Empty JSON data.");
                if (config.jsonField) {
                    jsonData = jsonData[config.jsonField];
                    if (!jsonData)
                        throw new Error("JSON field does not exist: " + config.jsonField);
                }
                let json = new SkeletonJson(new AtlasAttachmentLoader(atlas));
                skeletonData = json.readSkeletonData(jsonData);
            }
            catch (e) {
                this.showError(`Error: Could not load skeleton JSON.\n${e.message}`, e);
            }
        }
        else {
            let binaryData = this.assetManager.remove(config.binaryUrl);
            let binary = new SkeletonBinary(new AtlasAttachmentLoader(atlas));
            try {
                skeletonData = binary.readSkeletonData(binaryData);
            }
            catch (e) {
                this.showError(`Error: Could not load skeleton binary.\n${e.message}`, e);
            }
        }
        this.skeleton = new Skeleton(skeletonData);
        let stateData = new AnimationStateData(skeletonData);
        stateData.defaultMix = config.defaultMix;
        this.animationState = new AnimationState(stateData);
        // Check if all control bones are in the skeleton
        config.controlBones.forEach(bone => {
            if (!skeletonData.findBone(bone))
                this.showError(`Error: Control bone does not exist in skeleton: ${bone}`);
        });
        // Setup skin.
        if (!config.skin && skeletonData.skins.length)
            config.skin = skeletonData.skins[0].name;
        if (config.skins && config.skin.length) {
            config.skins.forEach(skin => {
                if (!this.skeleton.data.findSkin(skin))
                    this.showError(`Error: Skin in config list does not exist in skeleton: ${skin}`);
            });
        }
        if (config.skin) {
            if (!this.skeleton.data.findSkin(config.skin))
                this.showError(`Error: Skin does not exist in skeleton: ${config.skin}`);
            this.skeleton.setSkinByName(config.skin);
            this.skeleton.setSlotsToSetupPose();
        }
        // Check if all animations given a viewport exist.
        Object.getOwnPropertyNames(config.viewport.animations).forEach((animation) => {
            if (!skeletonData.findAnimation(animation))
                this.showError(`Error: Animation for which a viewport was specified does not exist in skeleton: ${animation}`);
        });
        // Setup the animations after the viewport, so default bounds don't get messed up.
        if (config.animations && config.animations.length) {
            config.animations.forEach(animation => {
                if (!this.skeleton.data.findAnimation(animation))
                    this.showError(`Error: Animation in config list does not exist in skeleton: ${animation}`);
            });
            if (!config.animation)
                config.animation = config.animations[0];
        }
        if (config.animation && !skeletonData.findAnimation(config.animation))
            this.showError(`Error: Animation does not exist in skeleton: ${config.animation}`);
        // Setup input processing and control bones.
        this.setupInput();
        if (config.showControls) {
            // Hide skin and animation if there's only the default skin / no animation
            if (skeletonData.skins.length == 1 || (config.skins && config.skins.length == 1))
                this.skinButton.classList.add("spine-player-hidden");
            if (skeletonData.animations.length == 1 || (config.animations && config.animations.length == 1))
                this.animationButton.classList.add("spine-player-hidden");
        }
        if (config.success)
            config.success(this);
        let entry = this.animationState.getCurrent(0);
        if (!entry) {
            if (config.animation) {
                entry = this.setAnimation(config.animation);
                this.play();
            }
            else {
                entry = this.animationState.setEmptyAnimation(0);
                entry.trackEnd = 100000000;
                this.setViewport(entry.animation);
                this.pause();
            }
        }
        else if (!this.currentViewport) {
            this.setViewport(entry.animation);
            this.play();
        }
    }
    setupInput() {
        let config = this.config;
        let controlBones = config.controlBones;
        if (!controlBones.length && !config.showControls)
            return;
        let selectedBones = this.selectedBones = new Array(controlBones.length);
        let canvas = this.canvas;
        let target = null;
        let offset = new Vector2();
        let coords = new Vector3();
        let mouse = new Vector3();
        let position = new Vector2();
        let skeleton = this.skeleton;
        let renderer = this.sceneRenderer;
        let closest = function (x, y) {
            mouse.set(x, canvas.clientHeight - y, 0);
            offset.x = offset.y = 0;
            let bestDistance = 24, index = 0;
            let best;
            for (let i = 0; i < controlBones.length; i++) {
                selectedBones[i] = null;
                let bone = skeleton.findBone(controlBones[i]);
                let distance = renderer.camera.worldToScreen(coords.set(bone.worldX, bone.worldY, 0), canvas.clientWidth, canvas.clientHeight).distance(mouse);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    best = bone;
                    index = i;
                    offset.x = coords.x - mouse.x;
                    offset.y = coords.y - mouse.y;
                }
            }
            if (best)
                selectedBones[index] = best;
            return best;
        };
        new Input(canvas).addListener({
            down: (x, y) => {
                target = closest(x, y);
            },
            up: () => {
                if (target)
                    target = null;
                else if (config.showControls)
                    (this.paused ? this.play() : this.pause());
            },
            dragged: (x, y) => {
                if (target) {
                    x = MathUtils.clamp(x + offset.x, 0, canvas.clientWidth);
                    y = MathUtils.clamp(y - offset.y, 0, canvas.clientHeight);
                    renderer.camera.screenToWorld(coords.set(x, y, 0), canvas.clientWidth, canvas.clientHeight);
                    if (target.parent) {
                        target.parent.worldToLocal(position.set(coords.x - skeleton.x, coords.y - skeleton.y));
                        target.x = position.x;
                        target.y = position.y;
                    }
                    else {
                        target.x = coords.x - skeleton.x;
                        target.y = coords.y - skeleton.y;
                    }
                }
            },
            moved: (x, y) => closest(x, y)
        });
        if (config.showControls) {
            // For manual hover to work, we need to disable hidding controls if the mouse/touch entered the clickable area of a child of the controls.
            // For this we need to register a mouse handler on the document and see if we are within the canvas area.
            this.addEventListener(document, "mousemove", (ev) => {
                if (ev instanceof MouseEvent)
                    handleHover(ev.clientX, ev.clientY);
            });
            this.addEventListener(document, "touchmove", (ev) => {
                if (ev instanceof TouchEvent) {
                    let touches = ev.changedTouches;
                    if (touches.length) {
                        let touch = touches[0];
                        handleHover(touch.clientX, touch.clientY);
                    }
                }
            });
            let overlap = (mouseX, mouseY, rect) => {
                let x = mouseX - rect.left, y = mouseY - rect.top;
                return x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
            };
            let mouseOverControls = true, mouseOverCanvas = false;
            let handleHover = (mouseX, mouseY) => {
                let popup = findWithClass(this.dom, "spine-player-popup");
                mouseOverControls = overlap(mouseX, mouseY, this.playerControls.getBoundingClientRect());
                mouseOverCanvas = overlap(mouseX, mouseY, canvas.getBoundingClientRect());
                clearTimeout(this.cancelId);
                let hide = !popup && !mouseOverControls && !mouseOverCanvas && !this.paused;
                if (hide)
                    this.playerControls.classList.add("spine-player-controls-hidden");
                else
                    this.playerControls.classList.remove("spine-player-controls-hidden");
                if (!mouseOverControls && !popup && !this.paused) {
                    this.cancelId = setTimeout(() => {
                        if (!this.paused)
                            this.playerControls.classList.add("spine-player-controls-hidden");
                    }, 1000);
                }
            };
        }
    }
    play() {
        this.paused = false;
        let config = this.config;
        if (config.showControls) {
            this.cancelId = setTimeout(() => {
                if (!this.paused)
                    this.playerControls.classList.add("spine-player-controls-hidden");
            }, 1000);
            this.playButton.classList.remove("spine-player-button-icon-play");
            this.playButton.classList.add("spine-player-button-icon-pause");
            // If no config animation, set one when first clicked.
            if (!config.animation) {
                if (config.animations && config.animations.length)
                    config.animation = config.animations[0];
                else if (this.skeleton.data.animations.length)
                    config.animation = this.skeleton.data.animations[0].name;
                if (config.animation)
                    this.setAnimation(config.animation);
            }
        }
    }
    pause() {
        this.paused = true;
        if (this.config.showControls) {
            this.playerControls.classList.remove("spine-player-controls-hidden");
            clearTimeout(this.cancelId);
            this.playButton.classList.remove("spine-player-button-icon-pause");
            this.playButton.classList.add("spine-player-button-icon-play");
        }
    }
    /* Sets a new animation and viewport on track 0. */
    setAnimation(animation, loop = true) {
        animation = this.setViewport(animation);
        return this.animationState.setAnimationWith(0, animation, loop);
    }
    /* Adds a new animation and viewport on track 0. */
    addAnimation(animation, loop = true, delay = 0) {
        animation = this.setViewport(animation);
        return this.animationState.addAnimationWith(0, animation, loop, delay);
    }
    /* Sets the viewport for the specified animation. */
    setViewport(animation) {
        if (typeof animation == "string")
            animation = this.skeleton.data.findAnimation(animation);
        this.previousViewport = this.currentViewport;
        // Determine the base viewport.
        let globalViewport = this.config.viewport;
        let viewport = this.currentViewport = {
            padLeft: globalViewport.padLeft !== void 0 ? globalViewport.padLeft : "10%",
            padRight: globalViewport.padRight !== void 0 ? globalViewport.padRight : "10%",
            padTop: globalViewport.padTop !== void 0 ? globalViewport.padTop : "10%",
            padBottom: globalViewport.padBottom !== void 0 ? globalViewport.padBottom : "10%"
        };
        if (globalViewport.x !== void 0 && globalViewport.y !== void 0 && globalViewport.width && globalViewport.height) {
            viewport.x = globalViewport.x;
            viewport.y = globalViewport.y;
            viewport.width = globalViewport.width;
            viewport.height = globalViewport.height;
        }
        else
            this.calculateAnimationViewport(animation, viewport);
        // Override with the animation specific viewport for the final result.
        let userAnimViewport = this.config.viewport.animations[animation.name];
        if (userAnimViewport) {
            if (userAnimViewport.x !== void 0 && userAnimViewport.y !== void 0 && userAnimViewport.width && userAnimViewport.height) {
                viewport.x = userAnimViewport.x;
                viewport.y = userAnimViewport.y;
                viewport.width = userAnimViewport.width;
                viewport.height = userAnimViewport.height;
            }
            if (userAnimViewport.padLeft !== void 0)
                viewport.padLeft = userAnimViewport.padLeft;
            if (userAnimViewport.padRight !== void 0)
                viewport.padRight = userAnimViewport.padRight;
            if (userAnimViewport.padTop !== void 0)
                viewport.padTop = userAnimViewport.padTop;
            if (userAnimViewport.padBottom !== void 0)
                viewport.padBottom = userAnimViewport.padBottom;
        }
        // Translate percentage padding to world units.
        viewport.padLeft = this.percentageToWorldUnit(viewport.width, viewport.padLeft);
        viewport.padRight = this.percentageToWorldUnit(viewport.width, viewport.padRight);
        viewport.padBottom = this.percentageToWorldUnit(viewport.height, viewport.padBottom);
        viewport.padTop = this.percentageToWorldUnit(viewport.height, viewport.padTop);
        this.viewportTransitionStart = performance.now();
        return animation;
    }
    percentageToWorldUnit(size, percentageOrAbsolute) {
        if (typeof percentageOrAbsolute === "string")
            return size * parseFloat(percentageOrAbsolute.substr(0, percentageOrAbsolute.length - 1)) / 100;
        return percentageOrAbsolute;
    }
    calculateAnimationViewport(animation, viewport) {
        this.skeleton.setToSetupPose();
        let steps = 100, stepTime = animation.duration ? animation.duration / steps : 0, time = 0;
        let minX = 100000000, maxX = -100000000, minY = 100000000, maxY = -100000000;
        let offset = new Vector2(), size = new Vector2();
        for (let i = 0; i < steps; i++, time += stepTime) {
            animation.apply(this.skeleton, time, time, false, null, 1, MixBlend.setup, MixDirection.mixIn);
            this.skeleton.updateWorldTransform();
            this.skeleton.getBounds(offset, size);
            if (!isNaN(offset.x) && !isNaN(offset.y) && !isNaN(size.x) && !isNaN(size.y)) {
                minX = Math.min(offset.x, minX);
                maxX = Math.max(offset.x + size.x, maxX);
                minY = Math.min(offset.y, minY);
                maxY = Math.max(offset.y + size.y, maxY);
            }
            else
                this.showError("Animation bounds are invalid: " + animation.name);
        }
        viewport.x = minX;
        viewport.y = minY;
        viewport.width = maxX - minX;
        viewport.height = maxY - minY;
    }
    drawFrame(requestNextFrame = true) {
        try {
            if (this.error)
                return;
            if (this.disposed)
                return;
            if (requestNextFrame && !this.stopRequestAnimationFrame)
                requestAnimationFrame(() => this.drawFrame());
            let doc = document;
            let isFullscreen = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;
            let bg = isFullscreen ? this.bgFullscreen : this.bg;
            this.time.update();
            let delta = this.time.delta;
            // Load the skeleton if the assets are ready.
            let loading = this.assetManager.isLoadingComplete();
            if (!this.skeleton && loading)
                this.loadSkeleton();
            let skeleton = this.skeleton;
            let config = this.config;
            if (skeleton) {
                // Resize the canvas.
                let renderer = this.sceneRenderer;
                renderer.resize(ResizeMode.Expand);
                let playDelta = this.paused ? 0 : delta * this.speed;
                if (config.frame)
                    config.frame(this, playDelta);
                // Update animation time and pose the skeleton.
                if (!this.paused) {
                    this.animationState.update(playDelta);
                    this.animationState.apply(skeleton);
                    skeleton.updateWorldTransform();
                    if (config.showControls) {
                        this.playTime += playDelta;
                        let entry = this.animationState.getCurrent(0);
                        if (entry) {
                            let duration = entry.animation.duration;
                            while (this.playTime >= duration && duration != 0)
                                this.playTime -= duration;
                            this.playTime = Math.max(0, Math.min(this.playTime, duration));
                            this.timelineSlider.setValue(this.playTime / duration);
                        }
                    }
                }
                // Determine the viewport.
                let viewport = this.viewport;
                viewport.x = this.currentViewport.x - this.currentViewport.padLeft,
                    viewport.y = this.currentViewport.y - this.currentViewport.padBottom,
                    viewport.width = this.currentViewport.width + this.currentViewport.padLeft + this.currentViewport.padRight,
                    viewport.height = this.currentViewport.height + this.currentViewport.padBottom + this.currentViewport.padTop;
                if (this.previousViewport) {
                    let transitionAlpha = (performance.now() - this.viewportTransitionStart) / 1000 / config.viewport.transitionTime;
                    if (transitionAlpha < 1) {
                        let x = this.previousViewport.x - this.previousViewport.padLeft;
                        let y = this.previousViewport.y - this.previousViewport.padBottom;
                        let width = this.previousViewport.width + this.previousViewport.padLeft + this.previousViewport.padRight;
                        let height = this.previousViewport.height + this.previousViewport.padBottom + this.previousViewport.padTop;
                        viewport.x = x + (viewport.x - x) * transitionAlpha;
                        viewport.y = y + (viewport.y - y) * transitionAlpha;
                        viewport.width = width + (viewport.width - width) * transitionAlpha;
                        viewport.height = height + (viewport.height - height) * transitionAlpha;
                    }
                }
                renderer.camera.zoom = this.canvas.height / this.canvas.width > viewport.height / viewport.width
                    ? viewport.width / this.canvas.width : viewport.height / this.canvas.height;
                renderer.camera.position.x = viewport.x + viewport.width / 2;
                renderer.camera.position.y = viewport.y + viewport.height / 2;
                // Clear the screen.
                let gl = this.context.gl;
                gl.clearColor(bg.r, bg.g, bg.b, bg.a);
                gl.clear(gl.COLOR_BUFFER_BIT);
                if (config.update)
                    config.update(this, playDelta);
                renderer.begin();
                // Draw the background image.
                let bgImage = config.backgroundImage;
                if (bgImage) {
                    let texture = this.assetManager.require(bgImage.url);
                    if (bgImage.x !== void 0 && bgImage.y !== void 0 && bgImage.width && bgImage.height)
                        renderer.drawTexture(texture, bgImage.x, bgImage.y, bgImage.width, bgImage.height);
                    else
                        renderer.drawTexture(texture, viewport.x, viewport.y, viewport.width, viewport.height);
                }
                // Draw the skeleton and debug output.
                renderer.drawSkeleton(skeleton, config.premultipliedAlpha);
                if ((renderer.skeletonDebugRenderer.drawBones = config.debug.bones)
                    || (renderer.skeletonDebugRenderer.drawBoundingBoxes = config.debug.bounds)
                    || (renderer.skeletonDebugRenderer.drawClipping = config.debug.clipping)
                    || (renderer.skeletonDebugRenderer.drawMeshHull = config.debug.hulls)
                    || (renderer.skeletonDebugRenderer.drawPaths = config.debug.paths)
                    || (renderer.skeletonDebugRenderer.drawRegionAttachments = config.debug.regions)
                    || (renderer.skeletonDebugRenderer.drawMeshTriangles = config.debug.meshes)) {
                    renderer.drawSkeletonDebug(skeleton, config.premultipliedAlpha);
                }
                // Draw the control bones.
                let controlBones = config.controlBones;
                if (controlBones.length) {
                    let selectedBones = this.selectedBones;
                    gl.lineWidth(2);
                    for (let i = 0; i < controlBones.length; i++) {
                        let bone = skeleton.findBone(controlBones[i]);
                        if (!bone)
                            continue;
                        let colorInner = selectedBones[i] ? BONE_INNER_OVER : BONE_INNER;
                        let colorOuter = selectedBones[i] ? BONE_OUTER_OVER : BONE_OUTER;
                        renderer.circle(true, skeleton.x + bone.worldX, skeleton.y + bone.worldY, 20, colorInner);
                        renderer.circle(false, skeleton.x + bone.worldX, skeleton.y + bone.worldY, 20, colorOuter);
                    }
                }
                // Draw the viewport bounds.
                if (config.viewport.debugRender) {
                    gl.lineWidth(1);
                    renderer.rect(false, this.currentViewport.x, this.currentViewport.y, this.currentViewport.width, this.currentViewport.height, Color.GREEN);
                    renderer.rect(false, viewport.x, viewport.y, viewport.width, viewport.height, Color.RED);
                }
                renderer.end();
                if (config.draw)
                    config.draw(this, playDelta);
            }
            // Draw the loading screen.
            if (config.showLoading) {
                this.loadingScreen.backgroundColor.setFromColor(bg);
                this.loadingScreen.draw(loading);
            }
            if (loading && config.loading)
                config.loading(this, delta);
        }
        catch (e) {
            this.showError(`Error: Unable to render skeleton.\n${e.message}`, e);
        }
    }
    stopRendering() {
        this.stopRequestAnimationFrame = true;
    }
    hidePopup(id) {
        return this.popup && this.popup.hide(id);
    }
    showSpeedDialog(speedButton) {
        let id = "speed";
        if (this.hidePopup(id))
            return;
        let popup = new Popup(id, speedButton, this, this.playerControls, /*html*/ `
<div class="spine-player-popup-title">Speed</div>
<hr>
<div class="spine-player-row" style="align-items:center;padding:8px">
<div class="spine-player-column">
	<div class="spine-player-speed-slider" style="margin-bottom:4px"></div>
	<div class="spine-player-row" style="justify-content:space-between"><div>0.1x</div><div>1x</div><div>2x</div></div>
</div>
</div>`);
        let slider = new Slider(2, 0.1, true);
        findWithClass(popup.dom, "spine-player-speed-slider").appendChild(slider.create());
        slider.setValue(this.speed / 2);
        slider.change = (percentage) => this.speed = percentage * 2;
        popup.show();
    }
    showAnimationsDialog(animationsButton) {
        let id = "animations";
        if (this.hidePopup(id))
            return;
        if (!this.skeleton || !this.skeleton.data.animations.length)
            return;
        let popup = new Popup(id, animationsButton, this, this.playerControls, 
        /*html*/ `<div class="spine-player-popup-title">Animations</div><hr><ul class="spine-player-list"></ul>`);
        let rows = findWithClass(popup.dom, "spine-player-list");
        this.skeleton.data.animations.forEach((animation) => {
            // Skip animations not whitelisted if a whitelist was given.
            if (this.config.animations && this.config.animations.indexOf(animation.name) < 0)
                return;
            let row = createElement(
            /*html*/ `<li class="spine-player-list-item selectable"><div class="selectable-circle"></div><div class="selectable-text"></div></li>`);
            if (animation.name == this.config.animation)
                row.classList.add("selected");
            findWithClass(row, "selectable-text").innerText = animation.name;
            rows.appendChild(row);
            row.onclick = () => {
                removeClass(rows.children, "selected");
                row.classList.add("selected");
                this.config.animation = animation.name;
                this.playTime = 0;
                this.setAnimation(animation.name);
                this.play();
            };
        });
        popup.show();
    }
    showSkinsDialog(skinButton) {
        let id = "skins";
        if (this.hidePopup(id))
            return;
        if (!this.skeleton || !this.skeleton.data.animations.length)
            return;
        let popup = new Popup(id, skinButton, this, this.playerControls, 
        /*html*/ `<div class="spine-player-popup-title">Skins</div><hr><ul class="spine-player-list"></ul>`);
        let rows = findWithClass(popup.dom, "spine-player-list");
        this.skeleton.data.skins.forEach((skin) => {
            // Skip skins not whitelisted if a whitelist was given.
            if (this.config.skins && this.config.skins.indexOf(skin.name) < 0)
                return;
            let row = createElement(/*html*/ `<li class="spine-player-list-item selectable"><div class="selectable-circle"></div><div class="selectable-text"></div></li>`);
            if (skin.name == this.config.skin)
                row.classList.add("selected");
            findWithClass(row, "selectable-text").innerText = skin.name;
            rows.appendChild(row);
            row.onclick = () => {
                removeClass(rows.children, "selected");
                row.classList.add("selected");
                this.config.skin = skin.name;
                this.skeleton.setSkinByName(this.config.skin);
                this.skeleton.setSlotsToSetupPose();
            };
        });
        popup.show();
    }
    showSettingsDialog(settingsButton) {
        let id = "settings";
        if (this.hidePopup(id))
            return;
        if (!this.skeleton || !this.skeleton.data.animations.length)
            return;
        let popup = new Popup(id, settingsButton, this, this.playerControls, /*html*/ `<div class="spine-player-popup-title">Debug</div><hr><ul class="spine-player-list"></li>`);
        let rows = findWithClass(popup.dom, "spine-player-list");
        let makeItem = (label, name) => {
            let row = createElement(/*html*/ `<li class="spine-player-list-item"></li>`);
            let s = new Switch(label);
            row.appendChild(s.create());
            let debug = this.config.debug;
            s.setEnabled(debug[name]);
            s.change = (value) => debug[name] = value;
            rows.appendChild(row);
        };
        makeItem("Bones", "bones");
        makeItem("Regions", "regions");
        makeItem("Meshes", "meshes");
        makeItem("Bounds", "bounds");
        makeItem("Paths", "paths");
        makeItem("Clipping", "clipping");
        makeItem("Points", "points");
        makeItem("Hulls", "hulls");
        popup.show();
    }
    showError(message, error = null) {
        if (this.error) {
            if (error)
                throw error; // Don't lose error if showError throws, is caught, and showError is called again.
        }
        else {
            this.error = true;
            this.dom.appendChild(createElement(
            /*html*/ `<div class="spine-player-error" style="background:#000;color:#fff;position:absolute;top:0;width:100%;height:100%;display:flex;justify-content:center;align-items:center;overflow:auto;z-index:999">`
                + message.replace("\n", "<br><br>") + `</div>`));
            if (this.config.error)
                this.config.error(this, message);
            throw (error ? error : new Error(message));
        }
    }
}
class Popup {
    constructor(id, button, player, parent, htmlContent) {
        this.id = id;
        this.button = button;
        this.player = player;
        this.dom = createElement(/*html*/ `<div class="spine-player-popup spine-player-hidden"></div>`);
        this.dom.innerHTML = htmlContent;
        parent.appendChild(this.dom);
        this.className = "spine-player-button-icon-" + id + "-selected";
    }
    dispose() {
    }
    hide(id) {
        this.dom.remove();
        this.button.classList.remove(this.className);
        if (this.id == id) {
            this.player.popup = null;
            return true;
        }
    }
    show() {
        this.player.popup = this;
        this.button.classList.add(this.className);
        this.dom.classList.remove("spine-player-hidden");
        // Make sure the popup isn't bigger than the player.
        let dismissed = false;
        let resize = () => {
            if (!dismissed)
                requestAnimationFrame(resize);
            let playerDom = this.player.dom;
            let bottomOffset = Math.abs(playerDom.getBoundingClientRect().bottom - playerDom.getBoundingClientRect().bottom);
            let rightOffset = Math.abs(playerDom.getBoundingClientRect().right - playerDom.getBoundingClientRect().right);
            this.dom.style.maxHeight = (playerDom.clientHeight - bottomOffset - rightOffset) + "px";
        };
        requestAnimationFrame(resize);
        // Dismiss when clicking somewhere outside the popup.
        let justClicked = true;
        let windowClickListener = (event) => {
            if (justClicked || this.player.popup != this) {
                justClicked = false;
                return;
            }
            if (!this.dom.contains(event.target)) {
                this.dom.remove();
                window.removeEventListener("click", windowClickListener);
                this.button.classList.remove(this.className);
                this.player.popup = null;
                dismissed = true;
            }
        };
        this.player.addEventListener(window, "click", windowClickListener);
    }
}
class Switch {
    constructor(text) {
        this.text = text;
        this.enabled = false;
    }
    create() {
        this.switch = createElement(/*html*/ `
<div class="spine-player-switch">
	<span class="spine-player-switch-text">${this.text}</span>
	<div class="spine-player-switch-knob-area">
		<div class="spine-player-switch-knob"></div>
	</div>
</div>`);
        this.switch.addEventListener("click", () => {
            this.setEnabled(!this.enabled);
            if (this.change)
                this.change(this.enabled);
        });
        return this.switch;
    }
    setEnabled(enabled) {
        if (enabled)
            this.switch.classList.add("active");
        else
            this.switch.classList.remove("active");
        this.enabled = enabled;
    }
    isEnabled() {
        return this.enabled;
    }
}
class Slider {
    constructor(snaps = 0, snapPercentage = 0.1, big = false) {
        this.snaps = snaps;
        this.snapPercentage = snapPercentage;
        this.big = big;
    }
    create() {
        this.slider = createElement(/*html*/ `
<div class="spine-player-slider ${this.big ? "big" : ""}">
	<div class="spine-player-slider-value"></div>
	<!--<div class="spine-player-slider-knob"></div>-->
</div>`);
        this.value = findWithClass(this.slider, "spine-player-slider-value");
        // this.knob = findWithClass(this.slider, "spine-player-slider-knob");
        this.setValue(0);
        let dragging = false;
        new Input(this.slider).addListener({
            down: (x, y) => {
                dragging = true;
                this.value.classList.add("hovering");
            },
            up: (x, y) => {
                dragging = false;
                if (this.change)
                    this.change(this.setValue(x / this.slider.clientWidth));
                this.value.classList.remove("hovering");
            },
            moved: (x, y) => {
                if (dragging && this.change)
                    this.change(this.setValue(x / this.slider.clientWidth));
            },
            dragged: (x, y) => {
                if (this.change)
                    this.change(this.setValue(x / this.slider.clientWidth));
            }
        });
        return this.slider;
    }
    setValue(percentage) {
        percentage = Math.max(0, Math.min(1, percentage));
        if (this.snaps) {
            let snap = 1 / this.snaps;
            let modulo = percentage % snap;
            // floor
            if (modulo < snap * this.snapPercentage)
                percentage = percentage - modulo;
            else if (modulo > snap - snap * this.snapPercentage)
                percentage = percentage - modulo + snap;
            percentage = Math.max(0, Math.min(1, percentage));
        }
        this.value.style.width = "" + (percentage * 100) + "%";
        // this.knob.style.left = "" + (-8 + percentage * this.slider.clientWidth) + "px";
        return percentage;
    }
}
function findWithClass(element, className) {
    return element.getElementsByClassName(className)[0];
}
function createElement(html) {
    let div = document.createElement("div");
    div.innerHTML = html;
    return div.children[0];
}
function removeClass(elements, clazz) {
    for (let i = 0; i < elements.length; i++)
        elements[i].classList.remove(clazz);
}
function toString(object) {
    return JSON.stringify(object)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&#34;")
        .replace(/'/g, "&#39;");
}
const BONE_INNER_OVER = new Color(0.478, 0, 0, 0.25);
const BONE_OUTER_OVER = new Color(1, 1, 1, 1);
const BONE_INNER = new Color(0.478, 0, 0, 0.5);
const BONE_OUTER = new Color(1, 0, 0, 0.8);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGxheWVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1BsYXllci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OytFQTJCK0U7QUFFL0UsT0FBTyxFQUFhLGNBQWMsRUFBRSxrQkFBa0IsRUFBRSxxQkFBcUIsRUFBUSxLQUFLLEVBQTBCLFNBQVMsRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxjQUFjLEVBQWdCLFlBQVksRUFBMkIsYUFBYSxFQUFFLFVBQVUsRUFBYyxPQUFPLEVBQUUsTUFBTSw4QkFBOEIsQ0FBQTtBQUMxVCxPQUFPLEVBQUUsWUFBWSxFQUFhLEtBQUssRUFBRSxhQUFhLEVBQUUsNEJBQTRCLEVBQUUsVUFBVSxFQUFFLGFBQWEsRUFBRSxPQUFPLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQTtBQXlKL0osTUFBTSxPQUFPLFdBQVc7SUF5Q3ZCLFlBQWEsTUFBNEIsRUFBVSxNQUF5QjtRQUF6QixXQUFNLEdBQU4sTUFBTSxDQUFtQjtRQWpDckUsT0FBRSxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7UUFDakIsaUJBQVksR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFDO1FBUTFCLGFBQVEsR0FBRyxDQUFDLENBQUM7UUFFYixhQUFRLEdBQUcsQ0FBQyxDQUFDO1FBVWQsV0FBTSxHQUFHLElBQUksQ0FBQztRQUNkLFVBQUssR0FBRyxDQUFDLENBQUM7UUFDVixTQUFJLEdBQUcsSUFBSSxVQUFVLEVBQUUsQ0FBQztRQUN2Qiw4QkFBeUIsR0FBRyxLQUFLLENBQUM7UUFDbEMsYUFBUSxHQUFHLEtBQUssQ0FBQztRQUVqQixhQUFRLEdBQWEsRUFBYyxDQUFDO1FBR3BDLDRCQUF1QixHQUFHLENBQUMsQ0FBQztRQUM1QixtQkFBYyxHQUFrRCxFQUFFLENBQUM7UUFHMUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLE1BQU0sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFD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