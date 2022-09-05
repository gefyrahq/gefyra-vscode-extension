// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { spawn } from 'child_process';
import { gefyraClient, gefyraInstaller } from 'gefyra';



// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	if (!gefyraInstaller.isInstalled()) {
		vscode.window.showInformationMessage('Gefyra is going to install its backend. This takes about a minute...');
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			cancellable: false,
			title: 'Installing Gefyra backend'
		}, async (progress) => {
			progress.report({  increment: 0 });
			const installer = gefyraInstaller.install();
			await installer;
			vscode.window.showInformationMessage('Gefyra successfully installed.');
			progress.report({ increment: 100 });
		});
	}

	let disposable = vscode.commands.registerCommand('gefyra.up', () => {
		if (gefyraInstaller.isInstalled()) {
			let status = gefyraClient.status();
			vscode.window.showInformationMessage(`Gefyra status: ${status.status}`);
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
