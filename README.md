# &lt;d2l-ajax&gt;

[![Build status][ci-image]][ci-url]

Wrapper for [iron-ajax](https://github.com/PolymerElements/iron-ajax), providing D2L authentication.
Inspired by [superagent-d2l-session-auth](https://github.com/Brightspace/superagent-d2l-session-auth).

## Usage

See the iron-ajax [documentation](https://elements.polymer-project.org/elements/iron-ajax) for a full list of available options.

```html
<d2l-ajax
    auto
    url="http://service.api.brightspace.com/"
    headers='{ "Accept": "application/vnd.siren+json\" }'
    handle-as="json"
    on-response="handleResponse"
    last-response="{{response}}"
    ></d2l-ajax>
```

## Building

Install dependencies

```shell
npm install
```

## Testing

Manual testing can be done with the demo page, accessible via polyserve.

```shell
npm run serve
```

Then access: http://localhost:8080/components/d2l-ajax/demo/index.html

If hosting on a different machine than where the element is being consumed from, you may also need to change the hostname used by polyserve.

```shell
polyserve -H my-machine-name
```

Currently the demo page is mostly not useful since this component is meant to be hosted in an LE.
The easiest way to do that right now is to use `bower link` in conjunction with [brightspace-integration](https://github.com/Brightspace/brightspace-integration) and the [d2l-my-courses](https://github.com/Brightspace/d2l-my-courses-ui) web component.

1) Clone [brightspace-integration](https://github.com/Brightspace/brightspace-integration)

2) In brightspace-integration repo, ensure you're in the correct branch (c12i12)

3) In d2l-ajax-ui directory, run

```shell
bower link
```
to allow it to be linked from brightspace-integration

4) In brightspace-integration directory, run

```shell
bower link d2l-ajax
```
to link to the local d2l-ajax project

5) Build and run brightspace-integration (will have to be rebuilt on any changes to d2l-ajax)

6) Create a homepage in the LMS that contains the new My Courses widget, AKA [d2l-my-courses](https://github.com/Brightspace/d2l-my-courses-ui), and test d2l-ajax via that component.

Note: On Windows, there exists an issue with relative paths, which will prevent web-component-shards from completing successfully without modifying vulcanize to not use path.posix. See: https://github.com/Polymer/vulcanize/issues/338

Under Windows, you will likely also run into a problem in brightspace-integration where web-component-shards will fail due to the 'tmp' directory not being able to be deleted, preventing 'npm run serve' from succeeding. A simple workaround is to run the contents of the npm 'serve' script directly after building, and removing the tmp directory manually.

[ci-url]: https://travis-ci.org/Brightspace/d2l-ajax-ui
[ci-image]: https://travis-ci.org/Brightspace/d2l-ajax-ui.svg?branch=master
