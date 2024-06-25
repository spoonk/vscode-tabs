// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { QuickPickItem } from "vscode";

class TabGroupContext {
  groups: Group[];

  constructor() {
    this.groups = [];
  }

  getGroups() {
    return this.groups;
  }

  addGroup(editors: readonly vscode.TextEditor[]) {
    // group = new Grou
    this.groups.push({
      items: editors.map((editor) => {
        return {
          document: editor.document,
          viewColumn: editor.viewColumn,
        };
      }),
    });
  }
}

type Group = {
  items: GroupItemState[];
};

type GroupItemState = {
  readonly document: vscode.TextDocument;
  viewColumn: vscode.ViewColumn | undefined;
};

class TabGroupPickItem implements QuickPickItem {
  label: string;
  description?: string | undefined;

  constructor(public name: string, public path: string, public group: Group) {
    this.label = name;
    this.description = path;
    this.group = group;
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
    console.log(tabContext.getGroups());
  });

  const addGroup = vscode.commands.registerCommand("tabs.addGroup", () => {
    const visibleEditors = vscode.window.visibleTextEditors;
    tabContext.addGroup(visibleEditors);
  });

  const closeCurrentEditors = async (
    newGroupViewColumns: (vscode.ViewColumn | undefined)[]
  ) => {
    const currentTabs = vscode.window.tabGroups.all;
    console.log(currentTabs);
    for (const group of currentTabs) {
      if (newGroupViewColumns.includes(group.viewColumn)) {
        continue;
      }

      try {
        await vscode.window.tabGroups.close(group);
      } catch (error) {
        console.log(`ERROR: ${error}`);
      }
    }
  };

  const pickGroup = vscode.commands.registerCommand(
    "tabs.pickGroup",
    async () => {
      const item = await vscode.window.showQuickPick(
        tabContext.getGroups().map((item) => {
          return new TabGroupPickItem(
            item.items[0].document.fileName,
            "ipsum",
            item
          );
        }),
        { placeHolder: "pick an editor" }
      );

      if (item instanceof TabGroupPickItem) {
        await closeCurrentEditors(item.group.items.map((i) => i.viewColumn));

        for (const groupItem of item.group.items) {
          vscode.window.showTextDocument(groupItem.document, {
            viewColumn: groupItem.viewColumn,
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
