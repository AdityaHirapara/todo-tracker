const vscode = require('vscode');

let linkSrc = '';

function getPanelContent(taskTree, link) {
  linkSrc = link;
  let contents = traverseDFS(taskTree);

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

function traverseDFS(root) {
  let keys = Object.keys(root);

  let stack = keys
    .map(k => {
      return {
        depth: 0,
        ref: root[k],
        key: k
      }
    });
  stack = sortKeys(stack);

  let content = "";
  let last = 0;
  
  while (stack.length) {      
    let curr = stack.pop();
    let { key, ref } = curr;
    let currDepth = curr.depth;

    if (currDepth < last) {
      let diff = last - currDepth;

      while (diff--) {
        content += '</div>';
      }
    }

    if (ref instanceof Array) {
      content += `<div style="margin-left: ${currDepth*10}px"><h3>${key}</h3>`;
      content += buildContent(ref);
      content += `<hr style="margin-left: ${(currDepth-1)*10}px"/></div>`;
    } else if (ref instanceof Object) {
      let keys = Object.keys(ref);
      let EleArr = keys.map(k => {
        return {
          depth: currDepth + 1,
          ref: ref[k],
          key: k
        }
      });

      EleArr = sortKeys(EleArr);
      stack.push(...EleArr);

      content += `<div style="margin-left: ${currDepth*10}px"><h2>${key}</h2>`;
    }

    last = currDepth;
  }

  return content;
}

function sortKeys(keys) {
  let dirs = [];
  let files = [];

  keys.sort((a, b) => a.key.toUpperCase() > b.key.toUpperCase()? -1: 1);
  keys.forEach(k => {
    if (k.ref instanceof Array) {
      files.push(k);
    } else if (k.ref instanceof Object) {
      dirs.push(k);
    }
  });

  return files.concat(dirs);
}

function buildContent(tasks) {
  let contents = tasks.map(t => {
    // console.log(vscode.workspace.workspaceFolders[0].uri.path);
    let filepath = t.file.replace(vscode.workspace.rootPath, "");

    return `
      <div style="line-height: 20px; margin: 20px; margin-bottom: 20px; border-bottom: 0.5px solid #d7d7d7;">
        <button onclick="openFile('${t.file}', ${t.position.line});" style="float: right; background-color: #3498DB; box-shadow: none; border: none; border-radius: 5px; cursor: pointor;">
          <img width=20 src=${linkSrc} alt="open" style="margin: 5px -2px 3px 0px;"/>
        </button>
        <h4>${t.title}</h4>
        <p>${t.description}</p>
        <div>
          ${filepath}
        </div>
      </div>
    `
  })

  contents = contents.join('');

  return contents;
}

module.exports = {
  getPanelContent,
};