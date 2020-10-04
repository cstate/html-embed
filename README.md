# HTML Embed for cState

✔ The basic code for checking if a cState-powered status page (using its read-only API) has a status other than "fully operational."

**This is a work in progres. Playkit for developers.**

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

## License

The idea for this project was [originally inspired](https://github.com/cstate/cstate/issues/131) by the GitHub / cState user @ririko5834.

MIT
