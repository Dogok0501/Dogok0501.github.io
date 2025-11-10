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
import { Color, SkeletonClipping, Vector2, Utils, RegionAttachment, MeshAttachment, ClippingAttachment } from "@esotericsoftware/spine-core";
import { WebGLBlendModeConverter } from "./WebGL";
class Renderable {
    constructor(vertices, numVertices, numFloats) {
        this.vertices = vertices;
        this.numVertices = numVertices;
        this.numFloats = numFloats;
    }
}
;
export class SkeletonRenderer {
    constructor(context, twoColorTint = true) {
        this.premultipliedAlpha = false;
        this.vertexEffect = null;
        this.tempColor = new Color();
        this.tempColor2 = new Color();
        this.vertexSize = 2 + 2 + 4;
        this.twoColorTint = false;
        this.renderable = new Renderable(null, 0, 0);
        this.clipper = new SkeletonClipping();
        this.temp = new Vector2();
        this.temp2 = new Vector2();
        this.temp3 = new Color();
        this.temp4 = new Color();
        this.twoColorTint = twoColorTint;
        if (twoColorTint)
            this.vertexSize += 4;
        this.vertices = Utils.newFloatArray(this.vertexSize * 1024);
    }
    draw(batcher, skeleton, slotRangeStart = -1, slotRangeEnd = -1) {
        let clipper = this.clipper;
        let premultipliedAlpha = this.premultipliedAlpha;
        let twoColorTint = this.twoColorTint;
        let blendMode = null;
        let tempPos = this.temp;
        let tempUv = this.temp2;
        let tempLight = this.temp3;
        let tempDark = this.temp4;
        let renderable = this.renderable;
        let uvs = null;
        let triangles = null;
        let drawOrder = skeleton.drawOrder;
        let attachmentColor = null;
        let skeletonColor = skeleton.color;
        let vertexSize = twoColorTint ? 12 : 8;
        let inRange = false;
        if (slotRangeStart == -1)
            inRange = true;
        for (let i = 0, n = drawOrder.length; i < n; i++) {
            let clippedVertexSize = clipper.isClipping() ? 2 : vertexSize;
            let slot = drawOrder[i];
            if (!slot.bone.active) {
                clipper.clipEndWithSlot(slot);
                continue;
            }
            if (slotRangeStart >= 0 && slotRangeStart == slot.data.index) {
                inRange = true;
            }
            if (!inRange) {
                clipper.clipEndWithSlot(slot);
                continue;
            }
            if (slotRangeEnd >= 0 && slotRangeEnd == slot.data.index) {
                inRange = false;
            }
            let attachment = slot.getAttachment();
            let texture = null;
            if (attachment instanceof RegionAttachment) {
                let region = attachment;
                renderable.vertices = this.vertices;
                renderable.numVertices = 4;
                renderable.numFloats = clippedVertexSize << 2;
                region.computeWorldVertices(slot.bone, renderable.vertices, 0, clippedVertexSize);
                triangles = SkeletonRenderer.QUAD_TRIANGLES;
                uvs = region.uvs;
                texture = region.region.renderObject.page.texture;
                attachmentColor = region.color;
            }
            else if (attachment instanceof MeshAttachment) {
                let mesh = attachment;
                renderable.vertices = this.vertices;
                renderable.numVertices = (mesh.worldVerticesLength >> 1);
                renderable.numFloats = renderable.numVertices * clippedVertexSize;
                if (renderable.numFloats > renderable.vertices.length) {
                    renderable.vertices = this.vertices = Utils.newFloatArray(renderable.numFloats);
                }
                mesh.computeWorldVertices(slot, 0, mesh.worldVerticesLength, renderable.vertices, 0, clippedVertexSize);
                triangles = mesh.triangles;
                texture = mesh.region.renderObject.page.texture;
                uvs = mesh.uvs;
                attachmentColor = mesh.color;
            }
            else if (attachment instanceof ClippingAttachment) {
                let clip = (attachment);
                clipper.clipStart(slot, clip);
                continue;
            }
            else {
                clipper.clipEndWithSlot(slot);
                continue;
            }
            if (texture) {
                let slotColor = slot.color;
                let finalColor = this.tempColor;
                finalColor.r = skeletonColor.r * slotColor.r * attachmentColor.r;
                finalColor.g = skeletonColor.g * slotColor.g * attachmentColor.g;
                finalColor.b = skeletonColor.b * slotColor.b * attachmentColor.b;
                finalColor.a = skeletonColor.a * slotColor.a * attachmentColor.a;
                if (premultipliedAlpha) {
                    finalColor.r *= finalColor.a;
                    finalColor.g *= finalColor.a;
                    finalColor.b *= finalColor.a;
                }
                let darkColor = this.tempColor2;
                if (!slot.darkColor)
                    darkColor.set(0, 0, 0, 1.0);
                else {
                    if (premultipliedAlpha) {
                        darkColor.r = slot.darkColor.r * finalColor.a;
                        darkColor.g = slot.darkColor.g * finalColor.a;
                        darkColor.b = slot.darkColor.b * finalColor.a;
                    }
                    else {
                        darkColor.setFromColor(slot.darkColor);
                    }
                    darkColor.a = premultipliedAlpha ? 1.0 : 0.0;
                }
                let slotBlendMode = slot.data.blendMode;
                if (slotBlendMode != blendMode) {
                    blendMode = slotBlendMode;
                    batcher.setBlendMode(WebGLBlendModeConverter.getSourceColorGLBlendMode(blendMode, premultipliedAlpha), WebGLBlendModeConverter.getSourceAlphaGLBlendMode(blendMode), WebGLBlendModeConverter.getDestGLBlendMode(blendMode));
                }
                if (clipper.isClipping()) {
                    clipper.clipTriangles(renderable.vertices, renderable.numFloats, triangles, triangles.length, uvs, finalColor, darkColor, twoColorTint);
                    let clippedVertices = new Float32Array(clipper.clippedVertices);
                    let clippedTriangles = clipper.clippedTriangles;
                    if (this.vertexEffect) {
                        let vertexEffect = this.vertexEffect;
                        let verts = clippedVertices;
                        if (!twoColorTint) {
                            for (let v = 0, n = clippedVertices.length; v < n; v += vertexSize) {
                                tempPos.x = verts[v];
                                tempPos.y = verts[v + 1];
                                tempLight.set(verts[v + 2], verts[v + 3], verts[v + 4], verts[v + 5]);
                                tempUv.x = verts[v + 6];
                                tempUv.y = verts[v + 7];
                                tempDark.set(0, 0, 0, 0);
                                vertexEffect.transform(tempPos, tempUv, tempLight, tempDark);
                                verts[v] = tempPos.x;
                                verts[v + 1] = tempPos.y;
                                verts[v + 2] = tempLight.r;
                                verts[v + 3] = tempLight.g;
                                verts[v + 4] = tempLight.b;
                                verts[v + 5] = tempLight.a;
                                verts[v + 6] = tempUv.x;
                                verts[v + 7] = tempUv.y;
                            }
                        }
                        else {
                            for (let v = 0, n = clippedVertices.length; v < n; v += vertexSize) {
                                tempPos.x = verts[v];
                                tempPos.y = verts[v + 1];
                                tempLight.set(verts[v + 2], verts[v + 3], verts[v + 4], verts[v + 5]);
                                tempUv.x = verts[v + 6];
                                tempUv.y = verts[v + 7];
                                tempDark.set(verts[v + 8], verts[v + 9], verts[v + 10], verts[v + 11]);
                                vertexEffect.transform(tempPos, tempUv, tempLight, tempDark);
                                verts[v] = tempPos.x;
                                verts[v + 1] = tempPos.y;
                                verts[v + 2] = tempLight.r;
                                verts[v + 3] = tempLight.g;
                                verts[v + 4] = tempLight.b;
                                verts[v + 5] = tempLight.a;
                                verts[v + 6] = tempUv.x;
                                verts[v + 7] = tempUv.y;
                                verts[v + 8] = tempDark.r;
                                verts[v + 9] = tempDark.g;
                                verts[v + 10] = tempDark.b;
                                verts[v + 11] = tempDark.a;
                            }
                        }
                    }
                    batcher.draw(texture, clippedVertices, clippedTriangles);
                }
                else {
                    let verts = renderable.vertices;
                    if (this.vertexEffect) {
                        let vertexEffect = this.vertexEffect;
                        if (!twoColorTint) {
                            for (let v = 0, u = 0, n = renderable.numFloats; v < n; v += vertexSize, u += 2) {
                                tempPos.x = verts[v];
                                tempPos.y = verts[v + 1];
                                tempUv.x = uvs[u];
                                tempUv.y = uvs[u + 1];
                                tempLight.setFromColor(finalColor);
                                tempDark.set(0, 0, 0, 0);
                                vertexEffect.transform(tempPos, tempUv, tempLight, tempDark);
                                verts[v] = tempPos.x;
                                verts[v + 1] = tempPos.y;
                                verts[v + 2] = tempLight.r;
                                verts[v + 3] = tempLight.g;
                                verts[v + 4] = tempLight.b;
                                verts[v + 5] = tempLight.a;
                                verts[v + 6] = tempUv.x;
                                verts[v + 7] = tempUv.y;
                            }
                        }
                        else {
                            for (let v = 0, u = 0, n = renderable.numFloats; v < n; v += vertexSize, u += 2) {
                                tempPos.x = verts[v];
                                tempPos.y = verts[v + 1];
                                tempUv.x = uvs[u];
                                tempUv.y = uvs[u + 1];
                                tempLight.setFromColor(finalColor);
                                tempDark.setFromColor(darkColor);
                                vertexEffect.transform(tempPos, tempUv, tempLight, tempDark);
                                verts[v] = tempPos.x;
                                verts[v + 1] = tempPos.y;
                                verts[v + 2] = tempLight.r;
                                verts[v + 3] = tempLight.g;
                                verts[v + 4] = tempLight.b;
                                verts[v + 5] = tempLight.a;
                                verts[v + 6] = tempUv.x;
                                verts[v + 7] = tempUv.y;
                                verts[v + 8] = tempDark.r;
                                verts[v + 9] = tempDark.g;
                                verts[v + 10] = tempDark.b;
                                verts[v + 11] = tempDark.a;
                            }
                        }
                    }
                    else {
                        if (!twoColorTint) {
                            for (let v = 2, u = 0, n = renderable.numFloats; v < n; v += vertexSize, u += 2) {
                                verts[v] = finalColor.r;
                                verts[v + 1] = finalColor.g;
                                verts[v + 2] = finalColor.b;
                                verts[v + 3] = finalColor.a;
                                verts[v + 4] = uvs[u];
                                verts[v + 5] = uvs[u + 1];
                            }
                        }
                        else {
                            for (let v = 2, u = 0, n = renderable.numFloats; v < n; v += vertexSize, u += 2) {
                                verts[v] = finalColor.r;
                                verts[v + 1] = finalColor.g;
                                verts[v + 2] = finalColor.b;
                                verts[v + 3] = finalColor.a;
                                verts[v + 4] = uvs[u];
                                verts[v + 5] = uvs[u + 1];
                                verts[v + 6] = darkColor.r;
                                verts[v + 7] = darkColor.g;
                                verts[v + 8] = darkColor.b;
                                verts[v + 9] = darkColor.a;
                            }
                        }
                    }
                    let view = renderable.vertices.subarray(0, renderable.numFloats);
                    batcher.draw(texture, view, triangles);
                }
            }
            clipper.clipEndWithSlot(slot);
        }
        clipper.clipEnd();
    }
}
SkeletonRenderer.QUAD_TRIANGLES = [0, 1, 2, 2, 3, 0];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2tlbGV0b25SZW5kZXJlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9Ta2VsZXRvblJlbmRlcmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7K0VBMkIrRTtBQUUvRSxPQUFPLEVBQWlDLEtBQUssRUFBRSxnQkFBZ0IsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUF1QixnQkFBZ0IsRUFBc0IsY0FBYyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFHck4sT0FBTyxFQUFnQyx1QkFBdUIsRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUdoRixNQUFNLFVBQVU7SUFDZixZQUFvQixRQUF5QixFQUFTLFdBQW1CLEVBQVMsU0FBaUI7UUFBL0UsYUFBUSxHQUFSLFFBQVEsQ0FBaUI7UUFBUyxnQkFBVyxHQUFYLFdBQVcsQ0FBUTtRQUFTLGNBQVMsR0FBVCxTQUFTLENBQVE7SUFBSSxDQUFDO0NBQ3hHO0FBQUEsQ0FBQztBQUVGLE1BQU0sT0FBTyxnQkFBZ0I7SUFpQjVCLFlBQWEsT0FBcUMsRUFBRSxlQUF3QixJQUFJO1FBZGhGLHVCQUFrQixHQUFHLEtBQUssQ0FBQztRQUMzQixpQkFBWSxHQUFpQixJQUFJLENBQUM7UUFDMUIsY0FBUyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7UUFDeEIsZUFBVSxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7UUFFekIsZUFBVSxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZCLGlCQUFZLEdBQUcsS0FBSyxDQUFDO1FBQ3JCLGVBQVUsR0FBZSxJQUFJLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3BELFlBQU8sR0FBcUIsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO1FBQ25ELFNBQUksR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO1FBQ3JCLFVBQUssR0FBRyxJQUFJLE9BQU8s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QyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQztnQ0FDeEIsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFBO2dDQUN2QixLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0NBQzFCLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQztnQ0FDMUIsS0FBSyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dDQUMzQixLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUM7NkJBQzNCO3lCQUNEO3FCQUNEO3lCQUFNO3dCQUNOLElBQUksQ0FBQyxZQUFZLEVBQUU7NEJBQ2xCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksVUFBVSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0NBQ2hGLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dDQUN4QixLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUM7Z0NBQzVCLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQztnQ0FDNUIsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dDQUM1QixLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQ0FDdEIsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDOzZCQUMxQjt5QkFDRDs2QkFBTTs0QkFDTixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsU0FBUyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLFVBQVUsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO2dDQUNoRixLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQztnQ0FDeEIsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dDQUM1QixLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUM7Z0NBQzVCLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQztnQ0FDNUIsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0NBQ3RCLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQ0FDMUIsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDO2dDQUMzQixLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0NBQzNCLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQztnQ0FDM0IsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDOzZCQUMzQjt5QkFDRDtxQkFDRDtvQkFDRCxJQUFJLElBQUksR0FBSSxVQUFVLENBQUMsUUFBeUIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDbkYsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2lCQUN2QzthQUNEO1lBRUQsT0FBTyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUM5QjtRQUNELE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNuQixDQUFDOztBQXJRTSwrQkFBYyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyJ9