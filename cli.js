#!/usr/bin/env node
'use strict';

var TerminalAdapter = require('yeoman-environment/lib/adapter.js');
var yeoman = require('yeoman-environment');
var path = require('path');
var Promise = require('promise');
var exec = require('child_process').exec;
var argv = require('minimist')(process.argv.slice(2));

class CreateSuppressingTerminalAdapter extends TerminalAdapter {
    constructor() {
        super();
        this.log.create = function() {};
    }
}

function init(argsOrName) {
    console.log('Initializing new Polymer Native app');
    var env = yeoman.createEnv(
        undefined,
        undefined,
        new TerminalAdapter()
    );

    env.register(
        require.resolve(path.join(__dirname, 'ios-generator/app')),
        'ios-generator:app'
    );

    var args = Array.isArray(argsOrName)
        ? argsOrName
        : [argsOrName].concat(process.argv.slice(4));

    var generator = env.create('ios-generator:app', {args: args});
    generator.destinationRoot('./');
    generator.run();
}

function run(args) {
    exec('xcodebuild -configuration Debug -target MyFirstProject -arch i386 -sdk iphonesimulator9.3 && ios-sim "launch" "./Library/WebServer/Documents/testapp/build/iphone/build/Debug-iphonesimulator/test.app" "--devicetypeid" "iPhone-5" "--exit";');
}

var args = process.argv.slice(3);

if (argv._ && argv._.indexOf('init') > -1) {
    init(args);
} else if (argv._ && argv._.indexOf('run') > -1) {
    run(args);
}