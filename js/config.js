var palette = [];
var config = {
    "width": 2400,
    "height": 3600,
    "bgColor": "#f2e9b8",
    "padding": [200, 200],
    "textColor": "#000000",
    "fontFamily": "OpenSans, sans-serif",
    "fontSize": 13,
    "fontWeight": "normal",
    "maxLines": 32,
    "maxPointsPerLine": 32,
    "minTextLength": 1,
    "maxTextLength": 24,
    "pathInterpolation": "basis", // linear, basis, cardinal, monotone
    "pointColor": "#ffffff",
    "pointColorInverse": "#444444",
    "borderColor": "#444444",
    "borderColorInverse": "#ffffff",
    "borderWidth": 2,
    "borderRadius": 4,
    "cornerRadius": 40,
    "pointRadius": 4,
    "pointRadiusLarge": 10,
    "strokeWidth": 8,
    "strokeOpacity": 0.9,
    "offsetWidth": 12,
    "minXDiff": 5,
    "hubSize": 4,
    "animate": false,
    "animationDuration": 10000,
    "colors": palette
    // {"hex":"#E5303C","group":"red"},
    // {"hex":"#F6802C","group":"orange"},
    // {"hex":"#FEC91A","group":"yellow"},
    // {"hex":"#45A844","group":"green"},
    // {"hex":"#3D84CA","group":"blue"},
    // {"hex":"#C1477F","group":"violet"},
    // {"hex":"#A59D90","group":"gray"},
    // {"hex":"#F4897F","group":"red"},
    // {"hex":"#FFA769","group":"orange"},
    // {"hex":"#FFD45C","group":"yellow"},
    // {"hex":"#74C063","group":"green"},
    // {"hex":"#86D0ED","group":"blue"},
    // {"hex":"#BF6992","group":"violet"},
    // {"hex":"#BAB4AA","group":"gray"},
    // {"hex":"#D8448B","group":"red"},
    // {"hex":"#E57257","group":"orange"},
    // {"hex":"#FCAB1D","group":"yellow"},
    // {"hex":"#45A384","group":"green"},
    // {"hex":"#6285D1","group":"blue"},
    // {"hex":"#9069AF","group":"violet"},
    // {"hex":"#999082","group":"gray"},
    // {"hex":"#EA83B9","group":"red"},
    // {"hex":"#E28876","group":"orange"},
    // {"hex":"#FFD773","group":"yellow"},
    // {"hex":"#75BCA2","group":"green"},
    // {"hex":"#85A5DD","group":"blue"},
    // {"hex":"#AB90C4","group":"violet"},
    // {"hex":"#CCC6BE","group":"gray"}
    // random hsl
    ,
    "legend": {
        "width": 800,
        "padding": 50,
        "bgColor": "#e8ddc2",
        "columns": 2,
        "titleFontSize": 32,
        "titleMaxLineChars": 30,
        "titleLineHeight": 40,
        "fontSize": 14,
        "lineHeight": 30,
        "gridUnit": 20
    },
    "pathTypes": [{
            "xDirection": "s",
            "directions": ["s"]
        }, // straight line
        {
            "xDirection": "e",
            "directions": ["s", "e", "s"]
        }, // elbow right
        {
            "xDirection": "w",
            "directions": ["s", "w", "s"]
        }, // elbow left
    ]
};

// function getRandomInt(min, max) {
//     return Math.floor(Math.random() * (max - min + 1) + min);
// }

(function genColors() {
    var g = ["red", "orange", "yellow", "green", "blue", "purple", "grey"];
    for (var i = 0; i < 55; i += 1) {
      // var h = getRandomInt(0, 360);
            color = {
                "hex": "hsl(" + i * 6 + ", 70%, 40%)",
                "group": g[i%7]
            };
       
        console.log(color);
        palette.push(color);
    }
})();
