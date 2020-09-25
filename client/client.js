import {startingPosition, alone, id2base7, colorTurn, legalSquares} from "./gameUtils.js";

'use strict';

let HOST = location.origin.replace(/^http/, 'ws'),
	ws = new WebSocket(HOST);

/* Game Variables */

const player = {
"clientID": null,
"userName": null,
"gameID": null,
"color": null,
"move": {from: null, to: null},
"state": startingPosition()
}

/* HTML Elements */

const boardMsgs = document.getElementById("msgs"),
	boardMsgs2 = document.getElementById("msgs2"),
	msgBoard = document.getElementById("msgBoard"),
	resultMsg = document.getElementById("resultMsg"),
	btnCreate = document.getElementById("btnCreate"),
	btnJoin = document.getElementById("btnJoin"),
	txtGameID = document.getElementById("txtGameID"),
	userNameField = document.getElementById("userNameField"),
	whiteCount = document.getElementById("whiteCount"),
	blackCount = document.getElementById("blackCount"),
	popUp = document.getElementById("popUp")

const white = document.getElementsByClassName("w"),
	black = document.getElementsByClassName("b"),
	clickedPiece=document.getElementsByClassName("clicked-p"),
	legalSquare=document.getElementsByClassName("legal-square")


/* On Page Load Event Listeners*/

btnCreate.addEventListener("click", createGame) 
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
		player.clientID = response.clientID;	
		alone();
	} else if (response.method === "error") {
		alert(response.error);
	}


	else if (response.method === "create") {

		if (response.alone) {
			player.gameID = response.gameID;
			player.color = response.color;
			listen(player.color === "w" ? white : black)
		}

		else {
			player.gameID = response.gameID;
			populatePool(response.userName, response.clientID)

			if (response.clientID === player.clientID) {
				updateBoard(response.state)
				listen(response.color === "white" ? white : black)
				writeParagraph("Wait for an opponent to join your seek.")
				writeParagraph("Or share this game ID with a friend:")
				writeParagraph(`You have the ${response.color === "w" ? "white" : "black"} pieces.`, boardMsgs2)
				writeParagraph(player.gameID)
			}

		}
	}

	else if (response.method === "join") {

		if (response.joiner === player.clientID) {

			player.color = response.color
			const opColor = (response.color === "w" ? "b" : "w")
			writeParagraph(`You have successfully joined the game.`);
			writeParagraph(`You have the  ${player.color === "w" ? "white" : "black"} pieces.`, boardMsgs2);
		} 

		else {

			player.color = (response.color === "w" ? "b" : "w")
			writeParagraph(`${player.color === "w" ? "Black" : "White"} has joined the game.`, boardMsgs2);

		}

		if (document.contains(document.getElementById(player.gameID)))
			removeElement(response.gameID)

		updateBoard(response.state)
		clearListener()

		if (player.color === response.turn) {
			listen( player.color === "w" ? white : black )
		}

	}

	else if (response.method === "state"){

		whiteCount.innerHTML = response.count.wc
		blackCount.innerHTML = response.count.bc

		player.state = response.state;
		updateBoard(response.state);
		clearListener()

		if (response.termination) {
			writeParagraph(response.termination, resultMsg);
			popUp.innerHTML = response.termination;
			popUp.style.zIndex = "2"
			popUp.addEventListener("click", () => popUp.style.zIndex = "0")

		} 
		else if (response.gameID === response.clientID) {player.color = response.turn; listen(player.color === "w" ? white : black)}
		else if (response.turn === player.color) listen(player.color === "w" ? white : black);

	}

}

function populatePool(pooler, creatorID) {


	const pool = document.getElementById("pool")

	let div = document.createElement("div"),
		usr = document.createTextNode(pooler)
	div.id = player.gameID;

	if (document.contains(document.getElementById(player.gameID)))
		removeElement(player.clientID)

	div.appendChild(usr)
	pool.appendChild(div)
	div.className = "game-link";
	div.style.cursor = "pointer";

	if (creatorID !== player.clientID) {
		div.title = "Click to join this game"
		div.addEventListener("click", () => {
			whiteCount.innerHTML = '2';
			blackCount.innerHTML = '2';
			const payload = {
				"method" : "join",
				"clientID": player.clientID,
				"gameID": player.gameID
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
			alone()

		})
	}
}

function removeElement(id) {
	const element = document.getElementById(id)
	if (element) element.parentNode.removeChild(element)
}


/* Board Events */

function join() {
	whiteCount.innerHTML = '2';
	blackCount.innerHTML = '2';
	popUp.style.zIndex = "0"

	player.gameID = txtGameID.value;
	const payload = {
		"method" : "join",
		"clientID": player.clientID,
		"gameID": player.gameID
	}
	ws.send(JSON.stringify(payload));
	boardMsgs.innerHTML='';
	resultMsg.innerHTML='';
}

function listen(s) {

	const sl= s.length
	for (let i = 0; i < sl; i++) {
		s[i].addEventListener("click", onClick) 
		s[i].style.cursor="pointer"
	}
}

function onClick() {

	const id = this.id ;

	if (this.className.includes("clicked-p")){
		clearLegalSquare()
		document.getElementById(id).className = player.color
		listen( player.color === "w" ? white : black )
	}

	else if (this.className.includes(player.color)){
		player.move.from = parseInt(id.match(/(\d+)/)[0])
		document.getElementById(id).classList.add("clicked-p")
		legalSquares(id)
		clearListener()
		listen(legalSquare)
		listen(clickedPiece)
	}


	else if (this.className.includes("legal-square")){

		player.move.to = parseInt(id.match(/(\d+)/)[0])
		const payload = {
			"method" : "move",
			"clientID": player.clientID,
			"gameID": player.gameID,
			"move": player.move
		}

		if (player.gameID) ws.send(JSON.stringify(payload));

		document.getElementById(id).className = player.color

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


function createGame() {
	if (player.gameID) removeElement(player.gameID)
	whiteCount.innerHTML = '2';
	blackCount.innerHTML = '2';
	popUp.style.zIndex = "0"

	player.userName = userNameField.value ? userNameField.value : "Anonymous";

	const payload = {
		"method" : "create",
		"clientID": player.clientID,
		"userName": player.userName
	}

	if (ws.readyState === ws.CLOSED) {
		alert("WebSocket connection has been closed. Please refresh the page.")
	}

	ws.send(JSON.stringify(payload));
	clearMsgBoard()
	clearListener()

}


export {player, ws}
