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

.PHONY: api.start api.stop web.start web.stop 
