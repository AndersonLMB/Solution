/// <reference path="UI.js" />
/// <reference path="C:\Users\ander\documents\visual studio 2015\Projects\Solution\CesiumPipeline\Lib/jquery-3.2.1.js" />
/// <reference path="C:\Users\ander\documents\visual studio 2015\Projects\Solution\CesiumPipeline\Cesium/Cesium.js" />
/// <reference path="C:\Users\ander\documents\visual studio 2015\Projects\Solution\CesiumPipeline\Lib/ol.js" />
/// <reference path="C:\Users\ander\documents\visual studio 2015\Projects\Solution\CesiumPipeline\Lib/jsts.js" />

var terrainProvider = new Cesium.CesiumTerrainProvider({ url: "http://localhost/CesiumPipeline/canton" });
var STK_Terrain_Provider = new Cesium.CesiumTerrainProvider({
    url: 'https://assets.agi.com/stk-terrain/world',
    requestWaterMask: true,
    requestVertexNormals: true
});

var OSM_WMTS_Provider = new Cesium.createOpenStreetMapImageryProvider({
    url: "https://a.tile.openstreetmap.org/",
});

var ArcGIS_WMTS_Provider = new Cesium.ArcGisMapServerImageryProvider({
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
});

var resources = {
    "OSM_WMTS": OSM_WMTS_Provider,
    "ArcGIS_WMTS": ArcGIS_WMTS_Provider,
    "STK_Terrain": STK_Terrain_Provider,
    "Local_Terrain": terrainProvider,

};

var viewer = new Cesium.Viewer("cesiumContainer", {
    animation: false,
    infoBox: false,
    baseLayerPicker: false,
    terrainProvider: terrainProvider,
    imageryProvider: OSM_WMTS_Provider,
});

var imageryLayers = viewer.scene.imageryLayers;

imageryLayers.addImageryProvider(ArcGIS_WMTS_Provider);


var loadEntities = function (entitiesFromServer) {
    jQuery.each(entitiesFromServer, function (i, o) {
        var orangeOutlined = viewer.entities.add({
            name: 'Orange line with black outline at height and following the surface',
            polyline: {
                positions: Cesium.Cartesian3.fromDegreesArrayHeights(o),
                width: 5,
                material: new Cesium.PolylineOutlineMaterialProperty({
                    color: Cesium.Color.ORANGE,
                    outlineWidth: 2,
                    outlineColor: Cesium.Color.BLACK
                })
            }
        })
    });

    function computeCircle(radius) {
        var positions = [];
        for (var i = 0; i < 360; i++) {
            var radians = Cesium.Math.toRadians(i);
            positions.push(new Cesium.Cartesian2(radius * Math.cos(radians), radius * Math.sin(radians)));
        }
        return positions;
    };
    jQuery.each(entitiesFromServer, function (i, o) {
        viewer.entities.add({
            polylineVolume: {
                positions: Cesium.Cartesian3.fromDegreesArrayHeights(o),
                shape: computeCircle(0.5),
                material: Cesium.Color.RED
            }
        });
    });
}

var entitiesFromServer = function (url) {
    var o = new Object();
    o.url = url;
    var result = null;
    jQuery.ajax({
        //url: "http://localhost:6080/arcgis/rest/services/PZH/PZH4326/MapServer/1/query",
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
    var arrays = [];
    jQuery.each(result.features, function (i, o) {
        if (o.geometry.paths.length === 1) {
            var temparray = [];
            jQuery.each(o.geometry.paths[0], function (j, m) {
                temparray.push(m[0]);
                temparray.push(m[1]);
                temparray.push(m[2]);
            });
            arrays.push(temparray);
        }
    });
    o = arrays;
    return o;
}

//从URL获取ol.feature
//输入url
//返回 Array<ol.feature>
var readFeatureFromURL = function (url) {
    var parser = new ol.format.EsriJSON();
    var features = [];
    var feature;
    var result = {};
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
        feature = o;
        feature = parser.readFeature(feature);
        features.push(feature);
    });
    return features;
}

//计算交点
//poly1: ol.Feature
//poly2: ol.Feature
var computeIntersect = function (poly1, poly2) {
    var olParser = new jsts.io.OL3Parser();
    var geojParser = new jsts.io.GeoJSONReader();
    var polyline1 = olParser.read(poly1.getGeometry());
    var polyline2 = olParser.read(poly2.getGeometry());
    var intersection = polyline1.intersection(polyline2);
    intersection = olParser.write(intersection);
    return intersection;
}

//return the segment:ol.geom.LingString that the point lie on the polyline 
//if the point is not on the polyline, return null
//返回点在多段线所在的线段
//如果点不在多段线上，返回null
//point: ol.geom.Point
//polyline: ol.geom.LineString
var segmentPointOnPolyline = function (point, polyline) {
    var dis1, dis2, dis3;
    var seg1, seg2, seg3;
    var seg = null;
    var array = polyline.getCoordinates();
    //the amount of segments
    //线段数量
    var length = polyline.getCoordinates().length - 1;
    for (var i = 0; i < length; i++) {
        seg1 = new ol.geom.LineString();
        seg1.setCoordinates([array[i], point.getCoordinates()], "XYZ");
        seg2 = new ol.geom.LineString();
        seg2.setCoordinates([array[i + 1], point.getCoordinates()], "XYZ");
        seg3 = new ol.geom.LineString();
        seg3.setCoordinates([array[i], array[i + 1]], "XYZ");
        dis1 = seg1.getLength()
        dis2 = seg2.getLength()
        dis3 = seg3.getLength()
        if (Math.abs(dis3 - (dis1 + dis2)) < 0.000001) {
            seg = seg3;
            break;
        }
    }
    //console.log(seg);
    return seg;
}

//return the height of the point on the polyline
//返回线段上面点的高程
var heigthPointOnPolyline = function (point, polyline) {
    var segment = null;
    var height;
    if (segment = segmentPointOnPolyline(point, polyline)) {
        height = segment.getCoordinates()[0][2]
               + (segment.getCoordinates()[1][2] - segment.getCoordinates()[0][2]) * ((point.getCoordinates()[0] - segment.getCoordinates()[0][0]) / (segment.getCoordinates()[1][0] - segment.getCoordinates()[0][0]));
        return height;
    }
    else { return };

}

//features1, features2 : ol.Features
var intersectFeatures = function (features1, features2) {
    var intersection;
    var results = [];
    var point;
    jQuery.each(features1, function (i, o) {
        jQuery.each(features2, function (j, p) {
            intersection = computeIntersect(o, p);
            if (intersection.getType() == "Point") {
                //TODO
                var result = {
                    feature1: "",
                    feature2: "",
                    height1: "",
                    height2: "",
                    coordinate: ""
                };
                point = intersection;
                polyline1 = o.getGeometry();
                polyline2 = p.getGeometry();
                result.feature1 = o;
                result.feature2 = p;
                result.height1 = heigthPointOnPolyline(point, polyline1);
                result.height2 = heigthPointOnPolyline(point, polyline2);
                result.coordinate = intersection.getCoordinates();
                //----
                results.push(result);
            }
        });
    });
    console.log(results);
    return results;
}

var collisionCheck = function () {
    features1 = readFeatureFromURL(data.data[jQuery(".features1").val()].url);
    features2 = readFeatureFromURL(data.data[jQuery(".features2").val()].url);
    var results = intersectFeatures(features1, features2);
    renderCollisionResults(results);
    //console.log(results);
    //f0 = readFeatureFromURL("http://localhost:6080/arcgis/rest/services/PZH/PZH_test/MapServer/0");
    //f1 = readFeatureFromURL("http://localhost:6080/arcgis/rest/services/PZH/PZH_test/MapServer/1");
    //intersectFeatures(f0, f1);
}

