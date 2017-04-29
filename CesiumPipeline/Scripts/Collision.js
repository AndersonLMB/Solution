/// <reference path="C:\Users\ander\documents\visual studio 2015\Projects\Solution\CesiumPipeline\Lib/ol.js" />
/// <reference path="C:\Users\ander\documents\visual studio 2015\Projects\Solution\CesiumPipeline\Lib/jsts.js" />
/// <reference path="C:\Users\ander\documents\visual studio 2015\Projects\Solution\CesiumPipeline\Lib/jquery.js" />

var collisionCheck = function (url1, url2) {
    var result;
    var esriJSON1 = {}, esriJSON2 = {};
    var features1 = [], features2 = [];
    var format = new ol.format.EsriJSON();
    var feature;
    jQuery.ajax({
        url: url1 + "/query",
        method: "GET",
        async: false,
        data: {
            where: "objectid>0",
            outFields: "*",
            returnZ: true,
            f: "pjson"
        },
        success: function (rs) { result = rs; },
    });
    esriJSON1 = JSON.parse(result);
    jQuery.ajax({
        url: url2 + "/query",
        method: "GET",
        async: false,
        data: {
            where: "objectid>0",
            outFields: "*",
            returnZ: true,
            f: "pjson"
        },
        success: function (rs) { result = rs; },
    });
    esriJSON2 = JSON.parse(result);

    jQuery.each(esriJSON1.features, function (i, o) {
        feature = format.readFeature(o);
        features1.push(feature);
    });

    jQuery.each(esriJSON2.features, function (i, o) {
        feature = format.readFeature(o);
        features2.push(feature);
    });

};