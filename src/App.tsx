import React, { useEffect, useState } from 'react';
import './App.css';
import Editor, { useMonaco, Monaco, loader } from "@monaco-editor/react";
import * as peggy from "peggy";
import { useLocalStorage } from './useLocalStorage';
import {nexapunks_setup} from './nexapunks_lang';
import optimise from './optimiser';

loader.init().then(nexapunks_setup)




function App() {
	let [parser, set_parser] = useState<peggy.Parser | undefined>(undefined);
	let [input, set_input] = useLocalStorage("main", "");
	let [output, set_output] = useState({ parsed: "", error: "" });
	let [opt_enabled, set_opt_enabled] = useState(true);
	let [rem_notes_enabled, set_rem_notes_enabled] = useState(false);

	useEffect(()=> {

			fetch("./exapunked.pegjs").then(res => res.text()).then(text => {
				set_parser(peggy.generate(text));
			})
		},
		[]
	)


	useEffect(()=>{
		do_update(input);
	},[opt_enabled, rem_notes_enabled, input,parser])

	function do_update(value: string) {
		try {
			if(parser===undefined) {
				set_output({ parsed: "", error: "Loading Parser" });
			}else{
				let parsed:string = parser.parse(value+"\n");
				if(opt_enabled){
					try{
						let optimised = optimise(parsed);
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
			<div className="header">
				<h1>Nick's ExaPunks Meta-Language Compiler</h1>
				Documentation at <a href="https://github.com/thehappycheese/exapunks_metalang_compiler">https://github.com/thehappycheese/exapunks_metalang_compiler</a> :)
				<label><input type="checkbox" checked={opt_enabled} onChange={e=>set_opt_enabled(e.target.checked)}/>Optimise</label>
				<label><input type="checkbox" checked={rem_notes_enabled} onChange={e=>set_rem_notes_enabled(e.target.checked)}/>Remove Notes</label>
			</div>
			<div>
				<Editor
					defaultLanguage="nexapunks"
					theme="nexapunkstheme"
					defaultValue={input}
					// onMount={(editor: any, monaco: any)=>do_update(editor.getValue())}
					onChange={(value: any, event: any)=>set_input(value)}
					path="source"
				/>
			</div>
			{
				output.error ?
				<div id="right"className={"parse_error"}>
					{output.error}
				</div>
				:
				<Editor
					defaultLanguage="nexapunksnative"
					theme="nexapunkstheme"
					value={output.parsed ? output.parsed : output.error}
					options={{readOnly:true}}
					path="compiled"
				/>
			}
		</div>
	);
}

export default App;
