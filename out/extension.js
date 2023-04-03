"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const gefyra_1 = require("gefyra");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    if (!gefyra_1.gefyraInstaller.isInstalled()) {
        vscode.window.showInformationMessage("Gefyra is going to install its backend. This takes about a minute...");
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Window,
            cancellable: false,
            title: "Installing Gefyra backend",
        }, async (progress) => {
            progress.report({ increment: 0 });
            const installer = gefyra_1.gefyraInstaller.install();
            await installer;
            vscode.window.showInformationMessage("Gefyra successfully installed.");
            progress.report({ increment: 100 });
        });
    }
    vscode.commands.registerCommand("gefyra.kubeconfig", async () => {
        const target = await vscode.window.showQuickPick([
            {
                label: "Automatic",
                description: "Use local machine's kubeconfig and context",
                target: "automatic",
            },
            {
                label: "Manual",
                description: "Set a specific kubeconfig and context",
                target: "manual",
            },
        ], {
            placeHolder: "Select how Gefyra should obtain the kubeconfig and context to use",
        });
        if (target?.target === "automatic") {
            // TODO: Implement automatic kubeconfig and context detection
            vscode.window.showErrorMessage("Automatic kubeconfig and context detection is not yet implemented.");
            return;
        }
        if (vscode.workspace.workspaceFolders === undefined) {
            vscode.window.showInformationMessage("Manual kubeconfig and context selection requires an open workspace.");
            return;
        }
        const file = await vscode.window.showInputBox({
            prompt: "Path to kubeconfig",
        });
        const context = await vscode.window.showInputBox({
            prompt: "Context",
        });
        const configuration = vscode.workspace.getConfiguration();
        await configuration.update("gefyra.kubeconfig", {
            file: file,
            context: context,
        });
        // const kubeconfig = configuration.get<{}>("gefyra.kubeconfig");
    });
    let up = vscode.commands.registerCommand("gefyra.up", () => {
        if (gefyra_1.gefyraInstaller.isInstalled()) {
            vscode.window.showInformationMessage("Starting and connecting Gefyra. This takes a few seconds...");
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Window,
                cancellable: false,
                title: "Starting Gefyra",
            }, async (progress) => {
                progress.report({ increment: 0 });
                let status = await gefyra_1.gefyraClient.up();
                progress.report({ increment: 100 });
                if (status.success) {
                    vscode.window.showInformationMessage("Gefyra is now running and connected.");
                }
                else {
                    vscode.window.showInformationMessage("There was an error starting Gefyra.");
                }
            });
        }
    });
    context.subscriptions.push(up);
    let down = vscode.commands.registerCommand("gefyra.down", () => {
        if (gefyra_1.gefyraInstaller.isInstalled()) {
            vscode.window.showInformationMessage("Stopping Gefyra. This takes a few seconds...");
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Window,
                cancellable: false,
                title: "Stopping Gefyra",
            }, async (progress) => {
                progress.report({ increment: 0 });
                let status = await gefyra_1.gefyraClient.down();
                progress.report({ increment: 100 });
                if (status.success) {
                    vscode.window.showInformationMessage("Gefyra is stopped.");
                }
                else {
                    vscode.window.showInformationMessage("There was an error stopping Gefyra.");
                }
            });
        }
    });
    let status = vscode.commands.registerCommand("gefyra.status", () => {
        if (gefyra_1.gefyraInstaller.isInstalled()) {
            let status = gefyra_1.gefyraClient.status();
            status.then((status) => {
                vscode.window.showInformationMessage(`Gefyra status: ${status.status}`);
            });
        }
    });
    context.subscriptions.push(status);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map