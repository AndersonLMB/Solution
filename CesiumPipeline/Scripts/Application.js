/// <reference path="C:\Users\ander\documents\visual studio 2015\Projects\Solution\CesiumPipeline\Lib/jquery-3.2.1.js" />
/// <reference path="C:\Users\ander\documents\visual studio 2015\Projects\Solution\CesiumPipeline\Cesium/Cesium.js" />
var terrainProvider = new Cesium.CesiumTerrainProvider({ url: "http://localhost/CesiumPipeline/canton" });
var cesiumTerrainProviderMeshes = new Cesium.CesiumTerrainProvider({
    url: 'https://assets.agi.com/stk-terrain/world',
    requestWaterMask: true,
    requestVertexNormals: true
});

var viewer = new Cesium.Viewer("cesiumContainer", {
    animation: false,
    infoBox: false,
    baseLayerPicker: false,
    terrainProvider: terrainProvider,
    imageryProvider: new Cesium.ArcGisMapServerImageryProvider({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
    }),
});

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
        url: "http://localhost:6080/arcgis/rest/services/PZH/PZH4326/MapServer/1/query",
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



