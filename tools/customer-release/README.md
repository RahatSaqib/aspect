## Publish Bangladesh to On-premise Repository

### Initial Setup

Run in your local repositories folder:

`git clone -o bangla https://git.dghs.gov.bd/SystemOne/aspect-bangladesh ./bangladesh-aspect`

> You will be prompted for credentials

Run in `bangladesh-aspect` folder:

`git checkout system-one`

This will clone the reposotory and pull the target branch `system-one`

### Every release

Run in your local Aspect repo:

`tools/customer-release/build-bangladesh.sh master`

Run in `bangladesh-aspect`:

- Pull any change in the sync branch

`git pull bangla system-one`

- Copy the changes from the release worktree into the Bangladesh local repo

`rsync -a --delete --exclude '.git/' --exclude 'node_modules' --exclude 'api/.env' ../aspect/.release/bangladesh/ .`

- Add and commit the code:

`git add -A`

`git commit -m "Aspect $(node -p "require('./api/package.json').version")"`

- Push the changes

`git push bangla system-one`

What the customer must run:

In their own clone, to pick up the release:

`git fetch bangla && git merge bangla/system-one`
