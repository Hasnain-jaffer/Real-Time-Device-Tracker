const express = require('express');
const app = express();
const http = require("http")
const socketio = require("socket.io")
const path = require("path")

const server = http.createServer(app)

const io = socketio(server)

app.set("view engine", "ejs")
app.use(express.static(path.join(__dirname, "public")))

io.on("connection", function (socket) {
        console.log("Connected:", socket.id);

    socket.on("send-location", (data)=>{
        console.log(data)
        io.emit("receive-location", { id: socket.id, ...data })
    })
    socket.on("disconnect", ()=>{
        io.emit("user-disconnected", { id: socket.id })
        console.log("User disconnected", socket.id)
    })
})

app.get('/', (req, res) => {
  res.render('index');
}  
 )

server.listen(3000, "0.0.0.0", () => {
  console.log('Server is running on port 3000');
}   
)