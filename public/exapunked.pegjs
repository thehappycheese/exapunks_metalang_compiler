// EngineerNick's ExaPunks Metalanguage Compiler
{
	let JUMP_INSTRUCTIONS = new Set(["JUMP", "TJMP","FJMP"]);
    var __marker_counter = 0;

	function remove_inaccesible_code(instructions){
		let output = [];
		let skipping = false;
		for(let i=0; i<instructions.length; i++){
			if(instructions[i][0]=="JUMP"){
				if(!skipping) output.push(instructions[i])
				skipping = true;
				continue;
			}
			if(instructions[i][0]=="MARK"){
				skipping = false;
			}
			if(!skipping || instructions[i][0]=="NOTE"){
				output.push(instructions[i])
			}
		}
		return output;
	}
	function collapse_jump_chain(instructions){
		let looking = false;
		let found = [];
		let mark = [];
		for(let i=0; i<instructions.length; i++){
			if(instructions[i][0]=="MARK"){
				looking = true;
				mark = [i, instructions[i][1]]
			}else if(instructions[i][0]=="JUMP" && looking){
				found.push([...mark, instructions[i][1]]);
			}else if(instructions[i][0]!=="NOTE"){
				looking = false;
				mark = []
			}
		}
		
		let output = instructions;
		for(let item of found){
			let [,find_jump_to,replace_with] = item;
		 	output =output.map(im=>(JUMP_INSTRUCTIONS.has(im[0]) && im[1]==find_jump_to)?[im[0],replace_with]:im)
		}
		output = output.filter((item, index)=>!found.find(im=>im[0]==index))

		return output;
	}
	function remove_notes(instructions){
		return instructions.filter(item=>item[0]!="NOTE");
	}

	function optimise_markers(instructions){
		let used_marker_names = new Set(
			instructions
			.filter(item=>JUMP_INSTRUCTIONS.has(item[0]))
			.map(item=>item[1])
		);
		let markers_to_keep = instructions
			.map((item, index)=>[index, ...item])
			.filter(item=>item[1]=="MARK")
			.filter(item=>used_marker_names.has(item[2]));

		let rename_map = markers_to_keep.reduce(
			(acc,cur)=>{
				acc[cur[2]] ="N" + (cur[0]+1);
				return acc;
			},
			{}
		);
		
		return instructions.reduce((acc, cur, index)=>{
					if(cur[0]=="MARK"){
						if(markers_to_keep.find(item=>item[0]===index)){
							return [...acc, ["MARK", rename_map[cur[1]]]]
						}else{
							return acc;
						}
					}
					if(new Set(["JUMP", "TJMP","FJMP"]).has(cur[0]))
						return [...acc,[cur[0],rename_map[cur[1]] ?? "ERROR_CANNOT_JUMP_TO_"+cur[1]]]
					
					return [...acc, cur]
				},
				[]
			)
			
	}
}

Program = _won* prog:Statement_List _won* {
	let instructions = prog
			.split("\n")
			.map(line=>line.split(" "))
			.map(tokens=>[tokens[0],tokens.slice(1).join(" ")])
			.filter(item=>item[0]!=="");
	if(options.optimise_inaccesible) instructions = remove_inaccesible_code(instructions);
	if(options.optimise_markers){
		instructions = optimise_markers(instructions);
		if(options.optimise_inaccesible) instructions = remove_inaccesible_code(instructions);
		if(options.collapse_jump_chain) instructions = collapse_jump_chain(instructions);
	}
	if(options.remove_notes) instructions = remove_notes(instructions);
	return instructions
			.map(item=>item
			.join(" "))
			.join("\n");
}


Statement_List = head:Statement _won* tail:(_won* Statement)* {
    return tail.reduce(
            (acc,cur)=>[...acc, cur[1]],
            [head]
        ).join("\n")
} / ""


Statement = 
   statement:(
		Function_If_True /
		Function_If_False /
		Function_No_Args /
        Function_Unary /
        Function_Replicate /
        Function_Jump /
		Function_If_True_Else /
		Function_If_False_Else /
        Function_Jump_If_True /
        Function_Jump_If_False /
        Function_Break /
        Function_Mark /
        Function_Test_EOF /
		Function_Test_MRD /
        Function_Assign_FID /
        Function_Assign_Host /
        Function_Assign_List /
        Function_Test_Compare /
        Function_Math 
    ) _wo (_nm / _le) {
        return statement
    } / Block_Statement
	/ Comment_Statement


Comment_Statement "Comment" 
	= "//" comment:$([^\r\n]*) _nm {
		return `NOTE ${comment.trim()}`
	}

Block_Statement = Infinite_Loop / Do_While_True_Loop / Do_While_False_Loop

Infinite_Loop
    = "loop" block:Block_Optionally_Labeled {
        return `MARK ${block.marker}\n${block.code}\nJUMP ${block.marker}\nMARK ${block.marker}_EXIT`;
    }

Do_While_True_Loop = "dowt"  block:Block_Optionally_Labeled {
    return `MARK ${block.marker}\n${block.code}\nTJMP ${block.marker}\nMARK ${block.marker}_EXIT`;
}

Do_While_False_Loop = "dowf" block:Block_Optionally_Labeled {
    return `MARK ${block.marker}\n${block.code}\nFJMP ${block.marker}\nMARK ${block.marker}_EXIT`;
}

Function_If_True = "iftt" block:Block_Optionally_Labeled !(_won* "else") {
    return `FJMP ${block.marker}\n${block.code}\nMARK ${block.marker}`;
}

Function_If_False = "iftf" block:Block_Optionally_Labeled !(_won* "else") {
    return `TJMP ${block.marker}\n${block.code}\nMARK ${block.marker}`
}

Function_If_False_Else = "iftf" block1:Block_Optionally_Labeled _won* "else" block2:Block_Optionally_Labeled  {
    return [`TJMP ${block2.marker}`,
			`MARK ${block1.marker}`,
			`${block1.code}`,
			`JUMP ${block1.marker}_EXIT`,
			`MARK ${block2.marker}`,
			`${block2.code}`,
			`MARK ${block1.marker}_EXIT`,
			`MARK ${block2.marker}_EXIT`].join('\n');
}
			
Function_If_True_Else = "iftt" block1:Block_Optionally_Labeled _won* "else" block2:Block_Optionally_Labeled  {
    return [`FJMP ${block2.marker}`,
			`MARK ${block1.marker}`,
			`${block1.code}`,
			`JUMP ${block1.marker}_EXIT`,
			`MARK ${block2.marker}`,
			`${block2.code}`,
			`MARK ${block1.marker}_EXIT`,
			`MARK ${block2.marker}_EXIT`].join('\n');
}

Block_Optionally_Labeled = lab:(_won+ Marker_Label)? _won* "{" _won* code:Statement_List _won* "}" {
	return {
		marker:`__${lab?.[1] ?? (++__marker_counter + "__")}`,
		code
	}
}

Function_No_Args = fn:("make" / "kill" / "drop" / "wipe" / "noop" / "halt" / "mode" / "skim" / "delf") {
    if(fn =="skim") return "VOID M";
    if(fn =="delf") return "VOID F";
    return fn.toUpperCase();
}


Function_Unary =
    fn:("link"/"seek"/"grab") " " arg:(Register / Integer) {
      	return `${fn.toUpperCase()} ${arg}`
    }

Function_Replicate = fn:"repl" _wm label:Marker_Label{
    return `REPL __${label}`
}


Function_Jump = "jump" _wm label:Marker_Label{
    return `JUMP __${label}`
}

Function_Jump_If_True = "jmpt" _wm label:Marker_Label{
    return `TJMP __${label}`
}

Function_Jump_If_False = "jmpf" _wm label:Marker_Label{
    return `FJMP __${label}`
}

Function_Break = "exit" _wm label:Marker_Label{
    return `JUMP __${label}_EXIT`
}

Function_Break_If_True = "extt" _wm label:Marker_Label{
    return `TJMP __${label}_EXIT`
}

Function_Break_If_False = "extf" _wm label:Marker_Label{
    return `FJMP __${label}_EXIT`
}

Function_Mark = "mark" _wm label:Marker_Label{
    return `MARK __${label}`
}

Function_Test_EOF = "t" _wo "=" _wo "EOF" {
    return `TEST EOF`;
}

Function_Test_MRD = "t" _wo "=" _wo "MRD" {
    return `TEST MRD`;
}

Function_Assign_FID = reg:Register _wo "=" _wo "FID" {
    return `FILE ${reg}`
}

Function_Assign_Host = reg:Register _wo "=" _wo "HOST" {
    return `HOST ${reg}`
}

Function_Assign_List
	= reg:(Register_F/Register_M/Hardware_Register) _wo "=" _wo "[" _wo head:(Integer/Register) _wo tail:("," _wo (Integer/Register))* _wo "]" {
		return tail.reduce(
			(acc,cur)=>[...acc, cur[2]],
			[head]
		).map(item=>`COPY ${item} ${reg}`).join("\n")
	}


Function_Test_Compare
	= "t" _wo "=" _wo arg:Comparitor_Expression {
		return `TEST ${arg}`;
	}

Comparitor_Opperator
	= "<" / ">" / "="
Comparitor_Expression
	= arg1:(Integer/Register) _wo opp:Comparitor_Opperator _wo arg2:(Integer/Register) {
		return `${arg1} ${opp} ${arg2}`
	}


Function_Math = Function_Math_Normal / Function_Assign / Function_Math_Self_Assignment / Function_Math_Rand / Function_Increment / Function_Decrement

Function_Assign
	= target:Register _wo "=" _wo arg1:(Integer/Register) {
    	return `COPY ${arg1} ${target}`
	}

Function_Math_Rand 
    = target:Register _wo "=" _wo "rand(" _won* arg1:(Integer/Register) _won* "," _won* arg2:(Integer/Register) _won* ")" {
        return `RAND ${arg1} ${arg2} ${target}`
    }

Math_Opperator = "+" / "-" / "*" / "/" / "%" / "^"

Function_Math_Self_Assignment 
    = target:Register _wo opp:Math_Opperator "=" _wo arg1:(Integer/Register) {
        let f = {
            "+":"ADDI",
            "-":"SUBI",
            "*":"MULI",
            "/":"DIVI",
            "%":"MODI",
            "^":"SWIZ",
        }[opp]
      return `${f} ${target} ${arg1} ${target}`
    }

Function_Math_Normal
    = target:Register _wo "=" _wo arg1:(Integer/Register) _wo opp:Math_Opperator _wo arg2:(Integer/Register) {
        let f = {
            "+":"ADDI",
            "-":"SUBI",
            "*":"MULI",
            "/":"DIVI",
            "%":"MODI",
            "^":"SWIZ",
        }[opp]
      return `${f} ${arg1} ${arg2} ${target}`
    }  

Function_Increment
	= reg:Register "++"{
    	return`ADDI ${reg} 1 ${reg}`
	}

Function_Decrement
	= reg:Register "--"{
		return `SUBI ${reg} 1 ${reg}`
	}

Register
    = (Register_X / Register_T / Register_F / Register_M / Hardware_Register)

Register_X = "x"{return text().toUpperCase()}
Register_T = "t"{return text().toUpperCase()}
Register_F = "f"{return text().toUpperCase()}
Register_M = "m"{return text().toUpperCase()}


Marker_Label "Label" = $([A-z_0-9]+)



Hardware_Register "HardwareRegister"
= $("#"[A-z][A-z][A-z][A-z]){return text().toUpperCase()}

Integer "Integer"
  = [-]?[0-9]+ { return parseInt(text(), 10); }



_wm // mandatory
  = whitespace_character+

_wo // optional
  = whitespace_character*

_won// optional allowing newline
  = (whitespace_character/_nm)

whitespace_character "Space"
 = [ \t]

_nm "Newline"
 = [\n\r]

_le "Semicolon"
 = [;]