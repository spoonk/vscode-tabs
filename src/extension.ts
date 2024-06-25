// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { QuickPickItem } from "vscode";

class TabGroupContext {
  groups: string[];
  constructor() {
    this.groups = [];
  }

  getTabs() {
    return this.groups;
  }

  addGroup(fileName: string) {
    this.groups.push(fileName);
  }
}

class TabGroupPickItem implements QuickPickItem {
  label: string;
  description?: string | undefined;

  constructor(public name: string, public path: string) {
    this.label = name;
    this.description = path;
  }
}

const tabContext = new TabGroupContext();

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log(context);

  const disposable = vscode.commands.registerCommand("tabs.helloWorld", () => {
    vscode.window.showInformationMessage("raaaaa!!!");
    vscode.window.showInformationMessage("hello");
  });

  const tabInfo = vscode.commands.registerCommand("tabs.tabInfo", () => {
    // const tabArray = vscode.window.tabGroups.all;
    console.log(tabContext.getTabs());
  });

  const addGroup = vscode.commands.registerCommand("tabs.addGroup", () => {
    // const tabArray = vscode.window.tabGroups.all;
    const activeTab = vscode.window.tabGroups.activeTabGroup;
    if (activeTab.activeTab) {
      tabContext.addGroup(activeTab.activeTab?.label);
    }
    console.log(tabContext.getTabs());
  });

  const pickGroup = vscode.commands.registerCommand(
    "tabs.pickGroup",
    async () => {
      const result = await vscode.window.showQuickPick(
        tabContext.getTabs().map((item) => new TabGroupPickItem(item, item)),
        {
          placeHolder: "pick a group",
          onDidSelectItem: (item) => {
            if (item instanceof TabGroupPickItem) {
              vscode.window.showInformationMessage(item.label);
            } else {
              vscode.window.showInformationMessage("raa");
            }
          },
        }
      );
    }
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(tabInfo);
  context.subscriptions.push(addGroup);
}

// This method is called when your extension is deactivated

export function deactivate() {}
