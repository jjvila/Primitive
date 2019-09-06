document.getElementById("mainForm").addEventListener("submit", getInput);

const maxLongitude = 180;
const maxLatitude = 90;

var pairsList;                // Array: List of coordinate pairs delimited by comma.
var topmost = -91,            // float: largest latitude (max 90)
    bottommost = 181;         // float: smallest latitude (min -90)
var topmostIndex = 0,
    bottommostIndex = 0;
var northwest, southeast;

/* Retrieve User Input*/
function getInput() {
    var unparsedList = document.getElementById("inputCoordinates").value;
    pairsList = unparsedList.split(";", 20);
    getEdgeCoordinates();
}

function getEdgeCoordinates() {
    var lat = 0, lon = 0;
    var negFlag = false, posFlag = false;
    var latlonString = pairsList[0].split(",", 2);
    var negMin = 1,                 // 1 = non-existant
        negMax = -1 - maxLongitude,  // (-181) = non-existant
        posMin = maxLongitude + 1,    // (181) = non-existant
        posMax = -1;    // -1 = non-existant

    var posMinIndex, posMaxIndex, negMinIndex, negMaxIndex;

    for (var i = 0; i < pairsList.length; i++) {
        latlonString = pairsList[i].split(",", 2);
        lat = parseFloat(latlonString[0]);
        lon = parseFloat(latlonString[1]);


        // Check range. -90 <= lat <= 90 ; -180 <= lon <= 180
        if (lat < -90 || lat > 90) {
            alertError(1);
            break;
        }
        if (lon < -180 || lon > 180) {
            alertError(2);
            break;
        }

        // Get top and bottom latitudes
        if (topmost < lat) {
            topmost = lat;
            topmostIndex = i;
        }

        if (bottommost > lat) {
            bottommost = lat;
            bottommostIndex = i;
        }

        // Determine minimum and maximum longitudes for each hemisphere.
        if (lon < 0) {
            negFlag = true;
            if (lon <= negMin) {
                negMin = lon;
                negMinIndex = i;
            }
            if (lon >= negMax) {
                negMax = lon;
                negMaxIndex = i;
            }
        }
        if (lon > 0) {
            posFlag = true;
            if (lon >= posMax) {
                posMax = lon;
                posMaxIndex = i;
            }
            if (lon <= posMin) {
                posMin = lon;
                posMinIndex = i;
            }
        }


    }
    alert("negMax: " + negMax + " negMin: " + negMin + " posMin: " + posMin + " posMax: " + posMax);

    // Determine largest longitudinal gap
    var lonGap1 = Math.abs(negMin - negMax);
    var lonGap2 = Math.abs(negMax - posMin);
    var lonGap3 = Math.abs(posMin - posMax);
    var lonGap4 = Math.abs(posMax - (2 * maxLongitude - Math.abs(negMin))); // anti-meridian offset applied to negMin
    alert("gap1: " + lonGap1 + " gap2: " + lonGap2 + " gap3: " + lonGap3 + " gap4: " + lonGap4);
    var lonGapLongest = lonGap1;
    var lonGapIndex = 1;
    if (lonGap2 > lonGapLongest) {
        lonGapLongest = lonGap2;
        lonGapIndex = 2;
    }
    if (lonGap3 > lonGapLongest) {
        lonGapLongest = lonGap3;
        lonGapIndex = 3;
    }
    if (lonGap4 > lonGapLongest) {
        lonGapLongest = lonGap4;
        lonGapIndex = 4;
    }

    // Determine meridian crossings
    if ((negFlag && !posFlag) || posFlag && !negFlag) {
        // Meridian not crossed
        if (negFlag) {
            // negMin = WEST
            // negMax = EAST
            alert("negMinWest: " + pairsList[negMinIndex] + " negMaxEast: " + pairsList[negMaxIndex]);
        }
        else if (posFlag) {
            // posMax = EAST
            // posMin = WEST
            alert(" posMinWest: " + pairsList[posMinIndex] + " posMaxEast: " + pairsList[posMaxIndex]);
        }
    }
    else {
        // Meridian crossed
        // Determine if crossed once or twice
        if (lonGapIndex == 2) {
            // Meridian crossed once
            // negMax = EAST
            // posMin = WEST
            alert("posMinWest: " + pairsList[posMinIndex] + " negMaxEast: " + pairsList[negMaxIndex]);

        } else if (lonGapIndex == 4) {
            // Meridian crossed once
            // negMin = WEST
            // posMax = EAST
            alert("negMinWest: " + pairsList[negMinIndex] + " posMaxEast: " + pairsList[posMaxIndex]);

        }
        else if (lonGapIndex == 3) {
            // Meridian crossed twice
            // posMin = EAST
            // posMax = WEST
            alert("posMaxWest: " + pairsList[posMaxIndex] + " posMinEast: " + pairsList[posMinIndex]);
        } else {
            // Meridian crossed twice
            // longGapIndex = 1
            // negMin = EAST
            // negMax = WEST
            alert("negMaxWest: " + pairsList[negMaxIndex] + " negMinEast: " + pairsList[negMinIndex]);
        }

    }

    printResult();
}

function printResult() {
    document.getElementById("result").style.display = "block";
    document.getElementById("GPS-N").value = pairsList[topmostIndex];
    nextAction();
    //alert(" Topmost: " + pairsList[topmostIndex] + " | Bottommost: " + pairsList[bottommostIndex]);
    document.getElementById("mainForm").addEventListener("submit", getInput);

}

function nextAction() {
    console.log("Done")
}

function alertError(errCode) {
    if (errCode == undefined)
        errCode = -1;
    if (errCode == 1)
        alert("Latitude out of range: -90 <= latitude <= 90");
    if (errCode == 2)
        alert("Longitude out of range: -180 <= longitude <= 180");
}