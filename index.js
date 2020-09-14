'use strict';
const Game = require("./lib/Game.js").Game
const gp = require("./lib/gamePlay.js").gamePlay
const guid = require("./lib/utils.js").guid
const http = require("http");
const app = require("express")();
app.get("/", (req, res) => res.sendFile(__dirname + "/" + "client/index.html"))
app.get('/style.css', (req, res) => res.sendFile(__dirname + "/" + "client/style.css"))
app.get('/client.js', (req, res) => res.sendFile(__dirname + "/" + "client/client.js"))
app.listen(9091, () => console.log("Listening on http port 9091"))
const websocketServer = require("websocket").server
const httpServer = http.createServer();
const hostname = '127.0.0.1', port = '9090';
httpServer.listen(port, hostname, () => console.log(`Listening on ${port}.`))

const wsServer = new websocketServer({
	//JSON format
	"httpServer":httpServer
})
// debug function
function debug() {
	Object.keys(games).forEach(key => {
		let wp = 0;
		Object.values(games[key].state).forEach( v => { if (v === "w") wp++})
		console.log(`Game ${key} has ${wp} white pieces`)
	})
}
/*--- global variables ---*/
let color = null;
const clients = [];
const g = {}; //games
/*------------------------*/

wsServer.on("request", request => {
	const connection = request.accept(null, request.origin); 
	const clientID = guid() 
	clients[clientID] = { "connection": connection }
	const payload = {
		"method": "connect",
		"clientID": clientID
	}
	connection.send(JSON.stringify(payload))

	connection.on("open", () => console.log("WS connection opened."))
	connection.on("close", () => console.log("WS connection has been closed."))

	connection.on("message", message => {
		console.log(`this is a message the server has received: ${message.utf8Data}`)
		const result = JSON.parse(message.utf8Data)

		if (result.method === "create") {
			const gID = guid();
			g[gID] = new Game(result.clientID)
			console.log(g[gID].position)
			const payload = {
				"method": "create",
				"gameID": gID,
				"state": g[gID].position,
				"color": Object.keys(g[gID].players)[0]
			}
			clients[result.clientID].connection.send(JSON.stringify(payload));
		}

		else if (result.method === "join" && clients.length < 2) {
			if (!Object.keys(g).includes(result.gameID)) { 
				const payload = {
					"method": "error",
					"error": "The game you want to join hasn't been created."
				}
				clients[result.clientID].connection.send(JSON.stringify(payload))
			}
			else {
				const gID = result.gameID;
				g[gID].opponent = result.clientID;
				const payload = {
					"method": "join", 
					"joiner": result.clientID,
					"gameID": gID, 
					"state": g[gID].position,
					"turn": g[gID].turn,
					"color": Object.keys(g[gID].players).find( c => g[gID].players[c] === result.clientID )
				}
				console.log(payload.color)
				sendAll(Object.values(g[gID].players), payload)
			}
		}

		else if (result.method === "move") {
			const gID = result.gameID
			g[gID].move = result.move
			const payload = {
				"method": "state",
				"state": g[gID].position,
				"turn": g[gID].turn,
				"termination": g[gID].termination
			}

			Object.values(g[gID].players).forEach( clientID => clients[clientID].connection.send( JSON.stringify(payload) ) )

		}
	})
})


/* send to all players */
function sendAll(playerIDs, payload) {
	playerIDs.forEach( c => clients[c].connection.send( JSON.stringify(payload) ) )
}
