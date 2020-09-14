'use strict';

const Game = require("./lib/Game.js").Game
const guid = require("./lib/utils.js").guid
const http = require("http");
const websocketServer = require("websocket").server
const app = require("express")();

/*--- global variables ---*/
let color;
const clients = [];
const g = {}; //games
/*------------------------*/


routeURLs(app)

const wsServer = new websocketServer({
	"httpServer" : httpLaunch()
})

runWebSocket(wsServer)


/*-----*/

function runWebSocket(wsServer){
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
			protocol(JSON.parse(message.utf8Data))
		})
	})

}


function routeURLs(app) {
	app.get("/", (req, res) => res.sendFile(__dirname + "/" + "client/index.html"))
	app.get('/style.css', (req, res) => res.sendFile(__dirname + "/" + "client/style.css"))
	app.get('/client.js', (req, res) => res.sendFile(__dirname + "/" + "client/client.js"))
	app.listen(9091, () => console.log("Listening on http port 9091"))
}


function httpLaunch(hostname ='127.0.0.1', port = '9090') {
	const httpServer = http.createServer();
	httpServer.listen(port, hostname, () => console.log(`Listening on ${port}.`))
	return httpServer;
}


function protocol(result) {

	if (result.method === "create") {

		const gID = guid();
		g[gID] = new Game(result.clientID)

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

			Object.values(g[gID].players).forEach( c => clients[c].connection.send( JSON.stringify(payload) ) )

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

}
