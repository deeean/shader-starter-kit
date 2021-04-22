import vertexShaderSource from './shaders/vertexShader.glsl';
import fragmentShaderSource from './shaders/fragmentShader.glsl';

export interface GLRendererOptions {
  width: number;
  height: number;
}

function isPowerOf2(value: number) {
  return (value & (value - 1)) == 0;
}

export default class Renderer {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;

  width: number;
  height: number;

  program: WebGLProgram;
  vertices: number[];
  dimensions: number = 2;
  uniforms: string[] = ['u_time', 'u_resolution', 'channel0', 'channel1'];
  uniformLocationMap: { [key: string]: WebGLUniformLocation } = {};

  channel0: WebGLTexture;
  channel1: WebGLTexture;

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
      throw new Error('Program을 만들 수 없습니다.');
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

    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, this.dimensions, gl.FLOAT, false, 0, 0);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.channel0);
    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.channel1);

    window.requestAnimationFrame(this.render);
  }

  render = (time: number) => {
    this.gl.viewport(0, 0, this.width, this.height);
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.useProgram(this.program);
    this.gl.uniform2f(this.uniformLocationMap['u_resolution'], this.width, this.height);
    this.gl.uniform1f(this.uniformLocationMap['u_time'], time * 0.001);
    this.gl.uniform1i(this.uniformLocationMap['channel0'], 0);
    this.gl.uniform1i(this.uniformLocationMap['channel1'], 1);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertices.length / this.dimensions);
    window.requestAnimationFrame(this.render);
  }

  createTexture(url: string) {
    const image = new Image();
    const texture = this.gl.createTexture();

    image.addEventListener('load', () => {
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);

      if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
      } else {
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
      }
    });

    image.src = url;

    return texture;
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
