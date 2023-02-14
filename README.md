# nft-images-generation

this is an experemental project that can generates gif images using threejs, canvas and gl in the server, text is fetched from a metadata api url hardcoded in src/index.js

threejs is supposed to run in a browser so most of work was hacking the THREE.WebGLRenderer to render in a virtual mocked dom canvas, so ignore any error saying something is not supported!

Running this in a machine with no GPU result a medium image quality and slow rendering even with paralel processing, took 10 minutes to generate 8 gif clips (600x600) with 90

running this version which generate 1000 nft take 16 hours and run out of memory

xvfb-run node src/index.js 249 372 &
xvfb-run node src/index.js 874 1000 &
xvfb-run node src/index.js 749 873 &
xvfb-run node src/index.js 624 748 &

1. Install dependencies

```bash
yarn
```

2. Start it

```bash
yarn generate
```
