import request from 'request';
import genBasketNFT from './genBasketNFT.js';

let p = process.argv;
if (p.length < 3) {
  console.log('usage i , j ');
  process.exit();
}
let a = p[2];
let b = p[3];

if (parseInt(b) < parseInt(a)) {
  console.log('a < b ');
  process.exit();
}

console.log('launched for ', a, b);

const requestMetadata = async (id) =>
  new Promise((resolve, reject) => {
    request(
      `https://api.saieve.io/api/v1/nfts/meta-data/${id}`,
      { json: true },
      (error, res, data) => {
        if (error) reject(error);
        else if (!error && res.statusCode == 200) resolve(data);
      }
    );
  });

for (let i = a; i <= b; ++i) {
  const nft = await requestMetadata(i);
  let indice = nft.attributes.find((item) => item.trait_type === 'Indice');
  indice = indice?.value || 0;
  indice = parseFloat(indice).toFixed(4).toString();
  let coins = nft.attributes
    .filter(
      (r) => !r.display_type && r.trait_type.toUpperCase() == r.trait_type
    )
    .map((r) => r.trait_type.toLowerCase());
  let badge = nft.attributes
    .filter((t) => t.trait_type == 'Badge')[0]
    .value.split('_')[0];
  let nftTogen = {
    title: nft.name.split('#')[0].trim(),
    id: nft.uuid.toString(),
    indice: indice,
    coins: coins,
    badge: badge,
  };

  const genNFT = await new genBasketNFT(nftTogen);
  // render jpeg for preview
  genNFT.renderJPG();
  // render gif animated nft
  genNFT.startGIFEncoder();
  genNFT.renderGIF();
}
