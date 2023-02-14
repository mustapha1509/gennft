import express from 'express';
import serveIndex from 'serve-index';
import path from 'path';
let app = express();

console.log(process.cwd());

app.use(
  '/',
  express.static(path.join("..","snapshot")),
  serveIndex(path.join("..","snapshot"), { icons: true })
);

app.listen(80);
