const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);
// ##############################
// DOCS
// ##############################
// Connections
// {
//   "LOBBY": {
//     "ROOM": [SOCKETID]
//   }
// }
// ##############################
// META
// {
//   "LOBBY": "ROBLOX",
//   "ROOM": "RHS"
// }
// ##############################
// HANDSHAKE
// {
//   "INITIATOR": bool,
//   "CDATA": CDATA,
//   "TO": SOCKETID,
//   "FROM": SOCKETID
// }
// ##############################
// SOCKETID LOOKUP
// {
//   "SOCKETID": {
//     "LOBBY": lobby,
//     "ROOM": room
//   }
// }
// ##############################

const connections = {"CLIENTS":{}};
const LOOKUP = {};

io.origins('*:*');

io.on("connection" , (socket)=>{
  console.log("CONNECTED: ", socket.id);
  // Send Client it's SOCKETID
  io.to(socket.id).emit("SOCKETID", socket.id);
  // Recive the clients META
  socket.on("META", (raw)=>{
    var data = JSON.parse(raw);
    console.log("META: ", JSON.stringify(data));
    // Create ROOM/LOBBY if it doesn't exist
    if (!connections[data.LOBBY]) {
      connections[data.LOBBY] = {};
      console.log("LOBBY created");
      if (!connections[data.LOBBY][data.ROOM]) {
        connections[data.LOBBY][data.ROOM] = [];
        console.log("ROOM created");
      }
    }
    if (!connections[data.LOBBY][data.ROOM]) {
      connections[data.LOBBY][data.ROOM] = [];
      console.log("WTF");
    }
    // Send the existing users the new user's connection data
    for (var i = 0; i < connections[data.LOBBY][data.ROOM].length; i++) {
      io.to(connections[data.LOBBY][data.ROOM][i]).emit("ADDSOCKET", socket.id);
    }
    // Add Client to the ROOM
    connections[data.LOBBY][data.ROOM].push(socket.id);
    // Add Client to LOOKUP
    LOOKUP[socket.id] = {
      "LOBBY": data.LOBBY,
      "ROOM": data.ROOM
    };
    // Send Client the already connected peers
    // NOTE: This WILL send the new user it's SOCKETID
    console.log(JSON.stringify(connections[data.LOBBY][data.ROOM]));
    io.to(socket.id).emit("META", JSON.stringify(connections[data.LOBBY][data.ROOM]));
  });

  socket.on("HANDSHAKE", (raw)=>{
    var data = JSON.parse(raw);
    console.log("HANDSHAKE: ", data.FROM, data.TO);
    io.to(data.TO).emit("HANDSHAKE", raw);
  });
  socket.on("disconnect", ()=>{
    console.log("REMOVE:",socket.id);
    var data = LOOKUP[socket.id];
    // Check to see if the socket exists??? It happens sometimes
    if (data) {
      delete LOOKUP[socket.id]
      var c = connections[data.LOBBY][data.ROOM];
      connections[data.LOBBY][data.ROOM] = c.slice(0,c.indexOf(socket.id)).concat(c.slice(c.indexOf(socket.id)+1));
      // Tell the existing users to remove the user
      for (var i = 0; i < connections[data.LOBBY][data.ROOM].length; i++) {
        io.to(connections[data.LOBBY][data.ROOM][i]).emit("REMOVE", socket.id);
      }
    }
  });
});

app.get("/", (req,res)=>{
	res.send("");
});

http.listen(3000, ()=>{
  console.log('listening on http://localhost:3000');
});
