/* global describe, it, beforeEach, afterEach, fixture, expect, sinon */

describe('smoke test', function() {
	var server,
		component,
		xsrfResponse = {
			body: { referrerToken: 'foo' }
		},
		authTokenResponse = {
			headers: { 'x-csrf-token': xsrfResponse.body.referrerToken },
			body: { access_token: 'such access wow' }
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
			component.authToken = null;
			component.xsrfToken = null;
		});

		it('should send an auth token request when auth token does not exist', function (done) {
			server.respondWith(
				'POST',
				'/d2l/lp/auth/oauth2/token',
				function (req) {
					expect(req.requestHeaders['x-csrf-token']).to.equal(xsrfResponse.body.referrerToken);
					expect(req.requestBody).to.equal('scope=*:*:*');
					req.respond(200, authTokenResponse.headers, JSON.stringify(authTokenResponse.body));
				});

			component._getAuthToken()
            	.then(function(authToken) {
					expect(authToken).to.equal(authTokenResponse.body.access_token);
					expect(component.authToken).to.equal(authTokenResponse.body.access_token);
					done();
				});
		});

		it('should use auth token if it exists', function (done) {
			component.authToken = authTokenResponse.body.access_token;
			component._getAuthToken()
				.then(function (authToken) {
					expect(authToken).to.equal(component.authToken);
					done();
				});
		});
	});

	describe('generateRequest', function () {
		afterEach(function () {
			component.authToken = null;
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
			component.authToken = authTokenResponse.body.access_token;

			server.respondWith(
				'GET',
				component.url,
				function (req) {
					expect(req.requestHeaders['authorization']).to.equal('Bearer ' + component.authToken);
					req.respond(200);
					done();
				});

			component.generateRequest();
        });

		it('should include specified headers in the request', function (done) {
			component = fixture('custom-headers-fixture');
			component.authToken = authTokenResponse.body.access_token;

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
