import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import Editor, { loader } from "@monaco-editor/react";
// import { useMonaco, Monaco } from "@monaco-editor/react";
import * as peggy from "peggy";
import { useLocalStorage } from './useLocalStorage';
import {nexapunks_setup} from './nexapunks_lang';
import optimise, { OptimisationOptions } from './optimiser';

loader.init().then(nexapunks_setup)


interface ProgEditState{
	current:string,
	progs:Record<string, string>
}

function App() {
	const editor_left_ref:React.MutableRefObject<any> = useRef(null);
	const editor_right_ref:React.MutableRefObject<any> = useRef(null);
	const [parser, set_parser] = useState<peggy.Parser | undefined>(undefined);
	const [input, set_input] = useLocalStorage("main", {current:"untitiled", progs:{"untitiled":""}} as ProgEditState);
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

	function get_new_filename(){
		let result = "untitled"
		let num = 1;
		while(input.progs[result+num]!==undefined){
			num++
		}
		return result+num;
	}


	useEffect(()=>{
		do_update(input.progs[input.current]);
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
				<p>Put your cursor inside the text editor and Press F1 to access the command pallet.</p>
				<a href="https://github.com/thehappycheese/exapunks_metalang_compiler">Documentation</a>


			</div>
			<ul id="tabs">{
				[
					...Object.entries(input.progs)
						.map(
							([key, item])=><li 
								key={key} 
								className={(key==input.current)?"curtab":""} 
								onClick={()=>set_input({...input, current:key})}
							>
								<div>{key}</div>
								<div
									className="tabbut"
									onClick={(e)=>{
										e.stopPropagation();
										let new_name = window.prompt("rename", key);
										if(new_name){
											if(input.progs[new_name]===undefined && new_name.length>0){
												let {current, progs} = input;
												if(current===key){
													current = new_name;
												}
												let prog = progs[key];
												delete progs[key];
												progs = {...progs, [new_name]:prog};
												set_input({current, progs});
											}
										}
									}}
								>
								✎
								</div>
								<div 
									className="tabbut"
									onClick={(e)=>{
										e.stopPropagation();
										if(window.confirm("Delete?")){
											let progs = input.progs
											delete progs[key]
											if(Object.keys(progs).length===0){
												set_input({current:"untitled",progs:{"untitled":""}})
											}else{
												let current = input.current;
												if(current===key){
													current = Object.keys(progs).slice(-1)[0]
												}
												set_input({current, progs});
											}
										}
									}}
								>
									✖
								</div>
							</li>
						),
					<li
						onClick={()=>{
							let new_filename = get_new_filename();
							set_input({current:new_filename, progs:{...input.progs,[new_filename]:""}})
						}}
						style={{textAlign:'center', display:'block', padding:" 0 5px"}}
					>
						+
					</li>
				]
			}</ul>
			<div id="left_editor" className="editor_host">
				<Editor
					defaultLanguage="nexapunks"
					theme="nexapunkstheme"
					defaultValue={input.progs[input.current]}
					// onMount={(editor: any, monaco: any)=>do_update(editor.getValue())}
					value={input.progs[input.current]}
					onChange={(value: any, event: any)=>set_input({...input, progs:{...input.progs, [input.current]:value}})}
					path="source"
					onMount={(editor:any, monaco:any)=>{editor_left_ref.current = editor; set_window_editors();}}
				/>
			</div>
			<input
				id="copybut" 
				type="button"
				disabled={copy_clip_state!==undefined}
				onClick={e=>{
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
				}} 
				value={
					(copy_clip_state=="failed" && "Failed to copy") ||
					(copy_clip_state=="success" && "Success") ||
					"Copy Output to Clipboard"
				}
			/>
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
