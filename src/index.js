const vscode = require('vscode');
const path = require('path');
const taskTreeView = require("./taskTreeView");

const { getPanelContent } = require('./taskPanel');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  const { window } = vscode;
  let panel = undefined;

	let addTask = vscode.commands.registerCommand('extension.addTask', async () => {
    const editor = window.activeTextEditor;

    if (editor.selection.isEmpty) {
      const position = editor.selection.active;
      const file = editor.document.fileName;
      
      const title = await window.showInputBox({
        placeHolder: 'Task title',
        validateInput: text => {
          return text === '' ? 'Empty not allowed!' : null;
        }
      });

      if (!title) {
        return;
      }

      const description = await window.showInputBox({
        placeHolder: 'Describe task (if you want)',
        value: ''
      });

      let id = context.workspaceState.get("lastid") || 0;

      let task = {
        id: id + 1,
        title,
        description,
        position,
        file,
        timestamp: new Date(),
      }

      let filepath = file.replace(vscode.workspace.rootPath, "").slice(1);
      let taskDB = context.workspaceState.get("taskDB") || {};

      let pathArr = filepath.split('/');
      let ref = taskDB;
      pathArr.forEach((p, i) => {
        if (ref[p]) {
          if (ref[p] instanceof Array) {
            ref[p].push(task);
          } else if (ref[p] instanceof Object) {
            ref = ref[p];
          }
        } else {
          if (i === pathArr.length - 1) {
            ref[p] = [task];
          } else {
            ref[p] = {};
            ref = ref[p];
          }
        }
      });

      context.workspaceState.update("taskDB", taskDB).then(() => {
        if (panel) {
          loadWebview();
        }
      });
      context.workspaceState.update("lastid", id+1);
    }
  });

  let openPanel = vscode.commands.registerCommand('extension.openTasks', () => {
    panel = window.createWebviewPanel(
      'todoTracker',
      'TODO Tracker',
      vscode.ViewColumn.One,
      {
        localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))],
        enableScripts: true
      }
    );

    panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'openfile':
            const openPath = vscode.Uri.file(message.file);
            vscode.commands.executeCommand('vscode.open', openPath).then(() => {
              const { line } = window.activeTextEditor.selection.active;
              let value = message.line - line;
              if (value)
                vscode.commands.executeCommand('cursorMove', {to: 'down', by: 'line', value });

              return;
            });
          break;

          case 'deleteTask':
            deleteTasks(message.file, message.id);
          break;

          case 'refresh':
            loadWebview();
          return;
        }
      },
      undefined,
      context.subscriptions
    );

    loadWebview();
  });

  context.subscriptions.push(addTask, openPanel);

  vscode.commands.registerCommand('extension.openFile', (file, position) => {
    const openPath = vscode.Uri.file(file);
    vscode.commands.executeCommand('vscode.open', openPath).then(() => {
      const { line } = window.activeTextEditor.selection.active;
      let value = position.line - line;
      if (value)
        vscode.commands.executeCommand('cursorMove', {to: 'down', by: 'line', value });
      return;
    });
  });

  const tasksProvider = new taskTreeView.TaskNodeProvider(vscode.workspace.rootPath, context.workspaceState.get("taskDB"));
  vscode.window.registerTreeDataProvider('todoTasks', tasksProvider);
  vscode.commands.registerCommand('todoTasks.refreshEntry', () => tasksProvider.refresh());
  vscode.commands.registerCommand('todoTasks.addTask', () => vscode.commands.executeCommand('extension.addTask'));

  function loadWebview() {

    const linkPath = vscode.Uri.file(
      path.join(context.extensionPath, 'media', 'link.png')
    );
    const expPath = vscode.Uri.file(
      path.join(context.extensionPath, 'media', 'expand.png')
    );
    const trsPath = vscode.Uri.file(
      path.join(context.extensionPath, 'media', 'trash.png')
    );
    const refreshPath = vscode.Uri.file(
      path.join(context.extensionPath, 'media', 'refresh.png')
    );

    const linkSrc = panel.webview.asWebviewUri(linkPath).toString();
    const expSrc = panel.webview.asWebviewUri(expPath).toString();
    const trsSrc = panel.webview.asWebviewUri(trsPath).toString();
    const refreshSrc = panel.webview.asWebviewUri(refreshPath).toString();

    let treeDB = context.workspaceState.get("taskDB") || {};

    panel.webview.html = getPanelContent(treeDB, linkSrc, expSrc, trsSrc, refreshSrc);
  }

  function deleteTasks(file, id) {
    let filepath = file.replace(vscode.workspace.rootPath, "").slice(1);
    let taskDB = context.workspaceState.get("taskDB") || {};

    let pathArr = filepath.split('/');
    let ref = taskDB;
    let refArray = [taskDB];

    for (let i=0; i<pathArr.length; i++) {
      ref = ref[pathArr[i]];
      refArray[i+1] = ref;
    }

    refArray.reverse();

    let index = ref.findIndex(t => t.id === id);
    ref.splice(index, 1);
    if (ref.length === 0) {
      let pathLength = pathArr.length;

      delete refArray[1][pathArr[pathLength-1]];
      for (let i=1; i<refArray.length-1; i++) {
        if (!Object.keys(refArray[i]).length) {
          delete refArray[i+1][pathArr[pathLength-1-i]];
        } else {
          break;
        }
      }
    }

    context.workspaceState.update("taskDB", taskDB).then(() => {
      if (panel) {
        loadWebview();
      }
    });
  }
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
