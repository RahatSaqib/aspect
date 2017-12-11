api.start:
	cd ./api && yarn start:background

api.stop:
	cd ./api && yarn stop:background

web.server.PID:
	# https://stackoverflow.com/a/23366404
	cd ./web/dist && { python -m SimpleHTTPServer & echo $$! > $@; }

web.start: web.server.PID
	cd ./web && yarn dist

web.stop: web.server.PID
	cd ./web/dist && kill `cat $<` && rm $<
	
e2e.local.impl:
	-cd ./web && ASPECT_URL=http://localhost:8000 yarn e2e:local

e2e.browserstack.impl:
	-cd ./web && ASPECT_URL=http://localhost:8000 yarn e2e:browserstack

e2e.local: api.start web.start e2e.local.impl web.stop api.stop

e2e.browserstack: api.start web.start e2e.browserstack.impl web.stop api.stop

.PHONY: api.start api.stop web.start web.stop e2e.local.impl e2e.browserstack.impl