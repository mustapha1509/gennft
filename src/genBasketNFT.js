import { createWriteStream, readFileSync, writeFile } from 'fs';
import * as THREE from 'three';
import GIFEncoder from 'gifencoder';
import { createCanvas, loadImage } from './lib/index.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import randomColor from 'randomcolor';
import pkg from 'node-fetch';
const { fileFromSync } = pkg;

class genBasketNFT {
  width = 800;
  height = 800;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1500);
  canvas = createCanvas(this.width, this.height);
  renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false });
  encoder = new GIFEncoder(this.width, this.height);
  nbFrame = 90;
  idFrame = 0;
  constructor(data) {
    return (async () => {
      this.data = data;
      const cameraTarget = new THREE.Vector3(0, 150, 0);
      this.camera.position.set(0, 300, 500);
      this.camera.lookAt(cameraTarget);

      this.renderer.setClearColor(0x1f1e1c, 1);
      this.renderer.outputEncoding = THREE.sRGBEncoding;

      const HDRRaw = readFileSync('src/images/empty_warehouse_01_2k.hdr');

      const bgloader = new RGBELoader();
      const bgTexture = bgloader.parse(HDRRaw);
      bgTexture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.background = bgTexture;
      this.scene.environment = bgTexture;

      // LIGHTS

      const light = new THREE.AmbientLight(0x404040); // soft white light
      this.scene.add(light);

      var dirLight = new THREE.DirectionalLight(0xffffff, 2);
      dirLight.position.set(200, 400, 600).normalize();
      this.scene.add(dirLight);

      var PointLight1 = new THREE.PointLight(0xffffff, 1);
      PointLight1.position.set(350, 250, 50);
      this.scene.add(PointLight1);

      var PointLight2 = new THREE.PointLight(0xffffff, 1.5);
      PointLight2.position.set(-250, 150, 50);
      this.scene.add(PointLight2);

      const randcolors = randomColor({
        count: 4,
        format: 'rgbArray',
      });

      const rgb = randcolors.map((c) => {
        return new THREE.Vector3(c[0], c[1], c[2]);
      });

      const snoise = readFileSync('src/shader/snoise.glsl', {
        encoding: 'utf8',
        flag: 'r',
      });
      const fragment = readFileSync('src/shader/fragment.glsl', {
        encoding: 'utf8',
        flag: 'r',
      });
      const vertex = readFileSync('src/shader/vertex.glsl', {
        encoding: 'utf8',
        flag: 'r',
      });

      var randomisePosition = new THREE.Vector2(
        Math.floor(Math.random() * 50, Math.floor(Math.random() * 30))
      );
      const materialBG = new THREE.ShaderMaterial({
        uniforms: {
          u_bg: { type: 'v3', value: rgb[0] },
          u_bgMain: { type: 'v3', value: rgb[1] },
          u_color1: { type: 'v3', value: rgb[2] },
          u_color2: { type: 'v3', value: rgb[3] },
          u_time: { type: 'f', value: 0 },
          u_randomisePosition: { type: 'v2', value: randomisePosition },
        },
        fragmentShader: snoise + fragment,
        vertexShader: snoise + vertex,
      });

      const geometryBG = new THREE.PlaneGeometry(
        this.width * 3,
        this.height * 3,
        100,
        100
      );
      let meshBG = new THREE.Mesh(geometryBG, materialBG);
      meshBG.position.set(0, -200, -380);
      meshBG.scale.multiplyScalar(5);
      meshBG.rotationX = -1.0;
      meshBG.rotationY = 0.0;
      meshBG.rotationZ = 0.1;
      this.scene.add(meshBG);

      const geometryLC = new THREE.BoxGeometry(250, 250, 250);
      this.glassBox = new THREE.Mesh(
        geometryLC,
        new THREE.MeshPhysicalMaterial({
          reflectivity: 1,
          transmission: 1,
          roughness: 0,
          thickness: 2,
          metalness: 0,
          envMap: bgTexture,
        })
      );
      this.glassBox.position.set(0, 200, 100);
      this.scene.add(this.glassBox);

      const geometryLL = new THREE.BoxGeometry(255, 255, 255);
      const cubeLL = new THREE.Mesh(
        geometryLL,
        new THREE.MeshPhysicalMaterial({
          reflectivity: 1,
          transmission: 1,
          roughness: 0,
          thickness: 2,
          metalness: 0,
        })
      );
      this.glassBox.add(cubeLL);

      const logo =
        data.badge === 'diamond'
          ? 'src/images/crypto/pcld.png'
          : 'src/images/crypto/pcl.png';

      const logoTexture = await this.loadImgTexture(logo);

      const geometryC = new RoundedBoxGeometry(70, 70, 70, 10, 10);
      const cube = new THREE.Mesh(
        geometryC,
        new THREE.MeshPhysicalMaterial({
          color: 0xb6afdd,
          reflectivity: 0.5,
          envMapIntensity: 0.5,
          clearcoat: 0,
          roughness: 0,
          metalness: 0,
          map: logoTexture,
        })
      );
      this.glassBox.add(cube);
      cube.rotation.y += Math.PI / 8;

      this.Coingroup = new THREE.Group();

      let coins = data.coins;
      let count = coins.length + 1;

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
      for (let a = 0; a < coins.length; a++) {
        let anotherCoin = await this.addCoin(coins[a]);
        anotherCoin.lookAt(this.camera.position);
        anotherCoin.rotateZ((Math.random() * Math.PI) / 2);
        anotherCoin.position.set(...coords[a]);
        anotherCoin.position.normalize();
        anotherCoin.position.multiplyScalar(105);
        this.Coingroup.add(anotherCoin);
      }
      cube.add(this.Coingroup);

      const fontRaw = readFileSync(
        'node_modules/three/examples/fonts/helvetiker_regular.typeface.json',
        { encoding: 'utf8', flag: 'r' }
      );
      const fontloader = new FontLoader();
      const font = fontloader.parse(JSON.parse(fontRaw));
      const textMat = new THREE.MeshStandardMaterial({
        color: 0xfafaff,
        roughness: 0,
        metalness: 0.2,
        side: THREE.FrontSide,
      });

      const badgeTexture = await this.loadImgTexture(
        'src/images/badges/' + data.badge + '.png'
      );

      const bMat = new THREE.MeshPhysicalMaterial({
        roughness: 0.4,
        metalness: 0.7,
        color: 0xffffff,
        alphaTest: 0.2,
        transparent: true,
        map: badgeTexture,
      });

      const TextP = new THREE.Object3D();
      const gTitle = new THREE.ShapeGeometry(
        font.generateShapes(data.title, 14)
      );
      const textTitle = new THREE.Mesh(gTitle, textMat);
      TextP.add(textTitle);

      const gSubTitle = new THREE.ShapeGeometry(
        font.generateShapes('#' + data.id, 12)
      );
      const subTitle = new THREE.Mesh(gSubTitle, textMat);
      TextP.add(subTitle);

      const gIndice = new THREE.ShapeGeometry(
        font.generateShapes('INDEX: ' + data.indice, 12)
      );
      const indice = new THREE.Mesh(gIndice, textMat);
      TextP.add(indice);

      const gBadge = new THREE.PlaneGeometry(60, 60);
      const badge = new THREE.Mesh(gBadge, bMat);
      TextP.add(badge);

      gTitle.translate(-110, 100, 126);
      gSubTitle.translate(-110, 70, 126);
      gIndice.translate(-110, -110, 126);
      gBadge.translate(90, -90, 130);

      this.glassBox.add(TextP);

      const TextP2 = TextP.clone();
      TextP2.rotation.y += Math.PI / 2;
      this.glassBox.add(TextP2);

      // comment next lines because i only rotate 90 deg (this.nbFrame)

      const TextP3 = TextP.clone();
      TextP3.rotation.y += Math.PI;
      this.glassBox.add(TextP3);

      const TextP4 = TextP.clone();
      TextP4.rotation.y += (Math.PI * 3) / 2;
      this.glassBox.add(TextP4);

      return this;
    })();
  }

  async addCoin(coin) {
    let g = new THREE.CylinderGeometry(20, 20, 5, 30);
    let texture = await this.loadImgTexture(
      'src/images/crypto/' + coin + '.png'
    );
    let mat = new THREE.MeshPhongMaterial({
      map: texture,
      color: 0x888888,
      flatShading: true,
    });
    let sideMat = new THREE.MeshPhongMaterial({
      color: 0x333333,
      shininess: 70,
    });
    let coinMesh = new THREE.Mesh(g, [sideMat, mat, mat]);
    return coinMesh;
  }

  async loadImgTexture(src) {
    const img = await loadImage(src);
    const texture = new THREE.Texture(img);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    return texture;
  }

  startGIFEncoder() {
    let fileName =
      this.data.title.replace(/\s+/g, '_').toLowerCase() +
      '_' +
      this.data.badge +
      '_' +
      this.data.id +
      '.gif';
    this.encoder
      .createReadStream()
      .pipe(createWriteStream('./snapshot/' + fileName));
    this.encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat
    // trying indice in cube vilocity here
    this.encoder.setDelay(20 / parseFloat(this.data.indice)); // frame delay in ms
    this.encoder.setQuality(10); // image quality. 10 is default.
    this.encoder.start();
  }

  renderGIF() {
    this.glassBox.rotation.y -= Math.PI / 45;
    for (let i = 0; i < this.Coingroup.children.length; i++) {
      this.Coingroup.children[i].rotation.y -= Math.PI / 45;
      this.Coingroup.children[i].rotation.z += Math.PI / 45;
    }
    this.renderer.render(this.scene, this.camera);
    if (this.idFrame > 0) {
      this.encoder.addFrame(this.canvas.__ctx__);
    }
    this.idFrame++;
    if (this.idFrame <= this.nbFrame) {
      this.renderGIF();
    } else {
      this.encoder.finish();
    }
  }

  renderJPG() {
    this.renderer.render(this.scene, this.camera);
    let fileName =
      this.data.title.replace(/\s+/g, '_').toLowerCase() +
      '_' +
      this.data.badge +
      '_' +
      this.data.id +
      '.jpeg';
    let img = this.canvas.toBuffer('image/jpeg', 1.0);
    writeFile('./snapshot/' + fileName, img, (err) => {
      if (err) return console.error(err);
    });
  }
}

export default genBasketNFT;
