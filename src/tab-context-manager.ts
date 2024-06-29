import * as vscode from "vscode";
import { QuickPickItem } from "vscode";

export class TabGroupContextManager {
  private groups: Group[];
  private currGroupNum: number;

  constructor() {
    this.groups = [];
    this.currGroupNum = -1;
  }

  getGroups() {
    return this.groups;
  }

  numGroups(): number {
    return this.groups.length;
  }

  currentGroupNum(): number {
    return this.currGroupNum;
  }

  updateStatusBarItemText(text: string, itemIndex: number): void {
    if (
      itemIndex < 0 ||
      itemIndex >= this.numGroups() ||
      this.currGroupNum === -1
    ) {
      return;
    }

    this.groups[itemIndex].statusBarItem.text = text;
  }

  // @todo: will probably need to show / hide items rather than deleting them
  // this means adding a group will also need to check if it doesn't exist
  // or if there's already a status bar item for them
  // This means I may need to separate out status bar item and group again
  deleteGroup(groupNum: number): void {
    // @note: for now, will just recreate status bar items a haha
    // rather than reusing them
    // remove from array
    // adjust labels of the things following the group to be 1 <
    // focus the group that replaced this one (unless was last group)

    if (this.numGroups() === 0) return;

    // remove the group
    this.groups[groupNum].statusBarItem.hide();
    this.groups.splice(groupNum, 1);

    // adjust the labels of subsequent groups
    for (let i = groupNum; i < this.numGroups(); i++) {
      this.updateStatusBarItemText(` ${i} `, i);
    }

    if (this.numGroups() !== 0) {
      // if we deleted the last group, focus next smallest
      // otherwise, focus same group num
      this.focusGroup(groupNum === this.numGroups() ? groupNum - 1 : groupNum);
    } else {
      this.currGroupNum = -1;
    }

    // @todo: focus other group
    // @todo: check if there are 0 groups remaining
    // -hm it might be weird to focus another gorup if the deleted layout is "dirty"
  }

  private initializeNewStatusBarItem(editors: readonly vscode.TextEditor[]) {
    const statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100000
    );

    statusBarItem.name = this.currentGroupNum().toString();
    statusBarItem.command = `tabs.pickGroup${this.currentGroupNum()}`;
    statusBarItem.text = `[${this.currentGroupNum().toString()}]`;
    statusBarItem.tooltip = `${this.currentGroupNum()}`;
    statusBarItem.tooltip = editors
      .map((item) => item.document.fileName.replace(/^.*[\\/]/, ""))
      .join("\n");

    statusBarItem.show();
    return statusBarItem;
  }

  async unfocusGroup(groupNum: number) {
    await this.closeCurrentEditors(
      this.groups[groupNum].items.map((i) => i.viewColumn)
    );
    // sets the text of status bar item to be unfocused variant
    this.updateStatusBarItemText(` ${groupNum} `, groupNum);
  }

  addGroup(editors: readonly vscode.TextEditor[]) {
    if (this.numGroups() > 0) {
      this.unfocusGroup(this.currGroupNum);
    }
    this.currGroupNum += 1;

    // no need to focus group when adding, since it will definitely already be focused

    const statusBarItem = this.initializeNewStatusBarItem(editors);
    this.groups.push({
      items: editors.map((editor) => {
        return {
          document: editor.document,
          viewColumn: editor.viewColumn,
        };
      }),
      statusBarItem,
    });
  }

  closeCurrentEditors = async (
    newGroupViewColumns: (vscode.ViewColumn | undefined)[]
  ) => {
    const currentTabs = vscode.window.tabGroups.all;
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
      console.warn(`ERROR: ${error}`);
    }
  };

  focusGroup(groupNum: number) {
    const group = this.groups[groupNum];
    for (const groupItem of group.items) {
      vscode.window.showTextDocument(groupItem.document, {
        viewColumn: groupItem.viewColumn,
      });
    }
    this.currGroupNum = groupNum;
    this.updateStatusBarItemText(`[${groupNum}]`, groupNum);
  }

  async loadTabGroup(groupNum: number) {
    this.unfocusGroup(this.currGroupNum);
    this.focusGroup(groupNum);
    vscode.window.showInformationMessage(`swapped to group ${groupNum}`);
  }
}

type Group = {
  items: readonly GroupItemState[];
  statusBarItem: vscode.StatusBarItem;
};

type GroupItemState = {
  readonly document: vscode.TextDocument;
  viewColumn: vscode.ViewColumn | undefined;
};

export class TabGroupPickItem implements QuickPickItem {
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
