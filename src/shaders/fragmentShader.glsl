precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

uniform sampler2D channel0;
uniform sampler2D channel1;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;

  gl_FragColor = texture2D(channel0, uv);
}
