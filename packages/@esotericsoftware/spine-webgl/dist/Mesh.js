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
import { Shader } from "./Shader";
import { ManagedWebGLRenderingContext } from "./WebGL";
export class Mesh {
    getAttributes() { return this.attributes; }
    maxVertices() { return this.vertices.length / this.elementsPerVertex; }
    numVertices() { return this.verticesLength / this.elementsPerVertex; }
    setVerticesLength(length) {
        this.dirtyVertices = true;
        this.verticesLength = length;
    }
    getVertices() { return this.vertices; }
    maxIndices() { return this.indices.length; }
    numIndices() { return this.indicesLength; }
    setIndicesLength(length) {
        this.dirtyIndices = true;
        this.indicesLength = length;
    }
    getIndices() { return this.indices; }
    ;
    getVertexSizeInFloats() {
        let size = 0;
        for (var i = 0; i < this.attributes.length; i++) {
            let attribute = this.attributes[i];
            size += attribute.numElements;
        }
        return size;
    }
    constructor(context, attributes, maxVertices, maxIndices) {
        this.attributes = attributes;
        this.verticesLength = 0;
        this.dirtyVertices = false;
        this.indicesLength = 0;
        this.dirtyIndices = false;
        this.elementsPerVertex = 0;
        this.context = context instanceof ManagedWebGLRenderingContext ? context : new ManagedWebGLRenderingContext(context);
        this.elementsPerVertex = 0;
        for (let i = 0; i < attributes.length; i++) {
            this.elementsPerVertex += attributes[i].numElements;
        }
        this.vertices = new Float32Array(maxVertices * this.elementsPerVertex);
        this.indices = new Uint16Array(maxIndices);
        this.context.addRestorable(this);
    }
    setVertices(vertices) {
        this.dirtyVertices = true;
        if (vertices.length > this.vertices.length)
            throw Error("Mesh can't store more than " + this.maxVertices() + " vertices");
        this.vertices.set(vertices, 0);
        this.verticesLength = vertices.length;
    }
    setIndices(indices) {
        this.dirtyIndices = true;
        if (indices.length > this.indices.length)
            throw Error("Mesh can't store more than " + this.maxIndices() + " indices");
        this.indices.set(indices, 0);
        this.indicesLength = indices.length;
    }
    draw(shader, primitiveType) {
        this.drawWithOffset(shader, primitiveType, 0, this.indicesLength > 0 ? this.indicesLength : this.verticesLength / this.elementsPerVertex);
    }
    drawWithOffset(shader, primitiveType, offset, count) {
        let gl = this.context.gl;
        if (this.dirtyVertices || this.dirtyIndices)
            this.update();
        this.bind(shader);
        if (this.indicesLength > 0) {
            gl.drawElements(primitiveType, count, gl.UNSIGNED_SHORT, offset * 2);
        }
        else {
            gl.drawArrays(primitiveType, offset, count);
        }
        this.unbind(shader);
    }
    bind(shader) {
        let gl = this.context.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
        let offset = 0;
        for (let i = 0; i < this.attributes.length; i++) {
            let attrib = this.attributes[i];
            let location = shader.getAttributeLocation(attrib.name);
            gl.enableVertexAttribArray(location);
            gl.vertexAttribPointer(location, attrib.numElements, gl.FLOAT, false, this.elementsPerVertex * 4, offset * 4);
            offset += attrib.numElements;
        }
        if (this.indicesLength > 0)
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
    }
    unbind(shader) {
        let gl = this.context.gl;
        for (let i = 0; i < this.attributes.length; i++) {
            let attrib = this.attributes[i];
            let location = shader.getAttributeLocation(attrib.name);
            gl.disableVertexAttribArray(location);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        if (this.indicesLength > 0)
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
    update() {
        let gl = this.context.gl;
        if (this.dirtyVertices) {
            if (!this.verticesBuffer) {
                this.verticesBuffer = gl.createBuffer();
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this.vertices.subarray(0, this.verticesLength), gl.DYNAMIC_DRAW);
            this.dirtyVertices = false;
        }
        if (this.dirtyIndices) {
            if (!this.indicesBuffer) {
                this.indicesBuffer = gl.createBuffer();
            }
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices.subarray(0, this.indicesLength), gl.DYNAMIC_DRAW);
            this.dirtyIndices = false;
        }
    }
    restore() {
        this.verticesBuffer = null;
        this.indicesBuffer = null;
        this.update();
    }
    dispose() {
        this.context.removeRestorable(this);
        let gl = this.context.gl;
        gl.deleteBuffer(this.verticesBuffer);
        gl.deleteBuffer(this.indicesBuffer);
    }
}
export class VertexAttribute {
    constructor(name, type, numElements) {
        this.name = name;
        this.type = type;
        this.numElements = numElements;
    }
}
export class Position2Attribute extends VertexAttribute {
    constructor() {
        super(Shader.POSITION, VertexAttributeType.Float, 2);
    }
}
export class Position3Attribute extends VertexAttribute {
    constructor() {
        super(Shader.POSITION, VertexAttributeType.Float, 3);
    }
}
export class TexCoordAttribute extends VertexAttribute {
    constructor(unit = 0) {
        super(Shader.TEXCOORDS + (unit == 0 ? "" : unit), VertexAttributeType.Float, 2);
    }
}
export class ColorAttribute extends VertexAttribute {
    constructor() {
        super(Shader.COLOR, VertexAttributeType.Float, 4);
    }
}
export class Color2Attribute extends VertexAttribute {
    constructor() {
        super(Shader.COLOR2, VertexAttributeType.Float, 4);
    }
}
export var VertexAttributeType;
(function (VertexAttributeType) {
    VertexAttributeType[VertexAttributeType["Float"] = 0] = "Float";
})(VertexAttributeType || (VertexAttributeType = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWVzaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9NZXNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7K0VBMkIrRTtBQUcvRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBQ2xDLE9BQU8sRUFBRSw0QkFBNEIsRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUd2RCxNQUFNLE9BQU8sSUFBSTtJQVloQixhQUFhLEtBQXlCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFFL0QsV0FBVyxLQUFjLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztJQUNoRixXQUFXLEtBQWMsT0FBTyxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7SUFDL0UsaUJBQWlCLENBQUUsTUFBYztRQUNoQyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztRQUMxQixJQUFJLENBQUMsY0FBYyxHQUFHLE1BQU0sQ0FBQztJQUM5QixDQUFDO0lBQ0QsV0FBVyxLQUFvQixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBRXRELFVBQVUsS0FBYyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUNyRCxVQUFVLEtBQWMsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztJQUNwRCxnQkFBZ0IsQ0FBRSxNQUFjO1FBQy9CLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxhQUFhLEdBQUcsTUFBTSxDQUFDO0lBQzdCLENBQUM7SUFDRCxVQUFVLEtBQW1CLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQSxDQUFDLENBQUM7SUFBQSxDQUFDO0lBRW5ELHFCQUFxQjtR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