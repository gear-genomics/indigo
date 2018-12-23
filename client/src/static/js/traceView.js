//  TraceView displays trace information
//
//  Data must be of this structure:
//  {
//  "pos": [1, 2, ...],            # Ignored
//  "peakA": [0, 0, 0, ...],       # Essential
//  "peakC": [4138, 3984, ...],    # Essential
//  "peakG": [0, 0, 0, 0, ...],    # Essential
//  "peakT": [1265, 1134, ...],    # Essential
//  "basecallPos": [12, 34,  ...], # Essential
//  "basecalls": {"12":"1:C", "34":"2:C", "41":"3:C",    # Essential
//  "refchr": "example",           # Optional
//  "refpos": 32,                  # Optional
//  "refalign": "CCCGGCAT...",     # Optional
//  "forward": 1                   # Optional
//  }
//

module.exports = {
    displayData: displayData,
    deleteContent: deleteContent
};

// Global Values
global.winXst;
global.winXend;
global.winYend;
var frameXst;
var frameXend;
var frameYst;
var frameYend;
global.allResults;
var baseCol;

function resetGlobalValues() {
    winXst = 0;
    winXend = 600;
    winYend = 2300;
    frameXst = 0;
    frameXend = 1000;
    frameYst = 0;
    frameYend = 200;
    baseCol = [["green",1.5],["blue",1.5],["black",1.5],["red",1.5]];
    allResults = "";
}

function createButtons() {
    var html = '<div id="traceView-Buttons" class="d-none">';
    html += '  <button id="traceView-nav-bw-win" class="btn btn-outline-secondary">prev</button>';
    html += '  <button id="traceView-nav-bw-bit" class="btn btn-outline-secondary">&lt;</button>';
    html += '  <button id="traceView-nav-zy-in" class="btn btn-outline-secondary">Bigger Peaks</button>';
    html += '  <button id="traceView-nav-zy-out" class="btn btn-outline-secondary">Smaller Peaks</button>';
    html += '  <button id="traceView-nav-zx-in" class="btn btn-outline-secondary">Zoom in</button>';
    html += '  <button id="traceView-nav-zx-out" class="btn btn-outline-secondary">Zoom Out</button>';
    html += '  <button id="traceView-nav-fw-bit" class="btn btn-outline-secondary">&gt;</button>';
    html += '  <button id="traceView-nav-fw-win" class="btn btn-outline-secondary">next</button>';
    html += '  <a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</a>';
    html += '  <button id="traceView-nav-hi-a" class="btn btn-outline-secondary"><strong>A</strong></button>';
    html += '  <button id="traceView-nav-hi-c" class="btn btn-outline-secondary"><strong>C</strong></button>';
    html += '  <button id="traceView-nav-hi-g" class="btn btn-outline-secondary"><strong>G</strong></button>';
    html += '  <button id="traceView-nav-hi-t" class="btn btn-outline-secondary"><strong>T</strong></button>';
    html += '  <button id="traceView-nav-hi-n" class="btn btn-outline-secondary">ACGT</button>';
    html += '</div>';
    html += '<div id="traceView-Traces"></div>';
    html += '<div id="traceView-Sequence" class="d-none">';
    html += '  <hr>\n  <p>Chromatogram Sequence:</p>';
    html += '<textarea class="form-control" id="traceView-traceSeq" rows="7" cols="110"></textarea>';
    html += '</div>';
    html += '<div id="traceView-Reference" class="d-none">';
    html += '  <hr>\n  <p>Reference Sequence:</p>';
    html += '<textarea class="form-control" id="traceView-refSeq" rows="7" cols="110"></textarea>';
    html += '</div>';
    return html;
}

function showElement(element) {
  element.classList.remove('d-none');
}

function hideElement(element) {
  element.classList.add('d-none');
}

document.addEventListener("DOMContentLoaded", function() {
    resetGlobalValues();
    var trv = document.getElementById('traceView');
    trv.innerHTML = createButtons();

    var navBwWinButton = document.getElementById('traceView-nav-bw-win')
    navBwWinButton.addEventListener('click', navBwWin)
    var navBwBitButton = document.getElementById('traceView-nav-bw-bit')
    navBwBitButton.addEventListener('click', navBwBit)
    var navZoomYinButton = document.getElementById('traceView-nav-zy-in')
    navZoomYinButton.addEventListener('click', navZoomYin)
    var navZoomYoutButton = document.getElementById('traceView-nav-zy-out')
    navZoomYoutButton.addEventListener('click', navZoomYout)
    var navZoomXinButton = document.getElementById('traceView-nav-zx-in')
    navZoomXinButton.addEventListener('click', navZoomXin)
    var navZoomXoutButton = document.getElementById('traceView-nav-zx-out')
    navZoomXoutButton.addEventListener('click', navZoomXout)
    var navFwBitButton = document.getElementById('traceView-nav-fw-bit')
    navFwBitButton.addEventListener('click', navFwBit)
    var navFwWinButton = document.getElementById('traceView-nav-fw-win')
    navFwWinButton.addEventListener('click', navFwWin)
    var navHiAButton = document.getElementById('traceView-nav-hi-a')
    navHiAButton.addEventListener('click', navHiA)
    var navHiCButton = document.getElementById('traceView-nav-hi-c')
    navHiCButton.addEventListener('click', navHiC)
    var navHiGButton = document.getElementById('traceView-nav-hi-g')
    navHiGButton.addEventListener('click', navHiG)
    var navHiTButton = document.getElementById('traceView-nav-hi-t')
    navHiTButton.addEventListener('click', navHiT)
    var navHiNButton = document.getElementById('traceView-nav-hi-n')
    navHiNButton.addEventListener('click', navHiN)
});

function navFaintCol() {
    baseCol = [["#a6d3a6",1.5],["#a6a6ff",1.5],["#a6a6a6",1.5],["#ffa6a6",1.5]];
}

function navHiN() {
    baseCol = [["green",1.5],["blue",1.5],["black",1.5],["red",1.5]];
    SVGRepaint();
}

function navHiA() {
    navFaintCol();
    baseCol[0] = ["green",2.5];
    SVGRepaint();    
}

function navHiC() {
    navFaintCol();
    baseCol[1] = ["blue",2.5];
    SVGRepaint();
}

function navHiG() {
    navFaintCol();
    baseCol[2] = ["black",2.5];
    SVGRepaint();
}

function navHiT() {
    navFaintCol();
    baseCol[3] = ["red",2.5];
    SVGRepaint();
}

function navBwBit() {
    var oldStep = winXend - winXst;
    var step = Math.floor(oldStep/3);
    winXst -= step;
    winXend -= step;
    if (winXst < 0) {
        winXst = 0;
        winXend = oldStep;
    }
    SVGRepaint();
}

function navBwWin() {
    var step = winXend - winXst;
    winXst -= step;
    winXend -= step;
    if (winXst < 0) {
        winXst = 0;
        winXend = step;
    }
    SVGRepaint();
}

function navZoomYin() {
    winYend = winYend * 3 / 4;
    SVGRepaint();
}

function navZoomYout() {
    winYend = winYend * 4 / 3;
    SVGRepaint();
}

function navZoomXin() {
    var oldStep = winXend - winXst;
    var center = winXst + oldStep / 2;
    var step = Math.floor(oldStep * 3 / 4);
    winXst = Math.floor(center - step / 2);
    winXend = Math.floor(center + step / 2);
    SVGRepaint();
}

function navZoomXout() {
    var oldStep = winXend - winXst;
    var center = winXst + oldStep / 2;
    var step = Math.floor(oldStep * 4 / 3);
    winXst = Math.floor(center - step / 2);
    winXend = Math.floor(center + step / 2);
    if (winXst < 0) {
        winXst = 0;
        winXend = step;
    }
    SVGRepaint();
}

function navFwBit() {
    var step = Math.floor((winXend - winXst)/3);
    winXst += step;
    winXend += step;
    SVGRepaint();
}

function navFwWin() {
    var step = winXend - winXst;
    winXst += step;
    winXend += step;
    SVGRepaint();
}

function SVGRepaint(){
    var retVal = createSVG(allResults,winXst,winXend,winYend,frameXst,frameXend,frameYst,frameYend);
    digShowSVG(retVal);
}

function displayTextSeq (tr) {
    if (tr.hasOwnProperty('alt1align') && tr.hasOwnProperty('alt2align')){
        return;
    }
    var seq = "";
    for (var i = 0; i < tr.basecallPos.length; i++) {
        var base = tr.basecalls[tr.basecallPos[i]] + " ";
        var pos = base.indexOf(":");
    //    if ((i % 60) === 0 && i != 0) {
    //        seq += "\n";
    //    }
        seq += base.charAt(pos + 1);
    }
    var outField = document.getElementById('traceView-traceSeq')
    outField.value = seq.replace(/-/g,"");
    var trSeq = document.getElementById('traceView-Sequence');
    showElement(trSeq);

    if (tr.hasOwnProperty('refalign')){
        var ref = tr.refalign;
        var outField2 = document.getElementById('traceView-refSeq')
        outField2.value = ref.replace(/-/g,"");
        var refSeq = document.getElementById('traceView-Reference');
        showElement(refSeq);
    } 
}

function digShowSVG(svg) {
    var retVal = svg;
    var regEx1 = /</g;
    retVal = retVal.replace(regEx1, "%3C");
    var regEx2 = />/g;
    retVal = retVal.replace(regEx2, "%3E");
    var regEx3 = /#/g;
    retVal = retVal.replace(regEx3, "%23");
    retVal = '<img src="data:image/svg+xml,' + retVal + '" alt="Digest-SVG">';
    var sectionResults = document.getElementById('traceView-Traces')
    sectionResults.innerHTML = retVal;
}

function createSVG(tr,startX,endX,endY,wdXst,wdXend,wdYst,wdYend) {
    var retVal = createAllCalls(tr,startX,endX,endY,wdXst,wdXend,wdYst,wdYend);
    retVal += createCoodinates (tr,startX,endX,endY,wdXst,wdXend,wdYst,wdYend);
    retVal += "</svg>";
    var head;
    if (tr.hasOwnProperty('refalign')) {
        head = "<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='360' viewBox='-60 -40 1200 360'>";
    } else if (tr.hasOwnProperty('ref1align') && tr.hasOwnProperty('ref2align')) {
        head = "<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='400' viewBox='-60 -40 1200 400'>";
    } else {
        head = "<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='300' viewBox='-60 -40 1200 300'>";
    }
    return head + retVal;
}

function createCoodinates (tr,startX,endX,endY,wdXst,wdXend,wdYst,wdYend){
    var lineXst = wdXst - 5;
    var lineXend = wdXend + 5;
    var lineYst = wdYst - 5;
    var lineYend = wdYend + 5;
    var retVal = "<line x1='" + lineXst + "' y1='" + lineYend;
    retVal += "' x2='" + lineXend + "' y2='" + lineYend + "' stroke-width='2' stroke='black' stroke-linecap='square'/>";
    retVal += "<line x1='" + lineXst + "' y1='" + lineYst;
    retVal += "' x2='" + lineXst + "' y2='" + lineYend + "' stroke-width='2' stroke='black' stroke-linecap='square'/>";

    var prim = "";
    var sec = "";
    for (var i = 0; i < tr.basecallPos.length; i++) {
        var base = tr.basecalls[tr.basecallPos[i]] + " ";
        var pos = base.indexOf(":");
    //    if ((i % 60) === 0 && i != 0) {
    //        seq += "\n";
    //    }
        prim += base.charAt(pos + 1);
        if (pos + 3 < base.length) {
            sec += base.charAt(pos + 3);
        } else {
            sec += base.charAt(pos + 1);
        }
    }

    // The X-Axis
    var firstBase = -1;
    var lastBase = -1;
    for (var i = 0; i < tr.basecallPos.length; i++) {
        if ((parseFloat(tr.basecallPos[i]) > startX) &&
            (parseFloat(tr.basecallPos[i]) < endX)) {
            if (firstBase === -1) {
                firstBase = tr.basecalls[tr.basecallPos[i]];
            }
            lastBase = tr.basecalls[tr.basecallPos[i]];
            var xPos = wdXst + (parseFloat(tr.basecallPos[i]) - startX) / (endX - startX)  * (wdXend - wdXst);
            retVal += "<line x1='" + xPos + "' y1='" + lineYend;
            retVal += "' x2='" + xPos + "' y2='" + (lineYend + 7)+ "' stroke-width='2' stroke='black' />";
            retVal += "<text x='" + (xPos + 3) + "' y='" + (lineYend + 11);
            retVal += "' font-family='Arial' font-size='10' fill='black' text-anchor='end' transform='rotate(-90 ";
            retVal += (xPos + 3) + "," + (lineYend + 11) + ")'>";
            retVal += tr.basecalls[tr.basecallPos[i]] + "</text>";

            if (tr.hasOwnProperty('refalign')){
                if (!(tr.refalign.charAt(i) === prim.charAt(i) && tr.refalign.charAt(i) === sec.charAt(i))) {
                    var refcol = "red";
                    if (tr.refalign.charAt(i) === prim.charAt(i) || tr.refalign.charAt(i) === sec.charAt(i)) {
                        refcol = "orange";
                    }
                    retVal += "<rect x='" + (xPos - 5) + "' y='" + (lineYend + 63);
                    retVal += "' width='10' height='10' style='fill:" + refcol + ";stroke-width:3;stroke:" + refcol + "' />";
                }
                retVal += "<text x='" + (xPos + 3) + "' y='" + (lineYend + 71);
                retVal += "' font-family='Arial' font-size='10' fill='black' text-anchor='end'>";
                retVal += tr.refalign.charAt(i);
                retVal +=  "</text>";
            }
            if (tr.hasOwnProperty('alt1align') && tr.hasOwnProperty('alt2align')){
                if ((tr.alt1gap.charAt(i) == '-') || (tr.alt1align.charAt(i) != ' ' && tr.alt1align.charAt(i) != tr.ref1align.charAt(i))) {
                    var refcol = "red";
                    if (tr.alt1gap.charAt(i) == '-') {
                        refcol = "#99ccff";
                    }
                    retVal += "<rect x='" + (xPos - 5) + "' y='" + (lineYend + 63);
                    retVal += "' width='10' height='10' style='fill:" + refcol + ";stroke-width:3;stroke:" + refcol + "' />";
                }
                retVal += "<text x='" + (xPos + 3) + "' y='" + (lineYend + 71);
                retVal += "' font-family='Arial' font-size='10' fill='black' text-anchor='end'>";
                if (tr.alt1align.charAt(i) == ' ') {
                    retVal += '-';
                } else {
                    retVal += tr.alt1align.charAt(i);
                }
                retVal +=  "</text>";

                if ((tr.alt2gap.charAt(i) == '-') || (tr.alt2align.charAt(i) != ' ' && tr.alt2align.charAt(i) != tr.ref2align.charAt(i))) {
                    var refcol = "red";
                    if (tr.alt2gap.charAt(i) == '-') {
                        refcol = "#99ccff";
                    }
                    retVal += "<rect x='" + (xPos - 5) + "' y='" + (lineYend + 113);
                    retVal += "' width='10' height='10' style='fill:" + refcol + ";stroke-width:3;stroke:" + refcol + "' />";
                }
                retVal += "<text x='" + (xPos + 3) + "' y='" + (lineYend + 121);
                retVal += "' font-family='Arial' font-size='10' fill='black' text-anchor='end'>";
                if (tr.alt2align.charAt(i) == ' ') {
                    retVal += '-';
                } else {
                    retVal += tr.alt2align.charAt(i);
                }
                retVal +=  "</text>";
            }
        }
    }

    var refOrient = "";
    if(tr.hasOwnProperty('forward')){
        if(tr.forward == 1) {
            if(tr.hasOwnProperty('refpos')){
                firstBase = parseInt(tr.refpos) + parseInt(firstBase);
                lastBase = parseInt(tr.refpos) + parseInt(lastBase);
                retVal += "<text x='-5' y='" + (lineYend + 71);
                retVal += "' font-family='Arial' font-size='10' fill='black' text-anchor='end'>";
                retVal += firstBase + "</text>";
                retVal += "<text x='1005' y='" + (lineYend + 71);
                retVal += "' font-family='Arial' font-size='10' fill='black' text-anchor='start'>";
                retVal += lastBase + "</text>";
            }
            refOrient = " - forward";
        } else {
            if(tr.hasOwnProperty('refpos')){
                firstBase = parseInt(tr.refpos) - parseInt(firstBase);
                lastBase = parseInt(tr.refpos) - parseInt(lastBase);
                retVal += "<text x='-5' y='" + (lineYend + 71);
                retVal += "' font-family='Arial' font-size='10' fill='black' text-anchor='end'>";
                retVal += firstBase + "</text>";
                retVal += "<text x='1005' y='" + (lineYend + 71);
                retVal += "' font-family='Arial' font-size='10' fill='black' text-anchor='start'>";
                retVal += lastBase + "</text>";
            }
            refOrient = " - reverse";
        }
    }
    if(tr.hasOwnProperty('refchr')){
        retVal += "<text x='500' y='" + (lineYend + 100);
        retVal += "' font-family='Arial' font-size='15' fill='black' text-anchor='middle'>";
        retVal += tr.refchr + refOrient + "</text>";
    }
  
    refOrient = "";
    if(tr.hasOwnProperty('ref1forward')){
        if(tr.ref1forward == 1) {
            refOrient = " - forward";
        } else {
            refOrient = " - reverse";
        }
    }
    if(tr.hasOwnProperty('ref1chr')){
        retVal += "<text x='500' y='" + (lineYend + 91);
        retVal += "' font-family='Arial' font-size='15' fill='black' text-anchor='middle'>";
        retVal += "Alt1 Alignment: " + tr.ref1chr + refOrient + "</text>";
    }
    refOrient = "";
    if(tr.hasOwnProperty('ref2forward')){
        if(tr.ref2forward == 1) {
            refOrient = " - forward";
        } else {
            refOrient = " - reverse";
        }
    }
    if(tr.hasOwnProperty('ref2chr')){
        retVal += "<text x='500' y='" + (lineYend + 141);
        retVal += "' font-family='Arial' font-size='15' fill='black' text-anchor='middle'>";
        retVal += "Alt2 Alignment: " + tr.ref2chr + refOrient + "</text>";
    }

    // The Y-Axis
    var yPow = Math.pow(10, Math.floor(Math.log10(endY/10)));
    var yStep = Math.floor(endY/10/yPow) * yPow;
    for (var i = 0; i * yStep < endY; i++) {
        var yPos = wdYend - i * yStep / endY * (wdYend - wdYst);
        retVal += "<line x1='" + lineXst + "' y1='" + yPos;
        retVal += "' x2='" + (lineXst - 7) + "' y2='" + yPos + "' stroke-width='2' stroke='black' />";
        retVal += "<text x='" + (lineXst - 11) + "' y='" + (yPos + 3);
        retVal += "' font-family='Arial' font-size='10' fill='black' text-anchor='end'>";
        retVal += (i * yStep) + "</text>";
    }
   
    var sqrY = -20;
    var txtY = -9;
    retVal += "<rect x='400' y='" + sqrY + "' width='10' height='10' style='fill:green;stroke-width:3;stroke:green' />";
    retVal += "<text x='417' y='" + txtY + "' font-family='Arial' font-size='18' fill='black'>A</text>";
    retVal += "<rect x='450' y='" + sqrY + "' width='10' height='10' style='fill:blue;stroke-width:3;stroke:blue' />";
    retVal += "<text x='467' y='" + txtY + "' font-family='Arial' font-size='18' fill='black'>C</text>";
    retVal += "<rect x='500' y='" + sqrY + "' width='10' height='10' style='fill:black;stroke-width:3;stroke:black' />";
    retVal += "<text x='517' y='" + txtY + "' font-family='Arial' font-size='18' fill='black'>G</text>";
    retVal += "<rect x='550' y='" + sqrY + "' width='10' height='10' style='fill:red;stroke-width:3;stroke:red' />";
    retVal += "<text x='567' y='" + txtY + "' font-family='Arial' font-size='18' fill='black'>T</text>";

    return retVal;
}

function createAllCalls(tr,startX,endX,endY,wdXst,wdXend,wdYst,wdYend){
    var retVal = createOneCalls(tr.peakA,baseCol[0],startX,endX,endY,wdXst,wdXend,wdYst,wdYend);
    retVal += createOneCalls(tr.peakC,baseCol[1],startX,endX,endY,wdXst,wdXend,wdYst,wdYend);
    retVal += createOneCalls(tr.peakG,baseCol[2],startX,endX,endY,wdXst,wdXend,wdYst,wdYend);
    retVal += createOneCalls(tr.peakT,baseCol[3],startX,endX,endY,wdXst,wdXend,wdYst,wdYend);
    return retVal;
}

function createOneCalls(trace,col,startX,endX,endY,wdXst,wdXend,wdYst,wdYend){
    var startTag = "<polyline fill='none' stroke-linejoin='round' stroke='" + col[0];
    startTag += "' stroke-width='" + col[1] + "' points='";
    var retVal = "";
    var lastVal = -99;
    for (var i = startX; i < endX; i++) {
        if(!(typeof trace[i] === 'undefined')){
            var iden = parseFloat(trace[i]);
            if ((lastVal < -90) && (iden > -90)) {
                retVal += startTag;
            }
            if ((lastVal > -90) && (iden < -90)) {
                retVal += "'/>";
            }
            lastVal = iden;
            iden = parseFloat(trace[i]) / endY;
            if (iden > 1.0) {
                iden = 1;
            }
            var xPos = wdXst + (i - startX) / (endX - startX)  * (wdXend - wdXst);
            var yPos = wdYend - iden * (wdYend - wdYst);
            retVal += xPos + "," + yPos + " ";
        } 
    }
    if (lastVal > -90) {
        retVal += "'/>";
    }
    return retVal;
}
function errorMessage(err) {
    deleteContent();
    var html = '<div id="traceView-error" class="alert alert-danger" role="alert">';
    html += '  <i class="fas fa-fire"></i>';
    html += '  <span id="error-message">' + err;
    html += '  </span>';
    html += '</div>';
    var trTrc = document.getElementById('traceView-Traces');
    trTrc.innerHTML = html;
}

function displayData(res) {
    resetGlobalValues();
    allResults = JSON.parse(JSON.stringify(res));
    if (allResults.hasOwnProperty('alt1align') && allResults.hasOwnProperty('alt2align')) {
        allResults.alt1align = spacesStartEnd(allResults.alt1align);
        allResults.ref1align = spacesStartEnd(allResults.ref1align);
        allResults.alt2align = spacesStartEnd(allResults.alt2align);
        allResults.ref2align = spacesStartEnd(allResults.ref2align);
        removeAlignGaps(allResults);
        if (allResults.hasOwnProperty('alt1align')) {
           var focPos = Math.floor((allResults.chartConfig.x.axis.range[1] + allResults.chartConfig.x.axis.range[0]) / 2);
           var step = winXend - winXst;
           winXst = focPos - Math.floor(step/2);
           winXend = focPos + Math.floor(step/2);
        }
    }
    if (allResults.hasOwnProperty('peakA') == false){
        errorMessage("Bad JSON data: peakA array missing!");
        return;
    }
    if (allResults.hasOwnProperty('peakC') == false){
        errorMessage("Bad JSON data: peakC array missing!");
        return;
    }
    if (allResults.hasOwnProperty('peakG') == false){
        errorMessage("Bad JSON data: peakG array missing!");
        return;
    }
    if (allResults.hasOwnProperty('peakT') == false){
        errorMessage("Bad JSON data: peakt array missing!");
        return;
    }
    if (allResults.hasOwnProperty('basecallPos') == false){
        errorMessage("Bad JSON data: basecallPos array missing!");
        return;
    }
    if (allResults.hasOwnProperty('basecalls') == false){
        errorMessage("Bad JSON data: basecalls array missing!");
        return;
    }
    displayTextSeq(allResults);
    SVGRepaint();
    var trBtn = document.getElementById('traceView-Buttons');
    showElement(trBtn);
}

function spacesStartEnd(tr) {
    var i = 0;
    var ret = "";
    while (tr.charAt(i) == '-') {
        ret += ' ';
        i++;
    }
    tr = ret + tr.substr(i);
    i = tr.length - 1;
    ret = ""
    while (tr.charAt(i) == '-') {
        ret += ' ';
        i--;
    }
    tr = tr.substr(0, i) + ret;
    return tr;
}

function removeAlignGaps(res) {
    var alig = "";
    var ref = "";
    var gap = "";
    for (var i = 0 ; i < res.alt1align.length ; i++ ) {
        if (res.alt1align.charAt(i) != '-') {
            alig += res.alt1align.charAt(i);
            ref += res.ref1align.charAt(i);
            gap += " ";
	} else {
            gap = gap.slice(0, -1) + '-';
	}
    }
    res.alt1align = alig;
    res.ref1align = ref;
    res.alt1gap = gap.replace(/- /g, "--");
    alig = "";
    ref = "";
    gap = "";
    for (var i = 0 ; i < res.alt2align.length ; i++ ) {
        if (res.alt2align.charAt(i) != '-') {
            alig += res.alt2align.charAt(i);
            ref += res.ref2align.charAt(i);
            gap += " ";
        } else {
            gap = gap.slice(0, -1) + '-';
        }
    }
    res.alt2align = alig;
    res.ref2align = ref;
    res.alt2gap = gap.replace(/- /g, "--");
}

function deleteContent() {
    var trBtn = document.getElementById('traceView-Buttons');
    hideElement(trBtn);
    var trTrc = document.getElementById('traceView-Traces');
    trTrc.innerHTML = "";
    var trSeq = document.getElementById('traceView-Sequence');
    hideElement(trSeq);
    var outField = document.getElementById('traceView-traceSeq')
    outField.value = "";
    var refSeq = document.getElementById('traceView-Reference');
    hideElement(refSeq);
    var outField2 = document.getElementById('traceView-refSeq')
    outField2.value = "";
}

