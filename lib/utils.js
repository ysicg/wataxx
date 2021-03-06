'use strict';

const adjSquares = require("./gamePlay").adjSquares


function legalMovesCount(id, state) {

	const r1 = adjSquares(id, 1).filter( 
		s => state[s] === 0
		).length

	const r2 = adjSquares(id, 2).filter( 
		s => state[s] === 0
		).length

	return r1 + r2
}

function guid() {

	const S4 = () =>  (((1+Math.random())*0x10000)|0).toString(16).substring(1);

	//return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
	return S4()

}


function ply2color(ply) {

	return (ply % 2 === 0) ? "w" : "b" 

}


function pieceCounter(state) {

	const wc = Object.values(state).reduce( (ac, cv) => {if (cv === "w") ac++; return ac}, 0),
		bc = Object.values(state).reduce( (ac, cv) => {if (cv === "b") ac++; return ac}, 0)

	return {"wc" : wc, "bc" : bc}

}


function checkTermination(state) {

	const pc = pieceCounter(state)

	if (pc.wc === 0) return "BLACK WINS"

	else if (pc.bc === 0) return "WHITE WINS"

	//else if (Object.values(state).filter(e => e === 0).length  === 0) {
	
	else if (!(49 - pc.bc - pc.wc)){
		if (pc.wc - pc.bc === 0) return "DRAW"
		else if (pc.wc - pc.bc > 0) return "WHITE WINS"
		else if (pc.wc - pc.bc < 0) return "BLACK WINS"
	}


	else return null

}


module.exports = {guid, ply2color, pieceCounter, checkTermination, legalMovesCount}
