'use strict';


/* Global Variables */

let HOST = location.origin.replace(/^http/, 'ws'),
	ws = new WebSocket(HOST);

let clientID, userName, gameID, color 
const move = {from: null, to: null};

const startingPosition = {}; for (let i = 0; i<49; i++) {startingPosition[i] = 0};
startingPosition[0]="w"; startingPosition[6]="b"; startingPosition[42]="b"; startingPosition[48]="w";

let STATE = startingPosition;

/* HTML Elements */

const boardMsgs = document.getElementById("msgs"),
	boardMsgs2 = document.getElementById("msgs2"),
	msgBoard = document.getElementById("msgBoard"),
	resultMsg = document.getElementById("resultMsg"),
	btnCreate = document.getElementById("btnCreate"),
	btnJoin = document.getElementById("btnJoin"),
	txtGameID = document.getElementById("txtGameID"),
	userNameField = document.getElementById("userNameField")

const white = document.getElementsByClassName("w"),
	black = document.getElementsByClassName("b"),
	clickedPiece=document.getElementsByClassName("clicked-p"),
	legalSquare=document.getElementsByClassName("legal-square")


/* On Page Load Events */


// start game againt oneself
function alone() {
	const payloadAlone = {
		"method" : "create",
		"clientID": clientID,
		"userName": userName,
		"alone": "yes"
	}

	ws.send(JSON.stringify(payloadAlone))
}


//

btnCreate.addEventListener("click", e => {

	if (gameID) removeElement(gameID)

	userName = userNameField.value ? userNameField.value : "Anonymous";

	const payload = {
		"method" : "create",
		"clientID": clientID,
		"userName": userName,
	}

	if (ws.readyState === ws.CLOSED) {
		alert("WebSocket connection has been closed. Please refresh the page.")
	}

	ws.send(JSON.stringify(payload));
	clearMsgBoard()
	clearListener()

})


btnJoin.addEventListener("click", join)

txtGameID.addEventListener("keypress", e => {
	if (txtGameID.value && e.code === "Enter") { 
		join()
	}
})



// WebSocket Protocol

ws.onmessage = message => {

	const response = JSON.parse(message.data);

	if (response.method === "connect") {
		clientID = response.clientID;	
		alone();
	} else if (response.method === "error") {
		alert(response.error);
	}


	else if (response.method === "create") {

		if (response.alone) {
			gameID = response.gameID;
			color = response.color;
			listen(color === "w" ? white : black)
			console.log("alone response")
		}

		else {
			gameID = response.gameID;
			populatePool(response.userName, gameID, response.clientID)

			if (response.clientID === clientID) {
				updateBoard(response.state)
				listen(response.color === "white" ? white : black)
				writeParagraph("Wait for an opponent to join your seek.")
				writeParagraph("Or share this game ID with a friend:")
				writeParagraph(`You have the ${response.color === "w" ? "white" : "black"} pieces.`, boardMsgs2)
				writeParagraph(gameID)
			}

		}
	}

	else if (response.method === "join") {

		if (response.joiner === clientID) {

			color = response.color
			const opColor = (response.color === "w" ? "b" : "w")
			writeParagraph(`You have successfully joined the game.`);
			writeParagraph(`You have the  ${color === "w" ? "white" : "black"} pieces.`, boardMsgs2);
		} 

		else {

			color = (response.color === "w" ? "b" : "w")
			writeParagraph(`${color === "w" ? "Black" : "White"} has joined the game.`, boardMsgs2);

		}

		if (document.contains(document.getElementById(gameID)))
			removeElement(response.gameID)

		updateBoard(response.state)
		clearListener()

		if (color === response.turn) {
			listen( color === "w" ? white : black )
		}

	}

	else if (response.method === "state"){
		console.log(response.gameID)
		console.log(response.clientID)

		STATE = response.state;
		updateBoard(response.state);
		clearListener()

		if (response.termination) {
			writeParagraph(response.termination, resultMsg);
		} 
		else if (response.gameID === response.clientID) {color = response.turn; listen(color === "w" ? white : black)}
		else if (response.turn === color) listen(color === "w" ? white : black);

	}

}

function populatePool(pooler = userName, gameID, creatorID) {


	const pool = document.getElementById("pool")

	let div = document.createElement("div"),
		usr = document.createTextNode(pooler)
	div.id = gameID;

	if (document.contains(document.getElementById(gameID)))
		removeElement(clientID)

	div.appendChild(usr)
	pool.appendChild(div)
	div.className = "game-link";
	div.style.cursor = "pointer";

	if (creatorID !== clientID) {
		div.title = "Click to join this game"
		div.addEventListener("click", () => {
			const payload = {
				"method" : "join",
				"clientID": clientID,
				"gameID": gameID
			}
			ws.send(JSON.stringify(payload));
			div.parentNode.removeChild(div);
		})
	}
	else {

		div.title = "Click to cancel this seek"
		div.addEventListener("click", () => {

			div.parentNode.removeChild(div);
			clearMsgBoard()

		})
	}
}

function removeElement(id) {
	const element = document.getElementById(id)
	if (element) element.parentNode.removeChild(element)
}


/* Board Events */


function listen(s) {

	const sl= s.length
	console.log(sl)
	for (let i = 0; i < sl; i++) {
		s[i].addEventListener("click", onClick) 
		s[i].style.cursor="pointer"
	}
}

function onClick() {

	const id = this.id ;

	if (this.className.includes("clicked-p")){
		clearLegalSquare()
		document.getElementById(id).className = color
		listen( color === "w" ? white : black )
	}

	else if (this.className.includes(color)){
		move.from = parseInt(id.match(/(\d+)/)[0])
		document.getElementById(id).classList.add("clicked-p")
		legalSquares(id)
		clearListener()
		listen(legalSquare)
		listen(clickedPiece)
	}


	else if (this.className.includes("legal-square")){

		move.to = parseInt(id.match(/(\d+)/)[0])
		const payload = {
			"method" : "move",
			"clientID": clientID,
			"gameID": gameID,
			"move": move
		}

		if (gameID) ws.send(JSON.stringify(payload));

		document.getElementById(id).className = color

		clearLegalSquare()
		clearClickedPiece()
		clearListener()
		}


}

function clearListener() {

	const wl=white.length
	const bl=black.length

	for (let i = 0; i < wl; i++) {
		white[i].removeEventListener("click", onClick);
		white[i].style.cursor=""
	}
	for (let i = 0; i < bl; i++) {
		black[i].removeEventListener("click", onClick);
		black[i].style.cursor=""
	}

}

function clearClickedPiece() {
	const l = clickedPiece.length;
	for (let i = 0; i < l; i++) {
		clickedPiece[0].classList.remove("clicked-p");
	}
}
function clearLegalSquare(){
	const l = legalSquare.length
	for (let i = 0; i < l; i++) {
		legalSquare[0].classList.remove("legal-square");
	}
}



function legalSquares(id) {
	/* to emulate a 2d array, uses base 7 indexing of squares to find neighboring squares */

	const b7s=id2base7(id),
		row_limit = 6, column_limit = 6,
		ls=[]

	let i, j, z

	if (b7s.length === 1) {j=0; i=parseInt(b7s)}
	else { j=parseInt(b7s.charAt(0)); i=parseInt(b7s.charAt(1)) } 

	for (let x = Math.max(0, i-2); x <= Math.min(i+2, row_limit); x++) {

		for (let y = Math.max(0, j-2); y <= Math.min(j+2, column_limit); y++) {

			if (x != i || y != j){
				z = y.toString() + x.toString()
				ls.push(parseInt(z, 7))
			}

		}

	}

	ls.forEach( (element, index, ls) => {

		if (STATE[element] === 0) {
			document.getElementById("sq_" + ls[index].toString()).classList.add("legal-square")
		}

	})

}


function updateBoard(state) {

	// Clear Board
	const wl = white.length,
		bl = black.length;

	for (let i=0; i<wl; i++) {if (white[0]) white[0].className=""}
	for (let i=0; i<wl; i++) {if (black[0]) black[0].className=""}

	// Read new state
	Object.entries(state).forEach( ([key, value]) => {
		if (value) {document.getElementById("sq_" + key).className=value}
	})

}


/* Utils */

function join() {

	gameID = txtGameID.value;
	const payload = {
		"method" : "join",
		"clientID": clientID,
		"gameID": gameID
	}
	ws.send(JSON.stringify(payload));
	boardMsgs.innerHTML='';
	resultMsg.innerHTML='';
}

function id2base7(id) {
	/* convert id to base 7. Example: "sq_8" -> "12"  */

	return parseInt(id.match(/(\d+)/)[0]).toString(7);

}


function colorTurn(turn) {

	if (turn % 2 === 0) return "w"
	else return "b"

}


/* Game Messages */

function wrap(el, wrapper) {
	el.parentNode.insertBefore(wrapper, el);
	wrapper.appendChild(el);
}

function writeParagraph(string, div = boardMsgs) {

	let p = document.createElement("p"),
		msg = document.createTextNode(string)

	p.appendChild(msg)
	div.appendChild(p)

}

function clearMsgBoard() {
	boardMsgs.innerHTML='';
	boardMsgs2.innerHTML='';
	resultMsg.innerHTML='';
}



/* TEST */

document.addEventListener("keypress", e => {

	if ( e.code === "KeyJ" ) focusJoin()

})

function focusJoin() {

	// works fine in firefox, in chrome though it inputs the e.code into the element...
	txtGameID.focus()

}
