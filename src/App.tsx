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
	const [used_passes, set_used_passes] = useState(0);
	const [opt_max_passes, set_opt_max_passes] = useState(100);

	const [copy_clip_state, set_copy_clip_state] = useState(undefined as string|undefined);

	const [opts, set_opts] = useState({
		remove_inaccessible_code:true,
		collapse_jump_chain:true,
		toggle_conditional_jumps:true,
		remove_jumps_to_next_line:true,
		remove_unused_markers:true,
		remove_halt_at_end:true,
		merge_adjacent_markers:true,
		rename_markers:true,
		remove_notes:false
	} as OptimisationOptions);

	useEffect(()=> {

			fetch("./exapunked.pegjs").then(res => res.text()).then(text => {
				set_parser(peggy.generate(text));
			})
			
			window.addEventListener("resize",(e)=>{
				if(editor_left_ref.current && editor_right_ref.current){
					editor_left_ref.current.layout()
					editor_right_ref.current.layout()
				}
			})
		},
		[]
	)

	function set_window_editors(){
		if(editor_left_ref.current && editor_right_ref.current){
			(window as any).editors = [editor_left_ref.current, editor_right_ref.current];
		}
	}


	useEffect(()=>{
		do_update(input);
	},[opts, opt_max_passes, input, parser])

	function do_update(value: string) {
		try {
			if(parser===undefined) {
				set_output({ parsed: "", error: "Loading Parser" });
			}else{
				let parsed:string = parser.parse(value+"\n");
				if(opts){
					try{
						let {code:optimised, used_passes} = optimise(parsed, opts, opt_max_passes);
						set_used_passes(used_passes)
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
							merge_adjacent_markers:"Merge Adjacent Markers",
							rename_markers:"Rename Markers",
							remove_notes:"Remove Notes"
						}).map(([name,title], index)=>[
								<input key={"key_1_"+name} id={"cb_"+name} type="checkbox" checked={opts[name]} onChange={e=>set_opts({...opts, [name]:e.target.checked})}/>,
								<label key={"key_0_"+name} htmlFor={"cb_"+name}>{title}</label>
						]).flat()
					}
					
				</div>
				<hr/>
				<div>
					
					<input id="cb_passes" type="range" min="0" max="20" step="1" value={opt_max_passes} onChange={e=>set_opt_max_passes(parseInt(e.target.value))}/>
					<label htmlFor="cb_passes">{`Max Passes ${opt_max_passes}`}</label>
				</div>
				<div>
					
					<input id="cb_used_passes" type="range" min="0" max="20" step="1" value={used_passes} disabled/>
					<label htmlFor="cb_used_passes">{`Used passes ${used_passes}`}</label>
					
				</div>
				<hr/>
				<input type="button" disabled={copy_clip_state!==undefined} onClick={e=>{
					if(editor_right_ref.current){
						set_copy_clip_state("trying")
						navigator.clipboard.writeText(editor_right_ref.current.getValue()).then(
							res=>{
								set_copy_clip_state("success")
								return new Promise(resolve=>setTimeout(resolve,1500));
							},
							err=>{
								set_copy_clip_state("failed")
								return new Promise(resolve=>setTimeout(resolve,1500));
							}
						).then(()=>set_copy_clip_state(undefined))
					}
				}} value={
					(copy_clip_state=="failed" && "Failed to copy") ||
					(copy_clip_state=="success" && "Success") ||
					"Copy Output to Clipboard"
					} style={{width:"100%",height:"4em"}}/>
				<hr/>
				<p>Put your cursor inside the text editor and Press F1 to access the command pallet.</p>
				<a href="https://github.com/thehappycheese/exapunks_metalang_compiler">Documentation</a>


			</div>
			<div id="left_editor" className="editor_host">
				<Editor
					defaultLanguage="nexapunks"
					theme="nexapunkstheme"
					defaultValue={input}
					// onMount={(editor: any, monaco: any)=>do_update(editor.getValue())}
					onChange={(value: any, event: any)=>set_input(value)}
					path="source"
					onMount={(editor:any, monaco:any)=>{editor_left_ref.current = editor; set_window_editors();}}
				/>
			</div>
			<div id="right_editor" className="editor_host">
				<Editor
					defaultLanguage="nexapunksnative"
					theme="nexapunkstheme"
					value={output.parsed ? output.parsed : output.error}
					options={{readOnly:true, wordWrap:true}}
					path="compiled"
					onMount={(editor:any, monaco:any)=>{editor_right_ref.current = editor;set_window_editors();}}
				/>
			</div>
		</div>
	);
}

export default App;
