"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const gefyra_1 = require("gefyra");
const protocol_1 = require("gefyra/lib/protocol");
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
        const selection = await vscode.window.showQuickPick([
            {
                label: "Default",
                description: "Use default kubeconfig and context",
                option: "default",
            },
            {
                label: "Manual",
                description: "Set a specific kubeconfig and context",
                option: "manual",
            },
        ], {
            placeHolder: "Select how Gefyra should obtain the kubeconfig and context to use",
        });
        let file;
        let context;
        if (selection?.option === "default") {
            // TODO: wait for gefyra-ext
            vscode.window.showErrorMessage("Not yet implemented.");
            return;
        }
        if (selection?.option === "manual") {
            if (vscode.workspace.workspaceFolders === undefined) {
                vscode.window.showInformationMessage("Gefyra (Kubeconfig - Manual) requires an open workspace.");
                return;
            }
            file = await vscode.window.showInputBox({
                prompt: "Kubeconfig",
            });
            context = await vscode.window.showInputBox({
                prompt: "Context",
            });
        }
        // save to workspace settings
        const configuration = vscode.workspace.getConfiguration();
        await configuration.update("gefyra.kubeconfig", {
            file: file,
            context: context,
        });
    });
    let up = vscode.commands.registerCommand("gefyra.up", async () => {
        if (!gefyra_1.gefyraInstaller.isInstalled()) {
            vscode.window.showInformationMessage("Gefyra is not installed.");
            return;
        }
        if (vscode.workspace.workspaceFolders === undefined) {
            vscode.window.showInformationMessage("Gefyra (Up) requires an open workspace.");
            return;
        }
        const selection = await vscode.window.showQuickPick([
            {
                label: "Basic",
                description: "configuration",
                option: "basic",
            },
            {
                label: "Advanced",
                description: "configuration",
                option: "advanced",
            },
            // TODO: wait for gefyra-ext (flags not yet implemented)
            // {
            //   label: "Expert",
            //   description: "configuration",
            //   option: "expert",
            // },
        ], {
            placeHolder: "Select configuration options",
        });
        const minikube = await vscode.window.showQuickPick([
            {
                label: "No",
                option: false,
            },
            {
                label: "Yes",
                option: true,
            },
        ], {
            placeHolder: "Do you use Minikube?",
        });
        let host;
        let port;
        if (selection?.option === "advanced" || selection?.option === "expert") {
            host = await vscode.window.showInputBox({
                title: "-H, --host",
                prompt: "Host address for Gefyra to connect to. ",
            });
            port = await vscode.window.showInputBox({
                title: "-P, --port",
                prompt: "Port on the for Gefyra to connect to. ",
                value: "31280",
            });
        }
        if (port !== undefined) {
            port = +port;
        }
        const configuration = vscode.workspace.getConfiguration();
        const kubeconfig = configuration.get("gefyra.kubeconfig");
        const request = new protocol_1.GefyraUpRequest();
        request.host = host;
        request.port = port;
        request.minikube = minikube?.option;
        request.kubeconfig = kubeconfig?.file;
        request.context = kubeconfig?.context;
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Gefyra (Up)",
            cancellable: false,
        }, async (progress) => {
            progress.report({
                increment: 0,
                message: "This takes a few seconds...",
            });
            let status = await gefyra_1.gefyraClient.up();
            if (status.success) {
                var message = "Done.";
            }
            else {
                var message = "Failed!";
                vscode.window.showErrorMessage("Gefyra (Up): Something went wrong.");
            }
            progress.report({
                increment: 100,
                message: message,
            });
            const p = new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, 3000);
            });
            return p;
        });
    });
    context.subscriptions.push(up);
    let down = vscode.commands.registerCommand("gefyra.down", () => {
        if (!gefyra_1.gefyraInstaller.isInstalled()) {
            vscode.window.showInformationMessage("Gefyra is not installed.");
            return;
        }
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Gefyra (Down)",
            cancellable: false,
        }, async (progress) => {
            progress.report({
                increment: 0,
                message: "This takes a few seconds...",
            });
            let status = await gefyra_1.gefyraClient.down();
            if (status.success) {
                var message = "Done.";
            }
            else {
                var message = "Failed!";
                vscode.window.showErrorMessage("Gefyra (Down): Something went wrong.");
            }
            progress.report({
                increment: 100,
                message: message,
            });
            const p = new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, 3000);
            });
            return p;
        });
    });
    context.subscriptions.push(down);
    let run = vscode.commands.registerCommand("gefyra.run", () => {
        if (!gefyra_1.gefyraInstaller.isInstalled()) {
            vscode.window.showInformationMessage("Gefyra is not installed.");
            return;
        }
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Gefyra (Run)",
            cancellable: false,
        }, async (progress) => {
            progress.report({
                increment: 0,
                message: "This takes a few seconds...",
            });
            // const kubeconfig = configuration.get<{}>("gefyra.kubeconfig");
            // let status = await gefyraClient.run();
            if (false) {
                var message = "Done.";
            }
            else {
                var message = "Failed!";
                vscode.window.showErrorMessage("Gefyra (Run): Something went wrong.");
            }
            progress.report({
                increment: 100,
                message: message,
            });
            const p = new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, 3000);
            });
            return p;
        });
    });
    context.subscriptions.push(run);
    let status = vscode.commands.registerCommand("gefyra.status", () => {
        if (!gefyra_1.gefyraInstaller.isInstalled()) {
            vscode.window.showInformationMessage("Gefyra is not installed.");
            return;
        }
        let status = gefyra_1.gefyraClient.status();
        status.then((status) => {
            vscode.window.showInformationMessage(`Gefyra (Status): ${status.response.summary}`);
        });
    });
    context.subscriptions.push(status);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map