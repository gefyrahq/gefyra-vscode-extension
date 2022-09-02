// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { spawn } from 'child_process';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log("ensure binary exists for correct platform; downloaded from GitHub release");
	
	console.log(context.extensionPath);
	let disposable = vscode.commands.registerCommand('gefyra.up', () => {
		
		const gefyra = spawn(context.extensionPath + '/gefyra-json', ['{"action": "gefyra.status"}']);
		gefyra.stdout.on("data", data => {
			console.log(`stdout: ${data}`);
		});
		gefyra.on("error", data => {
			console.error(data);
		});
		
		vscode.window.showInformationMessage('Now starting Gefyra');
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
