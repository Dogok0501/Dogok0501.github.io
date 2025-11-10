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
import { ManagedWebGLRenderingContext } from "./WebGL";
export class Shader {
    getProgram() { return this.program; }
    getVertexShader() { return this.vertexShader; }
    getFragmentShader() { return this.fragmentShader; }
    getVertexShaderSource() { return this.vsSource; }
    getFragmentSource() { return this.fsSource; }
    constructor(context, vertexShader, fragmentShader) {
        this.vertexShader = vertexShader;
        this.fragmentShader = fragmentShader;
        this.vs = null;
        this.fs = null;
        this.program = null;
        this.tmp2x2 = new Float32Array(2 * 2);
        this.tmp3x3 = new Float32Array(3 * 3);
        this.tmp4x4 = new Float32Array(4 * 4);
        this.vsSource = vertexShader;
        this.fsSource = fragmentShader;
        this.context = context instanceof ManagedWebGLRenderingContext ? context : new ManagedWebGLRenderingContext(context);
        this.context.addRestorable(this);
        this.compile();
    }
    compile() {
        let gl = this.context.gl;
        try {
            this.vs = this.compileShader(gl.VERTEX_SHADER, this.vertexShader);
            this.fs = this.compileShader(gl.FRAGMENT_SHADER, this.fragmentShader);
            this.program = this.compileProgram(this.vs, this.fs);
        }
        catch (e) {
            this.dispose();
            throw e;
        }
    }
    compileShader(type, source) {
        let gl = this.context.gl;
        let shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            let error = "Couldn't compile shader: " + gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            if (!gl.isContextLost())
                throw new Error(error);
        }
        return shader;
    }
    compileProgram(vs, fs) {
        let gl = this.context.gl;
        let program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            let error = "Couldn't compile shader program: " + gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            if (!gl.isContextLost())
                throw new Error(error);
        }
        return program;
    }
    restore() {
        this.compile();
    }
    bind() {
        this.context.gl.useProgram(this.program);
    }
    unbind() {
        this.context.gl.useProgram(null);
    }
    setUniformi(uniform, value) {
        this.context.gl.uniform1i(this.getUniformLocation(uniform), value);
    }
    setUniformf(uniform, value) {
        this.context.gl.uniform1f(this.getUniformLocation(uniform), value);
    }
    setUniform2f(uniform, value, value2) {
        this.context.gl.uniform2f(this.getUniformLocation(uniform), value, value2);
    }
    setUniform3f(uniform, value, value2, value3) {
        this.context.gl.uniform3f(this.getUniformLocation(uniform), value, value2, value3);
    }
    setUniform4f(uniform, value, value2, value3, value4) {
        this.context.gl.uniform4f(this.getUniformLocation(uniform), value, value2, value3, value4);
    }
    setUniform2x2f(uniform, value) {
        let gl = this.context.gl;
        this.tmp2x2.set(value);
        gl.uniformMatrix2fv(this.getUniformLocation(uniform), false, this.tmp2x2);
    }
    setUniform3x3f(uniform, value) {
        let gl = this.context.gl;
        this.tmp3x3.set(value);
        gl.uniformMatrix3fv(this.getUniformLocation(uniform), false, this.tmp3x3);
    }
    setUniform4x4f(uniform, value) {
        let gl = this.context.gl;
        this.tmp4x4.set(value);
        gl.uniformMatrix4fv(this.getUniformLocation(uniform), false, this.tmp4x4);
    }
    getUniformLocation(uniform) {
        let gl = this.context.gl;
        let location = gl.getUniformLocation(this.program, uniform);
        if (!location && !gl.isContextLost())
            throw new Error(`Couldn't find location for uniform ${uniform}`);
        return location;
    }
    getAttributeLocation(attribute) {
        let gl = this.context.gl;
        let location = gl.getAttribLocation(this.program, attribute);
        if (location == -1 && !gl.isContextLost())
            throw new Error(`Couldn't find location for attribute ${attribute}`);
        return location;
    }
    dispose() {
        this.context.removeRestorable(this);
        let gl = this.context.gl;
        if (this.vs) {
            gl.deleteShader(this.vs);
            this.vs = null;
        }
        if (this.fs) {
            gl.deleteShader(this.fs);
            this.fs = null;
        }
        if (this.program) {
            gl.deleteProgram(this.program);
            this.program = null;
        }
    }
    static newColoredTextured(context) {
        let vs = `
				attribute vec4 ${Shader.POSITION};
				attribute vec4 ${Shader.COLOR};
				attribute vec2 ${Shader.TEXCOORDS};
				uniform mat4 ${Shader.MVP_MATRIX};
				varying vec4 v_color;
				varying vec2 v_texCoords;

				void main () {
					v_color = ${Shader.COLOR};
					v_texCoords = ${Shader.TEXCOORDS};
					gl_Position = ${Shader.MVP_MATRIX} * ${Shader.POSITION};
				}
			`;
        let fs = `
				#ifdef GL_ES
					#define LOWP lowp
					precision mediump float;
				#else
					#define LOWP
				#endif
				varying LOWP vec4 v_color;
				varying vec2 v_texCoords;
				uniform sampler2D u_texture;

				void main () {
					gl_FragColor = v_color * texture2D(u_texture, v_texCoords);
				}
			`;
        return new Shader(context, vs, fs);
    }
    static newTwoColoredTextured(context) {
        let vs = `
				attribute vec4 ${Shader.POSITION};
				attribute vec4 ${Shader.COLOR};
				attribute vec4 ${Shader.COLOR2};
				attribute vec2 ${Shader.TEXCOORDS};
				uniform mat4 ${Shader.MVP_MATRIX};
				varying vec4 v_light;
				varying vec4 v_dark;
				varying vec2 v_texCoords;

				void main () {
					v_light = ${Shader.COLOR};
					v_dark = ${Shader.COLOR2};
					v_texCoords = ${Shader.TEXCOORDS};
					gl_Position = ${Shader.MVP_MATRIX} * ${Shader.POSITION};
				}
			`;
        let fs = `
				#ifdef GL_ES
					#define LOWP lowp
					precision mediump float;
				#else
					#define LOWP
				#endif
				varying LOWP vec4 v_light;
				varying LOWP vec4 v_dark;
				varying vec2 v_texCoords;
				uniform sampler2D u_texture;

				void main () {
					vec4 texColor = texture2D(u_texture, v_texCoords);
					gl_FragColor.a = texColor.a * v_light.a;
					gl_FragColor.rgb = ((texColor.a - 1.0) * v_dark.a + 1.0 - texColor.rgb) * v_dark.rgb + texColor.rgb * v_light.rgb;
				}
			`;
        return new Shader(context, vs, fs);
    }
    static newColored(context) {
        let vs = `
				attribute vec4 ${Shader.POSITION};
				attribute vec4 ${Shader.COLOR};
				uniform mat4 ${Shader.MVP_MATRIX};
				varying vec4 v_color;

				void main () {
					v_color = ${Shader.COLOR};
					gl_Position = ${Shader.MVP_MATRIX} * ${Shader.POSITION};
				}
			`;
        let fs = `
				#ifdef GL_ES
					#define LOWP lowp
					precision mediump float;
				#else
					#define LOWP
				#endif
				varying LOWP vec4 v_color;

				void main () {
					gl_FragColor = v_color;
				}
			`;
        return new Shader(context, vs, fs);
    }
}
Shader.MVP_MATRIX = "u_projTrans";
Shader.POSITION = "a_position";
Shader.COLOR = "a_color";
Shader.COLOR2 = "a_color2";
Shader.TEXCOORDS = "a_texCoords";
Shader.SAMPLER = "u_texture";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2hhZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1NoYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OytFQTJCK0U7QUFHL0UsT0FBTyxFQUFFLDRCQUE0QixFQUFFLE1BQU0sU0FBUyxDQUFDO0FBRXZELE1BQU0sT0FBTyxNQUFNO0lBa0JYLFVBQVUsS0FBTSxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ3RDLGVBQWUsS0FBTSxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO0lBQ2hELGlCQUFpQixLQUFNLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7SUFDcEQscUJBQXFCLEtBQU0sT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUNsRCxpQkFBaUIsS0FBTSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBRXJELFlBQWEsT0FBNkQsRUFBVSxZQUFvQixFQUFVLGNBQXNCO1FBQXBELGlCQUFZLEdBQVosWUFBWSxDQUFRO1FBQVUsbUJBQWMsR0FBZCxjQUFjLENBQVE7UUFmaEksT0FBRSxHQUFnQixJQUFJLENBQUM7UUFFdkIsT0FBRSxHQUFnQixJQUFJLENBQUM7UUFFdkIsWUFBTyxHQUFpQixJQUFJLENBQUM7UUFDN0IsV0FBTSxHQUFpQixJQUFJLFlBQVksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDL0MsV0FBTSxHQUFpQixJQUFJLFlBQVksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDL0MsV0FBTSxHQUFpQixJQUFJLFlBQVksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFTdEQsSUFBSSxDQUFDLFFBQVEsR0FBRyxZQUFZLENBQUM7UUFDN0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxjQUFjLENBQUM7UUFDL0IsSUFBSSxDQUFDLE9B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