import {
  QuickPickItem,
  window,
  Disposable,
  QuickInputButton,
  QuickInput,
  ExtensionContext,
  QuickInputButtons,
  Uri,
} from "vscode";
import * as vscode from "vscode";

import { gefyraClient } from "gefyra";
import { GefyraRunRequest } from "gefyra/lib/protocol";

export async function runInput(context: ExtensionContext) {
  class CreateQuickInputButton implements QuickInputButton {
    constructor(
      public iconPath: { light: Uri; dark: Uri },
      public tooltip: string
    ) {}
  }

  const createConfigurationButton = new CreateQuickInputButton(
    {
      dark: Uri.file(context.asAbsolutePath("resources/dark/add.svg")),
      light: Uri.file(context.asAbsolutePath("resources/light/add.svg")),
    },
    "Create Configuration"
  );

  // workspace settings
  const configuration = vscode.workspace.getConfiguration();
  const workspaceRun = configuration.get("gefyra.run") as Array<any>;

  const configurations: QuickPickItem[] = workspaceRun.map((item) => ({
    label: item.name,
  }));

  interface State {
    title: string;
    step: number;
    totalSteps: number;
    configuration: QuickPickItem | string;
    name: string;
    runtime: QuickPickItem;
  }

  async function collectInputs() {
    const state = {} as Partial<State>;
    await MultiStepInput.run((input) => selectOrCreate(input, state));
    return state as State;
  }

  const title = "Select/Create Configuration";

  async function selectOrCreate(input: MultiStepInput, state: Partial<State>) {
    const pick = await input.showQuickPick({
      title,
      step: 1,
      totalSteps: 1,
      placeholder: "Select configuration",
      items: configurations,
      activeItem:
        typeof state.configuration !== "string"
          ? state.configuration
          : undefined,
      buttons: [createConfigurationButton],
      shouldResume: shouldResume,
    });
    if (pick instanceof CreateQuickInputButton) {
      return (input: MultiStepInput) => inputConfigurationName(input, state);
    }
    state.configuration = pick;

    // select workspace configuration
    const configuration = workspaceRun.find((item) => item.name === pick.label);

    await execute(
      configuration.parameters.image,
      configuration.parameters.name,
      configuration.parameters.command,
      configuration.parameters.volumes,
      configuration.parameters.ports,
      configuration.parameters.detach,
      configuration.parameters.autoremove,
      configuration.parameters.namespace,
      configuration.parameters.env,
      configuration.parameters.envfrom
    );
  }

  async function inputConfigurationName(
    input: MultiStepInput,
    state: Partial<State>
  ) {
    state.configuration = await input.showInputBox({
      title,
      step: 1,
      totalSteps: 2,
      value: typeof state.configuration === "string" ? state.configuration : "",
      prompt: "Choose a unique name for the configuration",
      validate: validateNameIsUnique,
      shouldResume: shouldResume,
    });
    return (input: MultiStepInput) => inputParameters(input, state);
  }

  async function inputParameters(input: MultiStepInput, state: Partial<State>) {
    const image = (await vscode.window.showInputBox({
      prompt: "image",
    })) as string;
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

    var volumes = [];
    const volume = await vscode.window.showInputBox({
      prompt: "volume",
    });
    volumes.push(volume);

    var ports = [] as any;
    const port = await vscode.window.showInputBox({
      prompt: "port",
      value: "localhost:8000:8000",
    });
    ports.push(port);

    const detachSelection = await vscode.window.showQuickPick(
      [
        {
          label: "No",
          option: false,
        },
        {
          label: "Yes",
          option: true,
        },
      ],
      {
        placeHolder: "detach",
      }
    );
    const detach = detachSelection?.option;

    const autoremoveSelection = await vscode.window.showQuickPick(
      [
        {
          label: "No",
          option: false,
        },
        {
          label: "Yes",
          option: true,
        },
      ],
      {
        placeHolder: "autoremove",
      }
    );
    const autoremove = autoremoveSelection?.option;

    const namespace = await vscode.window.showInputBox({
      prompt: "namespace",
    });

    var env = [];
    const envInput = await vscode.window.showInputBox({
      prompt: "env",
    });
    env.push(envInput);

    const envfrom = await vscode.window.showInputBox({
      prompt: "envfrom",
    });

    // save to workspace settings
    workspaceRun.push({
      name: state.configuration,
      parameters: {
        image: image,
        name: name,
        command: command,
        volumes: volumes,
        ports: ports,
        detach: detach,
        autoremove: autoremove,
        namespace: namespace,
        env: env,
        envfrom: envfrom,
      },
    });
    await configuration.update("gefyra.run", workspaceRun);
  }

  function shouldResume() {
    // Could show a notification with the option to resume.
    return new Promise<boolean>((resolve, reject) => {
      // noop
    });
  }

  async function validateNameIsUnique(name: string) {
    // const configuration = vscode.workspace.getConfiguration();
    // const workspaceRun = configuration.get("gefyra.run") as Array<any>;
    const workspaceRunNames = workspaceRun.map((item) => item.name);
    return workspaceRunNames.includes(name) ? "Name not unique" : undefined;
  }

  async function execute(
    image: string,
    name: string,
    command?: string,
    volumes?: Array<string>,
    ports?: Array<string>,
    detach?: boolean,
    autoremove?: boolean,
    namespace?: string,
    env?: Array<string>,
    envfrom?: string
  ) {
    try {
      // check ports for undefined
      if (ports === undefined) {
        ports = [];
      } else {
        var portsObject = ports.forEach((port: any) => {
          const portSplit = port?.split(":");
          ports[[portSplit[0], portSplit[1]].join(":")] = portSplit[2];
          return ports;
        });
      }
    } catch {
      vscode.window.showInformationMessage("One or more  ports are invalid.");
      return;
    }

    const request = new GefyraRunRequest();
    request.image = image;
    request.name = name;
    request.command = command;
    request.volumes = volumes as any;
    request.ports = portsObject as any;
    request.detach = detach;
    request.autoremove = autoremove;
    request.namespace = namespace;
    request.env = env as any;
    request.envfrom = envfrom;

    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Gefyra (Run)",
        cancellable: false,
      },
      async (progress) => {
        progress.report({
          increment: 0,
          message: "This takes a few seconds...",
        });

        let status = await gefyraClient.run(request).catch((err) => {
          try {
            var message = String(JSON.parse(err.stdout).reason);
          } catch {
            var message = "Something went wrong.";
          }

          vscode.window.showErrorMessage("Gefyra (Run): " + message);
          return { success: false };
        });

        progress.report({
          increment: 100,
          message: status.success ? "Done." : "Failed!",
        });
        const p = new Promise<void>((resolve) => {
          setTimeout(() => {
            resolve();
          }, 3000);
        });
        return p;
      }
    );
  }

  const state = await collectInputs();
  window.showInformationMessage(`Creating Application Service '${state.name}'`);
}

// -------------------------------------------------------
// Helper code that wraps the API for the multi-step case.
// -------------------------------------------------------

class InputFlowAction {
  static back = new InputFlowAction();
  static cancel = new InputFlowAction();
  static resume = new InputFlowAction();
}

type InputStep = (input: MultiStepInput) => Thenable<InputStep | void>;

interface QuickPickParameters<T extends QuickPickItem> {
  title: string;
  step: number;
  totalSteps: number;
  items: T[];
  activeItem?: T;
  ignoreFocusOut?: boolean;
  placeholder: string;
  buttons?: QuickInputButton[];
  shouldResume: () => Thenable<boolean>;
}

interface InputBoxParameters {
  title: string;
  step: number;
  totalSteps: number;
  value: string;
  prompt: string;
  validate: (value: string) => Promise<string | undefined>;
  buttons?: QuickInputButton[];
  ignoreFocusOut?: boolean;
  placeholder?: string;
  shouldResume: () => Thenable<boolean>;
}

class MultiStepInput {
  static async run<T>(start: InputStep) {
    const input = new MultiStepInput();
    return input.stepThrough(start);
  }

  private current?: QuickInput;
  private steps: InputStep[] = [];

  private async stepThrough<T>(start: InputStep) {
    let step: InputStep | void = start;
    while (step) {
      this.steps.push(step);
      if (this.current) {
        this.current.enabled = false;
        this.current.busy = true;
      }
      try {
        step = await step(this);
      } catch (err) {
        if (err === InputFlowAction.back) {
          this.steps.pop();
          step = this.steps.pop();
        } else if (err === InputFlowAction.resume) {
          step = this.steps.pop();
        } else if (err === InputFlowAction.cancel) {
          step = undefined;
        } else {
          throw err;
        }
      }
    }
    if (this.current) {
      this.current.dispose();
    }
  }

  async showQuickPick<
    T extends QuickPickItem,
    P extends QuickPickParameters<T>
  >({
    title,
    step,
    totalSteps,
    items,
    activeItem,
    ignoreFocusOut,
    placeholder,
    buttons,
    shouldResume,
  }: P) {
    const disposables: Disposable[] = [];
    try {
      return await new Promise<
        T | (P extends { buttons: (infer I)[] } ? I : never)
      >((resolve, reject) => {
        const input = window.createQuickPick<T>();
        input.title = title;
        input.step = step;
        input.totalSteps = totalSteps;
        input.ignoreFocusOut = ignoreFocusOut ?? false;
        input.placeholder = placeholder;
        input.items = items;
        if (activeItem) {
          input.activeItems = [activeItem];
        }
        input.buttons = [
          ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
          ...(buttons || []),
        ];
        disposables.push(
          input.onDidTriggerButton((item) => {
            if (item === QuickInputButtons.Back) {
              reject(InputFlowAction.back);
            } else {
              resolve(<any>item);
            }
          }),
          input.onDidChangeSelection((items) => resolve(items[0])),
          input.onDidHide(() => {
            (async () => {
              reject(
                shouldResume && (await shouldResume())
                  ? InputFlowAction.resume
                  : InputFlowAction.cancel
              );
            })().catch(reject);
          })
        );
        if (this.current) {
          this.current.dispose();
        }
        this.current = input;
        this.current.show();
      });
    } finally {
      disposables.forEach((d) => d.dispose());
    }
  }

  async showInputBox<P extends InputBoxParameters>({
    title,
    step,
    totalSteps,
    value,
    prompt,
    validate,
    buttons,
    ignoreFocusOut,
    placeholder,
    shouldResume,
  }: P) {
    const disposables: Disposable[] = [];
    try {
      return await new Promise<
        string | (P extends { buttons: (infer I)[] } ? I : never)
      >((resolve, reject) => {
        const input = window.createInputBox();
        input.title = title;
        input.step = step;
        input.totalSteps = totalSteps;
        input.value = value || "";
        input.prompt = prompt;
        input.ignoreFocusOut = ignoreFocusOut ?? false;
        input.placeholder = placeholder;
        input.buttons = [
          ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
          ...(buttons || []),
        ];
        let validating = validate("");
        disposables.push(
          input.onDidTriggerButton((item) => {
            if (item === QuickInputButtons.Back) {
              reject(InputFlowAction.back);
            } else {
              resolve(<any>item);
            }
          }),
          input.onDidAccept(async () => {
            const value = input.value;
            input.enabled = false;
            input.busy = true;
            if (!(await validate(value))) {
              resolve(value);
            }
            input.enabled = true;
            input.busy = false;
          }),
          input.onDidChangeValue(async (text) => {
            const current = validate(text);
            validating = current;
            const validationMessage = await current;
            if (current === validating) {
              input.validationMessage = validationMessage;
            }
          }),
          input.onDidHide(() => {
            (async () => {
              reject(
                shouldResume && (await shouldResume())
                  ? InputFlowAction.resume
                  : InputFlowAction.cancel
              );
            })().catch(reject);
          })
        );
        if (this.current) {
          this.current.dispose();
        }
        this.current = input;
        this.current.show();
      });
    } finally {
      disposables.forEach((d) => d.dispose());
    }
  }
}
