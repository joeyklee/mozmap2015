var theme = 'night';
var palette = [];

var lightStyle = {
    "bgColor": "#f2e9b8",
    "textColor": "#000000",
    "pointColor": "#444444",
    "borderColor": "#444444"
};

var darkStyle = {
        "bgColor": "#1a1a1a",
        "textColor": "#b3b3b3",
        "pointColor": "#ffffff",
        "borderColor": "#000000"
};

var config = {
    "data_root_url": "http://mozilla.github.io/mozfest-schedule-app/",
    "width": 3900,
    "height": 1000,
    "padding_x": 100,
    "padding_y": 30,
    "spacer_x": 50,
    "spacer_y": 50,
    "station_pad": 30,
    "station_hub_offset": 8,
    "min_diff_x": 5,
    "min_diff_y": 5,
    "path_types": [{
            "direction_x": "e",
            "directions": ["e"]
        }, // straight line
        {
            "direction_x": "s",
            "directions": ["e", "s", "e"]
        }, // elbow down
        {
            "direction_x": "n",
            "directions": ["e", "n", "e"]
        } // elbow up
    ],

    "bgColor": "#1a1a1a",
    "textColor": "#b3b3b3",
    "fontFamily": "OpenSans, sans-serif",
    "fontSize": 13,
    "fontWeight": "normal",
    "minTextLength": 1,
    "maxTextLength": 24,
    "stationRadius": 3,
    "stationSelectedRadius": 20,
    "pathInterpolation": "linear", // linear, basis, cardinal, monotone
    "pointColor": "#ffffff",
    "pointColorInverse": "#ffffff",
    "borderColor": "#000000",
    "borderColorInverse": "#ffffff",
    "borderWidth": 1,
    "borderRadius": 1,
    "cornerRadius": 5,
    "pointRadius": 3,
    "pointRadiusLarge": 6,
    "strokeWidth": 4,
    "strokeSelectedWidth": 8,
    "strokeOpacity": 0.9,
    "hubSize": 10,
    "animate": false,
    "animationDuration": 0,
    "colors": palette // generated later

};

if (theme === 'night') {
    _.extend(config, darkStyle);
} else {
    _.extend(config, lightStyle);

}

(function genColors() {
    var cols = [
        "hsl(219, 100%, 33%)",
        "hsl(19, 100%, 55%)",
        "hsl(101, 48%, 51%)",
        "hsl(30, 50%, 40%)",
        "hsl(216, 3%, 66%)",
        "hsl(48, 98%, 51%)",
        "hsl(220, 1%, 51%)",
        "hsl(2, 85%, 56%)",
        "hsl(144, 100%, 29%)",
        "hsl(305, 57%, 46%)",
        "hsl(158, 100%, 30%)",
        "hsl(204, 6%, 32%)",
        "hsl(18, 63%, 26%)",
        "hsl(41, 100%, 40%)",
        "hsl(19, 100%, 55%)",
        "hsl(142, 100%, 34%)",
        "hsl(219, 100%, 33%)",
        "hsl(348, 89%, 41%)",
        "hsl(298, 63%, 41%)",
        "hsl(196, 100%, 44%)",
        "hsl(142, 100%, 30%)",
        "hsl(346, 100%, 44%)",
        "hsl(297, 42%, 42%)",
        "hsl(28, 100%, 50%)",
        "hsl(30, 50%, 40%)",
        "hsl(0, 60%, 50%)",
        "hsl(48, 100%, 50%)",
        "hsl(150, 100%, 20%)",
        "hsl(0, 33%, 70%)",
        "hsl(210, 8%, 56%)",
        "hsl(300, 100%, 20%)",
        "hsl(0, 0%, 0%)",
        "hsl(240, 100%, 30%)",
        "hsl(195, 100%, 40%)",
        "hsl(180, 50%, 60%)",
        "hsl(180, 100%, 30%)",
        "hsl(24, 100%, 50%)",
        "hsl(90, 100%, 40%)",
        "hsl(358, 72%, 46%)",
        "hsl(222, 84%, 31%)",
        "hsl(125, 52%, 42%)",
        "hsl(19, 99%, 53%)",
        "hsl(196, 60%, 49%)",
        "hsl(282, 34%, 48%)",
        "hsl(22, 74%, 44%)",
        "hsl(71, 77%, 22%)",
        "hsl(339, 92%, 52%)",
        "hsl(41, 25%, 56%)",
        "hsl(167, 60%, 49%)",
        "hsl(42, 100%, 50%)",
        "hsl(209, 38%, 67%)",
        "hsl(115, 40%, 46%)",
        "hsl(36, 100%, 50%)"
    ];

    cols.map(function(d) {
        var color = {
            "hex": d,
            "group": "test"
        };
        palette.push(color);

    });
})();
