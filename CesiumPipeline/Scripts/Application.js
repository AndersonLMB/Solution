/// <reference path="C:\Users\ander\documents\visual studio 2015\Projects\Solution\CesiumPipeline\Lib/echarts.common.min.js" />
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
        var entity = new Cesium.Entity({
            name: "",
            id: o.id,
            polyline: {
                positions: Cesium.Cartesian3.fromDegreesArrayHeights(o.geometry),
                width: 5,
                material: new Cesium.PolylineOutlineMaterialProperty({
                    color: Cesium.Color.BLUE,
                    outlineWidth: 2,
                    outlineColor: Cesium.Color.BLACK
                })
            }
        });
        entity.addProperty("url");
        entity.url = o.url;
        var orangeOutlined = viewer.entities.add(entity);
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
        var entity = new Cesium.Entity({
            id: o.id,
            polylineVolume: {
                positions: Cesium.Cartesian3.fromDegreesArrayHeights(o.geometry),
                shape: computeCircle(2),
                material: Cesium.Color.BLUE,
            }
        });
        entity.addProperty("url");
        entities.url = o.url;
        viewer.entities.add(entity);
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
    if (result.geometryType == "esriGeometryPolyline") {
        var arrays = [];
        jQuery.each(result.features, function (i, o) {
            var temparray = { id: "", url: "", geometry: [] };
            temparray.id = o.attributes.OBJECTID_1;
            temparray.url = url;
            if (o.geometry) {
                if (o.geometry.paths.length === 1 && o.geometry != undefined) {
                    jQuery.each(o.geometry.paths[0], function (j, m) {
                        temparray.geometry.push(m[0]);
                        temparray.geometry.push(m[1]);
                        temparray.geometry.push(m[2]);
                    });
                    arrays.push(temparray);
                }
            }
        });
        o = arrays;
    }
    if (result.geometryType == "esriGeometryPoint") {
        var arrays = [];
        //jQuery.each(result.features, function (i, o) {
        //    if (o.geometry.paths.length === 1) {
        //        var temparray = [];
        //        jQuery.each(o.geometry.paths[0], function (j, m) {
        //            temparray.push(m[0]);
        //            temparray.push(m[1]);
        //            temparray.push(m[2]);
        //        });
        //        arrays.push(temparray);
        //    }
        //});
        o = arrays;
    }
    return o;
}

//从URL获取ol.feature
//输入url
//返回 Array<ol.feature>
var readFeatureFromURL = function (url) {
    url = url.replace("FeatureServer", "MapServer");
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
                var result = {
                    //feature1: "",
                    //feature2: "",
                    //radius1: "",
                    //radius2: "",
                    //height1: "",
                    //height2: "",
                    //coordinate: "",
                    //heightDiff: "",
                    //boolCollision: ""
                };
                point = intersection;
                polyline1 = o.getGeometry();
                polyline2 = p.getGeometry();
                result.feature1 = o;
                //result.radius1=Number(o.geoProperties()["管径"])
                result.radius1 = 0.4;
                result.feature2 = p;
                //result.radius2 = Number(p.geoProperties()["管径"])
                result.radius2 = 0.4;
                result.height1 = heigthPointOnPolyline(point, polyline1);
                result.height2 = heigthPointOnPolyline(point, polyline2);
                result.coordinate = intersection.getCoordinates();
                result.heightDiff = Math.abs(result.height1 - result.height2) - result.radius1 - result.radius2;
                if (result.heightDiff > 0) {
                    result.boolCollision = "不碰撞"
                }
                else { result.boolCollision = "碰撞" }
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
}

//extent: "all" || ol.Feature
var executeStat = function (extent, arg) {
    var results = {};
    if (extent != "all") {
        results = queryPolygon(extent, arg);
    }
    console.log(results);
    var arrs = arrEchart(results, arg);
    var option = {};
    var myChart = echarts.init(jQuery(".resultsbar-content")[0]);// echarts.init(document.getElementById('main')
    option = {
        color: ['#3398DB'],
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: [
            {
                type: 'category',
                data: arrs[0],
                axisTick: {
                    alignWithLabel: true
                }
            }
        ],
        yAxis: [
            {
                type: 'value'
            }
        ],
        series: [
            {
                name: '直接访问',
                type: 'bar',
                barWidth: '60%',
                data: arrs[1]
            }
        ]
    };
    console.log(option);
    myChart.setOption(option);
}

//query.features => echart数据
var arrEchart = function (json, arg) {
    var tags = [], counts = [];
    var outArrs = [[], []];
    jQuery.each(json, function (i, o) {
        var tag = "null";
        jQuery.each(tags, function (j, m) {
            //已有该tag
            if (o.attributes[arg] === m) {
                counts[m] = counts[m] + 1;
                tag = m;
            }
        });
        //尚未有该tag
        if (tag === "null") {
            tags.push(o.attributes[arg]);//tags增加该标签
            counts[o.attributes[arg]] = 1;
        }
    });

    outArrs[0] = Object.keys(counts);
    jQuery.each(outArrs[0], function (i, o) {
        outArrs[1][i] = counts[o];
    });
    return outArrs;
}

//polygon: ol.Feature
var queryPolygon = function (polygon, arg) {
    var result;
    var format = new ol.format.EsriJSON();
    var obj = format.writeFeatureObject(polygon);
    var geom = obj.geometry;
    geom = JSON.stringify(geom);
    qdata = {
        where: "objectid>0",
        geometry: geom,
        geometryType: "esriGeometryPolygon",
        outFields: arg,
        returnZ: true,
        f: "pjson"
    }
    jQuery.ajax({
        url: "http://localhost:6080/arcgis/rest/services/PZH/PZH_test2/MapServer/1/query",
        method: "GET",
        data: qdata,
        async: false,
        success: function (rs) {
            result = rs;
        }
    });
    result = JSON.parse(result);
    return result.features;
}

//横截面分析
//drawFeature:ol.Feature() (LineString)
var analysisIntersectSurface = function (drawFeature) {

    var format = new ol.format.EsriJSON();
    var geom = format.writeFeatureObject(drawFeatures.getArray()[0]).geometry;
    geom = JSON.stringify(geom);

    var param = {
        geometry: geom,
        layers: "all",
        geometryType: "esriGeometryPolyline",
        tolerance: 0.5,
        mapExtent: "-180,-90,180,90",
        imageDisplay: "600,550,96",
        returnGeometry: true,
        returnZ: true,
        f: "PJSON"
    }
    var analysisResult;
    jQuery.ajax({
        url: "http://localhost:6080/arcgis/rest/services/PZH/PZH_test2/MapServer/identify",
        method: "GET",
        async: false,
        data: param,
        success: function (rs) { analysisResult = rs; }
    })
    analysisResult = JSON.parse(analysisResult).results;
    var array = [];
    jQuery.each(analysisResult, function (i, o) {
        var obj = format.readFeature(o);
        obj["layer"] = o.layerName;
        array.push(obj);
    });
    var ar2 = [drawFeatures.getArray()[0]];
    var analysisResult = intersectFeatures(ar2, array);
    var analysisData = {};
    jQuery.each(analysisResult, function (i, o) {
        analysisData[array[i].layer] = { name: array[i].layer, data: [] };
    });
    jQuery.each(analysisResult, function (i, o) {
        var firstCoor = ol.proj.transform(drawFeatures.getArray()[0].getGeometry().getFirstCoordinate(), "EPSG:4326", "EPSG:3857");
        var pCoor = ol.proj.transform(o.coordinate, "EPSG:4326", "EPSG:3857");
        var dist = Math.sqrt((firstCoor[0] - pCoor[0]) * (firstCoor[0] - pCoor[0]) +
                                  (firstCoor[1] - pCoor[1]) * (firstCoor[1] - pCoor[1]))
        var obj = [dist, o.height2, 400, "", ""];
        analysisData[array[i].layer].data.push(obj);
    });
    var j = 0;
    var arr = [];
    jQuery.each(analysisData, function (i, o) {
        arr[j] = o;
        j++;
    });
    renderAnalysisCanvas(arr);
