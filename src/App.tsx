import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import Editor, { loader } from "@monaco-editor/react";
// import { useMonaco, Monaco } from "@monaco-editor/react";
import * as peggy from "peggy";
import { useLocalStorage } from './useLocalStorage';
import {nexapunks_setup} from './nexapunks_lang';
import optimise, { OptimisationOptions } from './optimiser';

loader.init().then(nexapunks_setup)




function App() {
	const editor_left_ref:React.MutableRefObject<any> = useRef(null);
	const editor_right_ref:React.MutableRefObject<any> = useRef(null);
	const [parser, set_parser] = useState<peggy.Parser | undefined>(undefined);
	const [input, set_input] = useLocalStorage("main", "");
	const [output, set_output] = useState({ parsed: "", error: "" });
	const [opts, set_opts] = useState({
		remove_inaccessible_code:true,
		collapse_jump_chain:true,
		toggle_conditional_jumps:true,
		remove_jumps_to_next_line:true,
		remove_unused_markers:true,
		remove_halt_at_end:true,
		rename_markers:true,
		remove_notes:false
	} as OptimisationOptions);
	const [rem_notes_enabled, set_rem_notes_enabled] = useState(false);

	useEffect(()=> {

			fetch("./exapunked.pegjs").then(res => res.text()).then(text => {
				set_parser(peggy.generate(text));
			})
			debugger
			window.addEventListener("resize",(e)=>{
				if(editor_left_ref.current && editor_right_ref.current){
					editor_left_ref.current.layout()
					editor_right_ref.current.layout()
				}
			})
		},
		[]
	)


	useEffect(()=>{
		do_update(input);
	},[opts, rem_notes_enabled, input,parser])

	function do_update(value: string) {
		try {
			if(parser===undefined) {
				set_output({ parsed: "", error: "Loading Parser" });
			}else{
				let parsed:string = parser.parse(value+"\n");
				if(opts){
					try{
						let optimised = optimise(parsed, opts);
						set_output({ parsed: optimised, error: "" })
					}catch(e){
						set_output({ parsed: parsed+"\n\nNOTE Optimisation failed: "+e, error: "" })
					}
				}else{
					set_output({ parsed: parsed, error: "" })
				}
			}
		} catch (e: any) {
			set_output({ parsed: "", error: e.toString() })
		}
	}

	return (
		<div className="App">
			<div id="header">
				<h1>Nick's ExaPunks Meta-Language Compiler</h1>
			</div>
			<div id="settings">
				<div className="two_col">

					{
						Object.entries({
							remove_inaccessible_code:"Remove Inaccessible Code",
							collapse_jump_chain:"Collapse Jump Chain",
							toggle_conditional_jumps:"Toggle Conditional Jumps",
							remove_jumps_to_next_line:"Remove Jumps To Next Line",
							remove_unused_markers:"Remove Unused Markers",
							remove_halt_at_end:"Remove Halt At End",
							rename_markers:"Rename Markers",
							remove_notes:"Remove Notes"
						}).map(([name,title], index)=>{
							return <>
								<input key={"key_1_"+name} id={"cb_"+name} type="checkbox" checked={opts[name]} onChange={e=>set_opts({...opts, [name]:e.target.checked})}/>		
								<label key={"key_0_"+name} htmlFor={"cb_"+name}>{title}</label>
							</>
						})
					}
				</div>

				<a href="https://github.com/thehappycheese/exapunks_metalang_compiler">Documentation</a>


			</div>
			<div id="left_editor">
				<Editor
					defaultLanguage="nexapunks"
					theme="nexapunkstheme"
					defaultValue={input}
					// onMount={(editor: any, monaco: any)=>do_update(editor.getValue())}
					onChange={(value: any, event: any)=>set_input(value)}
					path="source"
					onMount={(editor:any, monaco:any)=>{editor_left_ref.current = editor;}}
				/>
			</div>
			<div id="right_editor">
				<Editor
					defaultLanguage={output.parsed ? "nexapunksnative" :"plaintext"}
					theme="nexapunkstheme"
					value={output.parsed ? output.parsed : output.error}
					options={{readOnly:true}}
					path="compiled"
					onMount={(editor:any, monaco:any)=>{editor_right_ref.current = editor;}}
				/>
			</div>
		</div>
	);
}

export default App;
