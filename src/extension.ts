import * as vscode from "vscode";
import {
  TabGroupContextManager,
  TabGroupPickItem,
} from "./tab-context-manager";
const tabContext = new TabGroupContextManager();

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const tabInfo = vscode.commands.registerCommand("tabs.tabInfo", () => {
    console.log(tabContext.getGroups());
  });

  const addGroup = vscode.commands.registerCommand("tabs.addGroup", () => {
    const visibleEditors = vscode.window.visibleTextEditors;
    if (tabContext.numGroups() >= 5) {
      // @todo: in the future support more and shorten the list
      vscode.window.showErrorMessage("Cannot add more than 5 tab groups");
      return;
    }

    tabContext.addGroup(visibleEditors);
    vscode.window.showInformationMessage("added new group");
  });

  const pickGroup = vscode.commands.registerCommand(
    "tabs.pickGroup",
    async () => {
      const item = await vscode.window.showQuickPick(
        tabContext.getGroups().map((item, index) => {
          return new TabGroupPickItem(
            index.toString(),
            item.items[0].document.fileName,
            item
          );
        }),
        { placeHolder: "pick an editor" }
      );

      if (item instanceof TabGroupPickItem) {
        tabContext.loadTabGroup(Number(item.label));
      } else {
        vscode.window.showInformationMessage("raa");
      }
    }
  );
  const nextGroup = vscode.commands.registerCommand(
    "tabs.nextGroup",
    async () => {
      const groupNumToLoad =
        (tabContext.currentGroupNum() + 1) % tabContext.numGroups();
      await tabContext.loadTabGroup(groupNumToLoad);
    }
  );

  const previousGroup = vscode.commands.registerCommand(
    "tabs.previousGroup",
    async () => {
      let groupNumToLoad = tabContext.currentGroupNum() - 1;
      if (groupNumToLoad < 0) {
        // wrap back around
        groupNumToLoad = tabContext.numGroups() - 1;
      }

      await tabContext.loadTabGroup(groupNumToLoad);
    }
  );

  const pickGroupHelper = async (desiredGroupNum: number) => {
    if (tabContext.currentGroupNum() == desiredGroupNum) {
      vscode.window.showWarningMessage(
        `Group ${desiredGroupNum} already selected`
      );
      return;
    } else if (tabContext.numGroups() <= desiredGroupNum) {
      vscode.window.showErrorMessage(`Group ${desiredGroupNum} doesn't exist`);
      return;
    }

    tabContext.loadTabGroup(desiredGroupNum);
  };

  for (const num of [0, 1, 2, 3, 4, 5]) {
    // register all 5 pickers
    vscode.commands.registerCommand(`tabs.pickGroup${num}`, async () => {
      pickGroupHelper(num);
    });

    // @todo: register 5 deleters
  }

  // context.subscriptions.push(disposable);
  context.subscriptions.push(tabInfo);
  context.subscriptions.push(addGroup);
  context.subscriptions.push(pickGroup);
}

// This method is called when your extension is deactivated

export function deactivate() {}
