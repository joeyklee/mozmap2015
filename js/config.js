var palette = [];
var config = {
    "width": 3000,
    "height": 1600,
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
    "pathInterpolation": "step-after", // linear, basis, cardinal, monotone
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
    "colors": palette // generated later
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

(function genColors() {
  var g = ["red", "orange", "yellow", "green", "blue", "purple", "grey"];
  for (var i = 0; i < 55; i += 1) {
    color = {
      "hex": "hsl(" + i * 6 + ", 70%, 40%)",
      "group": g[i%7]
    };

    palette.push(color);
  }
})();
