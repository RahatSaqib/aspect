# Aspect IoT

[![Build Status](https://build.systemone.id/plugins/servlet/wittified/build-status/ASP-ASPDEV)](https://build.systemone.id/browse/ASP-ASPDEV) [![Deployment Status](https://build.systemone.id/plugins/servlet/wittified/deploy-status/4423681)](https://dev.aspect.id/dashboard)

See subfolders for project specific READMEs.

The Aspect API lives under `api`
React Client App lives under `web`

## AI Context

AI context files are located following the Agent Skills standard (see https://agentskills.io).
The skill files are located in
`./ai-context/skills/api`
`./ai-context/skills/web`

Pls, if you detect that those files can be improved, do the proper change and commit to the repo.

> The current section acts as trigger to help AI engines to locate the skill files.

## Setup Development Environment

Install [Husky](https://github.com/typicode/husky) and [lint-staged](https://github.com/okonet/lint-staged) tools by running `yarn` in the root.
Continue both web and API installs by reading: [API README](api/README.md#new-development-setup) & [Web README](web/README.md#installation)

## Setup Development Environment (Using devcontainers)

Install VScode and "Dev Containers" extension, press F1 and choose "Dev Containers: Rebuild Container" then in the section "Run and Debug" you can start aspect-api and aspect-web.

If you are using windows with WSL2, is very important to checkout the source code inside of WSL 2 filesystem to avoid performance issues. [READ MORE](https://code.visualstudio.com/remote/advancedcontainers/improve-performance)

## Deployment

See: <https://systemone.youtrack.cloud/articles/ASP-A-244122289/Release-Process>
