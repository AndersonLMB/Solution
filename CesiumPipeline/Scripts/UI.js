/// <reference path="C:\Users\ander\documents\visual studio 2015\Projects\Solution\CesiumPipeline\Lib/template.js" />
/// <reference path="C:\Users\ander\documents\visual studio 2015\Projects\Solution\CesiumPipeline\Lib/jquery-3.2.1.js" />

var assertTemplates = function () {
    var tpl = "";
    var result = null;
    jQuery.ajax({
        url: "http://localhost/CesiumPipeline/Templates/UI.html",
        method: "GET",
        async: false,
        success: function (rs) { result = rs; }
    });
    jQuery("head").append(result);
    renderUI();
    renderHeadbar();
    renderFunctionBar();
    renderResourcesBar();
};

var renderUI = function () {
}

var renderHeadbar = function () {
    var data = {};
    var html = "";
    html = template("headbar", data);
    jQuery("body").append(html);
}

var renderFunctionBar = function () {

}

var renderResourcesBar = function () {
    var data = {
        resources: [
            {
                "title": "地形服务",
                "options": [
                    {
                        "title": "STK地形服务",
                        "url": "https://assets.agi.com/stk-terrain/world",
                    },
                    {
                        "title": "本地1",
                        "url": "",
                    }
                ]
            },
            {
                "title": "WMTS服务",
                "options": [
                    {
                        "title": "ArcGIS Online",
                        "url": "",
                    },
                    {
                        "title": "OSM",
                        "url": "https://assets.agi.com/stk-terrain/world",
                    },

                ]
            },
        ]
    };
    var html = "";
    html = template("resourcesbar", data);
    jQuery("body").append(html);
};

assertTemplates();

