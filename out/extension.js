"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const child_process_1 = require("child_process");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    console.log("ensure binary exists for correct platform; downloaded from GitHub release");
    console.log(context.extensionPath);
    let disposable = vscode.commands.registerCommand('gefyra.up', () => {
        const gefyra = (0, child_process_1.spawn)(context.extensionPath + '/gefyra-json', ['{"action": "gefyra.status"}']);
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
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map