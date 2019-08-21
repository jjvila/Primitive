document.getElementById("mainForm").addEventListener("submit", submitCoordinates);

function submitCoordinates() {
    var unparsedCoord = document.getElementById("inputCoordinates").value;
    var parsedCoord = unparsedCoord.split(";", 20);
    var topmost = 0, rightmost = 0, leftmost = 0, bottommost = 0;
    var topmostIndex = 0, rightmostIndex = 0, leftmostIndex = 0, bottommostIndex = 0;
    var coordTotal = parsedCoord.length;


    var lat = 0, lon = 0;
    var latlonString;
    for (var i=0; i < coordTotal; i++) {
        latlonString = parsedCoord[i].split(",", 2);
        lat = parseFloat(latlonString[0]);
        lon = parseFloat(latlonString[1]);

        // Latitude
        if (topmost < lat) {
            topmost = lat;
            topmostIndex = i;
        }

        if (bottommost > lat) {
            bottommost = lat;
            bottommostIndex = i;
        }

        // Longitude
        if (leftmost > lon) {
            leftmost = lon;
            leftmostIndex = i;
        }
        
        if (rightmost < lon) {
            rightmost = lon;
            rightmostIndex = i;
        }
    }


    

    //alert(test);
    alert("Topmost: " + parsedCoord[topmostIndex] + " | Bottommost: " + parsedCoord[bottommostIndex]);
}