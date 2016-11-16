/* global describe, it, beforeEach, afterEach, fixture, expect, sinon */

function clock() {
	return (Date.now() / 1000) | 0;
}

describe('smoke test', function() {
	var server,
		component,
		defaultScope = "*:*:*",
		authToken = {
			access_token: 'such access wow',
			expires_at: Number.MAX_VALUE
		},
		xsrfTokenValue = 'foo',
		xsrfResponse = {
			body: { referrerToken: xsrfTokenValue }
		},
		authTokenResponse = {
			headers: { 'x-csrf-token': xsrfTokenValue },
			body: { access_token: authToken.access_token, expires_at: authToken.expires_at }
		};

	beforeEach(function () {
		server = sinon.fakeServer.create();
		server.respondImmediately = true;

		server.respondWith(
			'GET',
			'/d2l/lp/auth/xsrf-tokens',
			function (req) {
				req.respond(200, xsrfResponse.headers, JSON.stringify(xsrfResponse.body))
			});

		component = fixture('d2l-ajax-fixture');
	});

	afterEach(function () {
		server.restore();
	});

	it('should load', function () {
		expect(component).to.exist;
	});

	describe('XSRF request', function () {
		it('should send a XSRF request', function (done) {
			component._getXsrfToken()
				.then(function(xsrfToken) {
					expect(xsrfToken).to.equal(xsrfResponse.body.referrerToken);
					expect(component.xsrfToken).to.equal(xsrfResponse.body.referrerToken);
					done();
				});
		});

		it('should fire error event if XSRF request fails', function (done) {
			component = fixture('absolute-path-fixture');

			server.respondWith(
				'GET',
				'/d2l/lp/auth/xsrf-tokens',
				function (req) {
					req.respond(404);
				});

			component.addEventListener('iron-ajax-error', function (e) {
				expect(e).to.not.be.undefined;
				expect(component.lastError).to.not.be.undefined;
				done();
			});

			component.generateRequest();
		});
	});

	describe('Auth token request', function () {
		afterEach(function () {
			delete component.cachedTokens[defaultScope];
			window.sessionStorage.setItem(defaultScope, null);
		});

		it('should send an auth token request when auth token does not exist', function (done) {
			server.respondWith(
				'POST',
				'/d2l/lp/auth/oauth2/token',
				function (req) {
					expect(req.requestHeaders['x-csrf-token']).to.equal(xsrfResponse.body.referrerToken);
					expect(req.requestBody).to.equal('scope=' + defaultScope);
					req.respond(200, authTokenResponse.headers, JSON.stringify(authTokenResponse.body));
				});

			component._getAuthToken()
				.then(function(authToken) {
					expect(authToken).to.equal(authTokenResponse.body.access_token);
					done();
				});
		});

		it('should send an auth token request when auth token is expired', function (done) {
			server.respondWith(
				'POST',
				'/d2l/lp/auth/oauth2/token',
				function (req) {
					req.respond(200, authTokenResponse.headers, JSON.stringify(authTokenResponse.body));
				});

			component.cachedTokens[defaultScope] = {
				access_token: 'token',
				expires_at: clock() - 1
			};

			component._getAuthToken()
				.then(function(authToken) {
					expect(authToken).to.equal(authTokenResponse.body.access_token);
					done();
				});
		});

		it('should use sessionStorage token if it exists', function (done) {
			window.sessionStorage.setItem(defaultScope, JSON.stringify(authToken));
			component._getAuthToken()
				.then(function (token) {
					expect(token).to.equal(authToken.access_token);
					done();
				});
		});

		it('should use cached auth token if it exists', function (done) {
			component.cachedTokens[defaultScope] = authToken;
			component._getAuthToken()
				.then(function (token) {
					expect(token).to.equal(authToken.access_token);
					done();
				});
		});

		it('should not use cached tokens after session change', function(done) {
			server.respondWith(
					'POST',
					'/d2l/lp/auth/oauth2/token',
					function (req) {
						req.respond(200, authTokenResponse.headers, JSON.stringify(authTokenResponse.body));
					});
			var alternativeToken = {
				access_token: 'cool beans',
				expires_at: Number.MAX_VALUE
			}
			component._cacheToken(defaultScope, alternativeToken);
			component._getAuthToken()
				.then(function (token) {
					expect(token).to.equal(alternativeToken.access_token);
					component._onSessionChanged({ key: 'Session.UserId' });
					component._getAuthToken()
						.then(function (token) {
							expect(token).to.equal(authToken.access_token);
							done();
						});
				});
		});

		it('should fire error event if auth token request fails', function (done) {
			component = fixture('absolute-path-fixture');

			server.respondWith(
				'POST',
				'/d2l/lp/auth/oauth2/token',
				function (req) {
					req.respond(404);
				});

			component.addEventListener('iron-ajax-error', function (e) {
				expect(e).to.not.be.undefined;
				expect(component.lastError).to.not.be.undefined;
				done();
			});

			component.generateRequest();
		});
	});

	describe('generateRequest', function () {
		afterEach(function () {
			delete component.cachedTokens[defaultScope];
		});

		it('should send a request with no auth header when url is relative', function (done) {
			component = fixture('relative-path-fixture');

			server.respondWith(
				'GET',
				component.url,
				function (req) {
					expect(req.requestHeaders['authorization']).to.not.be.defined;
					expect(req.requestHeaders['x-csrf-token']).to.not.be.defined;
					req.respond(200);
					done();
				});

			component.generateRequest();
		});

		it('should send a request with XSRF header when url is relative', function(done) {
			component = fixture('relative-put-fixture');

			server.respondWith(
				'GET',
				'/d2l/lp/auth/xsrf-tokens',
				function (req) {
					req.respond(200, xsrfResponse.headers, JSON.stringify(xsrfResponse.body))
				});

			server.respondWith(
				'PUT',
				component.url,
				function(req) {
					expect(req.requestHeaders['x-csrf-token']).to.equal('foo');
					expect(req.requestHeaders['accept']).to.equal('application/vnd.siren+json');
					done();
				});

			component.generateRequest();
		});

		it('should send a request with auth header when url is absolute', function (done) {
			component = fixture('absolute-path-fixture');
			component.cachedTokens[defaultScope] = authToken;

			server.respondWith(
				'GET',
				component.url,
				function (req) {
					expect(req.requestHeaders['authorization']).to.equal('Bearer ' + authToken.access_token);
					req.respond(200);
					done();
				});

			component.generateRequest();
		});

		it('should include specified headers in the request', function (done) {
			component = fixture('custom-headers-fixture');
			component.cachedTokens[defaultScope] = authToken;

			server.respondWith(
				'GET',
				component.url,
				function (req) {
					expect(req.requestHeaders['accept']).to.equal('application/vnd.siren+json');
					expect(req.requestHeaders['x-my-header']).to.equal('my value');
					req.respond(200);
					done();
				});

			component.generateRequest();
		});

		it('should include specified headers in the request for relative path', function (done) {
			component = fixture('custom-headers-fixture-relative-url');
			component.cachedTokens[defaultScope] = authToken;

			server.respondWith(
				'GET',
				component.url,
				function (req) {
					expect(req.requestHeaders['accept']).to.equal('application/vnd.siren+json');
					expect(req.requestHeaders['x-my-header']).to.equal('my value');
					req.respond(200);
					done();
				});

			component.generateRequest();
		});

		it('should set lastResponse after successful request', function (done) {
			component = fixture('relative-path-fixture');

			server.respondWith(
				'GET',
				component.url,
				function (req) {
					req.respond(200);
				});

			component.addEventListener('iron-ajax-response', function () {
				expect(component.lastResponse).to.not.be.undefined;
				done();
			});

			component.generateRequest();
		});

		it('should set lastError after unsuccessful request', function (done) {
			component = fixture('relative-path-fixture');

			server.respondWith(
				'GET',
				component.url,
				function (req) {
					req.respond(404);
				});

			component.addEventListener('iron-ajax-error', function () {
				expect(component.lastError).to.not.be.undefined;
				done();
			});

			component.generateRequest();
		});
	});

	describe('isRelativeUrl', function() {

		beforeEach(function() {
			component = fixture('d2l-ajax-fixture');
		});

		it('should treat relative URLs as relative', function() {
			var isRelative = component._isRelativeUrl('/relative/url');
			expect(isRelative).to.be.true;
		});

		it('should treat non-relative URLs as non-relative', function() {
			var isRelative = component._isRelativeUrl('http://foo.com/bar');
			expect(isRelative).to.be.false;
		});

		// IE adds the port (:80) to the inbound URL, which needs to be ignored
		it('should treat URLs with the same host as current page as relative', function() {
			var locationStub = sinon.stub(component, '_getCurrentLocation')
				.returns({ host: 'foo.com', protocol: 'http:' });
			var isRelative = component._isRelativeUrl('http://foo.com/bar');
			locationStub.restore();
			expect(isRelative).to.be.true;
		});

		// IE adds the port (:443) to the inbound URL, which needs to be ignored
		it('should treat HTTPS URLs with same host as current page as relative', function() {
			var locationStub = sinon.stub(component, '_getCurrentLocation')
				.returns({ host: 'foo.com', protocol: 'https:' });
			var isRelative = component._isRelativeUrl('https://foo.com/bar');
			locationStub.restore();
			expect(isRelative).to.be.true;
		});

	});

});
