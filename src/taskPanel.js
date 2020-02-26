function getPanelContent(tasks) {
  let contents = tasks.map(t => {
    return `
      <div style="line-height: 20px; margin: 20px; margin-bottom: 20px; border-bottom: 0.5px solid #d7d7d7;">
        <h2>${t.title}</h2>
        <p>${t.description}</p>
        <div>
          ${t.file}
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