var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
var pos = new THREE.Vector3(0, 0.5, 7);
//camera.position.set(0, 0.5, 7);
var renderer = new THREE.WebGLRenderer({
  antialias: true
});
renderer.setClearColor(0x050005);
renderer.setPixelRatio(0.5);
var canvas = renderer.domElement
document.body.appendChild(canvas);


//var controls = new THREE.OrbitControls(camera, canvas);

// GRID
var division = 20;
var limit = 10;
var grid = new THREE.GridHelper(limit * 2, division, 0x001060, 0x001060);

var moveable = [];
for (let i = 0; i <= division; i++) {
  moveable.push(1, 1, 0, 0); // move horizontal lines only (1 - point is moveable)
}
grid.geometry.addAttribute(
  "moveable",
  new THREE.BufferAttribute(new Uint8Array(moveable), 1)
);
grid.material = new THREE.ShaderMaterial({
  uniforms: {
    time: {
      value: 0
    },
    limits: {
      value: new THREE.Vector2(-limit, limit)
    },
    speed: {
      value: 5
    }
  },
  vertexShader: `
    uniform float time;
    uniform vec2 limits;
    uniform float speed;
    
    attribute float moveable;
    
    varying vec3 vColor;
  
    void main() {
      vColor = color;
      float limLen = limits.y - limits.x;
      vec3 pos = position;
      if (floor(moveable + 0.5) > 0.5){ // if a point has "moveable" attribute = 1 
        float dist = speed * time;
        float currPos = mod((pos.z + dist) - limits.x, limLen) + limits.x;
        pos.z = currPos;
      } 
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
  
    void main() {
      gl_FragColor = vec4(vColor, 1.);
    }
  `,
  vertexColors: THREE.VertexColors
});
scene.add(grid);

// CLOCK
var points = [
  new THREE.Vector2(0.1, 2),
  new THREE.Vector2(0.9, 2),
  
  new THREE.Vector2(0, 1.9),
  new THREE.Vector2(0, 1.1),
  
  new THREE.Vector2(1, 1.9),
  new THREE.Vector2(1, 1.1),
  
  new THREE.Vector2(0.1, 1),
  new THREE.Vector2(0.9, 1),
  
  new THREE.Vector2(0, 0.9),
  new THREE.Vector2(0, 0.1),
  
  new THREE.Vector2(1, 0.9),
  new THREE.Vector2(1, 0.1),
  
  new THREE.Vector2(0.1, 0),
  new THREE.Vector2(0.9, 0)
];
var idx = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6];
var uvs = [0.1, 0, 0.9, 0,  0, 0.05, 0, 0.45,  1, 0.05, 1, 0.45,  0.1, 0.5, 0.9, 0.5,  0, 0.55, 0, 0.95,  1, 0.55, 1, 0.95,  0.1, 1, 0.9, 1];

//console.log(new THREE.BoxBufferGeometry());

var geometry = new THREE.BufferGeometry().setFromPoints(points);
geometry.addAttribute('idx', new THREE.BufferAttribute(new Float32Array(idx), 1));
geometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
geometry.center();
var matrix = new THREE.Matrix4().makeShear(0, THREE.Math.degToRad(3), 0);
geometry.applyMatrix(matrix);
geometry.translate(0, 1.1, 0);

var digits = [];

function createDigit( position ) {

  let material = new THREE.ShaderMaterial({
    uniforms: {
      diffuse1: {
        value: new THREE.Color(0xff00ff)
      },
      diffuse2: {
        value: new THREE.Color(0xff3000)
      },
      digit: {
        value: 0
      }
    },
    vertexShader: lineVertShader,
    fragmentShader: lineFragShader
  });

  let digit = new THREE.LineSegments(geometry, material);
  digit.position.copy(position);
  digit.scale.setScalar(0.9);
  
  digits.push(digit);
  
  scene.add(digit);
}

var dots;
function createDots(){
  let geom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector2(-1.55, 1.45),
    new THREE.Vector2(-1.55, 1.35),
    new THREE.Vector2(-1.55, 0.65),
    new THREE.Vector2(-1.55, 0.55),
    new THREE.Vector2(1.55, 1.45),
    new THREE.Vector2(1.55, 1.35),
    new THREE.Vector2(1.55, 0.65),
    new THREE.Vector2(1.55, 0.55)
  ]);
  geom.setIndex([0, 1, 2, 3, 4, 5, 6, 7]);
  geom.applyMatrix(matrix);
  let mat = new THREE.LineBasicMaterial({color: 0xff0000});
  dots = new THREE.LineSegments(geom, mat);
  scene.add(dots);
}

// hours
createDigit( new THREE.Vector3(-3.6, 0, 0) );
createDigit( new THREE.Vector3(-2.5, 0, 0) );
// minutes
createDigit( new THREE.Vector3(-0.55, 0, 0) );
createDigit( new THREE.Vector3( 0.55, 0, 0) );
//seconts
createDigit( new THREE.Vector3( 2.5, 0, 0) );
createDigit( new THREE.Vector3( 3.6, 0, 0) );

createDots();

var clock = new THREE.Clock();
var date = 0;

var hours = 0, minutes = 0, seconds = 0;
var prevsec = -1;


render();

function render() {
  if (resize(renderer)) {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
  
  camera.position.set(
    Math.cos(clock.getElapsedTime() * 0.25),
    Math.sin(clock.getElapsedTime() * 0.314)*0.25,
    0
  ).add(pos);
  camera.lookAt(scene.position);
  
  grid.material.uniforms.time.value = clock.getElapsedTime() * 0.5;
  
  date = new Date();
  hours = date.getHours();
  minutes = date.getMinutes();
  seconds = date.getSeconds();
  if (seconds !== prevsec){
    digits[0].material.uniforms.digit.value = Math.floor(hours / 10) == 0 ? -1 : Math.floor(hours / 10);
    digits[1].material.uniforms.digit.value = hours % 10;
    digits[2].material.uniforms.digit.value = Math.floor(minutes / 10);
    digits[3].material.uniforms.digit.value = minutes % 10;
    digits[4].material.uniforms.digit.value = Math.floor(seconds / 10);
    digits[5].material.uniforms.digit.value = seconds % 10;
    prevsec = seconds;
  }
  
  dots.visible = seconds % 2 == 0;
  
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

function resize(renderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}