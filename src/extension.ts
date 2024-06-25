// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { QuickPickItem } from "vscode";

class TabGroupContext {
  groups: string[];
  editors: (readonly vscode.TextEditor[])[];
  constructor() {
    this.groups = [];
    this.editors = [];
  }

  getTabs() {
    return this.groups;
  }

  getEditors() {
    return this.editors;
  }

  addGroup(fileName: string) {
    this.groups.push(fileName);
  }
  addEditors(editors: readonly vscode.TextEditor[]) {
    this.editors.push(editors);
  }
}

class TabGroupPickItem implements QuickPickItem {
  label: string;
  description?: string | undefined;
  //   public editors: readonly vscode.TextEditor[];

  constructor(
    public name: string,
    public path: string,
    public editors: readonly vscode.TextEditor[]
  ) {
    this.label = name;
    this.description = path;
    this.editors = editors;
  }
}

const tabContext = new TabGroupContext();

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
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

    const visibleEditors = vscode.window.visibleTextEditors;
    tabContext.addEditors(visibleEditors);

    console.log(tabContext.getTabs());
  });

  const pickGroup = vscode.commands.registerCommand(
    "tabs.pickGroup",
    async () => {
      console.log("HELPPP");
      const item = await vscode.window.showQuickPick(
        tabContext.getEditors().map((item) => {
          // item is a list of editors
          return new TabGroupPickItem("lorem", "ipsum", item);
        }),
        { placeHolder: "pick an editor" }
      );
      console.log("huh");

      if (item instanceof TabGroupPickItem) {
        // @todo: close currently visible editors

        // show the editors
        for (const editor of item.editors) {
          vscode.window.showTextDocument(editor.document, {
            viewColumn: editor.viewColumn,
          });
        }
      } else {
        console.log(item);
        vscode.window.showInformationMessage("raa");
      }
    }
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(tabInfo);
  context.subscriptions.push(addGroup);
  context.subscriptions.push(pickGroup);
}

// This method is called when your extension is deactivated

export function deactivate() {}
