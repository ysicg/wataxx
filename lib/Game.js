'use strict';

/* Imports */

const gamePlay = require("./gamePlay.js").gamePlay,
	adjSquares = require("./gamePlay.js").adjSquares,
	ply2color = require("./utils.js").ply2color,
	pieceCounter = require("./utils.js").pieceCounter,
	checkTermination = require("./utils.js").checkTermination

/*---------*/


class Game {

	constructor(creatorID, color = "random") {

		this.creatorID = creatorID;
		this.termination;
		this.ply = 0
		this.turn = "w"
		this.states = {}
		this.states[this.ply] = startingPosition()
		this.count = { "wc": 2, "bc": 2 }
		this.pass = false

		switch (color) {

			case "w":
			case "b":
				this.players = {[color] : creatorID} 
				break;

			case "random":
				const c = Math.round(Math.random()) ? "w" : "b"
				this.players = {[c] : creatorID} 
				break;

			default:
				throw "Color provided is not recognized."
		}

	}

	// Getters
	
	get position() {
		return  {...this.states[this.ply]} ;
	}

	// Setters
	
	set opponent(ID) {

		if (Object.keys(this.players).length === 1) {
			const opColor = Object.keys(this.players)[0] === "b" ? "w" : "b"
			this.players[opColor] = ID;
		}

	}

	set move(m) { 

		this.states[this.ply + 1] = gamePlay(this.turn, m, {...this.states[this.ply]})
		this.ply++
		this.turn = ply2color(this.ply)
		this.count = pieceCounter(this.states[this.ply])

		switch ( legalExists(this.states[this.ply], this.turn) ) {

			case "end":
				this.termination = `${this.count.bc > this.count.wc ? "BLACK" : "WHITE"} WINS`
				break;

			case "pass":
				this.turn = "w" ? "b" : "w"
				this.termination = checkTermination(this.states[this.ply]) 
				break;

			case "continue":
				this.termination = checkTermination(this.states[this.ply]) 
				break;

			default: console.log("legalExists ERROR")

		}

	}

}


function legalExists(state, turn) { 

	let result = "continue";
	let availableSquares = 0;

	const piecesToMove = Object.keys(state).filter(
		key => state[key] === turn
	);

	piecesToMove.forEach(
		key => {

			let length = parseInt((adjSquares(parseInt(key), 2).filter(s => state[s] === 0)).length)
			availableSquares +=  length
		});

	if (availableSquares === 0) {
		result = "pass";
		piecesToMove.forEach(
			key => {
			let length = parseInt((adjSquares(parseInt(key), 4).filter(s => state[s] === 0)).length)
			availableSquares +=  length
			})
	}

	if (availableSquares === 0) 
		result = "end";

	return result;
}

function startingPosition() {

	const sp = {};  
	for (let i = 0; i<49; i++) {sp[i] = 0};
	sp[0]="w"; sp[6]="b"; sp[42]="b"; sp[48]="w"; 
	return sp
}

module.exports = {Game, legalExists}
