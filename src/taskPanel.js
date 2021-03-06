const vscode = require('vscode');
const moment = require('moment');

let linkSrc = '';
let expSrc = '';
let trsSrc = '';
let refSrc = '';

function getPanelContent(taskTree, link, expand, trash, refresh) {
  linkSrc = link;
  expSrc = expand;
  trsSrc = trash;
  refSrc = refresh;
  let contents = traverseDFS(taskTree);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TODO Tracker</title>
      <style>
        body {
          background-color: #1f1f1f;
          color: #fff;
        }
        h2 {
          margin-bottom: 5px;
        }
        h3 {
          font-size: 16px;
          margin-bottom: 5px;
        }
        h4 {
          font-size: 14px;
          margin-bottom: 5px;
        }
        button {
          cursor: pointer;
        }
        .center {
          text-align: center;
        }
        .title {
          cursor: pointer;
        }
        .content {
          overflow: hidden;
          transition: max-height .25s;
        }
        .collapse {
          max-height: 0px;
          transition: max-height .25s;
        }
        .arrow {
          margin: 0px 0px -5px 0px;
          transition: .25s;
        }
        .rotated {
          transform: rotate(-90deg);
        }
        .task {
          line-height: 20px;
          margin: 10px;
          padding: 10px;
          border-radius: 8px;
          background-color: #161616;
        }
        .button {
          box-shadow: none;
          border: none;
          border-radius: 5px;
          cursor: pointor;
          margin-right: 10px;
          padding: 5px 10px;
          color: #fff;
          font-weight: bold;
        }
        .iconbutton {
          float: right;
          box-shadow: none;
          border: none;
          border-radius: 5px;
          cursor: pointor;
          margin-right: 10px;
        }
        .blue {
          background-color: #3498DB;
        }
        .red {
          background-color: #D73A4A;
        }
        .icon {
          width: 20px;
          margin: 5px -2px 3px 0px;
        }
        .timestamp {
          float: right;
        }
      </style>
      <script>
        const vscode = acquireVsCodeApi();
        function openFile(file, line) {
          vscode.postMessage({
            command: 'openfile',
            file,
            line,
          });
        }

        function deleteTask(id, file) {
          vscode.postMessage({
            command: 'deleteTask',
            id,
            file,
          });
        }

        function refresh(id, file) {
          vscode.postMessage({
            command: 'refresh',
          });
        }

        function expand(ele) {
          let content = ele.nextSibling;
          let icnStyle = ele.firstChild.style;
          if (!content.classList.contains('collapse')) {
            content.classList.add('collapse');
            icnStyle.transform = 'rotate(-90deg)';
          } else {
            content.classList.remove('collapse');
            icnStyle.transform = 'rotate(0deg)';
          }
        }

        function expandAll() {
          let contents = document.getElementsByClassName('collapse');
          Array.from(contents).reverse().forEach(ele => {
            let icnStyle = ele.previousSibling.firstChild.style;
            ele.classList.remove('collapse');
            icnStyle.transform = 'rotate(0deg)';
          });
        }

        function collapseAll() {
          let contents = document.getElementsByClassName('content');
          Array.from(contents).forEach(ele => {
            let icnStyle = ele.previousSibling.firstChild.style;
            if (!ele.classList.contains('collapse')) {
              ele.classList.add('collapse');
              icnStyle.transform = 'rotate(-90deg)';
            }
          });
        }
      </script>
    </head>
    <body>
      <h1 class="center">TODO Tracker</h1>
      <div>
        <button onclick="refresh();" class="iconbutton blue">
          <img src=${refSrc} alt="open" class="icon"/>
        </button>
        <button onclick="expandAll();" class="button blue">
          Expand All
        </button>
        <button onclick="collapseAll();" class="button blue">
          Collapse All
        </button>
      </div>
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
        content += '</div></div>';
      }
    }

    if (ref instanceof Array) {
      content += `<div style="margin-left: ${currDepth*10}px"><h3 class="title" onclick="expand(this)"><img width=20 src=${expSrc} alt="open" class="arrow rotated"/>${key}</h3><div class="content collapse">`;
      content += buildContent(ref);
      content += `</div></div><hr style="margin-left: ${(currDepth)*10}px"/>`;
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

      content += `<div style="margin-left: ${currDepth*10}px"><h2 class="title" onclick="expand(this)"><img width=30 src=${expSrc} alt="open" class="arrow"/>${key}</h2><div class="content">`;
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
      <div class="task">
        <button onclick="deleteTask(${t.id}, '${t.file}');" class="iconbutton red">
          <img src=${trsSrc} alt="open" class="icon"/>
        </button>
        <button onclick="openFile('${t.file}', ${t.position.line});" class="iconbutton blue">
          <img src=${linkSrc} alt="open" class="icon"/>
        </button>
        <h4 style="margin-top: 0px">${t.title}</h4>
        <p>${t.description}</p>
        <div class="timestamp">
          <i>${moment(t.timestamp).fromNow()}</i>
        </div>
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