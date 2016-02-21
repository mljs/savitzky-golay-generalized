//Code translate from Pascal source in http://pubs.acs.org/doi/pdf/10.1021/ac00205a007
var extend = require('extend');
var stat = require('ml-stat');

var defaultOptions = {
    windowSize: 9,
    derivative: 0,
    polynomial: 3,
};


function SavitzkyGolay(data, h, options) {
    options = extend({}, defaultOptions, options);

    if ((options.windowSize % 2 === 0) || (options.windowSize < 5) || !(Number.isInteger(options.windowSize)))
            throw new RangeError('Invalid window size (should be odd and at least 5 integer number)')


    if (options.windowSize>data.length)
        throw new RangeError('Window size is higher than the data length '+options.windowSize+">"+data.length);
    if ((options.derivative < 0) || !(Number.isInteger(options.derivative)))
        throw new RangeError('Derivative should be a positive integer');
    if ((options.polynomial < 1) || !(Number.isInteger(options.polynomial)))
        throw new RangeError('Polynomial should be a positive integer');
    if (options.polynomial >= 6)
        console.warn('You should not use polynomial grade higher than 5 if you are' +
            ' not sure that your data arises from such a model. Possible polynomial oscillation problems');

    var windowSize = options.windowSize;

    var half = Math.floor(windowSize/2);
    var np = data.length;
    var ans = new Array(np);
    var weights = fullWeights(windowSize,options.polynomial,options.derivative);
    var hs = 0;
    var constantH = true;
    if( Object.prototype.toString.call( h ) === '[object Array]' ) {
        constantH = false;
    }
    else{
        hs = Math.pow(h, options.derivative);
    }
    //console.log("Constant h: "+constantH);
    //For the borders
    for(var i=0;i<half;i++){
        var wg1=weights[half-i-1];
        var wg2=weights[half+i+1];
        var d1 = 0,d2=0;
        for (var l = 0; l < windowSize; l++){
            d1 += wg1[l] * data[l];
            d2 += wg2[l] * data[np-windowSize+l-1];
        }
        if(constantH){
            ans[half-i-1] = d1/hs;
            ans[np-half+i] = d2/hs;
        }
        else{
            hs = getHs(h,half-i-1,half, options.derivative);
            ans[half-i-1] = d1/hs;
            hs = getHs(h,np-half+i,half, options.derivative);
            ans[np-half+i] = d2/hs;
        }
    }
    //For the internal points
    var wg = weights[half];
    for(var i=windowSize;i<np+1;i++){
        var d = 0;
        for (var l = 0; l < windowSize; l++)
            d += wg[l] * data[l+i-windowSize];
        if(!constantH)
            hs = getHs(h,i-half-1,half, options.derivative);
        ans[i-half-1] = d/hs;
    }
    return ans;
}

function getHs(h,center,half,derivative){
    var hs = 0;
    var count = 0;
    for(var i=center-half;i<center+half;i++){
        if(i>=0 && i < h.length-1){
            hs+= (h[i+1]-h[i]);
            count++;
        }
    }
    return Math.pow(hs/count,derivative);
}

function GramPoly(i,m,k,s){
    var Grampoly = 0;
    if(k>0){
        Grampoly = (4*k-2)/(k*(2*m-k+1))*(i*GramPoly(i,m,k-1,s) +
            s*GramPoly(i,m,k-1,s-1)) - ((k-1)*(2*m+k))/(k*(2*m-k+1))*GramPoly(i,m,k-2,s);
    }
    else{
        if(k==0&&s==0){
            Grampoly=1;
        }
        else{
            Grampoly=0;
        }
    }
    //console.log(Grampoly);
    return Grampoly;
}

function GenFact(a,b){
    var gf=1;
    if(a>=b){
        for(var j=a-b+1;j<=a;j++){
            gf*=j;
        }
    }
    return gf;
}

function Weight(i,t,m,n,s){
    var sum=0;
    for(var k=0;k<=n;k++){
        //console.log(k);
        sum+=(2*k+1)*(GenFact(2*m,k)/GenFact(2*m+k+1,k+1))*GramPoly(i,m,k,0)*GramPoly(t,m,k,s)
    }
    return sum;
}

/**
 *
 * @param m  Number of points
 * @param n  Polynomial grade
 * @param s  Derivative
 */
function fullWeights(m,n,s){
    var weights = new Array(m);
    var np = Math.floor(m/2);
    for(var t=-np;t<=np;t++){
        weights[t+np] = new Array(m);
        for(var j=-np;j<=np;j++){
            weights[t+np][j+np]=Weight(j,t,np,n,s);
        }
    }
    return weights;
}

/*function entropy(data,h,options){
    var trend = SavitzkyGolay(data,h,trendOptions);
    var copy = new Array(data.length);
    var sum = 0;
    var max = 0;
    for(var i=0;i<data.length;i++){
        copy[i] = data[i]-trend[i];
    }

    sum/=data.length;
    console.log(sum+" "+max);
    console.log(stat.array.standardDeviation(copy));
    console.log(Math.abs(stat.array.mean(copy))/stat.array.standardDeviation(copy));
    return sum;

}



function guessWindowSize(data, h){
    console.log("entropy "+entropy(data,h,trendOptions));
    return 5;
}
*/
module.exports = SavitzkyGolay;
 
