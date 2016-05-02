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
		xsrfResponse = {
			body: { referrerToken: 'foo' }
		},
		authTokenResponse = {
			headers: { 'x-csrf-token': xsrfResponse.body.referrerToken },
			body: { access_token: authToken.access_token, expires_at: authToken.expires_at }
		};

	beforeEach(function () {
		server = sinon.fakeServer.create();
		server.respondImmediately = true;

		component = fixture('d2l-ajax-fixture');
	});

	afterEach(function () {
		server.restore();
	});

	it('should load', function () {
		expect(component).to.exist;
	});

	describe('XSRF request', function () {
		afterEach(function () {
			component.xsrfToken = null;
		});

		it('should send a XSRF request when the XSRF token does not exist', function (done) {
			server.respondWith(
				'GET',
				'/d2l/lp/auth/xsrf-tokens',
				function (req) {
					req.respond(200, xsrfResponse.headers, JSON.stringify(xsrfResponse.body))
				});

			component._getXsrfToken()
				.then(function(xsrfToken) {
					expect(xsrfToken).to.equal(xsrfResponse.body.referrerToken);
					expect(component.xsrfToken).to.equal(xsrfResponse.body.referrerToken);
					done();
				});
		});

		it('should use xsrf token if it exists', function (done) {
			component.xsrfToken = xsrfResponse.body.referrerToken;

			component._getXsrfToken()
				.then(function(xsrfToken) {
					expect(xsrfToken).to.equal(component.xsrfToken);
					done();
				});
		});
	});

	describe('Auth token request', function () {
		beforeEach(function () {
			component.xsrfToken = xsrfResponse.body.referrerToken;
		});

        afterEach(function () {
			delete component.cachedTokens[defaultScope];
			component.xsrfToken = null;
        })

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
				}
            );

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

        it('should use cached auth token if it exists', function (done) {
			component.cachedTokens[defaultScope] = authToken;
            component._getAuthToken()
                .then(function (token) {
					expect(token).to.equal(authToken.access_token);
                    done();
                });
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
					req.respond(200);
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
    });
});
