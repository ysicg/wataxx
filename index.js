'use strict';

const gp = require("./gamePlay.js")
const http = require("http");
const app = require("express")();
app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"))
app.get('/style.css', (req, res) => res.sendFile(__dirname + "/" + "style.css"))
app.get('/client.js', (req, res) => res.sendFile(__dirname + "/" + "client.js"))
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
const games = {};
const startingPosition = { 
	// global variable kept getting implicitly reassigned for some reason, so i implemented this clumsy getter... which doesn't solve the problem...
	sp: (() => {
		let x = {}; 
		for (let i = 0; i<49; i++) {x[i] = 0};
		x[0]="w"; x[6]="b"; x[42]="b"; x[48]="w";
		return x;
	})(),
	get gen() {return this.sp}
}

wsServer.on("request", request => {
	//connect
	const connection = request.accept(null, request.origin); // null means any protocol
	const clientID = guid() //generate a new clientID
	clients[clientID] = { "connection": connection }
	const payload = {
		"method": "connect",
		"clientID": clientID
	}
	connection.send(JSON.stringify(payload))
	connection.on("open", () => console.log("WS connection opened."))
	connection.on("close", () => console.log("WS connection has been closed."))
	connection.on("message", message => {
		// on receiving a message from a client (will fail if client sends in format != JSON)
		console.log(`this is a message the server has received: ${message.utf8Data}`)
		const result = JSON.parse(message.utf8Data)
		if (result.method === "create") {
			// a user wants to create a new game

			const gameID = guid();
			const clientID = result.clientID;
			const color = Math.round(Math.random()) ? "w" : "b";
			clients[clientID].gameID = gameID
			games[gameID] = {
				"players": {[color] : clientID},
				"state": Object.assign({},startingPosition.gen), // shallow clone, otherwise startingPosition.gen gets updated by gamePlay
				"turn": 0
			}
			const payload = {
				"method": "create",
				"gameID": gameID,
				"game": games[gameID]
			}
			clients[clientID].connection.send(JSON.stringify(payload));
		}
		// a client wants to join an existing game
		if (result.method === "join" && clients.length < 2) {
			if (!Object.keys(games).includes(result.gameID)) { 
				const payload = {
					"method": "error",
					"error": "The game you want to join hasn't been created."
				}
				clients[result.clientID].connection.send(JSON.stringify(payload))
			}
			else {
				const clientID = result.clientID;
				const gameID = result.gameID;
				const color = Object.keys(games[gameID].players)[0]
				games[gameID].players[color === "w" ? "b" : "w" ] = clientID
				games[gameID].state = Object.assign({},startingPosition.gen)
				const payload = {
					"method": "join", 
					"joiner": clientID,
					"color": color === "w" ? "b" : "w",
					"gameID": gameID, 
					"game": games[gameID],
					"turn": 0
				}
				sendAll(gameID, payload)
			}
		}
		if (result.method === "move") {
			const clientID = result.clientID;
			const gameID = result.gameID;
			const move = result.move;


			let color = Object.keys(games[gameID].players).find( key => games[gameID].players[key] === clientID)
			const newState = gp.gamePlay(color, move, games[gameID].state );
			const gameResult = checkTermination(newState, pieceCounter(newState))
			console.log(`GAME RESULT : ${gameResult}`)

			games[gameID].state = newState;
			games[gameID].turn++;
			const payload = {
				"method": "state",
				"state": newState,
				"turn": games[gameID].turn,
				"termination": gameResult
			}
			if (games[gameID].players["w"]) clients[games[gameID].players["w"]].connection.send(JSON.stringify(payload));
			if (games[gameID].players["b"]) clients[games[gameID].players["b"]].connection.send(JSON.stringify(payload));

		}
		

	})

})
function pieceCounter(state) {
	const wc = Object.values(state).reduce( (ac, cv) => {if (cv === "w") ac++; return ac}, 0);
	const bc = Object.values(state).reduce( (ac, cv) => {if (cv === "b") ac++; return ac}, 0);
	return {"wc" : wc, "bc" : bc}
}

function checkTermination(state, pc) {
	if (pc.wc === 0) return "BLACK WINS"
	else if (pc.bc === 0) return "WHITE WINS"
	else if (Object.values(state).filter(e => e === 0).length  === 0) 
	{
		if (pc.wc - pc.bc === 0) return "DRAW"
		else if (pc.wc - pc.bc > 0) return "WHITE WINS"
		else if (pc.wc - pc.bc < 0) return "BLACK WINS"
		}

	else return null
}

/* some guid generator */
function S4() { return (((1+Math.random())*0x10000)|0).toString(16).substring(1); }
// then to call it, plus stitch in '4' in the third group
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();


/* send to all players */
function sendAll(gameID, payload) {
	Object.values(games[gameID].players).forEach( c => clients[c].connection.send(JSON.stringify(payload)))
}
