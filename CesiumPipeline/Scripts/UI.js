/// <reference path="C:\Users\ander\documents\visual studio 2015\Projects\Solution\CesiumPipeline\Lib/template.js" />
/// <reference path="C:\Users\ander\documents\visual studio 2015\Projects\Solution\CesiumPipeline\Lib/jquery-3.2.1.js" />
/// <reference path="Application.js" />

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
                "type": "terrainSelector",
                "title": "地形服务",
                "options": [
                    {
                        "title": "STK地形服务",
                        "val": "STK_Terrain",
                        "url": "https://assets.agi.com/stk-terrain/world",
                    },
                    {
                        "title": "本地1",
                        "val": "Local_Terrain",
                        "url": "",
                    }
                ]
            },
    {
        "type": "WMTSSelector",
        "title": "WMTS服务",
        "options": [
            {
                "title": "ArcGIS Online",
                "val": "ArcGIS_WMTS",
                "url": "",
            },
            {
                "title": "OSM",
                "val": "OSM_WMTS",
                "url": "",
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

//WMTS选择器
jQuery(".WMTSSelector").change(function () {
    imageryLayers.removeAll();
    viewer.imageryLayers.addImageryProvider(resources[jQuery(".WMTSSelector").val()]);
    //viewer.imageryLayers = resources[jQuery(".WMTSSelector").val()];
});

//地形服务选择器
jQuery(".terrainSelector").change(
    function () {
        viewer.terrainProvider = resources[jQuery(".terrainSelector").val()];
    });
