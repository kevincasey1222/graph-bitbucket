# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## 2021-06-29 - v1.2.0

### Added

- Added Groups, which pulls from API v.1.0 because that's the only place that
  supports it
- Support for API v.1.0 calls

### Changed

- Improved efficiency on managing objects in memory

### Updated

- Documentation.
- SDK version.

## 2021-06-22 - v1.1.0

### Added

- New config variable enrichedPrs that toggles pulling PRs individually in order
  to get Reviewer data.
- Scope checking to the access token validation.

### Changed

- ingestPullRequests config variable now uses the getStartStepStates pattern, so
  that the step doesn't run at all if ingestPullRequests is false.

### Updated

- Documentation.

## 2021-05-28 - v1.0.0

### Updated

- to '@jupiterone/integration-sdk-core'
