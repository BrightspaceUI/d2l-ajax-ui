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
The easiest way to do that right now is to hack the `PinnedCoursesWidget.cs` file to serve this component instead of `d2l-my-courses`.

**\le\manageCourses\D2L.LE.ManageCourses\Web\Desktop\Widget\PinnedCoursesWidget.cs**
```cs
internal sealed class Renderer : IHtmlView {

	private readonly UrlLocation m_myCoursesImportUrlLocation;
	//private const string m_webComponentName = "d2l-my-courses";
	private const string m_webComponentName = "d2l-ajax";

	public Renderer(
			IBsiBaseLocationProvider bsiBaseLocationProvider,
			long orgId
	) {

		string myCoursesWebComponentUrl =
			String.Format(
					"{0}{1}.html",
					"http://my-machine-name:8080/components/d2l-ajax/",
					m_webComponentName
				);

		m_myCoursesImportUrlLocation = new UrlLocation( myCoursesWebComponentUrl );
	}

	void IHtmlView.Render( IHtmlRenderContext rc ) {

		ImportStylePageElement myCoursesStylePageElement = new ImportStylePageElement( m_myCoursesImportUrlLocation );

		rc.Style.Loader.AddStyleElement( myCoursesStylePageElement );

		rc.Writer.WriteTagBegin( m_webComponentName );
		rc.Writer.WriteAttribute( "auto", "" );
		rc.Writer.WriteAttribute( "url", "http://my-machine-name:3000/enrollments" );
		rc.Writer.WriteAttribute( "headers", "{ \"Accept\": \"application/vnd.siren+json\"}" );
		rc.Writer.WriteTagBeginRightChar();
		rc.Writer.WriteTagEnd( m_webComponentName );
	}

}
```

[ci-url]: https://travis-ci.org/Brightspace/d2l-ajax-ui
[ci-image]: https://travis-ci.org/Brightspace/d2l-ajax-ui.svg?branch=master
