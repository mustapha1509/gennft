import { createWriteStream, readFileSync } from 'fs';
import * as THREE from 'three';
import GIFEncoder from 'gifencoder';
import { createCanvas, loadImage } from './lib/index.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import randomColor from 'randomcolor';

const width = 860;
const height = 860;

const randcolors = randomColor({
  count: 4,
  format: 'rgbArray'
});

const rgb = randcolors.map((c)=>{
  return new THREE.Vector3(c[0], c[1], c[2]);
})

const scene = new THREE.Scene();
scene.background = new THREE.Color('white');

const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1500 );
camera.position.set( 0, 300, 500 );
let cameraTarget = new THREE.Vector3( 0, 150, 0 );
camera.lookAt( cameraTarget );
const canvas = createCanvas(width, height);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true  });

// LIGHTS

const light = new THREE.AmbientLight( 0xaaaaaa ); // soft white light
scene.add( light );

var dirLight = new THREE.DirectionalLight( 0xaaaaaa, 2 );
dirLight.position.set( 200, 400, 600 ).normalize();
scene.add( dirLight );

var PointLight1 = new THREE.PointLight(0xaaaaaa, 1);
PointLight1.position.set(350, 250, 400)
scene.add(PointLight1);

var PointLight2 = new THREE.PointLight(0xaaaaff, 1.5);
PointLight2.position.set(-250, 150, -550)
scene.add(PointLight2);
  
  const snoise = readFileSync('src/shader/snoise.glsl', {encoding:'utf8', flag:'r'});
  const fragment = readFileSync('src/shader/fragment.glsl', {encoding:'utf8', flag:'r'});
  const vertex = readFileSync('src/shader/vertex.glsl', {encoding:'utf8', flag:'r'});
 
  var randomisePosition = new THREE.Vector2(Math.floor(Math.random() * 50, Math.floor(Math.random() * 30)));
  const materialBG = new THREE.ShaderMaterial({
    uniforms: {
      u_bg: {type: 'v3', value: rgb[0]},
      u_bgMain: {type: 'v3', value: rgb[1]},
      u_color1: {type: 'v3', value: rgb[2]},
      u_color2: {type: 'v3', value: rgb[3]},
      u_time: {type: 'f', value: 0},
      u_randomisePosition: { type: 'v2', value: randomisePosition }
    },
    fragmentShader: snoise+fragment,
    vertexShader: snoise+vertex
  });

  const geometryBG = new THREE.PlaneGeometry(width*3, height*3, 100, 100);
  let meshBG = new THREE.Mesh(geometryBG, materialBG);
  meshBG.position.set(0, -200, -380);
  meshBG.scale.multiplyScalar(5);
  meshBG.rotationX = -1.0;
  meshBG.rotationY = 0.0;
  meshBG.rotationZ = 0.1;
  scene.add(meshBG);


const materialLC = new THREE.MeshPhysicalMaterial({
  reflectivity : 1,
  transmission : 1,
  roughness : 0,
  metalness : 0,
  color: 0xffffff,
  side: THREE.FrontSide,
})

const geometryLC = new THREE.BoxGeometry(250, 250, 250);
const cubeLC = new THREE.Mesh(geometryLC, materialLC);
cubeLC.position.set(0,200,100)
scene.add(cubeLC);

async function imgTexture(coin){
  const img = await loadImage('src/images/crypto/'+coin+'.png');
  const texture = new THREE.Texture(img);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

const logoTexture = await imgTexture('pcl');

const geometryC = new RoundedBoxGeometry(66, 66, 66, 10, 10);
const materialC = new THREE.MeshPhysicalMaterial({ 
  roughness: 0, 
  metalness : 0.8, 
  color: 0xffffff,
  map: logoTexture });
const cube = new THREE.Mesh(geometryC, materialC);
cubeLC.add(cube);

async function addCoin(coin){
  let g = new THREE.CylinderGeometry( 20, 20, 5, 30);
  let texture = await imgTexture(coin);
  let mat = new THREE.MeshPhongMaterial( {
    map: texture,
    color: 0x888888,
    flatShading: true
  } );
  let sideMat = new THREE.MeshPhongMaterial( {
    color: 0x333333,
    shininess: 70
  });
  let coinMesh = new THREE.Mesh( g, [sideMat, mat, mat] );
  return coinMesh;
}

let coins = ['ada','sol','bnb','avax','eth', 'btc', 'link','mana', 'aave','comp', 'ftx', 'ape', 'mkr', 'cake', 'atom', 'sushi', 'uni', 'gala', 'matic'];
let count = coins.length + 1;
let Coingroup = new THREE.Group();
var offset = 2 / count;
var increment = Math.PI * (3 - Math.sqrt(5));
var coords = [];

for (let i = 1; i < count; i++) {
  let y = i * offset - 1 + offset / 2;
  let r = Math.sqrt(1 - Math.pow(y, 2));
  let phi = ((i + 1) % count) * increment;
  let x = Math.cos(phi) * r;
  let z = Math.sin(phi) * r;
  coords.push([x, y, z]);
}
for ( let a = 0; a < coins.length; a++ ) {
  let anotherCoin = await addCoin(coins[a]);
  anotherCoin.lookAt(cube.position);
  anotherCoin.rotateZ(Math.sin(Math.random() * Math.PI/a));
  anotherCoin.position.set(...coords[a]);
  anotherCoin.position.normalize();
  anotherCoin.position.multiplyScalar( 105 );
  Coingroup.add( anotherCoin );
}
cube.add( Coingroup );

const fontRaw = readFileSync('node_modules/three/examples/fonts/helvetiker_regular.typeface.json',
          {encoding:'utf8', flag:'r'});
const fontloader = new FontLoader();
const font = fontloader.parse(JSON.parse(fontRaw));

const textMat = new THREE.MeshPhongMaterial({
  color: 0xfafaff,
  flatShading: true
});

const badgeTextureimg = await loadImage('src/images/badges/silvr.png');
const badgeTexture = new THREE.Texture(badgeTextureimg);
badgeTexture.minFilter = THREE.LinearFilter;
badgeTexture.needsUpdate = true;

const bMat = new THREE.MeshPhysicalMaterial({ 
  roughness: 0.4, 
  metalness : 0.7, 
  color: 0xffffff,
  alphaTest: 0.2,
  transparent: true,
  map: badgeTexture });


const TextP = new THREE.Object3D();

const gTitle = new THREE.ShapeGeometry(font.generateShapes('Blue Chip', 24));
const textTitle = new THREE.Mesh(gTitle, textMat);
TextP.add(textTitle);

const gSubTitle = new THREE.ShapeGeometry(font.generateShapes('#16', 12));
const subTitle = new THREE.Mesh(gSubTitle, textMat);
TextP.add(subTitle);

const gIndice = new THREE.ShapeGeometry(font.generateShapes('INDEX: 1.25', 12));
const indice = new THREE.Mesh(gIndice, textMat);
TextP.add(indice);

const gBadge = new THREE.PlaneGeometry(60,60);
const badge = new THREE.Mesh(gBadge, bMat);
TextP.add(badge);

gTitle.translate(-110, 90, 126);
gSubTitle.translate(-110, 60, 126);
gIndice.translate(-110, -110, 126);
gBadge.translate(90, -90, 126);

cubeLC.add(TextP);

const TextP2 = TextP.clone()
TextP2.rotation.y += Math.PI / 2
cubeLC.add(TextP2);

const TextP3 = TextP.clone()
TextP3.rotation.y += Math.PI
cubeLC.add(TextP3);

const TextP4 = TextP.clone()
TextP4.rotation.y += Math.PI * 3/2
cubeLC.add(TextP4);

const encoder = new GIFEncoder(width, height);
encoder.createReadStream().pipe(createWriteStream('./snapshot/basket-nft-coin.gif'));
encoder.start();
encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat
encoder.setDelay(100); // frame delay in ms
encoder.setQuality(10); // image quality. 10 is default.
let idx = 0;

function update() {
  cubeLC.rotation.y -= Math.PI / 45;
  for (let i = 0; i < Coingroup.children.length; i++) {
    Coingroup.children[i].rotation.y -= Math.PI / 45;
    Coingroup.children[i].rotation.z += Math.PI / 45;
  }
  renderer.render(scene, camera);
  if (idx > 0) {
    encoder.addFrame(canvas.__ctx__);
  }
  idx++;
  if (idx <= 90) {
    update();
  } else {
    encoder.finish();
    console.log('complete')
  }
}

update();
