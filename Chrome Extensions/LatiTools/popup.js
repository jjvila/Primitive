document.getElementById("mainForm").addEventListener("submit", parseInput);

var unparsedList;             // String: Raw input of coordinates
var pairsList;                // Array: List of coordinate pairs delimited by comma.
var sortedLonIndices = [];    // Array: Indices of pairsList sorted by longitude
var topmost = -91,            // float: largest latitude (max 90)
    rightmost = 0,            // float: largest longitude (not crossing prime meridian)
    leftmost = 0,             // float: smallest longitude (not crossing prime meridian)
    bottommost = 181;         // float: smallest latitude (min -90)
var topmostIndex = 0, 
    rightmostIndex = 0, 
    leftmostIndex = 0, 
    bottommostIndex = 0;
var northwest, southeast;
var pairsTotal = 0;
var hemisphereType = 0;       // -1: Front Hemisphere
                              //  1: Back Hemisphere
                              //  0: Both Hemispheres

/* Retrieve User Input*/
function parseInput() {
    unparsedList = document.getElementById("inputCoordinates").value;
    pairsList = unparsedList.split(";", 20);
    pairsTotal = pairsList.length;
    getEdgeCoordinates();
}

function getEdgeCoordinates() {
    var lat = 0, lon = 0;
    var latlonString;
    for (var i=0; i < pairsTotal; i++) {
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

        // Add unsorted lon (to be sorted later if needed)
       sortedLonIndices[i] = lon;

            
        /* Get edge-most coordinates */
        // top and bottom latitudes
        if (topmost < lat) {
            topmost = lat;
            topmostIndex = i;
        }

        if (bottommost > lat) {
            bottommost = lat;
            bottommostIndex = i;
        }

        // smallest and largest longitudes
        if (leftmost > lon) {
            leftmost = lon;
            leftmostIndex = i;
        }
        
        if (rightmost < lon) {
            rightmost = lon;
            rightmostIndex = i;
        }

        // Determine if prime meridian is crossed


    }
    
    /* Sort by Longitude */
    // Sort is expensive. If pairs are on same hemisphere, no need to sort.
    crossesPrimeMeridian = false; // test
    if (crossesPrimeMeridian == false) {
        // If small list, sort by default (insertion)
        if (pairsTotal < 25)
            sortReturnIndices(sortedLonIndices);
    } 
    else {
        // Do not sort. Use leftmost an rightmost.
    }


    // Find largest Lon gap
    var left = sortedLonIndices.sortIndices[0];
    var right = sortedLonIndices.sortIndices[1];
    diff = Math.abs(sortedLonIndices[sortedLonIndices.sortIndices[0]] - sortedLonIndices[sortedLonIndices.sortIndices[1]]);
    var targetleft = left;
    var targetright = right;
    for (i=1; i < pairsTotal-1; i++){
        left = sortedLonIndices.sortIndices[i];
        right = sortedLonIndices.sortIndices[i+1];
        if (Math.abs(sortedLonIndices[left]-sortedLonIndices[right]) > diff){
            diff = Math.abs(sortedLonIndices[left]-sortedLonIndices[right]);
            targetleft = left;
            targetright = right;
        }
    }

    printResult();
    alert("Difference: " + diff + " Left Lon: " + sortedLonIndices[targetleft] + " | Right Lon: " + sortedLonIndices[targetright] );
    alert("Northwest: " + pairsList[targetleft] + " Southeast: " + pairsList[targetright]);
}

function sortReturnIndices(toSort) {
    for (var i = 0; i < toSort.length; i++) {
      toSort[i] = [toSort[i], i];
    }
    toSort.sort(function(left, right) {
      return left[0] < right[0] ? -1 : 1;
    });
    toSort.sortIndices = [];
    for (var j = 0; j < toSort.length; j++) {
      toSort.sortIndices.push(toSort[j][1]);
      toSort[j] = toSort[j][0];
    }
    return toSort;

    // Test call: alert("Sorted: " + outputtedarray.sortIndices.join(";"));
  }

function printResult() {
    //document.getElementById("result").style.display = "block";
    //document.getElementById("GPS-N").value = pairsList[topmostIndex];
    alert(" Topmost: " + pairsList[topmostIndex] + " | Bottommost: " + pairsList[bottommostIndex]);
    //alert("Index: " + sortedLonIndices.sortIndices[2] + " LonValue: " + sortedLonIndices[sortedLonIndices.sortIndices[2]]);
    //document.getElementById("mainForm").addEventListener("submit", parseInput);

}

function alertError(errCode){
    if (errCode == undefined)
        errCode = -1;
    if (errCode == 1)
        alert("Latitude out of range: -90 <= latitude <= 90");
    if (errCode == 2)
        alert("Longitude out of range: -180 <= longitude <= 180");
}