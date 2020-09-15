'use strict';

/* Imports */

const Game = require("./lib/Game.js").Game,
	guid = require("./lib/utils.js").guid,
	http = require("http"),
	websocketServer = require("websocket").server,
	app = require("express")()

/* Global Variables */

const PORT = process.env.PORT || 9090,
	clients = [],
	games = {}
let color;


// Serve client files with Express
routeURLs(app)


/* HTTP Server Instantiation */

const httpServer = http.createServer(app).listen(PORT, () => console.log(`httpServer listening on ${PORT}.`))


/* WebSocket Server Instantiation */

const wsServer = new websocketServer({
	"httpServer": httpServer
})

// Handle WebSocket Requests
runWebSocket(wsServer)


/*-----------------------------------------------*/

function routeURLs(app) {

	app.get("/", (req, res) => res.sendFile(__dirname + "/" + "client/index.html"))
	app.get('/style.css', (req, res) => res.sendFile(__dirname + "/" + "client/style.css"))
	app.get('/client.js', (req, res) => res.sendFile(__dirname + "/" + "client/client.js"))
}

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
