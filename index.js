// HTML Embed for cState
// Version 1.0
// github.com/cstate/html-embed

// Variables
// Site + '/index.json'
var cStateAPIRoot = 'https://flamboyant-shirley-6bc75e.netlify.app/index.json'
var cStateEmbedPrefix = '[cState HTML Embed v1.0] ';
var cStateEmbedDebugging = false;
var cStateAPIStatus = 'tryingToGetStatus';

// Code itself
fetch(cStateAPIRoot)
  .then(
    function(response) {
      if (response.status !== 200) {
        console.log(cStateEmbedPrefix + 'API not OK, it sent HTTP status code ' +
          response.status);
        return;
      }

      // Examine the text in the response
      response.json().then(function(data) {
        
        // When debugging, this code should be run to see API response
        if (cStateEmbedDebugging) {
          console.log(cStateEmbedPrefix + 'API response: ', data);
          cStateAPIStatus = data.summaryStatus;
          console.log(cStateEmbedPrefix + 'API says status page is: ' + cStateAPIStatus);
        }
          
      });
    }
  )
  .catch(function(err) {
    console.log('Fetch error :-S', err);
  });

