'use strict';

function gamePlay(color, move, state){

	const opColor = color === "w" ? "b" : "w";

	const from7 = move.from.toString(7);
	const to7 = move.to.toString(7);
	const arrFrom = from7.length == 1 ? ["0", from7]  : [ from7[0], from7[1] ];
	const arrTo = to7.length == 1 ? ["0", to7]  : [ to7[0], to7[1] ];
	const radius = Math.max( Math.abs(arrTo[0] - arrFrom[0]) ,  Math.abs(arrTo[1] - arrFrom[1]));

	state[move.from] = radius > 1 ? 0 : color;
	state[move.to]=color;

	adjSquares(move.to, 1).forEach(
		e => {
			if (state[e] === opColor) {
				state[e] = color;
			}
		}
	);
	return state;
}

function adjSquares(id, r) { // r= radius
	/* to emulate a 2d array, uses base 7 indexing of squares to find neighboring squares */

	const b7s=id.toString(7)
	const rowLimit = 6, columnLimit = 6 
	let i, j, z

	const ls=[]

	if (b7s.length === 1) {j=0; i=parseInt(b7s)}
	else { j=parseInt(b7s.charAt(0)); i=parseInt(b7s.charAt(1)) } 

	for (let x = Math.max(0, i-r); x <= Math.min(i+r, rowLimit); x++) {
		for (let y = Math.max(0, j-r); y <= Math.min(j+r, columnLimit); y++) {
			if (x != i || y != j){
				z = y.toString() + x.toString()
				ls.push(parseInt(z, 7))
			}
		}
	}
	return ls
}

module.exports = {gamePlay, adjSquares}
