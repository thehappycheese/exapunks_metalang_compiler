import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import Editor, { DiffEditor, useMonaco, loader } from "@monaco-editor/react";
import * as peggy from "peggy";

let parser:peggy.Parser;

fetch("./exapunked.pegjs").then(res=>res.text()).then(text=>{
	parser = peggy.generate(text);
})


function getStorageValue(key:string, defaultValue:any) {
	// getting stored value
	const saved = localStorage.getItem(key);
	if(saved)
		return JSON.parse(saved);
	return defaultValue;
}

export const useLocalStorage = (key:string, defaultValue:any) => {
	const [value, setValue] = useState(() => {
		return getStorageValue(key, defaultValue);
	});

	useEffect(() => {
		// storing input name
		localStorage.setItem(key, JSON.stringify(value));
	}, [key, value]);

	return [value, setValue];
};


function App() {
	const editorRef:any = useRef(null);
	let [input, set_input] = useLocalStorage("main","")
	let [output,set_output] = useState("");
	function handel_editor_change(value:any, event:any){
		set_input(value);
		try{
			set_output(parser.parse(value+"\n"))
		}catch(e:any){
			set_output(e.toString())
		}
	}
	function handleEditorDidMount(editor:any, monaco:any) {
		editorRef.current = editor; 
		try{
			set_output(parser.parse(editorRef.current.getValue()+"\n"))
		}catch(e:any){
			set_output(e.toString())
		}
	  }
	return (
		<div className="App">
			<div className="header">
				<h1>Nick's ExaPunks Meta-Language Compiler</h1>
			</div>
			<Editor
				height="500px"
				defaultLanguage="text"
				theme="vs-dark"
				defaultValue={input}
				onMount={handleEditorDidMount}
				onChange={handel_editor_change}
			/>
			<div id="right">
				<div>
					Documentation at <a href ="https://github.com/thehappycheese/exapunks_metalang_compiler">https://github.com/thehappycheese/exapunks_metalang_compiler</a> :)
				</div>
				<div id="output">
					{output}
				</div>
			</div>
		</div>
	);
}

export default App;
