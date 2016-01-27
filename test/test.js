'use strict';

var SG = require('..');

describe('Savitzky–Golay test', function () {

    it('Smoothing test', function () {
        var options = {
            windowSize: 15,
            derivative: 0,
            polynomial: 3
        };

        var noiseLevel = 0.1;
        var data = new Array(200);
        for (var i = 0; i < data.length; i++)
            data[i] = Math.sin(i*Math.PI*2/data.length)+(Math.random()-0.5)*noiseLevel;
        var ans = SG(data, Math.PI*2/data.length, options);
        for (var j = Math.round(options.windowSize/2); j < ans.length-Math.round(options.windowSize/2); j++)
            ans[j].should.be.approximately(data[j], noiseLevel);
    });

    it('First derivative test', function () {
        var options = {
            windowSize: 47,
            derivative: 1,
            polynomial: 3
        };

        var noiseLevel = 0.1;
        var data = new Array(200);
        for (var i = 0; i < data.length; i++)
            data[i] = Math.sin(i*Math.PI*2/data.length)+(Math.random()-0.5)*noiseLevel;
        var ans = SG(data, Math.PI*2/data.length, options);

        /*for (var j = 0; j < data.length; j++){
            console.log(j+" "+data[j]+" "+ans[j]);
        }*/

        for (var j = Math.round(options.windowSize/2); j < data.length-Math.round(options.windowSize/2); j++){
            ans[j].should.be.approximately(Math.cos(j*Math.PI*2/data.length), noiseLevel);
        }
    });

    it('First derivative test x as vector', function () {
        var options = {
            windowSize: 47,
            derivative: 1,
            polynomial: 3
        };

        var noiseLevel = 0.1;
        var data = new Array(200);
        var x = new Array(200);
        for (var i = 0; i < data.length; i++){
            data[i] = Math.sin(i*Math.PI*2/data.length)+(Math.random()-0.5)*noiseLevel;
            x[i]=i*Math.PI*2/data.length;
        }

        var ans = SG(data, Math.PI*2/data.length, options);
        var ans2 = SG(data, x, options);

        /*for (var j = 0; j < data.length; j++){
            console.log(ans[j]+" "+ans2[j]);
        }*/

        for (var j = Math.round(options.windowSize/2); j < data.length-Math.round(options.windowSize/2); j++){
            ans[j].should.be.approximately(ans2[j], 10e-10);
        }
    });
});
