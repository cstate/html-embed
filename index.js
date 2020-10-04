// HTML Embed for cState v0.1
// github.com/cstate/html-embed

// Variables
// Site + '/index.json'
var cStateAPIRoot = 'https://flamboyant-shirley-6bc75e.netlify.app/index.json'
var cStateEmbedName = '[cState HTML Embed v0.1] ';

var cStateAPIStatus = null;

// Logic
fetch(cStateAPIRoot)
  .then(response => response.json())
  .then(data =>
    if (data.summaryStatus !== 'ok') {
      console.log(cStateEmbedName + 'Overall status: ' + data.summaryStatus)
      cStateAPIStatus = data.summaryStatus
    }
)
