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

        this.fs.copy(
            [this.templatePath(path.join('./ios/Pods', '**', '*'))],
            this.destinationPath(path.join('ios/Pods'))
        );

        this.fs.copyTpl(
            [this.templatePath(path.join('./ios/', '*'))],
            this.destinationPath(path.join('ios/')),
            this
        );

        this.fs.copyTpl(
            [this.templatePath(path.join('./www/', '**', '*')), '!**/*.png'],
            this.destinationPath('www/'),
            this
        );

        this.fs.copy(
            this.templatePath(path.join('./www/', '**', '*.png')),
            this.destinationPath('www/')
        );

        this.fs.copy(
            this.templatePath(path.join('./ios/', TEMPLATING_PREFIX, '**', '*.png')),
            this.destinationPath(path.join('ios/', this.name))
        );

        this.fs.copyTpl(
            [this.templatePath(path.join('./ios/', TEMPLATING_PREFIX, '**', '*')), '!**/*.png'],
            this.destinationPath(path.join('ios/', this.name)),
            this
        );

        this.fs.copyTpl(
            this.templatePath(path.join('./ios/', TEMPLATING_PREFIX + '.xcodeproj', '**', '*')),
            this.destinationPath(path.join('ios/', this.name + '.xcodeproj')),
            this
        );

        this.fs.copyTpl(
            this.templatePath(path.join('./ios/', TEMPLATING_PREFIX + '.xcworkspace', '**', '*')),
            this.destinationPath(path.join('ios/', this.name + '.xcworkspace')),
            this
        );
    },

    install: function () {
        //this.installDependencies();
    },

    end: function () {
        var projectPath = path.resolve(this.destinationRoot(), 'ios', this.name);
        this.log(chalk.white.bold('Now you may run your app by'));
        this.log(chalk.white.bold('opening ' + projectPath + '.xcworkspace in Xcode and runing it then'));
    }
});
