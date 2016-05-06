'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var path = require('path');

var TEMPLATING_PREFIX = 'polymer-native-template';

module.exports = yeoman.Base.extend({

    constructor: function () {
        yeoman.Base.apply(this, arguments);
        this.argument('name', {type: String, required: true});
    },

    writing: function () {
        var templateVars = {name: this.name};

        console.log('Application name', this.name);

        this.fs.copy(
            [this.templatePath(path.join('./project/Pods', '**', '*'))],
            this.destinationPath(path.join('./ios/Pods'))
        );

        this.fs.copyTpl(
            [this.templatePath(path.join('./project/', '*'))],
            this.destinationPath(path.join('./ios/')),
            this
        );

        this.fs.copyTpl(
            [this.templatePath(path.join('./npm/', '*'))],
            this.destinationPath(),
            this
        );

        this.fs.copy(
            this.templatePath(path.join('./project', TEMPLATING_PREFIX, '**', '*.png')),
            this.destinationPath(path.join('./ios/', this.name))
        );

        this.fs.copyTpl(
            [this.templatePath(path.join('./project/', TEMPLATING_PREFIX, '**', '*')), '!**/*.png'],
            this.destinationPath(path.join('./ios/', this.name)),
            this
        );

        this.fs.copyTpl(
            this.templatePath(path.join('./project/', TEMPLATING_PREFIX + '.xcodeproj', '**', '*')),
            this.destinationPath(path.join('./ios/', this.name + '.xcodeproj')),
            this
        );

        this.fs.copyTpl(
            this.templatePath(path.join('./project/', TEMPLATING_PREFIX + '.xcworkspace', '**', '*')),
            this.destinationPath(path.join('./ios/', this.name + '.xcworkspace')),
            this
        );
    },

    install: function () {
        //this.installDependencies();
    },

    end: function () {
        var projectPath = path.resolve(this.destinationRoot(), 'ios', this.name);
        this.log(chalk.white.bold('Now you may run your app by:'));
        this.log(chalk.white('   cd ' + this.destinationRoot()));
        this.log(chalk.white('   polymer-native run'));
        this.log(chalk.white('   or'));
        this.log(chalk.white('   Open ' + projectPath + '.xcworkspace in Xcode and run it then'));
    }
});
