const vscode = require('vscode');
const path = require('path');

const { getPanelContent } = require('./taskPanel');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  const { window } = vscode;

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

      console.log(taskDB);
      context.workspaceState.update("taskDB", taskDB);
      context.workspaceState.update("lastid", id+1);
    }
  });

  let removeTask = vscode.commands.registerCommand('extension.removeTask', () => {

  });

  let openPanel = vscode.commands.registerCommand('extension.openTasks', () => {
    const panel = window.createWebviewPanel(
      'todoTracker',
      'TODO Tracker',
      vscode.ViewColumn.One,
      {
        localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))],
        enableScripts: true
      }
    );

    const linkPath = vscode.Uri.file(
      path.join(context.extensionPath, 'media', 'link.png')
    );

    const linkSrc = panel.webview.asWebviewUri(linkPath).toString();

    let treeDB = context.workspaceState.get("taskDB");

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
            return;
        }
      },
      undefined,
      context.subscriptions
    );

    panel.webview.html = getPanelContent(treeDB, linkSrc);
  });

	context.subscriptions.push(addTask, removeTask, openPanel);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
