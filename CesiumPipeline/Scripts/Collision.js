/// <reference path="C:\Users\ander\documents\visual studio 2015\Projects\Solution\CesiumPipeline\Lib/ol.js" />
/// <reference path="C:\Users\ander\documents\visual studio 2015\Projects\Solution\CesiumPipeline\Lib/jsts.js" />
/// <reference path="C:\Users\ander\documents\visual studio 2015\Projects\Solution\CesiumPipeline\Lib/jquery.js" />
var getOLFeaturesFromEsriJSON = function (url) {
    var format = new ol.format.EsriJSON();
    var features = [];
    var feature;
    var result;
    jQuery.ajax({
        url: url + "/query",
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
    result = JSON.parse(result);
    jQuery.each(result.features, function (i, o) {
        feature = format.readFeature(o);
        features.push(feature);
    });
    return features;
};

var collisionCheck = function (url1, url2) {
    var result;
    var esriJSON1 = {}, esriJSON2 = {};
    var features1 = [], features2 = [];
    var format = new ol.format.EsriJSON();
    var feature;
    features1 = getOLFeaturesFromEsriJSON(url1);
    features2 = getOLFeaturesFromEsriJSON(url2);
};

