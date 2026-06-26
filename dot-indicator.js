// HTML Embed for cState
// Version 2.0
// DOT INDICATOR STYLE
//
// github.com/cstate/html-embed

// THESE ARE THE TWO VARIABLES YOU PROBABLY WANT TO CHANGE
// Site + '/index.json'
var cStateAPIRoot = 'https://flamboyant-shirley-6bc75e.netlify.app/index.json'
var cStateDotTargetElement = document.querySelector('.status-indicator');

// Only change this if you are hacking around! :)
var cStateEmbedPrefix = '[cState HTML Embed v2.0] ';
var cStateEmbedDebugging = false;
var cStateAPIStatus = 'tryingToGetStatus';

function cStateReadStatus(data) {
  return data && data.summaryStatus ? data.summaryStatus : 'unknown';
}

function cStateApplyDotStatus(element, status) {
  element.style.display = 'inline-block';
  element.style.height = '10px';
  element.style.width = '10px';
  element.style.borderRadius = '50%';
  element.setAttribute('aria-label', 'Status indicator');
  element.style.backgroundColor = '#333';

  if (status === 'ok') {
    element.style.backgroundColor = '#4caf50';
    element.setAttribute('aria-label', 'Green icon indicating no issues');
  } else if (status === 'notice') {
    element.style.backgroundColor = '#607d8b';
    element.setAttribute('aria-label', 'Gray icon asking users to check status page');
  } else if (status === 'disrupted') {
    element.style.backgroundColor = '#ff9800';
    element.setAttribute('aria-label', 'Orange icon indicating disruptions');
  } else if (status === 'down') {
    element.style.backgroundColor = '#82071e';
    element.setAttribute('aria-label', 'Red icon indicating downtime');
  } else {
    element.setAttribute('aria-label', 'Status unavailable');
  }
}
 
// runs only on load
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
        cStateAPIStatus = cStateReadStatus(data);

        // When debugging, this code should be run to see API response
        if (cStateEmbedDebugging) {
          console.log(cStateEmbedPrefix + 'API response: ', data);
          console.log(cStateEmbedPrefix + 'API says status page is: ' + cStateAPIStatus);
        }

        if (!cStateDotTargetElement) {
          if (cStateEmbedDebugging) {
            console.log(cStateEmbedPrefix + 'No .status-indicator element found.');
          }
          return;
        }

        cStateApplyDotStatus(cStateDotTargetElement, cStateAPIStatus);
      });
    }
  )
  .catch(function(err) {
    console.log('Fetch error. Aborting', err);
  });

 
