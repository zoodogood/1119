
console.clear();
import express from "express";
import cors from "cors";
const app = express();
const port = 3000;


import { MemoryOptimiser }   from "./modules/memoryOptimiser.js";
import { FilesHandler }      from "./modules/filesHandler.js";
import { Image }             from "./modules/image.js";

import { Users, User }       from "./modules/users.js";

import fs                    from "fs";


let users = new Users("././data.json");


// >>---------------------------------------- {  FUNCTIONS  }



async function awaitBody(request){
  // За счёт того, что мы храним загруженные данные в свойствах промиса, мы можем получить к ним доступ извне
  let body = [];
  const getChunk = (chunk) => body.push(chunk);

  const awaitEnd = responce =>
    request.once("end", () => {
      request.removeListener("data", getChunk);
      responce( Buffer.concat(body) );
    });


  let promise = new Promise(awaitEnd);
  request.on("data", getChunk);
  return promise;
}



// >>---------------------------------------- {  STARTS  }




const Files = new FilesHandler({ startsHTML: "main.html" });


Files.events.on("ready", async () => {
  app.listen(port, () => {
    console.info(`\n  Запущен.`);
  });

});

Files.handleAllFiles();

let optimiser = new MemoryOptimiser(() => {
  Object.keys(Image.collection)
    .forEach(image => delete image.miniature);

}).init();



// >>---------------------------------------- {  ExpressListeners  }


app.use( express.urlencoded({ extended: false, limit: '40mb' }) );

app.use( cors() );
app.options('*', cors());

// LOGS
app.use((req, res, next) => {
  next();
  let action = ["addphoto", "removephoto"].find( path => req.path.startsWith(`/${path}`) );

  if ( action ){
    let timestamp = new Intl.DateTimeFormat("ru-ru", {month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"}).format();

    const ip = req.ip;
    const path = decodeURI(  req.originalUrl.slice( action.length + 2 )  );

    fs.appendFileSync("./logs.txt", `\n[${timestamp}] ${ip} ${ action.toUpperCase() } ${path}`);
  }
});


app.use((req, res, next) => {
  next();
  optimiser.updateTimeout();
});




app.get('/', (req, res) => {
  res.set("Content-Type", "text/html");
  res.send( Files.startsHTML );
});


app.get('/users/', (req, res) => {
  res.json( [...users.collection] );
});


app.get('/user/:id/', (req, res) => {
  let id = req.params.id;

  if ( id === "Всё возможное"){
    res.json(Object.keys( Image.collection ).sort( (a, b) => b.startsWith("avatar") - 1 ));
  }

  let imagesNamesList = users.collection[id]?.images;


  res.json( imagesNamesList );
});


app.get('/image/:path/', async (req, res) => {
  let path = req.params.path;
  let image = Image.collection[ path ];

  if (!image){
    res.status(404).end();
    return;
  }

  if (req.query.miniature)
    image = image.miniature ?? await image.createMiniature( req.query );


  let buffer = await image.getBuffer();
  res.set("Content-Type", `image/${ image.getFormat() }`);
  res.send( buffer );
});


app.post('/addphoto/:user/:path/', async (req, res) => {
  let path = req.params.path;
  let id   = req.params.user;

  let user = users.get(id);

  if (!user){
    res.status(404).end();
    return;
  }

  /** Неподдерживаемый формат, например, mp3 */
  if ( !Files.allowFormat(path) ){
    res.status(406).end();
    return;
  }

  let body = await awaitBody(req);

  /** Если изображение уже существует */
  let sameNameImage = Image.collection[path];
  if ( sameNameImage?.buffer?.equals(body) ){
    /** Если изображение существует у пользователя вернуть 405, иначе добавить путь к изображению и вернуть 208 */
    if ( user.images?.includes(path) ){
      res.status(405).end();
      return;
    }

    user.addImage(path);
    res.status(208).end();
    return;

  }


  Image.create(path, body);
  user.addImage(path);

  res.status(201).end();
});


app.delete('/removephoto/:user/:path/', async (req, res) => {
  let path = req.params.path;
  let id   = req.params.user;

  let user = users.get(id);

  if (!user){
    res.status(404).end();
    return;
  }

  if ( !user.images?.includes(path) ){
    res.status(405).end();
    return;
  }


  user.removeImage(path);
  res.status(200).end();
});


app.post('/copyimage/:user/:path/', async (req, res) => {
  let path = req.params.path;
  let id   = req.params.user;

  let user = users.get(id);

  if (!user){
    res.status(404).end();
    return;
  }

  if ( !Image.collection[path] ){
    res.status(405).end();
    return;
  }

  if ( user.images?.includes(path) ){
    res.status(412).end();
    return;
  }


  user.addImage(path);
  res.status(200).end();
});


app.post('/createuser/:user/', async (req, res) => {
  let index  = req.query.index  || -1;
  let about  = req.query.about  || "";
  const role = req.query.role === "teacher" ? "teacher" : "student";

  let avatar = req.query.avatar || null;
  if ( avatar && !avatar.startsWith("http") ){
    if (!Image.collection[avatar]){
      return res.status(406).end();
    }
    avatar = `/image/${req.query.avatar}`;
  }


  let status = users.create({ id: req.params.user, avatar, role, about, index });
  res.status( status ).end();
});




app.use((error, req, res, next) => {
  console.log("ERR");
  console.error(error);
  res.status(500).end();
});

app.use((req, res, next) => {
  res.redirect('/');
});


// >>---------------------------------------- {  Other  }



process.on('unhandledRejection', (err, promise) => {
  console.log("\x1B[90mНеобработанное");
  console.log(`Отклонение:\x1B[39m`);
  console.log(err);
});
