import React, { useRef, useState } from 'react';
import './App.css';
import Editor, { useMonaco, loader, Monaco } from "@monaco-editor/react";
import * as peggy from "peggy";
import { useLocalStorage } from './useLocalStorage';

let parser: peggy.Parser;

fetch("./exapunked.pegjs").then(res => res.text()).then(text => {
	parser = peggy.generate(text);
})

function App() {
	const monaco = useMonaco();
	const editorRef: any = useRef(null);
	let [input, set_input] = useLocalStorage("main", "")
	let [output, set_output] = useState({ parsed: "", error: "" });






	function do_update(value: string) {
		try {
			set_output({ parsed: parser.parse(value + "\n"), error: "" })
		} catch (e: any) {
			set_output({ parsed: "", error: e.toString() })
		}
	}

	function handel_editor_change(value: any, event: any) {
		set_input(value);
		do_update(value)

	}

	function handleEditorDidMount(editor: any, monaco: any) {
		editorRef.current = editor;

		monaco.languages.register({ id: "nexapunks" });
		monaco.languages.setLanguageConfiguration("nexapunks", {
			brackets:["{}","()"]
		});
		monaco.languages.setMonarchTokensProvider("nexapunks", {
			keywords: [
				"delf",
				"dowf",
				"dowt",
				"drop",
				"exit",
				"rand",
				"grab",
				"halt",
				"iftf",
				"iftt",
				"jmpf",
				"jmpt",
				"jump",
				"kill",
				"link",
				"loop",
				"make",
				"mark",
				"mode",
				"noop",
				"repl",
				"seek",
				"skim",
				"wipe"
			],
			registers:[
				"f",
				"t",
				"m",
				"x",
			],
			specials:[
				"EOF",
				"HOST",
				"FID",
				"MRD",
			],
			operators: [
				'=', '>', '<', '++', '--', '+', '-', '*', '/', '^', '%',
				'+=', '-=', '*=', '/=', '^=',
				'%='
			],
			symbols: /[=><!~?:&|+\-*\/\^%]+/,
			tokenizer: {
				root: [
					// identifiers and keywords
					[/[a-z_$][\w$]*/, {
						cases: {
							'@keywords': 'keyword',
							'@default': 'identifier'
						}
					}],
					
					// whitespace
					{ include: '@whitespace' },
					
					// delimiters and operators
					[/[{}()]/, '@brackets'],
					[/@symbols/, { cases: { '@operators': 'operator',
											'@default'  : '' } } ],
					
					// numbers
					[/\d+/, 'number'],

				],
				whitespace: [
					[/[ \t\r\n]+/, 'white'],
					[/\/\/.*$/,    'comment'],
				  ],
			}
		})
		monaco.editor.defineTheme("nexapunks", {
			base: "vs-dark",
			inherit: true,
			rules: [
				{ token: "registers", foreground: "ff00ff" },
				{ token: "int", foreground: "ff0000" },
				{ token: "regt", foreground: "ff0000" }
			]
		});
		monaco.editor.setModelLanguage(
			editor.getModel(),
			"nexapunks"
		)
		monaco.editor.setTheme("nexapunks")
		do_update(editorRef.current.getValue());
	}

	return (
		<div className="App">
			<div className="header">
				<h1>Nick's ExaPunks Meta-Language Compiler</h1>
				Documentation at <a href="https://github.com/thehappycheese/exapunks_metalang_compiler">https://github.com/thehappycheese/exapunks_metalang_compiler</a> :)
			</div>
			<Editor
				height="500px"
				defaultLanguage="nexapunks"
				theme="vs-dark"
				defaultValue={input}
				onMount={handleEditorDidMount}
				onChange={handel_editor_change}
			/>
			<div id="right">
				<div id="output" className={output.error ? "parse_error" : "parse_ok"}>
					{output.parsed ? output.parsed : output.error}
				</div>
			</div>
		</div>
	);
}

export default App;
