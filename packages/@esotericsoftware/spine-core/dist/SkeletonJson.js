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
import { Animation, AttachmentTimeline, RGBATimeline, RGBTimeline, AlphaTimeline, RGBA2Timeline, RGB2Timeline, RotateTimeline, TranslateTimeline, TranslateXTimeline, TranslateYTimeline, ScaleTimeline, ScaleXTimeline, ScaleYTimeline, ShearTimeline, ShearXTimeline, ShearYTimeline, IkConstraintTimeline, TransformConstraintTimeline, PathConstraintPositionTimeline, PathConstraintSpacingTimeline, PathConstraintMixTimeline, DeformTimeline, DrawOrderTimeline, EventTimeline } from "./Animation";
import { BoneData, TransformMode } from "./BoneData";
import { EventData } from "./EventData";
import { Event } from "./Event";
import { IkConstraintData } from "./IkConstraintData";
import { PathConstraintData, PositionMode, SpacingMode, RotateMode } from "./PathConstraintData";
import { SkeletonData } from "./SkeletonData";
import { Skin } from "./Skin";
import { SlotData, BlendMode } from "./SlotData";
import { TransformConstraintData } from "./TransformConstraintData";
import { Utils, Color } from "./Utils";
/** Loads skeleton data in the Spine JSON format.
 *
 * See [Spine JSON format](http://esotericsoftware.com/spine-json-format) and
 * [JSON and binary data](http://esotericsoftware.com/spine-loading-skeleton-data#JSON-and-binary-data) in the Spine
 * Runtimes Guide. */
export class SkeletonJson {
    constructor(attachmentLoader) {
        this.attachmentLoader = null;
        /** Scales bone positions, image sizes, and translations as they are loaded. This allows different size images to be used at
         * runtime than were used in Spine.
         *
         * See [Scaling](http://esotericsoftware.com/spine-loading-skeleton-data#Scaling) in the Spine Runtimes Guide. */
        this.scale = 1;
        this.linkedMeshes = new Array();
        this.attachmentLoader = attachmentLoader;
    }
    readSkeletonData(json) {
        let scale = this.scale;
        let skeletonData = new SkeletonData();
        let root = typeof (json) === "string" ? JSON.parse(json) : json;
        // Skeleton
        let skeletonMap = root.skeleton;
        if (skeletonMap) {
            skeletonData.hash = skeletonMap.hash;
            skeletonData.version = skeletonMap.spine;
            skeletonData.x = skeletonMap.x;
            skeletonData.y = skeletonMap.y;
            skeletonData.width = skeletonMap.width;
            skeletonData.height = skeletonMap.height;
            skeletonData.fps = skeletonMap.fps;
            skeletonData.imagesPath = skeletonMap.images;
        }
        // Bones
        if (root.bones) {
            for (let i = 0; i < root.bones.length; i++) {
                let boneMap = root.bones[i];
                let parent = null;
                let parentName = getValue(boneMap, "parent", null);
                if (parentName)
                    parent = skeletonData.findBone(parentName);
                let data = new BoneData(skeletonData.bones.length, boneMap.name, parent);
                data.length = getValue(boneMap, "length", 0) * scale;
                data.x = getValue(boneMap, "x", 0) * scale;
                data.y = getValue(boneMap, "y", 0) * scale;
                data.rotation = getValue(boneMap, "rotation", 0);
                data.scaleX = getValue(boneMap, "scaleX", 1);
                data.scaleY = getValue(boneMap, "scaleY", 1);
                data.shearX = getValue(boneMap, "shearX", 0);
                data.shearY = getValue(boneMap, "shearY", 0);
                data.transformMode = Utils.enumValue(TransformMode, getValue(boneMap, "transform", "Normal"));
                data.skinRequired = getValue(boneMap, "skin", false);
                let color = getValue(boneMap, "color", null);
                if (color)
                    data.color.setFromString(color);
                skeletonData.bones.push(data);
            }
        }
        // Slots.
        if (root.slots) {
            for (let i = 0; i < root.slots.length; i++) {
                let slotMap = root.slots[i];
                let boneData = skeletonData.findBone(slotMap.bone);
                let data = new SlotData(skeletonData.slots.length, slotMap.name, boneData);
                let color = getValue(slotMap, "color", null);
                if (color)
                    data.color.setFromString(color);
                let dark = getValue(slotMap, "dark", null);
                if (dark)
                    data.darkColor = Color.fromString(dark);
                data.attachmentName = getValue(slotMap, "attachment", null);
                data.blendMode = Utils.enumValue(BlendMode, getValue(slotMap, "blend", "normal"));
                skeletonData.slots.push(data);
            }
        }
        // IK constraints
        if (root.ik) {
            for (let i = 0; i < root.ik.length; i++) {
                let constraintMap = root.ik[i];
                let data = new IkConstraintData(constraintMap.name);
                data.order = getValue(constraintMap, "order", 0);
                data.skinRequired = getValue(constraintMap, "skin", false);
                for (let ii = 0; ii < constraintMap.bones.length; ii++)
                    data.bones.push(skeletonData.findBone(constraintMap.bones[ii]));
                data.target = skeletonData.findBone(constraintMap.target);
                data.mix = getValue(constraintMap, "mix", 1);
                data.softness = getValue(constraintMap, "softness", 0) * scale;
                data.bendDirection = getValue(constraintMap, "bendPositive", true) ? 1 : -1;
                data.compress = getValue(constraintMap, "compress", false);
                data.stretch = getValue(constraintMap, "stretch", false);
                data.uniform = getValue(constraintMap, "uniform", false);
                skeletonData.ikConstraints.push(data);
            }
        }
        // Transform constraints.
        if (root.transform) {
            for (let i = 0; i < root.transform.length; i++) {
                let constraintMap = root.transform[i];
                let data = new TransformConstraintData(constraintMap.name);
                data.order = getValue(constraintMap, "order", 0);
                data.skinRequired = getValue(constraintMap, "skin", false);
                for (let ii = 0; ii < constraintMap.bones.length; ii++)
                    data.bones.push(skeletonData.findBone(constraintMap.bones[ii]));
                let targetName = constraintMap.target;
                data.target = skeletonData.findBone(targetName);
                data.local = getValue(constraintMap, "local", false);
                data.relative = getValue(constraintMap, "relative", false);
                data.offsetRotation = getValue(constraintMap, "rotation", 0);
                data.offsetX = getValue(constraintMap, "x", 0) * scale;
                data.offsetY = getValue(constraintMap, "y", 0) * scale;
                data.offsetScaleX = getValue(constraintMap, "scaleX", 0);
                data.offsetScaleY = getValue(constraintMap, "scaleY", 0);
                data.offsetShearY = getValue(constraintMap, "shearY", 0);
                data.mixRotate = getValue(constraintMap, "mixRotate", 1);
                data.mixX = getValue(constraintMap, "mixX", 1);
                data.mixY = getValue(constraintMap, "mixY", data.mixX);
                data.mixScaleX = getValue(constraintMap, "mixScaleX", 1);
                data.mixScaleY = getValue(constraintMap, "mixScaleY", data.mixScaleX);
                data.mixShearY = getValue(constraintMap, "mixShearY", 1);
                skeletonData.transformConstraints.push(data);
            }
        }
        // Path constraints.
        if (root.path) {
            for (let i = 0; i < root.path.length; i++) {
                let constraintMap = root.path[i];
                let data = new PathConstraintData(constraintMap.name);
                data.order = getValue(constraintMap, "order", 0);
                data.skinRequired = getValue(constraintMap, "skin", false);
                for (let ii = 0; ii < constraintMap.bones.length; ii++)
                    data.bones.push(skeletonData.findBone(constraintMap.bones[ii]));
                let targetName = constraintMap.target;
                data.target = skeletonData.findSlot(targetName);
                data.positionMode = Utils.enumValue(PositionMode, getValue(constraintMap, "positionMode", "Percent"));
                data.spacingMode = Utils.enumValue(SpacingMode, getValue(constraintMap, "spacingMode", "Length"));
                data.rotateMode = Utils.enumValue(RotateMode, getValue(constraintMap, "rotateMode", "Tangent"));
                data.offsetRotation = getValue(constraintMap, "rotation", 0);
                data.position = getValue(constraintMap, "position", 0);
                if (data.positionMode == PositionMode.Fixed)
                    data.position *= scale;
                data.spacing = getValue(constraintMap, "spacing", 0);
                if (data.spacingMode == SpacingMode.Length || data.spacingMode == SpacingMode.Fixed)
                    data.spacing *= scale;
                data.mixRotate = getValue(constraintMap, "mixRotate", 1);
                data.mixX = getValue(constraintMap, "mixX", 1);
                data.mixY = getValue(constraintMap, "mixY", data.mixX);
                skeletonData.pathConstraints.push(data);
            }
        }
        // Skins.
        if (root.skins) {
            for (let i = 0; i < root.skins.length; i++) {
                let skinMap = root.skins[i];
                let skin = new Skin(skinMap.name);
                if (skinMap.bones) {
                    for (let ii = 0; ii < skinMap.bones.length; ii++)
                        skin.bones.push(skeletonData.findBone(skinMap.bones[ii]));
                }
                if (skinMap.ik) {
                    for (let ii = 0; ii < skinMap.ik.length; ii++)
                        skin.constraints.push(skeletonData.findIkConstraint(skinMap.ik[ii]));
                }
                if (skinMap.transform) {
                    for (let ii = 0; ii < skinMap.transform.length; ii++)
                        skin.constraints.push(skeletonData.findTransformConstraint(skinMap.transform[ii]));
                }
                if (skinMap.path) {
                    for (let ii = 0; ii < skinMap.path.length; ii++)
                        skin.constraints.push(skeletonData.findPathConstraint(skinMap.path[ii]));
                }
                for (let slotName in skinMap.attachments) {
                    let slot = skeletonData.findSlot(slotName);
                    let slotMap = skinMap.attachments[slotName];
                    for (let entryName in slotMap) {
                        let attachment = this.readAttachment(slotMap[entryName], skin, slot.index, entryName, skeletonData);
                        if (attachment)
                            skin.setAttachment(slot.index, entryName, attachment);
                    }
                }
                skeletonData.skins.push(skin);
                if (skin.name == "default")
                    skeletonData.defaultSkin = skin;
            }
        }
        // Linked meshes.
        for (let i = 0, n = this.linkedMeshes.length; i < n; i++) {
            let linkedMesh = this.linkedMeshes[i];
            let skin = !linkedMesh.skin ? skeletonData.defaultSkin : skeletonData.findSkin(linkedMesh.skin);
            let parent = skin.getAttachment(linkedMesh.slotIndex, linkedMesh.parent);
            linkedMesh.mesh.deformAttachment = linkedMesh.inheritDeform ? parent : linkedMesh.mesh;
            linkedMesh.mesh.setParentMesh(parent);
            linkedMesh.mesh.updateUVs();
        }
        this.linkedMeshes.length = 0;
        // Events.
        if (root.events) {
            for (let eventName in root.events) {
                let eventMap = root.events[eventName];
                let data = new EventData(eventName);
                data.intValue = getValue(eventMap, "int", 0);
                data.floatValue = getValue(eventMap, "float", 0);
                data.stringValue = getValue(eventMap, "string", "");
                data.audioPath = getValue(eventMap, "audio", null);
                if (data.audioPath) {
                    data.volume = getValue(eventMap, "volume", 1);
                    data.balance = getValue(eventMap, "balance", 0);
                }
                skeletonData.events.push(data);
            }
        }
        // Animations.
        if (root.animations) {
            for (let animationName in root.animations) {
                let animationMap = root.animations[animationName];
                this.readAnimation(animationMap, animationName, skeletonData);
            }
        }
        return skeletonData;
    }
    readAttachment(map, skin, slotIndex, name, skeletonData) {
        let scale = this.scale;
        name = getValue(map, "name", name);
        switch (getValue(map, "type", "region")) {
            case "region": {
                let path = getValue(map, "path", name);
                let region = this.attachmentLoader.newRegionAttachment(skin, name, path);
                if (!region)
                    return null;
                region.path = path;
                region.x = getValue(map, "x", 0) * scale;
                region.y = getValue(map, "y", 0) * scale;
                region.scaleX = getValue(map, "scaleX", 1);
                region.scaleY = getValue(map, "scaleY", 1);
                region.rotation = getValue(map, "rotation", 0);
                region.width = map.width * scale;
                region.height = map.height * scale;
                let color = getValue(map, "color", null);
                if (color)
                    region.color.setFromString(color);
                region.updateOffset();
                return region;
            }
            case "boundingbox": {
                let box = this.attachmentLoader.newBoundingBoxAttachment(skin, name);
                if (!box)
                    return null;
                this.readVertices(map, box, map.vertexCount << 1);
                let color = getValue(map, "color", null);
                if (color)
                    box.color.setFromString(color);
                return box;
            }
            case "mesh":
            case "linkedmesh": {
                let path = getValue(map, "path", name);
                let mesh = this.attachmentLoader.newMeshAttachment(skin, name, path);
                if (!mesh)
                    return null;
                mesh.path = path;
                let color = getValue(map, "color", null);
                if (color)
                    mesh.color.setFromString(color);
                mesh.width = getValue(map, "width", 0) * scale;
                mesh.height = getValue(map, "height", 0) * scale;
                let parent = getValue(map, "parent", null);
                if (parent) {
                    this.linkedMeshes.push(new LinkedMesh(mesh, getValue(map, "skin", null), slotIndex, parent, getValue(map, "deform", true)));
                    return mesh;
                }
                let uvs = map.uvs;
                this.readVertices(map, mesh, uvs.length);
                mesh.triangles = map.triangles;
                mesh.regionUVs = uvs;
                mesh.updateUVs();
                mesh.edges = getValue(map, "edges", null);
                mesh.hullLength = getValue(map, "hull", 0) * 2;
                return mesh;
            }
            case "path": {
                let path = this.attachmentLoader.newPathAttachment(skin, name);
                if (!path)
                    return null;
                path.closed = getValue(map, "closed", false);
                path.constantSpeed = getValue(map, "constantSpeed", true);
                let vertexCount = map.vertexCount;
                this.readVertices(map, path, vertexCount << 1);
                let lengths = Utils.newArray(vertexCount / 3, 0);
                for (let i = 0; i < map.lengths.length; i++)
                    lengths[i] = map.lengths[i] * scale;
                path.lengths = lengths;
                let color = getValue(map, "color", null);
                if (color)
                    path.color.setFromString(color);
                return path;
            }
            case "point": {
                let point = this.attachmentLoader.newPointAttachment(skin, name);
                if (!point)
                    return null;
                point.x = getValue(map, "x", 0) * scale;
                point.y = getValue(map, "y", 0) * scale;
                point.rotation = getValue(map, "rotation", 0);
                let color = getValue(map, "color", null);
                if (color)
                    point.color.setFromString(color);
                return point;
            }
            case "clipping": {
                let clip = this.attachmentLoader.newClippingAttachment(skin, name);
                if (!clip)
                    return null;
                let end = getValue(map, "end", null);
                if (end)
                    clip.endSlot = skeletonData.findSlot(end);
                let vertexCount = map.vertexCount;
                this.readVertices(map, clip, vertexCount << 1);
                let color = getValue(map, "color", null);
                if (color)
                    clip.color.setFromString(color);
                return clip;
            }
        }
        return null;
    }
    readVertices(map, attachment, verticesLength) {
        let scale = this.scale;
        attachment.worldVerticesLength = verticesLength;
        let vertices = map.vertices;
        if (verticesLength == vertices.length) {
            let scaledVertices = Utils.toFloatArray(vertices);
            if (scale != 1) {
                for (let i = 0, n = vertices.length; i < n; i++)
                    scaledVertices[i] *= scale;
            }
            attachment.vertices = scaledVertices;
            return;
        }
        let weights = new Array();
        let bones = new Array();
        for (let i = 0, n = vertices.length; i < n;) {
            let boneCount = vertices[i++];
            bones.push(boneCount);
            for (let nn = i + boneCount * 4; i < nn; i += 4) {
                bones.push(vertices[i]);
                weights.push(vertices[i + 1] * scale);
                weights.push(vertices[i + 2] * scale);
                weights.push(vertices[i + 3]);
            }
        }
        attachment.bones = bones;
        attachment.vertices = Utils.toFloatArray(weights);
    }
    readAnimation(map, name, skeletonData) {
        let scale = this.scale;
        let timelines = new Array();
        // Slot timelines.
        if (map.slots) {
            for (let slotName in map.slots) {
                let slotMap = map.slots[slotName];
                let slotIndex = skeletonData.findSlot(slotName).index;
                for (let timelineName in slotMap) {
                    let timelineMap = slotMap[timelineName];
                    if (!timelineMap)
                        continue;
                    let frames = timelineMap.length;
                    if (timelineName == "attachment") {
                        let timeline = new AttachmentTimeline(frames, slotIndex);
                        for (let frame = 0; frame < frames; frame++) {
                            let keyMap = timelineMap[frame];
                            timeline.setFrame(frame, getValue(keyMap, "time", 0), keyMap.name);
                        }
                        timelines.push(timeline);
                    }
                    else if (timelineName == "rgba") {
                        let timeline = new RGBATimeline(frames, frames << 2, slotIndex);
                        let keyMap = timelineMap[0];
                        let time = getValue(keyMap, "time", 0);
                        let color = Color.fromString(keyMap.color);
                        for (let frame = 0, bezier = 0;; frame++) {
                            timeline.setFrame(frame, time, color.r, color.g, color.b, color.a);
                            let nextMap = timelineMap[frame + 1];
                            if (!nextMap) {
                                timeline.shrink(bezier);
                                break;
                            }
                            let time2 = getValue(nextMap, "time", 0);
                            let newColor = Color.fromString(nextMap.color);
                            let curve = keyMap.curve;
                            if (curve) {
                                bezier = readCurve(curve, timeline, bezier, frame, 0, time, time2, color.r, newColor.r, 1);
                                bezier = readCurve(curve, timeline, bezier, frame, 1, time, time2, color.g, newColor.g, 1);
                                bezier = readCurve(curve, timeline, bezier, frame, 2, time, time2, color.b, newColor.b, 1);
                                bezier = readCurve(curve, timeline, bezier, frame, 3, time, time2, color.a, newColor.a, 1);
                            }
                            time = time2;
                            color = newColor;
                            keyMap = nextMap;
                        }
                        timelines.push(timeline);
                    }
                    else if (timelineName == "rgb") {
                        let timeline = new RGBTimeline(frames, frames * 3, slotIndex);
                        let keyMap = timelineMap[0];
                        let time = getValue(keyMap, "time", 0);
                        let color = Color.fromString(keyMap.color);
                        for (let frame = 0, bezier = 0;; frame++) {
                            timeline.setFrame(frame, time, color.r, color.g, color.b);
                            let nextMap = timelineMap[frame + 1];
                            if (!nextMap) {
                                timeline.shrink(bezier);
                                break;
                            }
                            let time2 = getValue(nextMap, "time", 0);
                            let newColor = Color.fromString(nextMap.color);
                            let curve = keyMap.curve;
                            if (curve) {
                                bezier = readCurve(curve, timeline, bezier, frame, 0, time, time2, color.r, newColor.r, 1);
                                bezier = readCurve(curve, timeline, bezier, frame, 1, time, time2, color.g, newColor.g, 1);
                                bezier = readCurve(curve, timeline, bezier, frame, 2, time, time2, color.b, newColor.b, 1);
                            }
                            time = time2;
                            color = newColor;
                            keyMap = nextMap;
                        }
                        timelines.push(timeline);
                    }
                    else if (timelineName == "alpha") {
                        timelines.push(readTimeline1(timelineMap, new AlphaTimeline(frames, frames, slotIndex), 0, 1));
                    }
                    else if (timelineName == "rgba2") {
                        let timeline = new RGBA2Timeline(frames, frames * 7, slotIndex);
                        let keyMap = timelineMap[0];
                        let time = getValue(keyMap, "time", 0);
                        let color = Color.fromString(keyMap.light);
                        let color2 = Color.fromString(keyMap.dark);
                        for (let frame = 0, bezier = 0;; frame++) {
                            timeline.setFrame(frame, time, color.r, color.g, color.b, color.a, color2.r, color2.g, color2.b);
                            let nextMap = timelineMap[frame + 1];
                            if (!nextMap) {
                                timeline.shrink(bezier);
                                break;
                            }
                            let time2 = getValue(nextMap, "time", 0);
                            let newColor = Color.fromString(nextMap.light);
                            let newColor2 = Color.fromString(nextMap.dark);
                            let curve = keyMap.curve;
                            if (curve) {
                                bezier = readCurve(curve, timeline, bezier, frame, 0, time, time2, color.r, newColor.r, 1);
                                bezier = readCurve(curve, timeline, bezier, frame, 1, time, time2, color.g, newColor.g, 1);
                                bezier = readCurve(curve, timeline, bezier, frame, 2, time, time2, color.b, newColor.b, 1);
                                bezier = readCurve(curve, timeline, bezier, frame, 3, time, time2, color.a, newColor.a, 1);
                                bezier = readCurve(curve, timeline, bezier, frame, 4, time, time2, color2.r, newColor2.r, 1);
                                bezier = readCurve(curve, timeline, bezier, frame, 5, time, time2, color2.g, newColor2.g, 1);
                                bezier = readCurve(curve, timeline, bezier, frame, 6, time, time2, color2.b, newColor2.b, 1);
                            }
                            time = time2;
                            color = newColor;
                            color2 = newColor2;
                            keyMap = nextMap;
                        }
                        timelines.push(timeline);
                    }
                    else if (timelineName == "rgb2") {
                        let timeline = new RGB2Timeline(frames, frames * 6, slotIndex);
                        let keyMap = timelineMap[0];
                        let time = getValue(keyMap, "time", 0);
                        let color = Color.fromString(keyMap.light);
                        let color2 = Color.fromString(keyMap.dark);
                        for (let frame = 0, bezier = 0;; frame++) {
                            timeline.setFrame(frame, time, color.r, color.g, color.b, color2.r, color2.g, color2.b);
                            let nextMap = timelineMap[frame + 1];
                            if (!nextMap) {
                                timeline.shrink(bezier);
                                break;
                            }
                            let time2 = getValue(nextMap, "time", 0);
                            let newColor = Color.fromString(nextMap.light);
                            let newColor2 = Color.fromString(nextMap.dark);
                            let curve = keyMap.curve;
                            if (curve) {
                                bezier = readCurve(curve, timeline, bezier, frame, 0, time, time2, color.r, newColor.r, 1);
                                bezier = readCurve(curve, timeline, bezier, frame, 1, time, time2, color.g, newColor.g, 1);
                                bezier = readCurve(curve, timeline, bezier, frame, 2, time, time2, color.b, newColor.b, 1);
                                bezier = readCurve(curve, timeline, bezier, frame, 3, time, time2, color2.r, newColor2.r, 1);
                                bezier = readCurve(curve, timeline, bezier, frame, 4, time, time2, color2.g, newColor2.g, 1);
                                bezier = readCurve(curve, timeline, bezier, frame, 5, time, time2, color2.b, newColor2.b, 1);
                            }
                            time = time2;
                            color = newColor;
                            color2 = newColor2;
                            keyMap = nextMap;
                        }
                        timelines.push(timeline);
                    }
                }
            }
        }
        // Bone timelines.
        if (map.bones) {
            for (let boneName in map.bones) {
                let boneMap = map.bones[boneName];
                let boneIndex = skeletonData.findBone(boneName).index;
                for (let timelineName in boneMap) {
                    let timelineMap = boneMap[timelineName];
                    let frames = timelineMap.length;
                    if (frames == 0)
                        continue;
                    if (timelineName === "rotate") {
                        timelines.push(readTimeline1(timelineMap, new RotateTimeline(frames, frames, boneIndex), 0, 1));
                    }
                    else if (timelineName === "translate") {
                        let timeline = new TranslateTimeline(frames, frames << 1, boneIndex);
                        timelines.push(readTimeline2(timelineMap, timeline, "x", "y", 0, scale));
                    }
                    else if (timelineName === "translatex") {
                        let timeline = new TranslateXTimeline(frames, frames, boneIndex);
                        timelines.push(readTimeline1(timelineMap, timeline, 0, scale));
                    }
                    else if (timelineName === "translatey") {
                        let timeline = new TranslateYTimeline(frames, frames, boneIndex);
                        timelines.push(readTimeline1(timelineMap, timeline, 0, scale));
                    }
                    else if (timelineName === "scale") {
                        let timeline = new ScaleTimeline(frames, frames << 1, boneIndex);
                        timelines.push(readTimeline2(timelineMap, timeline, "x", "y", 1, 1));
                    }
                    else if (timelineName === "scalex") {
                        let timeline = new ScaleXTimeline(frames, frames, boneIndex);
                        timelines.push(readTimeline1(timelineMap, timeline, 1, 1));
                    }
                    else if (timelineName === "scaley") {
                        let timeline = new ScaleYTimeline(frames, frames, boneIndex);
                        timelines.push(readTimeline1(timelineMap, timeline, 1, 1));
                    }
                    else if (timelineName === "shear") {
                        let timeline = new ShearTimeline(frames, frames << 1, boneIndex);
                        timelines.push(readTimeline2(timelineMap, timeline, "x", "y", 0, 1));
                    }
                    else if (timelineName === "shearx") {
                        let timeline = new ShearXTimeline(frames, frames, boneIndex);
                        timelines.push(readTimeline1(timelineMap, timeline, 0, 1));
                    }
                    else if (timelineName === "sheary") {
                        let timeline = new ShearYTimeline(frames, frames, boneIndex);
                        timelines.push(readTimeline1(timelineMap, timeline, 0, 1));
                    }
                }
            }
        }
        // IK constraint timelines.
        if (map.ik) {
            for (let constraintName in map.ik) {
                let constraintMap = map.ik[constraintName];
                let keyMap = constraintMap[0];
                if (!keyMap)
                    continue;
                let constraint = skeletonData.findIkConstraint(constraintName);
                let constraintIndex = skeletonData.ikConstraints.indexOf(constraint);
                let timeline = new IkConstraintTimeline(constraintMap.length, constraintMap.length << 1, constraintIndex);
                let time = getValue(keyMap, "time", 0);
                let mix = getValue(keyMap, "mix", 1);
                let softness = getValue(keyMap, "softness", 0) * scale;
                for (let frame = 0, bezier = 0;; frame++) {
                    timeline.setFrame(frame, time, mix, softness, getValue(keyMap, "bendPositive", true) ? 1 : -1, getValue(keyMap, "compress", false), getValue(keyMap, "stretch", false));
                    let nextMap = constraintMap[frame + 1];
                    if (!nextMap) {
                        timeline.shrink(bezier);
                        break;
                    }
                    let time2 = getValue(nextMap, "time", 0);
                    let mix2 = getValue(nextMap, "mix", 1);
                    let softness2 = getValue(nextMap, "softness", 0) * scale;
                    let curve = keyMap.curve;
                    if (curve) {
                        bezier = readCurve(curve, timeline, bezier, frame, 0, time, time2, mix, mix2, 1);
                        bezier = readCurve(curve, timeline, bezier, frame, 1, time, time2, softness, softness2, scale);
                    }
                    time = time2;
                    mix = mix2;
                    softness = softness2;
                    keyMap = nextMap;
                }
                timelines.push(timeline);
            }
        }
        // Transform constraint timelines.
        if (map.transform) {
            for (let constraintName in map.transform) {
                let timelineMap = map.transform[constraintName];
                let keyMap = timelineMap[0];
                if (!keyMap)
                    continue;
                let constraint = skeletonData.findTransformConstraint(constraintName);
                let constraintIndex = skeletonData.transformConstraints.indexOf(constraint);
                let timeline = new TransformConstraintTimeline(timelineMap.length, timelineMap.length * 6, constraintIndex);
                let time = getValue(keyMap, "time", 0);
                let mixRotate = getValue(keyMap, "mixRotate", 1);
                let mixX = getValue(keyMap, "mixX", 1);
                let mixY = getValue(keyMap, "mixY", mixX);
                let mixScaleX = getValue(keyMap, "mixScaleX", 1);
                let mixScaleY = getValue(keyMap, "mixScaleY", mixScaleX);
                let mixShearY = getValue(keyMap, "mixShearY", 1);
                for (let frame = 0, bezier = 0;; frame++) {
                    timeline.setFrame(frame, time, mixRotate, mixX, mixY, mixScaleX, mixScaleY, mixShearY);
                    let nextMap = timelineMap[frame + 1];
                    if (!nextMap) {
                        timeline.shrink(bezier);
                        break;
                    }
                    let time2 = getValue(nextMap, "time", 0);
                    let mixRotate2 = getValue(nextMap, "mixRotate", 1);
                    let mixX2 = getValue(nextMap, "mixX", 1);
                    let mixY2 = getValue(nextMap, "mixY", mixX2);
                    let mixScaleX2 = getValue(nextMap, "mixScaleX", 1);
                    let mixScaleY2 = getValue(nextMap, "mixScaleY", mixScaleX2);
                    let mixShearY2 = getValue(nextMap, "mixShearY", 1);
                    let curve = keyMap.curve;
                    if (curve) {
                        bezier = readCurve(curve, timeline, bezier, frame, 0, time, time2, mixRotate, mixRotate2, 1);
                        bezier = readCurve(curve, timeline, bezier, frame, 1, time, time2, mixX, mixX2, 1);
                        bezier = readCurve(curve, timeline, bezier, frame, 2, time, time2, mixY, mixY2, 1);
                        bezier = readCurve(curve, timeline, bezier, frame, 3, time, time2, mixScaleX, mixScaleX2, 1);
                        bezier = readCurve(curve, timeline, bezier, frame, 4, time, time2, mixScaleY, mixScaleY2, 1);
                        bezier = readCurve(curve, timeline, bezier, frame, 5, time, time2, mixShearY, mixShearY2, 1);
                    }
                    time = time2;
                    mixRotate = mixRotate2;
                    mixX = mixX2;
                    mixY = mixY2;
                    mixScaleX = mixScaleX2;
                    mixScaleY = mixScaleY2;
                    mixScaleX = mixScaleX2;
                    keyMap = nextMap;
                }
                timelines.push(timeline);
            }
        }
        // Path constraint timelines.
        if (map.path) {
            for (let constraintName in map.path) {
                let constraintMap = map.path[constraintName];
                let constraint = skeletonData.findPathConstraint(constraintName);
                let constraintIndex = skeletonData.pathConstraints.indexOf(constraint);
                for (let timelineName in constraintMap) {
                    let timelineMap = constraintMap[timelineName];
                    let keyMap = timelineMap[0];
                    if (!keyMap)
                        continue;
                    let frames = timelineMap.length;
                    if (timelineName === "position") {
                        let timeline = new PathConstraintPositionTimeline(frames, frames, constraintIndex);
                        timelines.push(readTimeline1(timelineMap, timeline, 0, constraint.positionMode == PositionMode.Fixed ? scale : 1));
                    }
                    else if (timelineName === "spacing") {
                        let timeline = new PathConstraintSpacingTimeline(frames, frames, constraintIndex);
                        timelines.push(readTimeline1(timelineMap, timeline, 0, constraint.spacingMode == SpacingMode.Length || constraint.spacingMode == SpacingMode.Fixed ? scale : 1));
                    }
                    else if (timelineName === "mix") {
                        let timeline = new PathConstraintMixTimeline(frames, frames * 3, constraintIndex);
                        let time = getValue(keyMap, "time", 0);
                        let mixRotate = getValue(keyMap, "mixRotate", 1);
                        let mixX = getValue(keyMap, "mixX", 1);
                        let mixY = getValue(keyMap, "mixY", mixX);
                        for (let frame = 0, bezier = 0;; frame++) {
                            timeline.setFrame(frame, time, mixRotate, mixX, mixY);
                            let nextMap = timelineMap[frame + 1];
                            if (!nextMap) {
                                timeline.shrink(bezier);
                                break;
                            }
                            let time2 = getValue(nextMap, "time", 0);
                            let mixRotate2 = getValue(nextMap, "mixRotate", 1);
                            let mixX2 = getValue(nextMap, "mixX", 1);
                            let mixY2 = getValue(nextMap, "mixY", mixX2);
                            let curve = keyMap.curve;
                            if (curve) {
                                bezier = readCurve(curve, timeline, bezier, frame, 0, time, time2, mixRotate, mixRotate2, 1);
                                bezier = readCurve(curve, timeline, bezier, frame, 1, time, time2, mixX, mixX2, 1);
                                bezier = readCurve(curve, timeline, bezier, frame, 2, time, time2, mixY, mixY2, 1);
                            }
                            time = time2;
                            mixRotate = mixRotate2;
                            mixX = mixX2;
                            mixY = mixY2;
                            keyMap = nextMap;
                        }
                        timelines.push(timeline);
                    }
                }
            }
        }
        // Deform timelines.
        if (map.deform) {
            for (let deformName in map.deform) {
                let deformMap = map.deform[deformName];
                let skin = skeletonData.findSkin(deformName);
                for (let slotName in deformMap) {
                    let slotMap = deformMap[slotName];
                    let slotIndex = skeletonData.findSlot(slotName).index;
                    for (let timelineName in slotMap) {
                        let timelineMap = slotMap[timelineName];
                        let keyMap = timelineMap[0];
                        if (!keyMap)
                            continue;
                        let attachment = skin.getAttachment(slotIndex, timelineName);
                        let weighted = attachment.bones;
                        let vertices = attachment.vertices;
                        let deformLength = weighted ? vertices.length / 3 * 2 : vertices.length;
                        let timeline = new DeformTimeline(timelineMap.length, timelineMap.length, slotIndex, attachment);
                        let time = getValue(keyMap, "time", 0);
                        for (let frame = 0, bezier = 0;; frame++) {
                            let deform;
                            let verticesValue = getValue(keyMap, "vertices", null);
                            if (!verticesValue)
                                deform = weighted ? Utils.newFloatArray(deformLength) : vertices;
                            else {
                                deform = Utils.newFloatArray(deformLength);
                                let start = getValue(keyMap, "offset", 0);
                                Utils.arrayCopy(verticesValue, 0, deform, start, verticesValue.length);
                                if (scale != 1) {
                                    for (let i = start, n = i + verticesValue.length; i < n; i++)
                                        deform[i] *= scale;
                                }
                                if (!weighted) {
                                    for (let i = 0; i < deformLength; i++)
                                        deform[i] += vertices[i];
                                }
                            }
                            timeline.setFrame(frame, time, deform);
                            let nextMap = timelineMap[frame + 1];
                            if (!nextMap) {
                                timeline.shrink(bezier);
                                break;
                            }
                            let time2 = getValue(nextMap, "time", 0);
                            let curve = keyMap.curve;
                            if (curve)
                                bezier = readCurve(curve, timeline, bezier, frame, 0, time, time2, 0, 1, 1);
                            time = time2;
                            keyMap = nextMap;
                        }
                        timelines.push(timeline);
                    }
                }
            }
        }
        // Draw order timelines.
        if (map.drawOrder) {
            let timeline = new DrawOrderTimeline(map.drawOrder.length);
            let slotCount = skeletonData.slots.length;
            let frame = 0;
            for (let i = 0; i < map.drawOrder.length; i++, frame++) {
                let drawOrderMap = map.drawOrder[i];
                let drawOrder = null;
                let offsets = getValue(drawOrderMap, "offsets", null);
                if (offsets) {
                    drawOrder = Utils.newArray(slotCount, -1);
                    let unchanged = Utils.newArray(slotCount - offsets.length, 0);
                    let originalIndex = 0, unchangedIndex = 0;
                    for (let ii = 0; ii < offsets.length; ii++) {
                        let offsetMap = offsets[ii];
                        let slotIndex = skeletonData.findSlot(offsetMap.slot).index;
                        // Collect unchanged items.
                        while (originalIndex != slotIndex)
                            unchanged[unchangedIndex++] = originalIndex++;
                        // Set changed items.
                        drawOrder[originalIndex + offsetMap.offset] = originalIndex++;
                    }
                    // Collect remaining unchanged items.
                    while (originalIndex < slotCount)
                        unchanged[unchangedIndex++] = originalIndex++;
                    // Fill in unchanged items.
                    for (let ii = slotCount - 1; ii >= 0; ii--)
                        if (drawOrder[ii] == -1)
                            drawOrder[ii] = unchanged[--unchangedIndex];
                }
                timeline.setFrame(frame, getValue(drawOrderMap, "time", 0), drawOrder);
            }
            timelines.push(timeline);
        }
        // Event timelines.
        if (map.events) {
            let timeline = new EventTimeline(map.events.length);
            let frame = 0;
            for (let i = 0; i < map.events.length; i++, frame++) {
                let eventMap = map.events[i];
                let eventData = skeletonData.findEvent(eventMap.name);
                let event = new Event(Utils.toSinglePrecision(getValue(eventMap, "time", 0)), eventData);
                event.intValue = getValue(eventMap, "int", eventData.intValue);
                event.floatValue = getValue(eventMap, "float", eventData.floatValue);
                event.stringValue = getValue(eventMap, "string", eventData.stringValue);
                if (event.data.audioPath) {
                    event.volume = getValue(eventMap, "volume", 1);
                    event.balance = getValue(eventMap, "balance", 0);
                }
                timeline.setFrame(frame, event);
            }
            timelines.push(timeline);
        }
        let duration = 0;
        for (let i = 0, n = timelines.length; i < n; i++)
            duration = Math.max(duration, timelines[i].getDuration());
        skeletonData.animations.push(new Animation(name, timelines, duration));
    }
}
class LinkedMesh {
    constructor(mesh, skin, slotIndex, parent, inheritDeform) {
        this.mesh = mesh;
        this.skin = skin;
        this.slotIndex = slotIndex;
        this.parent = parent;
        this.inheritDeform = inheritDeform;
    }
}
function readTimeline1(keys, timeline, defaultValue, scale) {
    let keyMap = keys[0];
    let time = getValue(keyMap, "time", 0);
    let value = getValue(keyMap, "value", defaultValue) * scale;
    let bezier = 0;
    for (let frame = 0;; frame++) {
        timeline.setFrame(frame, time, value);
        let nextMap = keys[frame + 1];
        if (!nextMap) {
            timeline.shrink(bezier);
            return timeline;
        }
        let time2 = getValue(nextMap, "time", 0);
        let value2 = getValue(nextMap, "value", defaultValue) * scale;
        if (keyMap.curve)
            bezier = readCurve(keyMap.curve, timeline, bezier, frame, 0, time, time2, value, value2, scale);
        time = time2;
        value = value2;
        keyMap = nextMap;
    }
}
function readTimeline2(keys, timeline, name1, name2, defaultValue, scale) {
    let keyMap = keys[0];
    let time = getValue(keyMap, "time", 0);
    let value1 = getValue(keyMap, name1, defaultValue) * scale;
    let value2 = getValue(keyMap, name2, defaultValue) * scale;
    let bezier = 0;
    for (let frame = 0;; frame++) {
        timeline.setFrame(frame, time, value1, value2);
        let nextMap = keys[frame + 1];
        if (!nextMap) {
            timeline.shrink(bezier);
            return timeline;
        }
        let time2 = getValue(nextMap, "time", 0);
        let nvalue1 = getValue(nextMap, name1, defaultValue) * scale;
        let nvalue2 = getValue(nextMap, name2, defaultValue) * scale;
        let curve = keyMap.curve;
        if (curve) {
            bezier = readCurve(curve, timeline, bezier, frame, 0, time, time2, value1, nvalue1, scale);
            bezier = readCurve(curve, timeline, bezier, frame, 1, time, time2, value2, nvalue2, scale);
        }
        time = time2;
        value1 = nvalue1;
        value2 = nvalue2;
        keyMap = nextMap;
    }
}
function readCurve(curve, timeline, bezier, frame, value, time1, time2, value1, value2, scale) {
    if (curve == "stepped") {
        timeline.setStepped(frame);
        return bezier;
    }
    let i = value << 2;
    let cx1 = curve[i];
    let cy1 = curve[i + 1] * scale;
    let cx2 = curve[i + 2];
    let cy2 = curve[i + 3] * scale;
    timeline.setBezier(bezier, frame, value, time1, value1, cx1, cy1, cx2, cy2, time2, value2);
    return bezier + 1;
}
function getValue(map, property, defaultValue) {
    return map[property] !== undefined ? map[property] : defaultValue;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2tlbGV0b25Kc29uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1NrZWxldG9uSnNvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OytFQTJCK0U7QUFFL0UsT0FBTyxFQUFFLFNBQVMsRUFBWSxrQkFBa0IsRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFBRSxhQUFhLEVBQUUsWUFBWSxFQUFFLGNBQWMsRUFBRSxpQkFBaUIsRUFBRSxrQkFBa0IsRUFBRSxrQkFBa0IsRUFBRSxhQUFhLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBRSxvQkFBb0IsRUFBRSwyQkFBMkIsRUFBRSw4QkFBOEIsRUFBRSw2QkFBNkIsRUFBRSx5QkFBeUIsRUFBRSxjQUFjLEVBQUUsaUJBQWlCLEVBQUUsYUFBYSxFQUFpRCxNQUFNLGFBQWEsQ0FBQztBQUlwaUIsT0FBTyxFQUFFLFFBQVEsRUFBRSxhQUFhLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFDckQsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUN4QyxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQ2hDLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQ3RELE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBQ2pHLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUM5QyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sUUFBUSxDQUFDO0FBQzlCLE9BQU8sRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBQ2pELE9BQU8sRUFBRSx1QkFBdUIsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBQ3BFLE9BQU8s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QVMsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dDQUMzRixNQUFNLEdBQUcsU0FBUyxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0NBQzNGLE1BQU0sR0FBRyxTQUFTLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQ0FDM0YsTUFBTSxHQUFHLFNBQVMsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dDQUMzRixNQUFNLEdBQUcsU0FBUyxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0NBQzdGLE1BQU0sR0FBRyxTQUFTLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQ0FDN0Ys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