## Releases

We strictly follow [Semantic Versioning](http://semver.org/)

1. Make sure that tests are green.
2. Update project version in package.json.
3. Commit it with message `release <version>`.
4. Tag the release by running `git tag v<version>`. Push the tag: `git push --tags`.
5. Run `npm publish`.
