import * as vscode from "vscode";
import { QuickPickItem } from "vscode";

class TabGroupContext {
  groups: Group[];
  currentGroupNum: number;

  constructor() {
    this.groups = [];
    this.currentGroupNum = -1;
  }

  getGroups() {
    return this.groups;
  }

  addGroup(editors: readonly vscode.TextEditor[]) {
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
    this.description = group.items
      .map((item) => item.document.fileName.replace(/^.*[\\/]/, ""))
      .join(" | ");
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
    tabContext.currentGroupNum = tabContext.groups.length - 1; // current group is last group
    vscode.window.showInformationMessage("added new group");
  });

  const closeCurrentEditors = async (
    newGroupViewColumns: (vscode.ViewColumn | undefined)[]
  ) => {
    const currentTabs = vscode.window.tabGroups.all;
    console.log(currentTabs);
    const tabsToClose: vscode.TabGroup[] = [];
    for (const group of currentTabs) {
      if (newGroupViewColumns.includes(group.viewColumn)) {
        continue;
      }
      tabsToClose.push(group);
    }

    try {
      await vscode.window.tabGroups.close(tabsToClose);
    } catch (error) {
      console.log(`ERROR: ${error}`);
    }
  };

  const pickGroup = vscode.commands.registerCommand(
    "tabs.pickGroup",
    async () => {
      const item = await vscode.window.showQuickPick(
        tabContext.getGroups().map((item, index) => {
          return new TabGroupPickItem(
            index.toString(),
            item.items[0].document.fileName,
            item
            // @ todo: simplify tabGroupPickItem to just use an id
          );
        }),
        { placeHolder: "pick an editor" }
      );

      if (item instanceof TabGroupPickItem) {
        loadTabGroup(Number(item.label));
      } else {
        console.log(item);
        vscode.window.showInformationMessage("raa");
      }
    }
  );

  const loadTabGroup = async (groupNum: number) => {
    const group = tabContext.getGroups()[groupNum];

    await closeCurrentEditors(group.items.map((i) => i.viewColumn));
    for (const groupItem of group.items) {
      vscode.window.showTextDocument(groupItem.document, {
        viewColumn: groupItem.viewColumn,
      });
    }

    tabContext.currentGroupNum = groupNum;
    vscode.window.showInformationMessage(`swapped to group ${groupNum}`);
  };

  const nextGroup = vscode.commands.registerCommand(
    "tabs.nextGroup",
    async () => {
      const groupNumToLoad =
        (tabContext.currentGroupNum + 1) % tabContext.groups.length;
      await loadTabGroup(groupNumToLoad);
    }
  );

  const previousGroup = vscode.commands.registerCommand(
    "tabs.previousGroup",
    async () => {
      let groupNumToLoad = tabContext.currentGroupNum - 1;
      if (groupNumToLoad < 0) {
        // wrap back around
        groupNumToLoad = tabContext.groups.length - 1;
      }

      await loadTabGroup(groupNumToLoad);
    }
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(tabInfo);
  context.subscriptions.push(addGroup);
  context.subscriptions.push(pickGroup);
}

// This method is called when your extension is deactivated

export function deactivate() {}
