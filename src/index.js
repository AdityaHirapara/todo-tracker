const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	let addTask = vscode.commands.registerCommand('extension.addTask', async () => {
    const { window } = vscode;
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
      if (!list.length) id = 0;
      else id = list[list.length-1] + 1;

      let task = {
        title,
        description,
        position,
        file,
      }
      context.workspaceState.update(id, task);
      list.push(id);
      context.workspaceState.update("list", list);
    }
  });

  let removeTask = vscode.commands.registerCommand('extension.removeTask', () => {

  });

  let openPanel = vscode.commands.registerCommand('extension.openTasks', () => {

  });

	context.subscriptions.push(addTask, removeTask, openPanel);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
