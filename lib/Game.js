'use strict';

/* Imports */

const gamePlay = require("./gamePlay.js").gamePlay,
	ply2color = require("./utils.js").ply2color,
	pieceCounter = require("./utils.js").pieceCounter,
	checkTermination = require("./utils.js").checkTermination

/*---------*/

function startingPosition() {

	const sp = {};  
	for (let i = 0; i<49; i++) {sp[i] = 0};
	sp[0]="w"; sp[6]="b"; sp[42]="b"; sp[48]="w"; 
	return sp
}

class Game {

	constructor(creatorID, color = "random") {

		this.creatorID = creatorID;
		this.termination;
		this.ply = 0
		this.turn = "w"
		this.states = {}
		this.states[this.ply] = startingPosition()
		this.count = { "wc": 2, "bc": 2 }

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
		this.termination = checkTermination(this.states[this.ply]) 
		this.count = pieceCounter(this.states[this.ply])

	}

}


module.exports = {Game}
