
// HTML Embed for cState
// Version 2.0
// ALERT – DIALOG STYLE
//
// github.com/cstate/html-embed

// CHANGE THIS:
var cStateRoot = 'https://flamboyant-shirley-6bc75e.netlify.app'

// Only change this if you are hacking around! :)
var cStateEmbedPrefix = '[cState HTML Embed v2.0] ';
var cStateEmbedDebugging = false;
var cStateAPIStatus = 'tryingToGetStatus';
var cStateAPIRoot = cStateRoot + '/index.json';

function cStateReadStatus(data) {
  return data && data.summaryStatus ? data.summaryStatus : 'unknown';
}

function cStateActiveRecords(data) {
  if (!data || !Array.isArray(data.records)) {
    return [];
  }

  return data.records.filter(function(record) {
    return record && (record.state === 'active' || record.severity === 'ongoing');
  });
}

function cStateAlertCopy(data) {
  var activeExperiments = cStateActiveRecords(data).filter(function(record) {
    return record.recordType === 'experiment' || record.is === 'experiment';
  });

  return {
    title: cStateAPIStatus === 'notice' ? 'Status update' : 'Service disruption',
    description: activeExperiments.length > 0
      ? 'Service status has changed, with active experiments also listed on the status page.'
      : 'Service status has changed. See the latest update on the status page.'
  };
}

function cStateAlertFunc() {
  return fetch(cStateAPIRoot)
    .then(function(response) {
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
                
        // UI code
        // You can change how the alert appears here
        function cStateAlertIn() {
          var copy = cStateAlertCopy(data);
          var cStateAlertTitle = copy.title;
          var cStateAlertDescription = copy.description + ' <a href="' + cStateRoot + '" style="text-decoration: none; border-bottom: 1px solid currentColor; color: #007bff">View updates</a>.';

          document.body.insertAdjacentHTML("beforeend",
          `<style>
            #cStateAlertDiv {
              position: fixed;
              line-height: 1.5;
              max-width: 320px;
              bottom: 5vh;
              left: 5vh;
              animation: cstatein 1s;
              padding: 40px;
              background: #fff;
              border-radius: 6px;
              box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
            }

            @keyframes cstatein {
              0% { opacity: 0; transform: translateY(10%); }
              70% { opacity: 0; transform: translateY(10%); }
              100% { opacity: 100%; transform: translateY(0); }
            }
          </style>
          
          <div id="cStateAlertDiv">
            <div style="font-size: 20px"> 
              <strong id="cStateAlertTitle">` + cStateAlertTitle + `</strong>
              <span onclick="this.parentNode.parentNode.remove()" aria-label="button to close dialog" style="font-size: 24px; cursor: pointer; float: right">×</span>
            </div>

            <div id="cStateAlertDescription" style="margin-top: 20px">` + cStateAlertDescription + `</div>
          </div>`);
        }
 
        // Sets color and accessible label
        if (cStateAPIStatus === 'ok') {
          return;
        } else if (cStateAPIStatus === 'notice') { 
          cStateAlertIn(); // You MIGHT want to change this
        } else if (cStateAPIStatus === 'disrupted') { 
          cStateAlertIn();
        } else { // down
          cStateAlertIn();
        }

      });
    })
    .catch(function(err) {
      console.log('Status page is down? fetch error. aborting', err);
    });
}
  

// function can be run programatically or only on page load
// e.g. setTimeout(cStateAlertFunc, 5000000);
cStateAlertFunc();
