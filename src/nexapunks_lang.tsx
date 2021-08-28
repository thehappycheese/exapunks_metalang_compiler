export const nexapunks_setup = (monaco:any) => {
	monaco.languages.register({ id: "nexapunks" });
	monaco.languages.setLanguageConfiguration("nexapunks", {
		brackets: ["{}", "()"]
	});
	monaco.languages.setMonarchTokensProvider("nexapunks", {
		keywords: [
			"dowf",
			"dowt",
			"exit",
			"rand",
			"grab",
			"iftf",
			"iftt",
			"jmpf",
			"jmpt",
			"jump",
			"link",
			"loop",
			"mark",
			"repl",
			"seek",
			"else"
		],
		keywordssingle:[
			"halt",
			"make",
			"skim",
			"mode",
			"drop",
			"kill",
			"noop",
			"delf",
			"wipe",
		],
		registers: [
			"f",
			"t",
			"m",
			"x",
		],
		specials: [
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
		symbols: /[=><!~?:&|+\-*/^%]+/,
		tokenizer: {
			root: [
				
				// numbers
				[/\d+/, 'number'],
				// identifiers and keywords
				[/#[A-z0-9]{4}/, 'register'],
				[/[A-z_0-9][\w$]*/, {
					cases: {
						'@keywords': 'keyword',
						'@keywordssingle': 'keywordss',
						'@registers': 'register',
						'@default': 'string'
					}
				}],

				// whitespace
				{ include: '@whitespace' },

				// delimiters and operators
				[/[{}()]/, '@brackets'],
				[/@symbols/, {
					cases: {
						'@operators': 'operator',
						'@default': ''
					}
				}],

			],
			whitespace: [
				[/[ \t\r\n]+/, 'white'],
				[/\/\/.*$/, 'comment'],
			],
		}
	});







	monaco.languages.register({ id: "nexapunksnative" });
	monaco.languages.setMonarchTokensProvider("nexapunksnative", {
		keywords: [
			"COPY",
			"MARK",
			"RAND",
			"GRAB",
			"JUMP",
			"FJMP",
			"TJMP",
			"LINK",
			"REPL",
			"SEEK",
			"FILE",
			"HOST",
			"TEST",
			"SUBI",
			"ADDI",
			"MODI",
			"DIVI",
		],
		keywordssingle:[
			"HALT",
			"VOID",
			"MODE",
			"DROP",
			"KILL",
			"NOOP",
			"WIPE",
			"MAKE"
		],
		registers: [
			"F",
			"T",
			"M",
			"X",
			"GX",
			"GY",
		],
		specials: [
			"EOF",
			"MRD",
		],
		operators: [
			'=', '>', '<'
		],
		symbols: /[=><!~?:&|+\-*/^%]+/,
		tokenizer: {
			root: [
				
				// numbers
				[/\d+/, 'number'],
				// identifiers and keywords
				[/#[A-z0-9]{4}/, 'register'],
				[/(?=NOTE).*$/, 'comment'],
				[/[A-z_0-9][\w$]*/, {
					cases: {
						'@keywords': 'keyword',
						'@keywordssingle': 'keywordss',
						'@registers': 'register',
						'@default': 'string'
					}
				}],

				// whitespace
				{ include: '@whitespace' },

				// delimiters and operators
				[/[{}()]/, '@brackets'],
				[/@symbols/, {
					cases: {
						'@operators': 'operator',
						'@default': ''
					}
				}],

			],
			whitespace: [
				[/[ \t\r\n]+/, 'white'],
			],
		}
	});



	monaco.editor.defineTheme("nexapunkstheme", {
		base: "vs-dark",
		inherit: true,
		rules: [
			{ token: "register", foreground: "#d16969" },
			{ token: "keywordss", foreground: "#9cdcfe" },
			{ token: "specials", foreground: "#9cfffe" },
		]
	});

};