<p align="center"><img src="images/logo.svg?sanitize=true" alt="cState alt logo"></p>

✔ The basic JavaScript code for checking if a cState-powered status page (using its read-only API).

**There is no UI for this project, so you are you free to write that yourself or [contribute so others can use it](https://github.com/cstate/html-embed/issues/2).**

The `index.js` file has the JavaScript you can add to your page and use for making other things happen.

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


## License

The idea for this project was [originally inspired](https://github.com/cstate/cstate/issues/131) by the GitHub / cState user @ririko5834.

Contributing rules same as on main [cState repository](https://github.com/cstate/cstate)

Licensed MIT, made by Mantas Vilčinskas since 2020. Thank you to all contributors.
