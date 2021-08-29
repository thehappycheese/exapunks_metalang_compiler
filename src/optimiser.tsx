



let JUMP_INSTRUCTIONS = new Set(["JUMP", "TJMP", "FJMP"]);





class Instruction {
	code: string;
	args: string[];
	constructor(code: string, args: string[]) {
		this.code = code;
		this.args = args;
	}

	static from_line(line: string) {
		let tokens = line.trim().split(" ");
		let [code, ...args] = tokens;
		return new Instruction(code, args);
	}

	is_jump() {
		return this.code === "JUMP" || this.code === "TJMP" || this.code === "FJMP";
	}
	toString() {
		return [this.code, ...this.args].join(" ")
	}
	copy() {
		return new Instruction(this.code, [...this.args])
	}
	with_args(args: string[]) {
		return new Instruction(this.code, args);
	}
	mutates_t(){
		// TODO: this would allow more complex jump optimisations to be contemplated
	}
}



export default function optimise(
	prog: string,
	remove_notes: boolean = false
): string {
	let instructions = prog
		.split("\n")
		.filter(item => item.trim() !== "")
		.map(line => Instruction.from_line(line))


	let previous_number_of_instructions = Infinity;
	while (instructions.length < previous_number_of_instructions) {
		previous_number_of_instructions = instructions.length;
		instructions = remove_inaccessible_code(instructions);
		instructions = opt_remove_unused_markers(instructions);
		instructions = collapse_jump_chain(instructions);
		instructions = opt_rename_markers(instructions);
	}

	if (remove_notes) instructions = opt_remove_notes(instructions);

	return instructions
		.map(item => item.toString())
		.join("\n");
}



/**
 * Delete all code between an unconditional JUMP or a HALT and the next MARK
*/
function remove_inaccessible_code(instructions: Instruction[]): Instruction[] {
	let output = [];
	let skipping = false;
	for (let instruction of instructions) {
		if (instruction.code == "JUMP" || instruction.code == "HALT") {
			if (!skipping) output.push(instruction)
			skipping = true;
			continue;
		}
		if (instruction.code == "MARK") {
			skipping = false;
		}
		if (!skipping || instruction.code == "NOTE") {
			output.push(instruction)
		}
	}
	return output;
}
/**
 * When a Mark is followed by an unconditional jump, try to re-label the jumps and delete the un-needed marks
 * ```
 * JUMP AA
 * ...
 * MARK AA
 * JUMP XX
 * ...
 * MARK XX
 * ```
 * and converts this to 
 * ```
 * JUMP XX
 * ...
 * JUMP XX
 * ...
 * MARK XX
 * ```
 */

function collapse_jump_chain(instructions: Instruction[]): Instruction[] {

	// A juicy reducey ;)
	let found = instructions.reduce((state: {
		replacement: { index: number, mark: Instruction, jump: Instruction }[],
		trigger_mark?: { index: number, mark: Instruction },
	}, instruction, index) => {
		if (instruction.code == "MARK") {
			return {
				...state,
				trigger_mark: { index, mark: instruction }
			}
		} else if (instruction.code == "JUMP" && state.trigger_mark) {
			return {
				...state,
				replacement: [...state.replacement, { ...state.trigger_mark, jump: instruction }]
			}
		} else if (instruction.code !== "NOTE") {
			return {
				...state,
				trigger_mark: undefined
			}
		}
		return state
	},
		{
			replacement: [],
			trigger_mark: undefined,
		}
	).replacement;

	let output = instructions;
	// repeatedly modify output with replacement rules;
	for (let item of found) {
		let { mark, jump } = item;
		output = output.map(instruction => (instruction.is_jump() && instruction.args[0] == mark.args[0]) ? instruction.with_args(jump.args) : instruction)
	}
	output = output.filter((_, index) => !found.find(item => item.index == index))

	return output;
}


/** Toggles a Conditional jump that only jumps over a hard jump
 * ```
 * FJMP AA
 * JUMP CC
 * MARK AA
 * ...
 * MARK CC
 * ```
 * 
 * to
 * 
 * ```
 * TJMP CC
 * MARK AA
 * ```
 */
function toggle_conditional_jumps(instructions: Instruction[]): Instruction[] {
	// TODO: write this

	return instructions;
}

/**
 * FJMP AA
 * MARK AA
 * 
 * to
 * 
 * MARK AA
 */
function opt_remove_jumps_to_next_line(instructions: Instruction[]): Instruction[] {
	// let output = [];
	// let skipping = false;
	// for (let instruction of instructions) {
	// 	if (instruction.code == "JUMP" || instruction.code == "HALT") {
	// 		if (!skipping) output.push(instruction)
	// 		skipping = true;
	// 		continue;
	// 	}
	// 	if (instruction.code == "MARK") {
	// 		skipping = false;
	// 	}
	// 	if (!skipping || instruction.code == "NOTE") {
	// 		output.push(instruction)
	// 	}
	// }
	// return output;
	return instructions
}


function opt_remove_notes(instructions: Instruction[]) {
	return instructions.filter(item => item.code != "NOTE");
}
/**
 * Remove unused markers
*/
function opt_remove_unused_markers(instructions: Instruction[]): Instruction[] {

	let used_marker_names = new Set(
		instructions
			.filter(instruction => instruction.is_jump)
			.map(instruction => instruction.args[0])
	);

	let markers_to_keep = instructions.reduce((
		acc: { index: number, instruction: Instruction }[],
		instruction,
		index
	) => {
		if (instruction.code == "MARK" && used_marker_names.has(instruction.args[0]))
			return [...acc, { index, instruction }];
		return acc;
	},
		[]
	);



	return instructions.reduce((acc: Instruction[], instruction, index) => {
		if (instruction.code == "MARK") {
			if (markers_to_keep.find(item => item.index === index)) {
				return [...acc, instruction]
			} else {
				return acc;
			}
		}
		if (instruction.is_jump())
			return [...acc, (used_marker_names.has(instruction.args[0])) ? instruction : instruction.with_args(["ERROR_CANNOT_JUMP_TO_" + instruction.args[0]])]

		return [...acc, instruction]
	},
		[]
	)
}




function opt_rename_markers(instructions: Instruction[]): Instruction[] {

	let markers = instructions
		.map((instruction, index) => ({ index, instruction }))
		.filter(({ instruction }) => instruction.code == "MARK")

	let rename_map = markers.reduce(
		(acc: Record<string, string>, { index, instruction }) => {
			acc[instruction.args[0]] = "N" + (index + 1);
			return acc;
		},
		{}
	);

	return instructions.reduce((acc: Instruction[], instruction, index) => {
		if (instruction.code == "MARK") {
			return [...acc, instruction.with_args([rename_map[instruction.args[0]]])]
		}
		if (instruction.is_jump())
			return [...acc, instruction.with_args([rename_map[instruction.args[0]] ?? instruction.args[0]])]
		return [...acc, instruction]
	},
		[]
	)


}