const vscode = require('vscode');
const path = require('path');

class TaskNodeProvider {
  constructor(workspaceRoot, taskDB) {
    this.workspaceRoot = workspaceRoot;
    this.taskDB = taskDB || {};
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }
  refresh() {
    this._onDidChangeTreeData.fire();
  }
  getTreeItem(element) {
    return element;
  }
  getChildren(element) {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No tasks in empty workspace');
      return Promise.resolve([]);
    }
    if (element) {
      return Promise.resolve(this.getTasks(path.join(this.workspaceRoot, ...element.file)));
    }
    else {
      return Promise.resolve(this.getTasks(this.workspaceRoot));
    }
  }

  getTasks(filePath) {
    let pathArr = filePath.replace(this.workspaceRoot, "").slice(1).split('/');

    if (pathArr[0] === "") {
      let ref = this.taskDB;
      return Object.keys(ref).map(t => {
        const icon = ref[t] instanceof Array? 'document': 'folder';
        return new Task(t, vscode.TreeItemCollapsibleState.Collapsed, [t], icon);
      });
    } else {
      let ref = this.taskDB;
      pathArr.forEach(p => {
        ref = ref[p];
      });

      if (ref instanceof Array) {
        return ref.map(t => {
          return new Task(t.title, vscode.TreeItemCollapsibleState.None, t.file, 'task', t.description, t.position, {
            command: 'extension.openFile',
            title: '',
            arguments: [t.file, t.position]
          });
        });
      } else if (ref instanceof Object) {
        return Object.keys(ref).map(t => {
          const icon = ref[t] instanceof Array? 'document': 'folder';
          let temp = [...pathArr];
          temp.push(t);
          return new Task(t, vscode.TreeItemCollapsibleState.Collapsed, temp, icon);
        });
      }
    }
  }
}

exports.TaskNodeProvider = TaskNodeProvider;
class Task extends vscode.TreeItem {
  constructor(label, collapsibleState, file, icon, desc, position, command) {
    super(label, collapsibleState);
    this.label = label;
    this.collapsibleState = collapsibleState;
    this.file = file;
    this.desc = desc;
    this.position = position;
    this.command = command;
    this.iconPath = {
      light: path.join(__filename, '..', '..', 'media', 'light', icon + '.svg'),
      dark: path.join(__filename, '..', '..', 'media', 'dark', icon + '.svg')
    };
    this.contextValue = 'task';
  }
  get tooltip() {
    return this.desc? `${this.label} - ${this.desc}`: this.label;
  }
  get description() {
    return this.desc || '';
  }
}

exports.Task = Task;
