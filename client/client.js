'use strict';

let HOST = location.origin.replace(/^http/, 'ws')
let ws = new WebSocket(HOST);

/* Global Variables */

let clientID, gameID, color 
const move = {from: null, to: null};

const startingPosition = {}; for (let i = 0; i<49; i++) {startingPosition[i] = 0};
startingPosition[0]="w"; startingPosition[6]="b"; startingPosition[42]="b"; startingPosition[48]="w";

let STATE = startingPosition;

/* HTML Elements */

const boardMsgs = document.getElementById("msgs"),
	msgBoard = document.getElementById("msgBoard"),
	resultMsg = document.getElementById("resultMsg"),
	btnCreate = document.getElementById("btnCreate"),
	txtGameID = document.getElementById("txtGameID")

let white = document.getElementsByClassName("w"),
	black = document.getElementsByClassName("b"),
	clickedPiece=document.getElementsByClassName("clicked-p"),
	legalSquare=document.getElementsByClassName("legal-square")


/* On Page Load Events */

btnCreate.addEventListener("click", e => {

	const payload = {
		"method" : "create",
		"clientID": clientID
	}
	ws.send(JSON.stringify(payload));
	boardMsgs.innerHTML='';
	resultMsg.innerHTML='';

})

txtGameID.addEventListener("keypress", e => {

	if (txtGameID.value && e.code === "Enter") { 
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
})

// WebSocket Protocol

ws.onmessage = message => {

	const response = JSON.parse(message.data);

	if (response.method === "connect") {
		clientID = response.clientID;	
	} else if (response.method === "error") {
		alert(response.error);
	}

	else if (response.method === "create") {

		gameID = response.gameID;
		updateBoard(response.state)
		listen(response.color === "white" ? white : black)
		writeParagraph(`You have the ${response.color === "w" ? "white" : "black"} pieces.`)
		writeParagraph("To play, share this ID with your opponent:")
		writeParagraph(gameID)
		pool()

	}

	else if (response.method === "join") {

		if (response.joiner === clientID) {

			color = response.color
			const opColor = (response.color === "w" ? "b" : "w")
			writeParagraph(`You have successfully joined game.`);
			writeParagraph(`You have the  ${color === "w" ? "white" : "black"} pieces.`);
		} 

		else {

			color = (response.color === "w" ? "b" : "w")
			writeParagraph(`${color === "w" ? "Black" : "White"} has joined the game.`);

		}

		updateBoard(response.state)
		clearListener()

		if (color === response.turn) {
			listen( color === "w" ? white : black )
		}

	}

	else if (response.method === "state"){

		STATE = response.state;
		updateBoard(response.state);
		clearListener()

		if (response.termination) {
			writeParagraph(response.termination, resultMsg);
		} 
		else if (response.turn === color) listen(color === "w" ? white : black);

	}

}


/* Board Events */


function listen(s) {

	const sl= s.length
	for (let i = 0; i < sl; i++) {
		s[i].addEventListener("click", onClick) 
	}
}

function onClick() {

	const id = this.id ;

	if (this.className.includes(color)){
		move.from = parseInt(id.match(/(\d+)/)[0])
		document.getElementById(id).className = "clicked-p"
		legalSquares(id)
		clearListener()
		listen(legalSquare)
		listen(clickedPiece)
	}

	else if (this.className.includes("clicked-p")){
		clearLegalSquare()
		document.getElementById(id).className = color
		listen( color === "w" ? white : black )
	}

	else if (this.className.includes("legal-square")){

		move.to = parseInt(id.match(/(\d+)/)[0])
		const payload = {
			"method" : "move",
			"clientID": clientID,
			"gameID": gameID,
			"move": move
		}

		ws.send(JSON.stringify(payload));

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
	}
	for (let i = 0; i < bl; i++) {
		black[i].removeEventListener("click", onClick);
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

	for (let i=0; i<wl; i++) {if (white[0]) white[0].classList.remove("w")}
	for (let i=0; i<wl; i++) {if (black[0]) black[0].classList.remove("b")}

	// Read new state
	Object.entries(state).forEach( ([key, value]) => {
		if (value) {document.getElementById("sq_" + key).classList.add(value);}
	})

}


/* Utils */

function id2base7(id) {
	/* convert id to base 7. Example: "sq_8" -> "12"  */

	return parseInt(id.match(/(\d+)/)[0]).toString(7);

}


function colorTurn(turn) {

	if (turn % 2 === 0) return "w"
	else return "b"

}


/* Game Messages */

function writeParagraph(string, div = boardMsgs) {

	let p = document.createElement("p"),
		msg = document.createTextNode(string)

	p.appendChild(msg)
	div.appendChild(p)

}


function pool() {

	writeParagraph(gameID, document.getElementById("pool"))

}


/* TEST */

document.addEventListener("keypress", e => {

	if ( e.code === "KeyJ" ) focusJoin()

})

function focusJoin() {

	// works fine in firefox, in chrome though it inputs the e.code into the element...
	txtGameID.focus()

}
