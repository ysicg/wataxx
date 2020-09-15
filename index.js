'use strict';

/* Imports */

const Game = require("./lib/Game.js").Game
const guid = require("./lib/utils.js").guid
const http = require("http");
const websocketServer = require("websocket").server
const app = require("express")();

/* Global Variables */

let color;
const clients = [];
const games = {}; 


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

		const gameID = guid();
		games[gameID] = new Game(result.clientID)

		const payload = {
			"method": "create",
			"gameID": gameID,
			"state": games[gameID].position,
			"color": Object.keys(games[gameID].players)[0]
		}

		clients[result.clientID].connection.send(JSON.stringify(payload));
	}

	else if (result.method === "join" && clients.length < 2) {

		if (!Object.keys(games).includes(result.gameID)) { 

			const payload = {
				"method": "error",
				"error": "The game you want to join hasn't been created."
			}

			clients[result.clientID].connection.send(JSON.stringify(payload))
		}

		else {

			const gameID = result.gameID;
			games[gameID].opponent = result.clientID;

			const payload = {
				"method": "join", 
				"joiner": result.clientID,
				"gameID": gameID, 
				"state": games[gameID].position,
				"turn": games[gameID].turn,
				"color": Object.keys(games[gameID].players).find( c => games[gameID].players[c] === result.clientID )
			}

			Object.values(games[gameID].players).forEach( c => clients[c].connection.send( JSON.stringify(payload) ) )

		}

	}


	else if (result.method === "move") {

		const gameID = result.gameID
		games[gameID].move = result.move

		const payload = {
			"method": "state",
			"state": games[gameID].position,
			"turn": games[gameID].turn,
			"termination": games[gameID].termination
		}

		Object.values(games[gameID].players).forEach( clientID => clients[clientID].connection.send( JSON.stringify(payload) ) )

	}

}
