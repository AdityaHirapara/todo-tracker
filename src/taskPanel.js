const vscode = require('vscode');

function getPanelContent(tasks, linkSrc) {
  let contents = tasks.map(t => {
    let filepath = t.file.replace(vscode.workspace.rootPath, "");

    return `
      <div style="line-height: 20px; margin: 20px; margin-bottom: 20px; border-bottom: 0.5px solid #d7d7d7;">
        <button onclick="openFile('${t.file}', ${t.position.line});" style="float: right; background-color: #3498DB; box-shadow: none; border: none; border-radius: 5px; cursor: pointor;">
          <img width=20 src=${linkSrc} alt="open" style="margin: 5px -2px 3px 0px;"/>
        </button>
        <h2>${t.title}</h2>
        <p>${t.description}</p>
        <div>
          ${filepath}
        </div>
      </div>
    `
  })

  contents = contents.join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TODO Tracker</title>
      <script>
        const vscode = acquireVsCodeApi();
        function openFile(file, line) {
          vscode.postMessage({
            command: 'openfile',
            file,
            line,
          });
        }
      </script>
    </head>
    <body>
      <h1 style="text-align: center">TODO Tracker</h1>
      ${contents}
    </body>
    </html>
  `
}

module.exports = {
  getPanelContent,
};