# Release

1. To release a new version bump the package version number via `npm version major|minor|patch`.
2. Commit the new version number with message `chore: bump version to x.x.x`.
3. Tag commit with corresponding version number `x.x.x`.
4. Push changes and tag to Github
5. Create a new release based on the pushed tag.

## Notes

The VSCode marketplace only accepts semver version.
