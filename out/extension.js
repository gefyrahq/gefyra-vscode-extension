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
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Gefyra (Install)",
            cancellable: false,
        }, async (progress) => {
            progress.report({
                increment: 0,
                message: "This takes about a minute...",
            });
            const installer = gefyra_1.gefyraInstaller.install();
            await installer;
            progress.report({
                increment: 100,
                message: "Successfully installed.",
            });
            const p = new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, 3000);
            });
            return p;
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
            let fileResponse = await gefyra_1.gefyraClient.k8sDefaultKubeconfig();
            file = fileResponse.response;
        }
        if (selection?.option === "manual") {
            if (vscode.workspace.workspaceFolders === undefined) {
                vscode.window.showInformationMessage("Gefyra (Kubeconfig - Manual) requires an open workspace.");
                return;
            }
            file = await vscode.window.showInputBox({
                prompt: "Kubeconfig",
            });
        }
        const request = new protocol_1.K8sContextRequest();
        request.kubeconfig = file;
        let contextResponse = await gefyra_1.gefyraClient.k8sContexts(request);
        const contextSelection = await vscode.window.showQuickPick(contextResponse.response.contexts.map((c) => {
            return {
                label: c,
                description: "",
                option: c,
            };
        }), {
            placeHolder: "Select the context to be used by Gefyra",
        });
        context = contextSelection?.option;
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
        // workspace settings
        const configuration = vscode.workspace.getConfiguration();
        const workspaceKubeconfig = configuration.get("gefyra.kubeconfig");
        const workspaceUp = configuration.get("gefyra.up");
        // options
        var options = [
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
            {
                label: "Expert",
                description: "configuration",
                option: "expert",
            },
        ];
        if (Object.keys(workspaceUp).length > 0) {
            options.push({
                label: "Settings",
                description: "use configuration from .vscode/settings.json",
                option: "settings",
            });
        }
        const selection = await vscode.window.showQuickPick(options, {
            placeHolder: "Select configuration options",
        });
        let host;
        let port;
        let minikube;
        let operatorImage;
        let stowawayImage;
        let carrierImage;
        let cargoImage;
        let registryUrl;
        let wireguardMTU;
        if (selection?.option === "basic" ||
            selection?.option === "advanced" ||
            selection?.option === "expert") {
            const minikubeSelection = await vscode.window.showQuickPick([
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
            minikube = minikubeSelection?.option;
            if (selection?.option === "advanced" || selection?.option === "expert") {
                host = await vscode.window.showInputBox({
                    title: "Host (-H, --host)",
                    prompt: "Host address for Gefyra to connect to.",
                });
                port = await vscode.window.showInputBox({
                    title: "Port (-P, --port)",
                    prompt: "Port for Gefyra to connect to.",
                    value: "31280",
                });
                if (port !== undefined) {
                    port = +port;
                }
            }
            if (selection?.option === "expert") {
                operatorImage = await vscode.window.showInputBox({
                    title: "Operator Image (-o, --operator)",
                    prompt: "The full image path (including tag) for the Operator image (e.g. quay.io/gefyra/operator:latest).",
                    value: "quay.io/gefyra/operator:latest",
                });
                stowawayImage = await vscode.window.showInputBox({
                    title: "Stowaway Image (-s, --stowaway)",
                    prompt: "The full image path (including tag) for the Stowaway image (e.g. quay.io/gefyra/stowaway:latest).",
                    value: "quay.io/gefyra/stowaway:latest",
                });
                carrierImage = await vscode.window.showInputBox({
                    title: "Carrier Image (-c, --carrier	)",
                    prompt: "The full image path (including tag) for the Carrier image (e.g. quay.io/gefyra/carrier:latest).",
                    value: "quay.io/gefyra/carrier:latest",
                });
                cargoImage = await vscode.window.showInputBox({
                    title: "Cargo Image (-a, --cargo)",
                    prompt: "The full image path (including tag) for the Cargo image (e.g. quay.io/gefyra/cargo:latest).",
                    value: "quay.io/gefyra/cargo:latest",
                });
                registryUrl = await vscode.window.showInputBox({
                    title: "Registry URL (-r, --registry)",
                    prompt: "The base url for registry to pull images from (e.g. quay.io/gefyra/), the full image paths will be constructed using the name and the tag of the release.",
                    value: "quay.io/gefyra/",
                });
                wireguardMTU = await vscode.window.showInputBox({
                    title: "Wireguard MTU (--wireguard-mtu)",
                    prompt: "The MTU value for the local Wireguard endpoint (default: 1340).",
                    value: "1340",
                });
            }
            // save to workspace settings
            await configuration.update("gefyra.up", {
                host: host,
                port: port,
                minikube: minikube,
                operatorImage: operatorImage,
                stowawayImage: stowawayImage,
                carrierImage: carrierImage,
                cargoImage: cargoImage,
                registryUrl: registryUrl,
                wireguardMTU: wireguardMTU,
            });
        }
        else {
            // load from workspace settings
            host = workspaceUp?.host;
            port = workspaceUp?.port;
            operatorImage = workspaceUp?.operatorImage;
            stowawayImage = workspaceUp?.stowawayImage;
            carrierImage = workspaceUp?.carrierImage;
            cargoImage = workspaceUp?.cargoImage;
            registryUrl = workspaceUp?.registryUrl;
            wireguardMTU = workspaceUp?.wireguardMTU;
        }
        const request = new protocol_1.GefyraUpRequest();
        request.kubeconfig = workspaceKubeconfig?.file;
        request.context = workspaceKubeconfig?.context;
        request.host = host;
        request.port = port;
        request.minikube = minikube;
        request.operatorImage = operatorImage;
        request.stowawayImage = stowawayImage;
        request.carrierImage = carrierImage;
        request.cargoImage = cargoImage;
        request.registryUrl = registryUrl;
        request.wireguardMTU = wireguardMTU;
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Gefyra (Up)",
            cancellable: false,
        }, async (progress) => {
            progress.report({
                increment: 0,
                message: "This takes a few seconds...",
            });
            let status = await gefyra_1.gefyraClient.up(request).catch((err) => {
                try {
                    var message = String(JSON.parse(err.stdout).reason);
                }
                catch {
                    var message = "Something went wrong.";
                }
                vscode.window.showErrorMessage("Gefyra (Up): " + message);
                return { success: false };
            });
            progress.report({
                increment: 100,
                message: status.success ? "Done." : "Failed!",
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
            let status = await gefyra_1.gefyraClient.down().catch((err) => {
                try {
                    var message = String(JSON.parse(err.stdout).reason);
                }
                catch {
                    var message = "Something went wrong.";
                }
                vscode.window.showErrorMessage("Gefyra (Down): " + message);
                return { success: false };
            });
            progress.report({
                increment: 100,
                message: status.success ? "Done." : "Failed!",
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
    let run = vscode.commands.registerCommand("gefyra.run", async () => {
        if (!gefyra_1.gefyraInstaller.isInstalled()) {
            vscode.window.showInformationMessage("Gefyra is not installed.");
            return;
        }
        const image = await vscode.window.showInputBox({
            prompt: "image",
        });
        if (image === undefined) {
            vscode.window.showInformationMessage("Image is required.");
            return;
        }
        const name = await vscode.window.showInputBox({
            prompt: "name",
        });
        const command = await vscode.window.showInputBox({
            prompt: "command",
        });
        const detach = await vscode.window.showQuickPick([
            {
                label: "No",
                option: false,
            },
            {
                label: "Yes",
                option: true,
            },
        ], {
            placeHolder: "detach",
        });
        const autoremove = await vscode.window.showQuickPick([
            {
                label: "No",
                option: false,
            },
            {
                label: "Yes",
                option: true,
            },
        ], {
            placeHolder: "autoremove",
        });
        const namespace = await vscode.window.showInputBox({
            prompt: "namespace",
        });
        const envfrom = await vscode.window.showInputBox({
            prompt: "envfrom",
        });
        const request = new protocol_1.GefyraRunRequest();
        request.image = image;
        request.name = name;
        request.command = command;
        // // volumes and ports are tbd
        // volumes?: string[];
        // ports?: { [key: string]: string };
        request.detach = detach?.option;
        request.autoremove = autoremove?.option;
        request.namespace = namespace;
        // env?: string[];
        request.envfrom = envfrom;
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
            let status = await gefyra_1.gefyraClient.run(request).catch((err) => {
                try {
                    var message = String(JSON.parse(err.stdout).reason);
                }
                catch {
                    var message = "Something went wrong.";
                }
                vscode.window.showErrorMessage("Gefyra (Run): " + message);
                return { success: false };
            });
            progress.report({
                increment: 100,
                message: status.success ? "Done." : "Failed!",
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