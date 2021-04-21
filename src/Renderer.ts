import vertexShaderSource from './shaders/vertexShader.glsl';
import fragmentShaderSource from './shaders/fragmentShader.glsl';

export interface GLRendererOptions {
  width: number;
  height: number;
}

export default class Renderer {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;

  width: number;
  height: number;

  program: WebGLProgram;
  vertices: number[];
  dimensions: number = 2;
  uniforms: string[] = ['u_time', 'u_resolution'];
  uniformLocationMap: { [key: string]: WebGLUniformLocation } = {};

  constructor({ width, height }: GLRendererOptions) {
    this.width = width;
    this.height = height;

    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('width', this.width.toString());
    this.canvas.setAttribute('height', this.height.toString());

    const gl = this.canvas.getContext('webgl');
    if (!gl) {
      throw new Error('WebGL을 사용할 수 없습니다.');
    }

    this.gl = gl;

    document.body.appendChild(this.canvas);

    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexShaderSource);
    if (!vertexShader) {
      throw new Error('Vertex Shader를 컴파일할 수 없습니다.');
    }

    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!fragmentShader) {
      throw new Error('Fragment Shader를 컴파일할 수 없습니다.');
    }

    const program = this.createProgram(vertexShader, fragmentShader);
    if (!program) {
      throw new Error('program을 만들 수 없습니다.');
    }

    this.program = program;
    this.vertices = [
      -1.0, -1.0,
      1.0, -1.0,
      -1.0, 1.0,
      1.0, 1.0,
      -1.0, 1.0,
      1.0, -1.0,
    ];

    const bufferArray = new Float32Array(this.vertices);

    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, bufferArray, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, this.dimensions, gl.FLOAT, false, 0, 0);

    window.requestAnimationFrame(this.render);
  }

  render = (time: number) => {
    this.gl.useProgram(this.program);
    this.gl.uniform2f(this.uniformLocationMap['u_resolution'], this.width, this.height);
    this.gl.uniform1fv(this.uniformLocationMap['u_time'], [time * 0.001]);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertices.length / this.dimensions);
    window.requestAnimationFrame(this.render);
  }

  compileShader(type: GLenum, code: string) {
    const shader = this.gl.createShader(type);
    if (!shader) {
      return null;
    }

    this.gl.shaderSource(shader, code);
    this.gl.compileShader(shader);
    return shader;
  }

  createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader) {
    const program = this.gl.createProgram();
    if (!program) {
      return null;
    }

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    this.uniforms.forEach(uniform => {
      const uniformLocation = this.gl.getUniformLocation(program, uniform);
      if (!uniformLocation) {
        return;
      }

      this.uniformLocationMap[uniform] = uniformLocation;
    });

    return program;
  }
}
