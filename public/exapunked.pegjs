// EngineerNick's ExaPunks Metalanguage Compiler
{
    var __marker_counter = 0;
}

Program = _won prog:Statement_List _won {return prog}


Statement_List = head:Statement _won tail:(_won Statement)* {
    return tail.reduce(
            (acc,cur)=>[...acc, cur[1]],
            [head]
        ).join("\n")
}


Statement = 
   statement:(
		Function_If_True /
		Function_If_False /
		Function_No_Args /
        Function_Unary /
        Function_Replicate /
        Function_Jump /
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
		return `NOTE ${comment}`
	}

Block_Statement = Infinite_Loop / Do_While_True_Loop / Do_While_False_Loop

Infinite_Loop
    = "loop" lab:(_wm Marker_Label)? _won "{" _won args:Statement_List _won "}" {
        let marker_label = `__${lab?.[1] ?? "loop"+(++__marker_counter)}`;
        return `MARK ${marker_label}\n${args}\nJUMP ${marker_label}` + (lab ? `\nMARK ${marker_label}_EXIT` : "");
    }

Do_While_True_Loop = "dowt" lab:(_wm Marker_Label)? _won "{" _won args:Statement_List _won "}" {
    let marker_label = `__${lab?.[1] ?? "dowt"+(++__marker_counter)}`;
    return `MARK ${marker_label}\n${args}\nTJMP ${marker_label}` + (lab ? `\nMARK ${marker_label}_EXIT` : "");

}

Do_While_False_Loop = "dowf" lab:(_wm Marker_Label)? _won "{" _won args:Statement_List _won "}" {
    let marker_label = `__${lab?.[1] ?? "dowf"+(++__marker_counter)}`;
    return `MARK ${marker_label}\n${args}\nFJMP ${marker_label}` + (lab ? `\nMARK ${marker_label}_EXIT` : "");
}

Function_If_True = "iftt" _won "{" _won args:Statement_List _won "}" {
    let marker_label = `__iftt${__marker_counter++}`
    return `FJMP ${marker_label}\n${args}\nMARK ${marker_label}`
}

Function_If_False = "iftf" _won "{" _won args:Statement_List _won "}" {
    let marker_label = `__iftf${__marker_counter++}`
    return `TJMP ${marker_label}\n${args}\nMARK ${marker_label}`
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

Function_Assign_List = reg:(Register_F/Register_M/Hardware_Register) _wo "=" _wo "[" _wo head:(Integer/Register) _wo tail:("," _wo (Integer/Register))* _wo "]" {
    return tail.reduce(
        (acc,cur)=>[...acc, cur[2]],
        [head]
    ).map(item=>`COPY ${item} ${reg}`).join("\n")
}


Function_Test_Compare = "t" _wo "=" _wo arg:Comparitor_Expression {
    return `TEST ${arg}`;
}
Comparitor_Opperator = "<" / ">" / "="
Comparitor_Expression = arg1:(Integer/Register) _wo opp:Comparitor_Opperator _wo arg2:(Integer/Register) {
    return `${arg1} ${opp} ${arg2}`
}


Function_Math = Function_Math_Normal / Function_Assign / Function_Math_Self_Assignment / Function_Math_Rand / Function_Increment / Function_Decrement

Function_Assign = target:Register _wo "=" _wo arg1:(Integer/Register) {
    return `COPY ${arg1} ${target}`
}

Function_Math_Rand 
    = target:Register _wo "=" _wo "rand(" _won arg1:(Integer/Register) _won "," _won arg2:(Integer/Register) _won ")" {
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

Function_Increment = reg:Register "++"{
    return`ADDI ${reg} 1 ${reg}`
}

Function_Decrement = reg:Register "--"{
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
  = (whitespace_character/_nm)*

whitespace_character "Space"
 = [ \t]

_nm "Newline"
 = [\n\r]

_le "Semicolon"
 = [;]