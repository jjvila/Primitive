const maxLongitude = 180;
const maxLatitude = 90;
const delimiterRE = /[ ,	 ]+/;        // Delimiters accepted for coordinate parsing: space, comma, tab, small tab

document.addEventListener('DOMContentLoaded', function () {
    let form = document.getElementById('mainForm');
    let pairswap1 = document.getElementById('pairswap1');
    let pairswap2 = document.getElementById('pairswap2');
    pairswap1.addEventListener('change', function (e) {e.preventDefault; document.getElementById("inputCoordinates").placeholder = "longitude, latitude\nlongitude, latitude\nlongitude latitude\nlongitude latitude"; });
    pairswap2.addEventListener('change', function (e) {e.preventDefault; document.getElementById("inputCoordinates").placeholder = "latitude, longitude\nlatitude, longitude\nlatitude longitude\nlatitude longitude"; });
    form.addEventListener('submit', function (e) {
        e.preventDefault();           // prevent refresh
        getInput(pairswap2.checked);
    })
}, false);

function getInput(pairswap2) {
    /* Retrieve User Input from DOM */
    let pairsList = [];              // Array: List of string coordinate pairs delimited by comma and/or space.


    // Get coordinates list
    let unparsedList = document.getElementById("inputCoordinates").value;
    if (unparsedList == "")
        alertError(4);
    else {
        pairsList = unparsedList.split("\n");

        // Get padding
        let meters = document.getElementById("paddingDistance").value;
        if (isNaN(meters))
            alertError(3);
        else if (parseFloat(meters) < 0)
            alertError(3);
        else
            generateBoundedBox(pairsList, parseFloat(meters), pairswap2);
    }
}

function generateBoundedBox(pairsList, padding, latLonOrder) {
    /* INPUT 
        padding: meters between outer coordinates and bounding box
        latLonOrder: if false, inputted coordinates are swapped (lon, lat) instead of (lat, lon)
                When not default, placement into parsed array is swapped to default format, then swapped back at printing.
    */

    let lat = 0, lon = 0;
    let negFlag = false, posFlag = false;
    let latlonString = pairsList[0].split(",", 2);
    let negMin = 1,                 // 1 = non-existant
        negMax = -1 - maxLongitude,  // (-181) = non-existant
        posMin = maxLongitude + 1,    // (181) = non-existant
        posMax = -1;    // -1 = non-existant

    let posMinIndex, posMaxIndex, negMinIndex, negMaxIndex;
    let parsedPairsList = [];          // 2D Array: List of coordinate pairs as floats. i = [lat (float), lon (float)]
    let topmost = -91,            // float: largest latitude (max 90)
        bottommost = 181;         // float: smallest latitude (min -90)
    let topmostIndex = 0,
        bottommostIndex = 0;

    for (let i = 0; i < pairsList.length; i++) {
        latlonString = pairsList[i].split(delimiterRE, 2);

        if (latLonOrder == true) {
        lat = parseFloat(latlonString[0]);
        lon = parseFloat(latlonString[1]);
        } 
        else { // Not Default
            lon = parseFloat(latlonString[0]);
            lat = parseFloat(latlonString[1]);  
        }


        parsedPairsList[i] = [lat, lon];    // create float list here


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
        console.log("posMin: " + posMin + " posMax: " + posMax);


    }
    console.log("negMax: " + negMax + " negMin: " + negMin + " posMin: " + posMin + " posMax: " + posMax);

    // Determine largest longitudinal gap
    var lonGap1 = Math.abs(negMin - negMax);
    var lonGap2 = Math.abs(negMax - posMin);
    var lonGap3 = Math.abs(posMin - posMax);
    var lonGap4 = Math.abs(posMax - (2 * maxLongitude - Math.abs(negMin))); // anti-meridian offset applied to negMin
    console.log("gap 1: " + lonGap1 + " gap 2: " + lonGap2 + " gap 3: " + lonGap3 + " gap 4: " + lonGap4);
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

    // Determine meridian crossings, then determine box coordinates indices and store
    let boxCoordinates = [4];     // NW and SE unpadded bounding box coordinates [latNW, lonNW, latSE, lonSE]
    let paddedCoordinates = [4]  // SIZE TEMP


    if ((negFlag && !posFlag) || posFlag && !negFlag) {
        // Meridian not crossed
        if (negFlag) {
            // negMin = WEST
            // negMax = EAST
            boxCoordinates[0] = parsedPairsList[topmostIndex][0];
            boxCoordinates[1] = parsedPairsList[negMinIndex][1];
            boxCoordinates[2] = parsedPairsList[bottommostIndex][0];
            boxCoordinates[3] = parsedPairsList[negMaxIndex][1];

            paddedCoordinates = getPaddedCoordinates(boxCoordinates, padding);
            console.log("negMin (West): (" + pairsList[negMinIndex] + "); negMax (East): (" + pairsList[negMaxIndex] + ")");
        }
        else if (posFlag) {
            // posMax = EAST
            // posMin = WEST
            boxCoordinates[0] = parsedPairsList[topmostIndex][0];
            boxCoordinates[1] = parsedPairsList[posMinIndex][1];
            boxCoordinates[2] = parsedPairsList[bottommostIndex][0];
            boxCoordinates[3] = parsedPairsList[posMaxIndex][1];

            paddedCoordinates = getPaddedCoordinates(boxCoordinates, padding);
            console.log(" posMin (West): (" + pairsList[posMinIndex] + "); posMax (East): (" + pairsList[posMaxIndex] + ")");
        }
    }
    else {
        // Meridian crossed
        // Determine if crossed once or twice
        if (lonGapIndex == 2) {
            // Meridian crossed once
            // negMax = EAST
            // posMin = WEST
            boxCoordinates[0] = parsedPairsList[topmostIndex][0];
            boxCoordinates[1] = parsedPairsList[posMinIndex][1];
            boxCoordinates[2] = parsedPairsList[bottommostIndex][0];
            boxCoordinates[3] = parsedPairsList[negMaxIndex][1];

            paddedCoordinates = getPaddedCoordinates(boxCoordinates, padding);
            console.log("posMin (West): (" + pairsList[posMinIndex] + "); negMax (East): (" + pairsList[negMaxIndex] + ")");

        } else if (lonGapIndex == 4) {
            // Meridian crossed once
            // negMin = WEST
            // posMax = EAST
            boxCoordinates[0] = parsedPairsList[topmostIndex][0];       // nLat
            boxCoordinates[1] = parsedPairsList[negMinIndex][1];        // wLon
            boxCoordinates[2] = parsedPairsList[bottommostIndex][0];    // sLat
            boxCoordinates[3] = parsedPairsList[posMaxIndex][1];        // eLon

            paddedCoordinates = getPaddedCoordinates(boxCoordinates, padding);
            console.log("negMin (West): (" + pairsList[negMinIndex] + "); posMax (East): (" + pairsList[posMaxIndex] + ")");
        }
        else if (lonGapIndex == 3) {
            // Meridian crossed twice
            // posMin = EAST
            // posMax = WEST
            boxCoordinates[0] = parsedPairsList[topmostIndex][0];
            boxCoordinates[1] = parsedPairsList[posMaxIndex][1];
            boxCoordinates[2] = parsedPairsList[bottommostIndex][0];
            boxCoordinates[3] = parsedPairsList[posMinIndex][1];

            paddedCoordinates = getPaddedCoordinates(boxCoordinates, padding);
            console.log("posMax (West): (" + pairsList[posMaxIndex] + "); posMin (East): (" + pairsList[posMinIndex] + ")");
        } else {
            // Meridian crossed twice
            // longGapIndex = 1
            // negMin = EAST
            // negMax = WEST
            boxCoordinates[0] = parsedPairsList[topmostIndex][0];
            boxCoordinates[1] = parsedPairsList[negMaxIndex][1];
            boxCoordinates[2] = parsedPairsList[bottommostIndex][0];
            boxCoordinates[3] = parsedPairsList[negMinIndex][1];

            paddedCoordinates = getPaddedCoordinates(boxCoordinates, padding);
            console.log("negMax (West): (" + pairsList[negMaxIndex] + "); negMin (East): (" + pairsList[negMinIndex] + ")");
        }

    }


    printResult(1, latLonOrder, boxCoordinates, paddedCoordinates);
}

function printResult(type, latLonOrder, boxCoordinates, paddedCoordinates) {
    // 1: Bounding Box
    if (type == 1) {
        document.getElementById("result").style.display = "block";
        if (latLonOrder == true) {
            document.getElementById("NW").innerHTML = boxCoordinates[0] + ", " + boxCoordinates[1];
            document.getElementById("SE").innerHTML = boxCoordinates[2] + ", " + boxCoordinates[3];
            //alert(" Topmost: " + pairsList[topmostIndex] + " | Bottommost: " + pairsList[bottommostIndex]);
        }
        else {
            document.getElementById("NW").innerHTML = boxCoordinates[1] + ", " + boxCoordinates[0];
            document.getElementById("SE").innerHTML = boxCoordinates[3] + ", " + boxCoordinates[2];
        }
    }
    console.log("NW: " + paddedCoordinates[0][0] + ", " + paddedCoordinates[0][1]);
    console.log("SE: " + paddedCoordinates[1][0] + ", " + paddedCoordinates[1][1]);

}

function getPaddedCoordinates(latlon, lengthMeters) {
    /*  INPUT
        latlon[0]: lat of northernmost
        latlon[1]: lon of westernmost
        latlon[2]: lat of southernmost
        larlon[3]: lon of easternmost

        lengthMeters: desired padding in meters

        OUTPUT
        result[0][0]: lat of NW
        result[0][1]: lon of NW
        result[1][0]: lat of NE
        result[1][1]: lon of NE
        result[2][0]: lat of SE
        result[2][1]: lon of SE
        result[3][0]: lat of SW
        result[3][1]: lon of SW
    */

    let result = [2];

    /* Local Plane Formula (Law of Cosines) - Small Distances */

    // Get NW
    result[0] = [(lengthMeters / 111111) + latlon[0], -(lengthMeters / 1 / 111111) + latlon[1]];

    // Get SE
    result[1] = [-(lengthMeters / 111111) + latlon[2], (lengthMeters / 1 / 111111) + latlon[3]];


    return result;

}

function alertError(errCode) {
    if (errCode == 1)
        alert("Latitude out of range: -90 <= latitude <= 90");
    if (errCode == 2)
        alert("Longitude out of range: -180 <= longitude <= 180");
    if (errCode == 3)
        alert("Padding value must be a positive number.");
    if (errCode == 4)
        alert("Please enter a list of coordinates.");
}