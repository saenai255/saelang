all: dist/slc-linux dist/slc-macos dist/slc-win.exe

dist/slc-linux dist/slc-macos dist/slc-win.exe: clean install test
	yarn build
	cp ./package.json ./dist
	cd dist && yarn install --production
	rm dist/package.json dist/yarn.lock
	cd dist && npx pkg ./bin/slc.js
	rm -r dist/bin dist/node_modules dist/src


.PHONY: clean install test

install:
	which node
	npm i -g yarn pkg
	yarn

test:
	yarn test

clean:
	[ -d .swc ] && rm -r .swc || :
	[ -d dist ] && rm -r dist || :
	[ -d node_modules ] && rm -r node_modules || :
