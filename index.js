'use strict';

/* Imports */

const Game = require("./lib/Game.js").Game,
	guid = require("./lib/utils.js").guid,
	http = require("http"),
	websocketServer = require("websocket").server,
	express = require("express"),
	path = require("path"),
	app = express()

/* Global Variables */

const PORT = process.env.PORT || 9090,
	clients = {},
	games = {}
let color;


// Serve client files with Express
app.use(express.static(path.join(__dirname, 'client')))


/* HTTP Server Instantiation */

const httpServer = http.createServer(app).listen(PORT, () => console.log(`httpServer listening on ${PORT}.`))


/* WebSocket Server Instantiation and Requests*/

const wsServer = new websocketServer({
	"httpServer": httpServer
})

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

/*---------*/

function protocol(result) {

	if (result.method === "create") {

		console.log(result.alone)
		if (result.alone) { // game againsts oneself
			games[result.clientID] = new Game(result.clientID, "w")
			games[result.clientID].opponent = result.clientID
			const payload = {
				"method": "create",
				"clientID": result.clientID,
				"gameID": result.clientID,
				"state": games[result.clientID].position,
				"color": Object.keys(games[result.clientID].players)[0],
				"alone": true
			}
			clients[result.clientID].connection.send(JSON.stringify(payload));
		}

		else {
			console.log(result.userName)
			const gameID = guid();
			games[gameID] = new Game(result.clientID)

			const payload = {
				"method": "create",
				"clientID": result.clientID,
				"gameID": gameID,
				"state": games[gameID].position,
				"color": Object.keys(games[gameID].players)[0],
				"userName": result.userName
			}

			//clients[result.clientID].connection.send(JSON.stringify(payload));
			Object.keys(clients).forEach(client => clients[client].connection.send(JSON.stringify(payload)));
		}
	}

	else if (result.method === "join") {

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

			Object.values(games[gameID].players).forEach( c => {
				clients[c].connection.send( JSON.stringify(payload) ) 
				console.log(c)
			})

		}

	}


	else if (result.method === "move") {

		const gameID = result.gameID
		games[gameID].move = result.move

		const payload = {
			"method": "state",
			"clientID": result.clientID,
			"gameID": gameID,
			"state": games[gameID].position,
			"turn": games[gameID].turn,
			"termination": games[gameID].termination
		}

		if (gameID === result.clientID) clients[result.clientID].connection.send( JSON.stringify(payload) )
		else Object.values(games[gameID].players).forEach( clientID => clients[clientID].connection.send( JSON.stringify(payload) ) )

	}

}
