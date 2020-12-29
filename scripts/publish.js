/* eslint-disable global-require */
/* eslint-disable no-console */
const chalk = require('chalk');
const { execSync } = require('child_process');
const { get, memoize } = require('lodash');
const semver = require('semver');
const path = require('path');

const LATEST_TAG = 'latest';
const NEXT_TAG = 'next';
const OLD_TAG = 'old';

const getPackageDetails = memoize(pkg => {
  try {
    const npmShowCommand = `npm show ${pkg.name} --registry=${pkg.registry} --json`;
    return JSON.parse(
      execSync(npmShowCommand, { stdio: ['pipe', 'pipe', 'ignore'] }),
    );
  } catch (error) {
    if (!error.stdout.toString().includes('E404')) {
      console.error(chalk.red(`\nError: ${error}`));
    }
  }
});

function getPublishedVersions(pkg) {
  return get(getPackageDetails(pkg), 'versions', []);
}

function getLatestVersion(pkg) {
  return get(getPackageDetails(pkg), 'dist-tags.latest');
}

function shouldPublishPackage(pkg) {
  const remoteVersionsList = getPublishedVersions(pkg);

  return !remoteVersionsList.includes(pkg.version);
}

function getTag(pkg) {
  const latestVersion = getLatestVersion(pkg);

  const isLessThanLatest = () =>
    latestVersion && semver.lt(pkg.version, latestVersion);

  const isPreRelease = () => semver.prerelease(pkg.version) !== null;

  if (isLessThanLatest()) {
    return OLD_TAG;
  }

  if (isPreRelease()) {
    return NEXT_TAG;
  }

  return LATEST_TAG;
}

function createNpmRc() {
  execSync('rm -f package-lock.json');
  const { NPM_EMAIL, NPM_TOKEN } = process.env;
  console.assert(NPM_EMAIL && NPM_TOKEN, 'Error: npm credentials not found');
  const { EOL } = require('os');
  const content = `email=${NPM_EMAIL}${EOL}//registry.npmjs.org/:_authToken=${NPM_TOKEN}${EOL}`;
  const fs = require('fs');
  fs.writeFileSync('.npmrc', content);
  console.assert(fs.existsSync('.npmrc'), 'Error writing .npmrc');
}

function publish(pkg) {
  const publishCommand = `npm publish ${path.resolve('.')} --tag=${getTag(
    pkg,
  )} --registry=${pkg.publishConfig.registry}`;
  console.log(
    chalk.magenta(
      `Running: "${publishCommand}" for ${pkg.name}@${pkg.version}`,
    ),
  );
  execSync(publishCommand, { stdio: 'inherit' });
  return true;
}

function publishPackage(pkg) {
  console.log(`\nStarting the release process for ${chalk.bold(pkg.name)}`);

  if (!shouldPublishPackage(pkg)) {
    console.log(
      chalk.blue(
        `${pkg.name}@${pkg.version} already exists on registry ${pkg.publishConfig.registry}`,
      ),
    );
    console.log('No publish performed');
    return;
  }

  const published = publish(pkg);
  if (published) {
    console.log(
      chalk.green(
        `Published "${pkg.name}@${pkg.version}" succesfully to ${pkg.publishConfig.registry}`,
      ),
    );
  } else {
    console.log('No publish performed');
  }
}

function run() {
  let skip;
  const { FORCE_PUBLISH, GITHUB_REF, CI } = process.env;
  if ((!GITHUB_REF || GITHUB_REF.indexOf('release') === -1) && !FORCE_PUBLISH) {
    skip = 'Not on master branch';
  } else if (!CI) {
    skip = 'Not in CI';
  }
  if (skip) {
    console.log(chalk.yellow(`${skip} - skipping publish`));
    return false;
  }

  createNpmRc();
  const pkg = require('../package.json');
  publishPackage(pkg);
}

run();
