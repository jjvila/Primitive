const maxLongitude = 180;
const maxLatitude = 90;
const delimiterRE = /[ ,	 ]+/;       // Regex: delimiters accepted for coordinate parsing: space, comma, tab, small tab
const degreeLength = 111111;            // Num: total length of one degree in meters.

document.addEventListener('DOMContentLoaded', function () {
    let form = document.getElementById('bbox-form');
    let pairswap1 = document.getElementById('bbox-form-lonlat');
    let pairswap2 = document.getElementById('bbox-form-latlon');
    pairswap1.addEventListener('change', function (e) { e.preventDefault; document.getElementById("bbox-form-pairslist").placeholder = "longitude, latitude\nlongitude, latitude\nlongitude latitude\nlongitude latitude"; });
    pairswap2.addEventListener('change', function (e) { e.preventDefault; document.getElementById("bbox-form-pairslist").placeholder = "latitude, longitude\nlatitude, longitude\nlatitude longitude\nlatitude longitude"; });
    form.addEventListener('submit', function (e) {
        e.preventDefault();           // prevent refresh
        getInput(pairswap2.checked);
    })
}, false);

function getInput(pairswap2) {
    /* Retrieve User Input from DOM */
    let pairsList = [];              // Array: List of string coordinate pairs delimited by comma and/or space.


    // Get coordinates list
    let unparsedList = document.getElementById("bbox-form-pairslist").value;
    if (unparsedList == "")
        alertError(4);
    else {
        pairsList = unparsedList.split("\n");

        // Get padding
        let padding = document.getElementById("paddingDistance").value;
        let paddingFloat;          // Meters to be used in the algorithm for m or km
        let paddingValues = [2];    // [0]: padding in meters
        // [1]: padding in kilometers
        // [2]: padding in degrees
        if (padding == "")
            padding = 0;
        if (isNaN(padding))
            alertError(3);
        else {
            paddingFloat = parseFloat(padding);
            if (paddingFloat < 0)
                alertError(3);
            else {
                let x = document.getElementById("padding-unit").selectedIndex;
                if (document.getElementsByTagName("option")[x].value == "meter") {
                    paddingValues[0] = paddingFloat;
                    paddingValues[1] = paddingFloat / 1000;
                }
                if (document.getElementsByTagName("option")[x].value == "kilometer") {
                    paddingValues[0] = paddingFloat * 1000;
                    paddingValues[1] = paddingFloat;
                }
                if (document.getElementsByTagName("option")[x].value == "degree") {
                    paddingValues[2] = paddingFloat;
                }
                else
                    paddingValues[2] = -1;                      // -1: Flag for non-degree unit
                parseList(pairsList, paddingValues, pairswap2);
            }
        }
    }
}

function parseList(pairsList, padding, latLonOrder) {
    /* INPUT 
        padding: meters between outer coordinates and bounding box
        latLonOrder: if false, inputted coordinates are swapped (lon, lat) instead of (lat, lon)
                When not default, placement into parsed array is swapped to default format, then swapped back at printing.
    */

    let lat = 0, lon = 0;
    let hemisphereSigns = [
        false,      // 0: latNegFlag = true/false = Southern
        false,      // 1: latPosFlag = true/false = Northern
        false,      // 2: lonNegFlag = true/false = Western
        false       // 3: lonPosFlag = true/false = Eastern
    ];
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

    let errorOccured = false;

    for (let i = 0; i < pairsList.length; i++) {
        latlonString = pairsList[i].split(delimiterRE, 2);

        if (isNaN(latlonString[0]) || isNaN(latlonString[1])) {
            alertError(5);
            errorOccured = true;
        }
        else {

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
                return;
            }
            if (lon < -180 || lon > 180) {
                alertError(2);
                return;
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
                hemisphereSigns[2] = true;
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
                hemisphereSigns[3] = true;
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


    }
    if (topmost < 0 || bottommost < 0)
        hemisphereSigns[0] = true;
    if (topmost >= 0 || bottommost >= 0)
        hemisphereSigns[1] = true;

    console.log("negMax: " + negMax + " negMin: " + negMin + " posMin: " + posMin + " posMax: " + posMax);

    if (!errorOccured)
        generateBoundedBox(hemisphereSigns, negMin, negMax, posMin, posMax, posMinIndex, posMaxIndex, negMinIndex, negMaxIndex, parsedPairsList, topmostIndex, bottommostIndex, pairsList, padding, latLonOrder);

}

function generateBoundedBox(hemisphereSigns, negMin, negMax, posMin, posMax, posMinIndex, posMaxIndex, negMinIndex, negMaxIndex, parsedPairsList, topmostIndex, bottommostIndex, pairsList, padding, latLonOrder) {

    // Determine largest longitudinal gap
    let lonGap1 = Math.abs(negMin - negMax);
    let lonGap2 = Math.abs(negMax - posMin);
    let lonGap3 = Math.abs(posMin - posMax);
    let lonGap4 = Math.abs(posMax - (2 * maxLongitude - Math.abs(negMin))); // anti-meridian offset applied to negMin
    console.log("gap 1: " + lonGap1 + " gap 2: " + lonGap2 + " gap 3: " + lonGap3 + " gap 4: " + lonGap4);
    let lonGapLongest = lonGap1;
    let lonGapIndex = 1;
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
    let boxCoordinates = [4];     // (Unpadded) 0: northernmost lat; 1: westernmost lon; 2: southernmost lat; 3: easternmost lon
    let paddedCoordinates = [4]  // SIZE TEMP

    let statisticsCoordinates = [4];            // 0: north; 1: south; 2: west; 3: east
    statisticsCoordinates[0] = parsedPairsList[topmostIndex];
    statisticsCoordinates[1] = parsedPairsList[bottommostIndex];


    if ((hemisphereSigns[2] && !hemisphereSigns[3]) || hemisphereSigns[3] && !hemisphereSigns[2]) {
        // Meridian not crossed
        if (hemisphereSigns[2]) {
            // negMin = WEST
            // negMax = EAST
            boxCoordinates[0] = parsedPairsList[topmostIndex][0];
            boxCoordinates[1] = parsedPairsList[negMinIndex][1];
            boxCoordinates[2] = parsedPairsList[bottommostIndex][0];
            boxCoordinates[3] = parsedPairsList[negMaxIndex][1];

            statisticsCoordinates[2] = parsedPairsList[negMinIndex]; // west
            statisticsCoordinates[3] = parsedPairsList[negMaxIndex]; // east

            paddedCoordinates = getPaddedCoordinates(boxCoordinates, padding);
            console.log("negMin (West): (" + pairsList[negMinIndex] + "); negMax (East): (" + pairsList[negMaxIndex] + ")");
        }
        else if (hemisphereSigns[3]) {
            // posMin = WEST
            // posMax = EAST
            boxCoordinates[0] = parsedPairsList[topmostIndex][0];
            boxCoordinates[1] = parsedPairsList[posMinIndex][1];
            boxCoordinates[2] = parsedPairsList[bottommostIndex][0];
            boxCoordinates[3] = parsedPairsList[posMaxIndex][1];

            statisticsCoordinates[2] = parsedPairsList[posMinIndex]; // west
            statisticsCoordinates[3] = parsedPairsList[posMaxIndex]; // east

            paddedCoordinates = getPaddedCoordinates(boxCoordinates, padding);
            console.log(" posMin (West): (" + pairsList[posMinIndex] + "); posMax (East): (" + pairsList[posMaxIndex] + ")");
        }
    }
    else {
        // Meridian crossed
        // Determine if crossed once or twice
        if (lonGapIndex == 2) {
            // Meridian crossed once
            // posMin = WEST
            // negMax = EAST
            boxCoordinates[0] = parsedPairsList[topmostIndex][0];
            boxCoordinates[1] = parsedPairsList[posMinIndex][1];
            boxCoordinates[2] = parsedPairsList[bottommostIndex][0];
            boxCoordinates[3] = parsedPairsList[negMaxIndex][1];

            statisticsCoordinates[2] = parsedPairsList[posMinIndex]; // west
            statisticsCoordinates[3] = parsedPairsList[negMaxIndex]; // east

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

            statisticsCoordinates[2] = parsedPairsList[negMinIndex]; // west
            statisticsCoordinates[3] = parsedPairsList[posMaxIndex]; // east

            paddedCoordinates = getPaddedCoordinates(boxCoordinates, padding);
            console.log("negMin (West): (" + pairsList[negMinIndex] + "); posMax (East): (" + pairsList[posMaxIndex] + ")");
        }
        else if (lonGapIndex == 3) {
            // Meridian crossed twice
            // posMax = WEST
            // posMin = EAST
            boxCoordinates[0] = parsedPairsList[topmostIndex][0];
            boxCoordinates[1] = parsedPairsList[posMaxIndex][1];
            boxCoordinates[2] = parsedPairsList[bottommostIndex][0];
            boxCoordinates[3] = parsedPairsList[posMinIndex][1];

            statisticsCoordinates[2] = parsedPairsList[posMaxIndex]; // west
            statisticsCoordinates[3] = parsedPairsList[posMinIndex]; // east

            paddedCoordinates = getPaddedCoordinates(boxCoordinates, padding);
            console.log("posMax (West): (" + pairsList[posMaxIndex] + "); posMin (East): (" + pairsList[posMinIndex] + ")");
        } else {
            // Meridian crossed twice
            // longGapIndex = 1
            // negMax = WEST
            // negMin = EAST
            boxCoordinates[0] = parsedPairsList[topmostIndex][0];
            boxCoordinates[1] = parsedPairsList[negMaxIndex][1];
            boxCoordinates[2] = parsedPairsList[bottommostIndex][0];
            boxCoordinates[3] = parsedPairsList[negMinIndex][1];

            statisticsCoordinates[2] = parsedPairsList[negMaxIndex]; // west
            statisticsCoordinates[3] = parsedPairsList[negMinIndex]; // east

            paddedCoordinates = getPaddedCoordinates(boxCoordinates, padding);
            console.log("negMax (West): (" + pairsList[negMaxIndex] + "); negMin (East): (" + pairsList[negMinIndex] + ")");
        }

    }
        // Check that coordinates stay within range
        if (   paddedCoordinates[0][0] < -90 
            || paddedCoordinates[0][0] > 90
            || paddedCoordinates[1][0] < -90
            || paddedCoordinates[1][0] > 90
            || paddedCoordinates[2][0] < -90
            || paddedCoordinates[2][0] > 90
            || paddedCoordinates[3][0] < -90
            || paddedCoordinates[3][0] > 90)
            alertError(6);
        else
            printResult(1, hemisphereSigns, latLonOrder, boxCoordinates, paddedCoordinates, statisticsCoordinates, padding);
            /*
        if (paddedCoordinates[0][1] < -180) {
            paddedCoordinates[0][1] = 180 - (Math.abs(paddedCoordinates[0][1]) - 180);
            paddedCoordinates[3][1] = paddedCoordinates[0][1];
            if (paddedCoordinates[1][1] <= paddedCoordinates[0][1]) {
                alertError(7);
            }

        }
        */
}

function getPaddedCoordinates(latlon, padding) {
    /*  INPUT
        latlon[0]: lat of northernmost
        latlon[1]: lon of westernmost
        latlon[2]: lat of southernmost
        larlon[3]: lon of easternmost

        padding[0]: padding in meters
        padding[1]: padding in kilometers
        padding[2]: padding in degrees (-1 if not provided)

        OUTPUT
        result[0]: NW coordinates ([lat, lon])
        result[1]: SE coordinates ([lat, lon])
        result[2]: NE coordinates ([lat, lon])
        result[3]: SW coordinates ([lat, lon])
    */

    let result = [4];

    if (padding[2] != -1) {
        // Get NW
        result[0] = [latlon[0] + padding[2] , latlon[1] - padding[2] ];
        // Get SE
        result[1] = [latlon[0] - padding[2] , latlon[1] + padding[2] ];
        // Get NE
        result[2] = [latlon[0] + padding[2] , latlon[1] + padding[2] ];
        // Get SW
        result[3] = [latlon[0] - padding[2] , latlon[1] - padding[2] ];

    }
    else {

        /* Local Plane Formula (Law of Cosines) - Small Distances */

        // Get NW
        result[0] = [(padding[0] / 111111) + latlon[0], padding[0] / (111111 * (Math.cos(latlon[0] * Math.PI / 180))) - latlon[1]];

        // Get SE
        result[1] = [-(padding[0] / 111111) + latlon[2], padding[0] / (111111 * (Math.cos(latlon[0] * Math.PI / 180))) + latlon[1]];

        // Get NE
        result[2] = [(padding[0] / 111111) + latlon[0], padding[0] / (111111 * (Math.cos(latlon[0] * Math.PI / 180))) + latlon[1]];

        // Get SW
        result[3] = [-(padding[0] / 111111) + latlon[2], padding[0] / (111111 * (Math.cos(latlon[0] * Math.PI / 180))) - latlon[1]];
    }

    return result;

}

function printResult(type, hemisphereSigns, latLonOrder, boxCoordinates, paddedCoordinates, statisticsCoordinates, padding) {
    // 1: Bounding Box
    if (type == 1) {
        document.getElementById("result").style.display = "block";
        if (latLonOrder == true) {

            // Print to Diagram
            document.getElementById("bbox-nw").innerHTML = paddedCoordinates[0][0].toFixed(6) + ", " + paddedCoordinates[0][1].toFixed(6);
            document.getElementById("bbox-se").innerHTML = paddedCoordinates[1][0].toFixed(6) + ", " + paddedCoordinates[1][1].toFixed(6);
            document.getElementById("bbox-ne").innerHTML = paddedCoordinates[2][0].toFixed(6) + ", " + paddedCoordinates[2][1].toFixed(6);
            document.getElementById("bbox-sw").innerHTML = paddedCoordinates[3][0].toFixed(6) + ", " + paddedCoordinates[3][1].toFixed(6);

            // Print to Description Table
            document.getElementById("bbox-p-nw-l1").innerHTML = paddedCoordinates[0][0].toFixed(6);
            document.getElementById("bbox-p-nw-l2").innerHTML = paddedCoordinates[0][1].toFixed(6);
            document.getElementById("bbox-p-se-l1").innerHTML = paddedCoordinates[1][0].toFixed(6);
            document.getElementById("bbox-p-se-l2").innerHTML = paddedCoordinates[1][1].toFixed(6);
            document.getElementById("bbox-p-ne-l1").innerHTML = paddedCoordinates[2][0].toFixed(6);
            document.getElementById("bbox-p-ne-l2").innerHTML = paddedCoordinates[2][1].toFixed(6);
            document.getElementById("bbox-p-sw-l1").innerHTML = paddedCoordinates[3][0].toFixed(6);
            document.getElementById("bbox-p-sw-l2").innerHTML = paddedCoordinates[3][1].toFixed(6);

            document.getElementById("bbox-nw-l1").innerHTML = boxCoordinates[0].toFixed(6);
            document.getElementById("bbox-nw-l2").innerHTML = boxCoordinates[1].toFixed(6);
            document.getElementById("bbox-se-l1").innerHTML = boxCoordinates[2].toFixed(6);
            document.getElementById("bbox-se-l2").innerHTML = boxCoordinates[3].toFixed(6);
            document.getElementById("bbox-ne-l1").innerHTML = boxCoordinates[0].toFixed(6);
            document.getElementById("bbox-ne-l2").innerHTML = boxCoordinates[3].toFixed(6);
            document.getElementById("bbox-sw-l1").innerHTML = boxCoordinates[2].toFixed(6);
            document.getElementById("bbox-sw-l2").innerHTML = boxCoordinates[1].toFixed(6);

            // Print Statistics
            document.getElementById("bbox-n-l1").innerHTML = statisticsCoordinates[0][0].toFixed(6);
            document.getElementById("bbox-n-l2").innerHTML = statisticsCoordinates[0][1].toFixed(6);
            document.getElementById("bbox-s-l1").innerHTML = statisticsCoordinates[1][0].toFixed(6);
            document.getElementById("bbox-s-l2").innerHTML = statisticsCoordinates[1][1].toFixed(6);
            document.getElementById("bbox-w-l1").innerHTML = statisticsCoordinates[2][0].toFixed(6);
            document.getElementById("bbox-w-l2").innerHTML = statisticsCoordinates[2][1].toFixed(6);
            document.getElementById("bbox-e-l1").innerHTML = statisticsCoordinates[3][0].toFixed(6);
            document.getElementById("bbox-e-l2").innerHTML = statisticsCoordinates[3][1].toFixed(6);

        }
        else {

            // Swap Table Labels
            document.getElementById("bbox-p-th-l1").innerHTML = "Longitude";
            document.getElementById("bbox-p-th-l2").innerHTML = "Latitude";
            document.getElementById("bbox-th-l1").innerHTML = "Longitude";
            document.getElementById("bbox-th-l2").innerHTML = "Latitude";
            document.getElementById("bbox-st-l1").innerHTML = "Longitude";
            document.getElementById("bbox-st-l2").innerHTML = "Latitude";

            // Print to Diagram
            document.getElementById("bbox-nw").innerHTML = paddedCoordinates[0][1].toFixed(6) + ", " + paddedCoordinates[0][0].toFixed(6);
            document.getElementById("bbox-se").innerHTML = paddedCoordinates[1][1].toFixed(6) + ", " + paddedCoordinates[1][0].toFixed(6);
            document.getElementById("bbox-ne").innerHTML = paddedCoordinates[2][1].toFixed(6) + ", " + paddedCoordinates[2][0].toFixed(6);
            document.getElementById("bbox-sw").innerHTML = paddedCoordinates[3][1].toFixed(6) + ", " + paddedCoordinates[3][0].toFixed(6);

            // Print Description
            document.getElementById("bbox-p-nw-l1").innerHTML = paddedCoordinates[0][1].toFixed(6);
            document.getElementById("bbox-p-nw-l2").innerHTML = paddedCoordinates[0][0].toFixed(6);
            document.getElementById("bbox-p-se-l1").innerHTML = paddedCoordinates[1][1].toFixed(6);
            document.getElementById("bbox-p-se-l2").innerHTML = paddedCoordinates[1][0].toFixed(6);
            document.getElementById("bbox-p-ne-l1").innerHTML = paddedCoordinates[2][1].toFixed(6);
            document.getElementById("bbox-p-ne-l2").innerHTML = paddedCoordinates[2][0].toFixed(6);
            document.getElementById("bbox-p-sw-l1").innerHTML = paddedCoordinates[3][1].toFixed(6);
            document.getElementById("bbox-p-sw-l2").innerHTML = paddedCoordinates[3][0].toFixed(6);

            document.getElementById("bbox-nw-l1").innerHTML = boxCoordinates[1].toFixed(6);
            document.getElementById("bbox-nw-l2").innerHTML = boxCoordinates[0].toFixed(6);
            document.getElementById("bbox-se-l1").innerHTML = boxCoordinates[3].toFixed(6);
            document.getElementById("bbox-se-l2").innerHTML = boxCoordinates[2].toFixed(6);
            document.getElementById("bbox-ne-l1").innerHTML = boxCoordinates[3].toFixed(6);
            document.getElementById("bbox-ne-l2").innerHTML = boxCoordinates[0].toFixed(6);
            document.getElementById("bbox-sw-l1").innerHTML = boxCoordinates[1].toFixed(6);
            document.getElementById("bbox-sw-l2").innerHTML = boxCoordinates[2].toFixed(6);

            // Print Statistics
            document.getElementById("bbox-n-l1").innerHTML = statisticsCoordinates[0][1].toFixed(6);
            document.getElementById("bbox-n-l2").innerHTML = statisticsCoordinates[0][0].toFixed(6);
            document.getElementById("bbox-s-l1").innerHTML = statisticsCoordinates[1][1].toFixed(6);
            document.getElementById("bbox-s-l2").innerHTML = statisticsCoordinates[1][0].toFixed(6);
            document.getElementById("bbox-w-l1").innerHTML = statisticsCoordinates[2][1].toFixed(6);
            document.getElementById("bbox-w-l2").innerHTML = statisticsCoordinates[2][0].toFixed(6);
            document.getElementById("bbox-e-l1").innerHTML = statisticsCoordinates[3][1].toFixed(6);
            document.getElementById("bbox-e-l2").innerHTML = statisticsCoordinates[3][0].toFixed(6);
        }

        // Print Information: Padding
        let paddingstring;
        if (padding[0] == 1)
            paddingstring = padding[0] + " meter (" + padding[1] + " kilometers)";
        else if (padding[1] == 1)
            paddingstring = padding[0] + " meters (" + padding[1] + " kilometer)";
        else
            paddingstring = padding[0] + " meters (" + padding[1] + " kilometers)"

        document.getElementById("bbox-p").innerHTML = paddingstring;

        // Print Information: Hemispheres
        let hemisphereString = "";
        if (hemisphereSigns[0])
            hemisphereString = "Southern";
        if (hemisphereSigns[1]) {
            if (hemisphereString != "") hemisphereString += ", ";
            hemisphereString += "Northern";
        }
        if (hemisphereSigns[2]) {
            if (hemisphereString != "") hemisphereString += ", ";
            hemisphereString += "Western";
        }
        if (hemisphereSigns[3]) {
            if (hemisphereString != "") hemisphereString += ", ";
            hemisphereString += "Eastern";
        }

        document.getElementById("bbox-hs").innerHTML = hemisphereString;

    }
    console.log("NW: " + paddedCoordinates[0][0] + ", " + paddedCoordinates[0][1]);
    console.log("SE: " + paddedCoordinates[1][0] + ", " + paddedCoordinates[1][1]);

}

function alertError(errCode) {

    switch (errCode) {
        case 0:
            alert("An error has occurred.");
            break;
        case 1:
            alert("Latitude out of range: -90 <= latitude <= 90");
            break;
        case 2:
            alert("Longitude out of range: -180 <= longitude <= 180");
            break;
        case 3:
            alert("Padding value must be a positive number.");
            break;
        case 4:
            alert("Please enter a list of coordinates.");
            break;
        case 5:
            alert("List of coordinates contains an invalid or unpaired value.");
            break;
        case 6:
            alert("Resulting box exceeds latitudinal range. Please reduce padding.");
            break;
        case 7:
            alert("Resulting box exceeds longitudinal range. Please reduce padding.");
            break;
    }
}