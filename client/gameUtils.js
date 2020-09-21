import {player, ws} from "./client.js";

'use strict';

function startingPosition() {
const startingPosition = {}; for (let i = 0; i<49; i++) {startingPosition[i] = 0};
startingPosition[0]="w"; startingPosition[6]="b"; startingPosition[42]="b"; startingPosition[48]="w";
	return startingPosition;
}

// start game againt oneself
function alone() {
	const payloadAlone = {
		"method" : "create",
		"clientID": player.clientID,
		"userName": player.userName,
		"alone": "yes"
	}

	ws.send(JSON.stringify(payloadAlone))
}


function id2base7(id) {
	/* convert id to base 7. Example: "sq_8" -> "12"  */

	return parseInt(id.match(/(\d+)/)[0]).toString(7);

}


function colorTurn(turn) {

	if (turn % 2 === 0) return "w"
	else return "b"

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

		if (player.state[element] === 0) {
			document.getElementById("sq_" + ls[index].toString()).classList.add("legal-square")
		}

	})

}

export {startingPosition, alone, id2base7, colorTurn, legalSquares}
