<p align="center"><img src="images/preview.svg?sanitize=true" alt="cState HTML embed lets you add a dot indicator or show an alert if your cState status page has active issues"></p>

✔ SUPER SMALL bits of code that check if a cState-powered status page (using its read-only API) has active issues; if they do, an alert can be shown, or you can write a custom callback. Or, it is possible to simply embed a dot indicator in a place like your footer.

## Prerequisites

* You have a cState status page set up with a [read-only API](https://github.com/cstate/cstate/wiki/API)
* You have modified your headers (for Netlify users, it's the `netlify.toml` file in the root) to allow for cross-origin access
* Your browser (or environment) supports `fetch()`

The demo page uses this for its `netlify.toml`:

```toml
[[headers]]
    for = "/*.json"
    [headers.values]
      Access-Control-Allow-Origin = "*"
```

For `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" }
      ]
    }
  ]
}
```

## No UI needed?

The `basic-v1.js` file has the basic JavaScript you can use from v1.


## First UI: Dot Indicator

Grab the code from `dot-indicator.js` and add it to your page.

Modify the embed to your liking. Make sure to define your status page link variable.

This is a great option for footers and if you want to have a persistent icon showing that your services are online / there are no posted issues.

This code is only run on page load.

There is an example in `dot-indicator.html`. [View it here.](https://cstate-embed.pages.dev/dot-indicator.html)

## Second UI: Alert Box

Grab the code from `dialog.js`.

Modify the embed to your liking:

- You might also want to change the text if your main user language is not English.
- You might want to not show this alert if there is a `notice` type issue (like for maintenance announcements). **By default,** the alert shows for all status-impacting alerts.
- You might want to change the colors if you have, for example, a dark website.
- By default the code only runs on page load but can be edited to do so every x seconds or programatically.

There is an example in `dialog.html`. [View it here.](https://cstate-embed.pages.dev/dialog.html)

## License

The idea for this project was [originally inspired](https://github.com/cstate/cstate/issues/131) by the GitHub / cState user @ririko5834. A big thanks to them!

Contributing rules same as on main [cState repository](https://github.com/cstate/cstate)

Licensed MIT, made by Mantas Vilčinskas since 2020. Thank you for your support!
