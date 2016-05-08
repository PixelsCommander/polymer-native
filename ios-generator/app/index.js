'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var path = require('path');

module.exports = yeoman.Base.extend({

    constructor: function () {
        yeoman.Base.apply(this, arguments);
        this.argument('name', {type: String, required: true});
    },

    writing: function () {
        var templateVars = {name: this.name};

        this.fs.copyTpl(
            [
                this.templatePath(path.join('./ios/', '**', '*')),
                this.templatePath(path.join('./www/', '**', '*')),
                '!**/*.png'
            ],
            this.destinationPath(),
            this
        );

        this.fs.copy(
            [
                this.templatePath(path.join('./ios/', '**', '*.png')),
                this.templatePath(path.join('./www/', '**', '*.png'))
            ],
            this.destinationPath()
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
