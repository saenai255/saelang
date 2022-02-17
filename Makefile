all: dist/slc-linux dist/slc-macos dist/slc-win.exe

dist/slc-linux dist/slc-macos dist/slc-win.exe: clean install test
	yarn build
	cd dist && npx pkg ./bin/slc.js

.PHONY: clean install test

install:
	@which node >/dev/null || echo "Could not find build dependency: node." && which node >/dev/null
	@which yarn >/dev/null || echo "Could not find build dependency: yarn. Install it by executing 'npm install --global yarn'" && which yarn >/dev/null
	yarn install

test:
	yarn test

clean:
	[ -d .swc ] && rm -r .swc || :
	[ -d dist ] && rm -r dist || :
	[ -d node_modules ] && rm -r node_modules || :
