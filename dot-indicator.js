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
        cStateAPIStatus = data.summaryStatus;

        // When debugging, this code should be run to see API response
        if (cStateEmbedDebugging) {
          console.log(cStateEmbedPrefix + 'API response: ', data);
          console.log(cStateEmbedPrefix + 'API says status page is: ' + cStateAPIStatus);
        }

        // UI code (run even if not debugging)
        // You can change how the dot appears here
        cStateDotTargetElement.style.display = 'inline-block';
        cStateDotTargetElement.style.height = '10px';
        cStateDotTargetElement.style.width = '10px';
        cStateDotTargetElement.style.borderRadius = '50%';
        cStateDotTargetElement.setAttribute('aria-label', 'Status indicator'); 
        cStateDotTargetElement.style.backgroundColor = '#333';
        // Sets color and accessible label
        if (cStateAPIStatus === 'ok') {
          cStateDotTargetElement.style.backgroundColor = '#4caf50';
          cStateDotTargetElement.setAttribute('aria-label', 'Green icon indicating no issues');
        } else if (cStateAPIStatus === 'notice') {
          cStateDotTargetElement.style.backgroundColor = '#607d8b';
          cStateDotTargetElement.setAttribute('aria-label', 'Gray icon asking users to check status page');
        } else if (cStateAPIStatus === 'disrupted') {
          cStateDotTargetElement.style.backgroundColor = '#ff9800';
          cStateDotTargetElement.setAttribute('aria-label', 'Orange icon indicating disruptions');
        } else { // down
          cStateDotTargetElement.style.backgroundColor = '#82071e';
          cStateDotTargetElement.setAttribute('aria-label', 'Red icon indicating downtime');
        }

      });
    }
  )
  .catch(function(err) {
    console.log('Fetch error. Aborting', err);
  });

 