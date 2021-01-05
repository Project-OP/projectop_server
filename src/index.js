import express from "express";
var path = require('path');

import {MRooms} from "./MRooms";
import {MPlayer, InitMPlayer} from "./MPlayer";

const session = require("express-session");

import * as crypto from "crypto";
import {RequestHandler} from "./RequestHandler";
import {Player} from "./data/Player";
import { MDeck } from "./MDeck";
import { IllegalOperationError } from "./IllegalOperationError";
import { isConstTypeReference } from "typescript";
let ws = require('express-ws')


const expressSanitizer = require("express-sanitizer");
//const errorhandler = require('errorhandler')
const MemoryStore = require("memorystore")(session);

const app = express();
ws = ws(app);


const port = 3000;
const sessionStore = new MemoryStore({
  checkPeriod: 86400000 // prune expired entries every 24h
});

InitMPlayer(sessionStore);

//var Datastore = require('nedb');
//var db = new Datastore(); //todo add persistence some day :D
var rooms = new MRooms();
const requestHandler = new RequestHandler(rooms);
MPlayer.rooms = rooms;


var sess = {
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
  secret: crypto.randomBytes(64).toString('hex'),
  store: sessionStore  
}
const sessPars = session(sess); 
if (app.get('env') === 'production') {
  app.set('trust proxy', 1) // trust first proxy
  sess.cookie.secure = true // serve secure cookies
}
 
app.use(sessPars);
app.use(express.json());
app.use(expressSanitizer());

const base = __dirname.substr(0,__dirname.lastIndexOf(path.sep));
const static_folder = base+"/static";
app.use('/', express.static(static_folder));
app.use('/lobby', express.static(static_folder));
app.use('/table/*', express.static(static_folder));


//app.use('/static', express.static(__dirname + '/static'));
console.log(base,"webapp at "+static_folder);



ws.getWss().on('connection', function(ws, req) {
  //requestHandler.hb.Conn(ws,req);
  //console.log("new heartbeat connection");
  ws.send("hello from server");
});

/*ws.getWss().on('close', function(ws, req) {
  //requestHandler.hb.Close(ws,req);
  //console.log("ws disconnect: "+req.session);
  
});
*/

app.ws('/heartbeat', function(ws, req) {
  
  ws.on('close', function(msg) {
    //console.log("ws close: "+msg);
    requestHandler.hb.Close(ws, req, msg);
  });

  ws.on('message', function(msg) {

    requestHandler.hb.Beat(ws, req, msg);
  });

  ws.on('error', function(msg) {
    requestHandler.hb.Err(ws, req, msg);
  });

});

app.get('/game/new/:name', (req, res) => {
    
    let player = checkSetPlayer(req,res);
    const newRoom = rooms.Create(player.sessId);
      
    if (player.roomId != ""){
      const r = rooms.Get(player.roomId);
      if (r == null){
        player.roomId = "";
      }
    }
  
    newRoom.Join(player,true)    
  
    //let r = newRoom.RoomInfo(player);
    //res.json(r);
    res.status(201).json({status:'created',id:newRoom.id});
    console.log("New room created with id: "+newRoom.id+", now "+rooms.Size + " rooms online");

 
})
/*
app.get('/app', (req, res) => {
  res.sendFile(base+"/app/app.zip");
})
*/




app.get('/game/debug/clear', (req, res) => {
    
  MPlayer.Delete(req.session.id);
  res.status(200).send({status:'deleted'});

})

app.get('/game/id/:uuid', (req, res) => {
    const id = req.params.uuid;
    const room = requestHandler.GetRoom(id);
    const player = getPlayer(req,res);
    if (!room.Has(player)){
      throw new IllegalOperationError("cannot show room","you are not in this room");
    }
    requestHandler.RoomInfo(player,room,req,res);
     
})

app.get('/game/id/:uuid/notifyactive/', (req, res) => {
  const id = req.params.uuid;
  console.log("recv nudge");
  const room = requestHandler.GetRoom(id);
  room.NudgeTurn();
  //const roominfo = room.RoomInfo(player);
  res.send("");

})



app.get('/game/id/:uuid/join/:name', (req, res) => {
  const id = req.params.uuid;

  const room = requestHandler.GetRoom(id);
  let player = getPlayer(req,res,true);
  if (!player){
    player = checkSetPlayer(req,res);
  }
  //console.log(player.name + " joining");
  room.Join(player)
  //console.log(player.name + " joined");
  const roominfo = room.RoomInfo(player);
  res.send(roominfo);

})

app.get('/game/id/:uuid/leave', async (req, res, next) => {
  try{
    const id = req.params.uuid;
    const room = requestHandler.GetRoom(id);
    let player = getPlayer(req,res,true);
    await room.Leave(player);
    const roominfo = room.RoomInfo(player);
    res.send(roominfo);
  
  }catch(e){
    next(e);
  }
    
  //res.send({status:'left'}); 
})

app.get('/game/id/:uuid/sit/:where?', (req, res) => {
  const id = req.params.uuid;
  const _where = req.params.where || -1;
  const room = requestHandler.GetRoom(id);
  let player = getPlayer(req,res,true);
  room.Sit(player, _where);
  const roominfo = room.RoomInfo(player);
  //console.log(roominfo);
  res.send(roominfo);
 
})
app.get('/game/id/:uuid/sitout/:back', async (req, res, next) => {
  try{
    const id = req.params.uuid;
    let back = req.params.back.toLowerCase();
    console.log("sitin",back);

    back = back == "true";
    const room = requestHandler.GetRoom(id);
    let player = getPlayer(req,res,true);
    console.log("sitin",back);
    if (back){
      room.Sitin(player);
    }else{
      await room.Sitout(player);
    }
    
    const roominfo = room.RoomInfo(player);
    res.send(roominfo);
   
  }catch(e){
    next(e);
  }
  
})
app.get('/game/id/:uuid/admin/set/:amount', (req, res) => {
  const id = req.params.uuid;
  const amount = req.params.amount;
  const room = requestHandler.GetRoom(id);
  let player = getPlayer(req,res,true);
  const namount = Number.parseInt(amount)
  room.Admin_SetAmount(player,namount);
  const roominfo = room.RoomInfo(player);
  console.log(player.name + " changed amount to "+namount);
  res.send(roominfo);
 
})

app.get('/game/id/:uuid/admin/nextbb/:bb', (req, res) => {
  const id = req.params.uuid;
  const bb = req.params.bb;
  let player = getPlayer(req,res,true);

  const room = requestHandler.GetRoom(id);
  room.SetNextBB(player, bb);
  
  const roominfo = room.RoomInfo(player);
  res.json(roominfo);

})

app.get('/game/id/:uuid/admin/fold/', async (req, res) => {
  const id = req.params.uuid;
  const room = requestHandler.GetRoom(id);
  let player = getPlayer(req,res,true);
  await room.Admin_Fold_Current(player);
  const roominfo = room.RoomInfo(player);
  console.log("admin folding");
  res.send(roominfo);
 
})
app.get('/game/id/:uuid/admin/kick/', async (req, res) => {
  const id = req.params.uuid;
  const room = requestHandler.GetRoom(id);
  let player = getPlayer(req,res,true);
  await room.Admin_Kick_Current(player);
  const roominfo = room.RoomInfo(player);
  console.log("admin folding");
  res.send(roominfo);
 
})
app.get('/game/id/:uuid/admin/promote/all', (req, res) => {
  const id = req.params.uuid;
  const room = requestHandler.GetRoom(id);
  let player = getPlayer(req,res,true);
  room.SetAdmin(player,undefined, true);
  console.log(player.name + " changed all to admins");
  const roominfo = room.RoomInfo(player);

  res.send(roominfo);
 
})
app.get('/game/id/:uuid/admin/revoke/all', (req, res) => {
  const id = req.params.uuid;
  const room = requestHandler.GetRoom(id);
  let player = getPlayer(req,res,true);
  room.SetAdmin(player,undefined, false);
  console.log(player.name + " changed all to non admins");
  const roominfo = room.RoomInfo(player);

  res.send(roominfo);
 
})
/*
app.get('/game/id/:uuid/draw/', (req, res) => {
    const id = req.params.uuid;
    const room = requestHandler.GetRoom(id);
    const carddrawn = room.Deck.Take(1);
    const p = getPlayer(req, res);
    // TODO
    //req.session.cards = req.session.cards.concat(carddrawn);
    res.send({cards:carddrawn});
    return;
  

})
*/
app.get('/wstest/', (req, res) => {
  let v  = `
  <script>
    var w = new WebSocket('ws://localhost:3000/heartbeat');
    w.onopen = function(){ 

      var beat = function(){
        setTimeout(function(){
          w.send('Heartbeat');
          if (w.readyState == w.OPEN){
            beat();
          }
          
        },10000);
      }
      w.send('Heartbeat');
      beat();
      
    }
    w.onmessage = function(e){
      console.log(e.data);
    }
    w.onclose = function(){
      console.log('closed');
    } 
    </script>
  `;

  res.send(v);

})

app.get('/game/myroom/', (req, res) => {
  const player = getPlayer(req, res);
  requestHandler.MyRoom(player, req,res);  
})

app.get('/game/id/:uuid/members', async (req, res, next) => {
  try{


    const id = req.params.uuid;
    const room = requestHandler.GetRoom(id);
    res.json(await room.Members(id));
  }catch(e){
    next(e);
  }
})


app.get('/game/id/:uuid/startgame', async (req, res, next) => {
  try{
    
    const id = req.params.uuid;
    const room = requestHandler.GetRoom(id);
    let player = getPlayer(req,res,true);
    await requestHandler.StartGame(player.sessId,room);
    const roominfo = room.RoomInfo(player);
    //console.log(roominfo);
    res.send(roominfo);
  }catch(e){
    next(e);
  }
 
})


app.get('/game/id/:uuid/turn/:action/:amount?', async (req, res, next) => {
  try{
    

    const id = req.params.uuid;
    const action = req.params.action; // call, fold, set
    const amount = req.params.amount;
    const sess = req.session.id;
    let player = getPlayer(req,res);
    const room = await requestHandler.Turn(sess, id, action, amount);

    const roominfo = room.RoomInfo(player);
    res.send(roominfo);

  }catch(e){
    next(e);
  }
 
})

app.get('/game/id/:uuid/refresh/', (req, res) => {
  const roomid = req.params.uuid;
  let player = getPlayer(req,res,true);
  const room = requestHandler.GetRoom(roomid);
  //console.log("ISD",player,room);
  const roominfo = room.RoomInfo(player,true);
  res.send(roominfo);
 
})





app.use(function(err, req, res, next) {
  if (err['isillegaloperationerror']){
    res.status(500).json({status:err.status,error:err.error,reason:err.cause});
  }else{
    console.trace(err);  
  }
});

app.listen(port, () => {
  console.log(`app listening at http://0.0.0.0:${port}`)
})

function sanitizeName(req, res){
  if (req.params.name.length > 20){
    console.log("invalid name attempt (len): "+req.params.name);
    throw new IllegalOperationError("cannot perform operation","name too long");
  }

  let name = req.sanitize(req.params.name);
  //name = name.replace(/^[^-\s][^a-z0-9 _]/gi,'');
  if (name.length <= 1){
    throw new IllegalOperationError("cannot set name", "name must be at least 2 characters long");
  }
  name = name.match(/^[^-\s][\w\s-]+/gi,'')[0];
  console.log(name);
  
  if (name != req.params.name){
    console.log("invalid name attempt (chars): "+req.params.name);
    throw new IllegalOperationError("cannot perform operation","invalid characters in name");
  }

  return name;
}

function checkSetPlayer(req, res){

  if (!req.session.player){
    if (!req.params.name){
      throw new IllegalOperationError("cannot perform operation","no name given");
   }
    let name = sanitizeName(req,res);
    
    if (name == null){
      throw new IllegalOperationError("cannot create name","invalid characters in name");
      
    }
    
    if (req.session.id === undefined){
      throw new IllegalOperationError("cannot perform operation","session undefined");
    }
    const player = new Player(req.session.id , name);
    //TODO remove player references
    req.session.player = player;
    console.log("player "+player.name+" created with sessid "+player.sessId);
  }else{
    const player = req.session.player;
    let oldname = player.name;
    let name = sanitizeName(req,res);
    
    player.name = name;
    console.log("player name changed from " +  oldname + " to "+name);
    return player;

  }
  return req.session.player;

}

function getPlayer(req, res, dontsend = false){
  if (!req.session.player){
    if (dontsend){
      return null;
    }
    throw new IllegalOperationError("cannot perform request","you are not registered");
  }
  return req.session.player;
  
}