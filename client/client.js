'use strict';
let ws = new WebSocket("ws://localhost:9090");
//global variables
let clientID = null;
let gameID = null;
let color = null; 
const startingPosition = {}; for (let i = 0; i<49; i++) {startingPosition[i] = 0};
startingPosition[0]="w"; startingPosition[6]="b"; startingPosition[42]="b"; startingPosition[48]="w";
let STATE = startingPosition;
// HTML Elements
const msgs = document.getElementById("msgs");
const msgBoard = document.getElementById("msgBoard");
const resultMsg = document.getElementById("resultMsg")
const btnCreate = document.getElementById("btnCreate");
const txtGameID = document.getElementById("txtGameID");
let white = document.getElementsByClassName("w")
let black = document.getElementsByClassName("b")
let clickedPiece=document.getElementsByClassName("clicked-p");
let legalSquare=document.getElementsByClassName("legal-square");

/* TESTING */
document.addEventListener("keypress", e => {
	if ( e.code === "KeyJ" ) focusJoin()
})
function focusJoin() {
// works fine in firefox, in chrome though it inputs the e.code into the element...
	txtGameID.focus()
}
/* --------*/

btnCreate.addEventListener("click", e => {
	const payload = {
		"method" : "create",
		"clientID": clientID
	}
	ws.send(JSON.stringify(payload));
	msgs.innerHTML='';
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
	msgs.innerHTML='';
	resultMsg.innerHTML='';
	}
})

function writeParagraph(string, div = msgs) {
	let p = document.createElement("p")
	let msg = document.createTextNode(string)
	p.appendChild(msg)
	div.appendChild(p)
	return
}

ws.onmessage = message => {
	const response = JSON.parse(message.data);
	if (response.method === "connect") {
		clientID = response.clientID;	
	}
	else if (response.method === "error") {
		alert(response.error);
	}
	else if (response.method === "create") {
		gameID = response.gameID;
		updateBoard(response.state)
		listen(response.color === "white" ? white : black)
		writeParagraph(`You have the ${response.color === "w" ? "white" : "black"} pieces.`)
		writeParagraph("To play, share this ID with your opponent:")
		writeParagraph(gameID)

	}
	else if (response.method === "join") {


		if (response.joiner === clientID) {
			color = response.color
			const opColor = (response.color === "w" ? "b" : "w")
			writeParagraph(`You have successfully joined game.`);
			writeParagraph(`You have the  ${color === "w" ? "white" : "black"} pieces.`);
		} else {
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

function colorTurn(turn) {
	if (turn % 2 === 0) return "w"
	else return "b"
}

// GAME PLAY


/* event listening */


let move = {from: null, to: null};

function listen(s) {
	const sl= s.length
	for (let i = 0; i < sl; i++) {
		s[i].addEventListener("click", onClick) 
	}
}

function onClick() {
	let id = this.id ;

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
	const cpl=clickedPiece.length
	for (let i = 0; i < cpl; i++) {
		clickedPiece[0].classList.remove("clicked-p");
	}
}
function clearLegalSquare(){
	const lslength= legalSquare.length
	for (let i = 0; i < lslength; i++) {
		legalSquare[0].classList.remove("legal-square");
	}
}


function id2b7(id) {
	/* convert id to base 7 */
	const	cs = parseInt(id.match(/(\d+)/)[0]) //retrieve id as int
	
	const b7s = cs.toString(7); //base7square
	return b7s
}

function legalSquares(id) {
	/* to emulate a 2d array, uses base 7 indexing of squares to find neighboring squares */

	const b7s=id2b7(id)
	const row_limit = 6 ;
	const column_limit = 6 ;
	const ls=[]
	let i = null, j = null, z = null;

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
	ls.forEach((x,index,ls) =>
		{
		let	y=ls[index].toString()
		if (STATE[x] === 0) {
			document.getElementById("sq_" + y).classList.add("legal-square")
		}
	})

}

function updateBoard(state) {
	// Clear Board
	const wl = white.length;
	const bl = black.length;
	for (let i=0; i<wl; i++) {if (white[0]) white[0].classList.remove("w")}
	for (let i=0; i<wl; i++) {if (black[0]) black[0].classList.remove("b")}
	// Read new state
	Object.entries(state).forEach( ([key, value]) => {
		if (value) {document.getElementById("sq_" + key).classList.add(value);}
	}
	)
}
