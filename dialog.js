
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
// Opt in to healthy operational-record notices. Disruptions and outages always render.
var cStateShowRecordNotices = typeof cStateShowRecordNotices === 'boolean' ? cStateShowRecordNotices : false;
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
    if (!record) return false;

    // Explicit lifecycle states take precedence over legacy severity values.
    var state = record.state;
    var type = record.recordType || record.is;
    var isExperiment = type === 'experiment';
    var active = state ? (state === 'active' || (isExperiment && state === 'running')) : record.severity === 'ongoing';
    if (!active) return false;

    // Published future experiments are scheduled notices, not running records.
    var startsAt = Date.parse(record.createdAt);
    return !isExperiment || !Number.isFinite(startsAt) || startsAt <= Date.now();
  });
}

function cStateRecordPriority(record) {
  var impact = { down: 400, disrupted: 300, notice: 200, none: 0 }[record.statusImpact] || 0;
  var severity = { down: 40, disrupted: 30, notice: 20, ongoing: 10, none: 0 }[record.severity] || 0;
  return impact + severity + (record.pin ? 50 : 0);
}

function cStateHighestPriorityRecord(data) {
  var ranked = cStateActiveRecords(data).map(function(record, index) {
    return { record: record, index: index, priority: cStateRecordPriority(record) };
  }).sort(function(a, b) {
    return b.priority - a.priority || a.index - b.index;
  });
  return ranked.length ? ranked[0].record : null;
}

function cStateRecordKind(record) {
  return String(record.kind || record.recordType || record.is || 'update')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, function(character) { return character.toUpperCase(); });
}

function cStateAlertCopy(data) {
  var record = cStateHighestPriorityRecord(data);
  var isDisruption = cStateAPIStatus === 'disrupted' || cStateAPIStatus === 'down';

  if (!isDisruption && !cStateShowRecordNotices) {
    return null;
  }

  if (!isDisruption && !record) {
    return null;
  }

  return {
    title: isDisruption ? (cStateAPIStatus === 'down' ? 'Service outage' : 'Service disruption') : record.title,
    description: isDisruption
      ? 'Service status has changed. See the latest update on the status page.'
      : (record.summary || ''),
    record: record,
    href: record && record.permalink ? record.permalink : cStateRoot
  };
}

function cStateEscapeHTML(value) {
  return String(value || '').replace(/[&<>'"]/g, function(character) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character];
  });
}

function cStateSafeURL(value) {
  try {
    var parsed = new URL(value, cStateRoot);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && !parsed.username && !parsed.password ? parsed.href : cStateRoot;
  } catch (_error) {
    return cStateRoot;
  }
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
      return response.json().then(function(data) {
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
          if (!copy) return;
          var cStateAlertTitle = cStateEscapeHTML(copy.title);
          var recordContext = '';
          if (copy.record && (cStateAPIStatus === 'disrupted' || cStateAPIStatus === 'down')) {
            recordContext = '<div style="margin-top: 16px"><small>' + cStateEscapeHTML(cStateRecordKind(copy.record)) + '</small><br><strong>' + cStateEscapeHTML(copy.record.title) + '</strong>' + (copy.record.summary ? '<br>' + cStateEscapeHTML(copy.record.summary) : '') + '</div>';
          }
          var cStateAlertDescription = cStateEscapeHTML(copy.description) + recordContext + ' <a href="' + cStateEscapeHTML(cStateSafeURL(copy.href)) + '" style="text-decoration: none; border-bottom: 1px solid currentColor; color: #007bff">View updates</a>.';

          document.body.insertAdjacentHTML("beforeend",
          `<style>
            #cStateAlertDiv {
              position: fixed;
              line-height: 1.5;
              box-sizing: border-box;
              width: calc(100vw - 10vh);
              max-width: 400px;
              overflow-wrap: anywhere;
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
        if (cStateAPIStatus === 'disrupted' || cStateAPIStatus === 'down') {
          cStateAlertIn();
        } else if (cStateShowRecordNotices) {
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
