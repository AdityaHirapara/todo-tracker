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

      let list = context.workspaceState.get("list");
      let id;
      if (!list || !list.length) {
        id = 0;
        list=[];
      } else {
        id = list[list.length-1] + 1;
      }

      let task = {
        title,
        description,
        position,
        file,
      }
      context.workspaceState.update(`todoTask${id}`, task);
      list.push(id);
      context.workspaceState.update("list", list);
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

    let list = context.workspaceState.get("list");
    let tasks = list.map(key => {
      return context.workspaceState.get(`todoTask${key}`)
    })

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

    panel.webview.html = getPanelContent(tasks, linkSrc);
  });

	context.subscriptions.push(addTask, removeTask, openPanel);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
