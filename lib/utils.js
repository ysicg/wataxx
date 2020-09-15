'use strict';

function guid() {
	const S4 = () =>  (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
}

function ply2color(ply) {
	if (ply % 2 === 0) return "w"
	else return "b"
}

function pieceCounter(state) {
	const wc = Object.values(state).reduce( (ac, cv) => {if (cv === "w") ac++; return ac}, 0);
	const bc = Object.values(state).reduce( (ac, cv) => {if (cv === "b") ac++; return ac}, 0);
	return {"wc" : wc, "bc" : bc}
}

function checkTermination(state, pc) {

	if (pc.wc === 0) return "BLACK WINS"
	else if (pc.bc === 0) return "WHITE WINS"
	else if (Object.values(state).filter(e => e === 0).length  === 0) {
		if (pc.wc - pc.bc === 0) return "DRAW"
		else if (pc.wc - pc.bc > 0) return "WHITE WINS"
		else if (pc.wc - pc.bc < 0) return "BLACK WINS"
	}

	else return null
}

module.exports = {guid, ply2color, pieceCounter, checkTermination}
