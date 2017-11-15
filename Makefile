api.start:
	pushd ./api && yarn start:background

api.stop:
	pushd ./api && yarn stop:background

web.server.PID:
	# https://stackoverflow.com/a/23366404
	pushd ./web/dist && { python -m SimpleHTTPServer & echo $$! > $@; }

web.start: web.server.PID
	pushd ./web && yarn dist

web.stop: web.server.PID
	pushd ./web/dist && kill `cat $<` && rm $<
	
e2e.local:
	pushd ./web && ASPECT_URL=http://localhost:8000 yarn e2e:local

e2e: api.start web.start e2e.local web.stop api.stop

.PHONY: api.start api.stop web.start web.stop e2e.local